import Phaser from 'phaser';
import { isLevelOneEffectId } from '../content/levelOne';
import { LEVEL_ONE_PLAYER_PHYSICS, LEVEL_ONE_SPAWNS, LEVEL_ONE_WORLD } from '../content/levelOneLayout';
import { publishGameStatus } from '../events';
import type { InputController } from '../input/InputController';
import { LevelOneWorld } from './levelOne/LevelOneWorld';
import { LevelOneSession } from '../session/LevelOneSession';
import type { ProgressStore } from '../state/progress';
import { IdleTrigger } from '../state/IdleTrigger';
import type { ReactionDefinition } from '../sympathy/types';
import type { PlaytestDriver } from '../testing/PlaytestDriver';
import { addGameText } from '../visuals/addGameText';
import { createGameTextures } from '../visuals/createTextures';

interface VerticalSliceSceneDependencies {
  readonly inputController: InputController;
  readonly progressStore: ProgressStore;
  readonly playtestDriver?: PlaytestDriver;
}

interface DeathContext {
  readonly causeId: string;
  readonly blockerId: string | null;
  readonly message: string;
}

export class VerticalSliceScene extends Phaser.Scene {
  private readonly session: LevelOneSession;
  private readonly moveSpeed = LEVEL_ONE_PLAYER_PHYSICS.moveSpeed;
  private readonly jumpSpeed = LEVEL_ONE_PLAYER_PHYSICS.jumpSpeed;
  private spawn = new Phaser.Math.Vector2(LEVEL_ONE_SPAWNS.start.x, LEVEL_ONE_SPAWNS.start.y);

  private player!: Phaser.Physics.Arcade.Sprite;
  private world!: LevelOneWorld;
  private reverseCoins: Phaser.GameObjects.Container[] = [];
  private reverseCoinLabel: Phaser.GameObjects.Text | null = null;
  private appliedEffectIds = new Set<string>();
  private dying = false;
  private completed = false;
  private readonly idleTrigger = new IdleTrigger(8_000);

  private readonly resetIdleClock = (): void => {
    this.idleTrigger.reset();
  };

  constructor(private readonly dependencies: VerticalSliceSceneDependencies) {
    super('VerticalSliceScene');
    this.session = new LevelOneSession(dependencies.progressStore);
  }

  create(): void {
    this.resetRuntimeState();
    createGameTextures(this);
    this.physics.world.setBounds(0, 0, LEVEL_ONE_WORLD.width, LEVEL_ONE_WORLD.height + 180);
    this.drawWorld();
    this.world.createPlatforms();
    this.createPlayer();
    this.createReverseEasterEgg();
    this.world.createWarningHazard();
    this.createGoal();
    this.restorePersistedAssists();

    this.cameras.main.setBounds(0, 0, LEVEL_ONE_WORLD.width, LEVEL_ONE_WORLD.height);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09, -130, 30);
    this.cameras.main.setDeadzone(280, 180);

    document.addEventListener('visibilitychange', this.resetIdleClock);
    window.addEventListener('focus', this.resetIdleClock);
    window.addEventListener('blur', this.resetIdleClock);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.removeEventListener('visibilitychange', this.resetIdleClock);
      window.removeEventListener('focus', this.resetIdleClock);
      window.removeEventListener('blur', this.resetIdleClock);
    });

    const deaths = this.session.totalDeaths;
    publishGameStatus({
      deaths,
      message: deaths === 0 ? '方向鍵或 A／D 移動，空白鍵跳躍。' : '紀錄還在。世界也記得自己放過多少水。',
    });
  }

  private resetRuntimeState(): void {
    this.dependencies.playtestDriver?.reset(this.dependencies.inputController.actions);
    this.spawn.set(LEVEL_ONE_SPAWNS.start.x, LEVEL_ONE_SPAWNS.start.y);
    this.world = new LevelOneWorld(this, {
      onWarningHazard: () => {
        this.beginDeath({
          causeId: 'trusted-warning-strip',
          blockerId: 'warning-strip',
          message: '它說「完全安全」，但沒有說是對誰安全。',
        });
      },
      isPlayerDying: () => this.dying,
    });
    this.reverseCoins = [];
    this.reverseCoinLabel = null;
    this.appliedEffectIds.clear();
    this.dying = false;
    this.completed = false;
    this.idleTrigger.resetAll();
  }

  override update(): void {
    if (this.dying || this.completed) {
      return;
    }

    const actions = this.dependencies.inputController.actions;
    this.dependencies.playtestDriver?.update(
      {
        x: this.player.x,
        y: this.player.y,
        grounded: this.player.body?.blocked.down === true,
      },
      actions,
    );
    const horizontal = Number(actions.isDown('right')) - Number(actions.isDown('left'));
    this.player.setVelocityX(horizontal * this.moveSpeed);

    if (actions.isAnyDown()) {
      this.resetIdleClock();
    }
    if (horizontal !== 0) {
      this.player.setFlipX(horizontal < 0);
    }

    const body = this.player.body;
    if (actions.consumeJumpPressed() && body?.blocked.down === true) {
      this.player.setVelocityY(-this.jumpSpeed);
    }

    if (this.player.y > LEVEL_ONE_WORLD.height + 30) {
      const blockerId = this.player.x >= 390 && this.player.x < 790 ? 'first-gap' : null;
      this.beginDeath({
        causeId: 'fell-out-of-world',
        blockerId,
        message: blockerId === 'first-gap' ? '那個坑確實比看起來更有企圖。' : '地圖下面沒有隱藏道路。剛剛確認過了。',
      });
      return;
    }

    this.updateProgressMarkers();
    this.updateIdleEgg();
  }

  private drawWorld(): void {
    this.cameras.main.setBackgroundColor('#ddf4ff');
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x9fd5e8, 0.35);
    for (let x = 0; x <= LEVEL_ONE_WORLD.width; x += 48) {
      grid.lineBetween(x, 0, x, LEVEL_ONE_WORLD.height);
    }
    for (let y = 0; y <= LEVEL_ONE_WORLD.height; y += 48) {
      grid.lineBetween(0, y, LEVEL_ONE_WORLD.width, y);
    }

    addGameText(this, 42, 38, '練習題一：只要一直往右，應該不會有事。', 22, '#1d2a33').setAlpha(0.86);
    addGameText(this, 500, 450, '第一題\n跨過去', 17, '#1d2a33').setAlign('center').setRotation(-0.03);
    addGameText(this, 1_030, 468, '完全安全', 17, '#fff9e8')
      .setBackgroundColor('#e95d5d')
      .setPadding(10, 6)
      .setRotation(0.025);
    addGameText(this, 1_710, 350, '終點在右邊\n這次是真的', 18, '#1d2a33')
      .setAlign('center')
      .setBackgroundColor('#fff9e8')
      .setPadding(12, 8)
      .setRotation(-0.025);
  }

  private createPlayer(): void {
    const initialSpawn = this.session.initialSpawn;
    this.spawn = new Phaser.Math.Vector2(initialSpawn.x, initialSpawn.y);

    this.player = this.physics.add.sprite(this.spawn.x, this.spawn.y, 'player');
    this.player.setCollideWorldBounds(false);
    this.player.setMaxVelocity(this.moveSpeed, 780);
    this.player.body?.setSize(28, 39, true);
    this.world.attachPlayer(this.player);
  }

  private createReverseEasterEgg(): void {
    const discovered = this.session.hasDiscoveredEasterEgg('reverse-zero-coins');
    const coinPositions = [6, 20, 34, 48, 62, 76, 90, 104];

    this.reverseCoins = coinPositions.map((x) => {
      const disc = this.add.circle(0, 0, 9, 0xffd447, 1).setStrokeStyle(3, 0x1d2a33, 1);
      const value = this.add
        .text(0, 0, '0', {
          color: '#b9382c',
          fontFamily: 'Fredoka, Nunito, sans-serif',
          fontSize: '11px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      return this.add.container(x, 225, [disc, value]).setAlpha(discovered ? 0.42 : 1);
    });

    this.reverseCoinLabel = addGameText(
      this,
      8,
      289,
      discovered ? '已領取 · 仍然沒用' : '用途：0 × 8',
      14,
      '#b9382c',
    )
      .setBackgroundColor('#fff9e8')
      .setPadding(5, 3)
      .setRotation(-0.035);

    const trigger = this.add.zone(55, 205, 150, 130);
    this.physics.add.existing(trigger, true);
    this.physics.add.overlap(this.player, trigger, () => this.triggerReverseEasterEgg());
  }

  private triggerReverseEasterEgg(): void {
    const eggId = 'reverse-zero-coins';
    const next = this.session.discoverEasterEgg(eggId);
    if (next === null) {
      return;
    }

    this.reverseCoinLabel?.setText('已領取 · 仍然沒用');
    const message = '你特地往左找到了 8 枚沒有用途的金幣。很會。';
    publishGameStatus({ deaths: next.totalDeaths, message });
    this.tweens.add({
      targets: this.reverseCoins,
      y: '-=14',
      duration: 180,
      ease: 'Sine.Out',
      yoyo: true,
      repeat: 1,
      onComplete: () => this.reverseCoins.forEach((coin) => coin.setAlpha(0.42)),
    });

    const annotation = addGameText(this, 165, 120, '恭喜找到 8 枚\n完全沒有用途的金幣。', 21, '#b9382c')
      .setOrigin(0.5)
      .setAlign('center')
      .setStroke('#fff9e8', 6)
      .setRotation(-0.045)
      .setDepth(10);
    this.time.delayedCall(3_000, () => annotation.destroy());
  }

  private createGoal(): void {
    const pole = this.add.rectangle(2_080, 322, 12, 190, 0x1d2a33, 1);
    const flag = this.add.triangle(2_125, 255, 0, 0, 0, 70, 92, 35, 0xffd447, 1);
    flag.setStrokeStyle(4, 0x1d2a33, 1);
    const goal = this.add.zone(2_070, 360, 100, 150);
    this.physics.add.existing(goal, true);
    this.physics.add.overlap(this.player, goal, () => this.finishLevel());
    pole.setDepth(1);
    flag.setDepth(1);
  }

  private updateProgressMarkers(): void {
    const currentOrder = this.session.progressOrder;

    if (currentOrder < 1 && this.player.x >= 790) {
      this.advanceMarker(
        'after-first-gap',
        1,
        new Phaser.Math.Vector2(LEVEL_ONE_SPAWNS.afterFirstGap.x, LEVEL_ONE_SPAWNS.afterFirstGap.y),
        '第一題通過。世界假裝沒緊張。',
      );
    } else if (currentOrder < 2 && this.player.x >= 1_300) {
      this.advanceMarker(
        'after-warning-strip',
        2,
        new Phaser.Math.Vector2(
          LEVEL_ONE_SPAWNS.afterWarningStrip.x,
          LEVEL_ONE_SPAWNS.afterWarningStrip.y,
        ),
        '「完全安全」區已經在你後面了。',
      );
    }
  }

  private advanceMarker(markerId: string, order: number, spawn: Phaser.Math.Vector2, message: string): void {
    const next = this.session.advanceMarker(markerId, order);
    if (next === null) {
      return;
    }
    this.spawn = spawn;
    publishGameStatus({ deaths: next.totalDeaths, message });
  }

  private beginDeath(context: DeathContext): void {
    if (this.dying || this.completed) {
      return;
    }

    this.dying = true;
    this.resetIdleClock();
    const result = this.session.recordDeath({
      causeId: context.causeId,
      blockerId: context.blockerId,
      x: Math.round(this.player.x),
      y: Math.round(this.player.y),
    });

    this.player.setTint(0xb9382c);
    this.player.setVelocity(0, -180);
    if (this.player.body !== null) {
      this.player.body.enable = false;
    }

    if (result.reaction?.effectId !== undefined) {
      this.applyEffectSafely(result.reaction.effectId);
    }

    const message = result.reaction?.message ?? context.message;
    publishGameStatus({ deaths: result.state.totalDeaths, message });
    const annotation = this.createMercyAnnotation(message, result.reaction);

    this.time.delayedCall(900, () => {
      annotation.destroy();
      this.respawn();
    });
  }

  private createMercyAnnotation(message: string, reaction: ReactionDefinition | null): Phaser.GameObjects.Text {
    const prefix = reaction === null ? '×' : `修正 ${reaction.tier}`;
    return addGameText(this, this.player.x, Math.max(80, this.player.y - 72), `${prefix}　${message}`, 22, '#b9382c')
      .setOrigin(0.5)
      .setStroke('#fff9e8', 6)
      .setRotation(-0.045)
      .setDepth(10)
      .setScrollFactor(1);
  }

  private respawn(): void {
    this.player.clearTint();
    this.player.setPosition(this.spawn.x, this.spawn.y);
    this.player.setVelocity(0, 0);
    if (this.player.body !== null) {
      this.player.body.enable = true;
    }
    this.dying = false;
    this.resetIdleClock();
    publishGameStatus({
      deaths: this.session.totalDeaths,
      message: '再一次。已經發生的援助不會收回。',
    });
  }

  private restorePersistedAssists(): void {
    for (const effectId of this.session.activeAssistIds) {
      this.applyEffectSafely(effectId);
    }
  }

  private applyEffectSafely(effectId: string): void {
    if (this.appliedEffectIds.has(effectId)) {
      return;
    }

    try {
      if (!isLevelOneEffectId(effectId)) {
        throw new Error(`Unknown sympathy effect: ${effectId}`);
      }
      this.world.applyAssistEffect(effectId);
      this.appliedEffectIds.add(effectId);
    } catch (error) {
      console.error('[sympathy-effect]', effectId, error);
    }
  }

  private updateIdleEgg(): void {
    const eligible =
      document.visibilityState === 'visible' &&
      document.hasFocus() &&
      this.player.body?.blocked.down === true &&
      !this.dependencies.inputController.actions.isAnyDown();

    if (!this.idleTrigger.update(performance.now(), eligible)) {
      return;
    }

    const eggId = 'idle-apology';
    const next = this.session.discoverEasterEgg(eggId);
    if (next === null) {
      return;
    }
    const message = '你是在等遊戲先道歉嗎？';
    publishGameStatus({ deaths: next.totalDeaths, message });
    const annotation = addGameText(this, this.player.x + 20, this.player.y - 76, message, 22, '#b9382c')
      .setOrigin(0.5)
      .setStroke('#fff9e8', 6)
      .setRotation(-0.05)
      .setDepth(10);
    this.time.delayedCall(2_400, () => annotation.destroy());
  }

  private finishLevel(): void {
    if (this.completed || this.dying) {
      return;
    }
    this.completed = true;
    this.player.setVelocity(0, 0);
    if (this.player.body !== null) {
      this.player.body.enable = false;
    }
    const next = this.session.complete();
    publishGameStatus({
      deaths: next.totalDeaths,
      message: `抵達終點。世界總共心軟了 ${this.session.activeAssistCount} 次。`,
      phase: 'completed',
    });
    addGameText(this, this.player.x - 40, 205, '通過\n（本題不計分）', 34, '#b9382c')
      .setAlign('center')
      .setOrigin(0.5)
      .setStroke('#fff9e8', 8)
      .setRotation(-0.055)
      .setDepth(20);
  }

}
