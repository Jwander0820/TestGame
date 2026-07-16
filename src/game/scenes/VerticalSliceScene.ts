import Phaser from 'phaser';
import { LEVEL_ONE_ID, LEVEL_ONE_REACTIONS } from '../content/levelOne';
import {
  LEVEL_ONE_PLATFORM_LAYOUT,
  LEVEL_ONE_PLAYER_PHYSICS,
  LEVEL_ONE_SPAWNS,
  LEVEL_ONE_WARNING_HAZARD,
  LEVEL_ONE_WORLD,
} from '../content/levelOneLayout';
import { publishGameStatus } from '../events';
import type { InputController } from '../input/InputController';
import type { ProgressStore } from '../state/progress';
import { IdleTrigger } from '../state/IdleTrigger';
import { advanceProgress, completeLevel, discoverEasterEgg, recordDeath } from '../sympathy/director';
import type { DeathEvent, ReactionDefinition } from '../sympathy/types';
import { createGameTextures, PLATFORM_TEXTURE_WIDTH } from '../visuals/createTextures';

interface VerticalSliceSceneDependencies {
  readonly inputController: InputController;
  readonly progressStore: ProgressStore;
}

interface DeathContext {
  readonly causeId: string;
  readonly blockerId: string | null;
  readonly message: string;
}

export class VerticalSliceScene extends Phaser.Scene {
  private readonly moveSpeed = LEVEL_ONE_PLAYER_PHYSICS.moveSpeed;
  private readonly jumpSpeed = LEVEL_ONE_PLAYER_PHYSICS.jumpSpeed;
  private spawn = new Phaser.Math.Vector2(LEVEL_ONE_SPAWNS.start.x, LEVEL_ONE_SPAWNS.start.y);

  private player!: Phaser.Physics.Arcade.Sprite;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private firstLanding!: Phaser.Physics.Arcade.Sprite;
  private warningHazard: Phaser.GameObjects.Rectangle | null = null;
  private warningOverlap: Phaser.Physics.Arcade.Collider | null = null;
  private spring: Phaser.Physics.Arcade.Sprite | null = null;
  private appliedEffectIds = new Set<string>();
  private dying = false;
  private completed = false;
  private readonly idleTrigger = new IdleTrigger(8_000);

  private readonly resetIdleClock = (): void => {
    this.idleTrigger.reset();
  };

  constructor(private readonly dependencies: VerticalSliceSceneDependencies) {
    super('VerticalSliceScene');
  }

  create(): void {
    this.resetRuntimeState();
    createGameTextures(this);
    this.physics.world.setBounds(0, 0, LEVEL_ONE_WORLD.width, LEVEL_ONE_WORLD.height + 180);
    this.drawWorld();
    this.createPlatforms();
    this.createPlayer();
    this.createWarningHazard(LEVEL_ONE_WARNING_HAZARD.width);
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

    const deaths = this.dependencies.progressStore.snapshot.totalDeaths;
    publishGameStatus({
      deaths,
      message: deaths === 0 ? '方向鍵或 A／D 移動，空白鍵跳躍。' : '紀錄還在。世界也記得自己放過多少水。',
    });
  }

  private resetRuntimeState(): void {
    this.spawn.set(LEVEL_ONE_SPAWNS.start.x, LEVEL_ONE_SPAWNS.start.y);
    this.warningHazard = null;
    this.warningOverlap = null;
    this.spring = null;
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

    this.addText(42, 38, '練習題一：只要一直往右，應該不會有事。', 22, '#1d2a33').setAlpha(0.86);
    this.addText(500, 450, '第一題\n跨過去', 17, '#1d2a33').setAlign('center').setRotation(-0.03);
    this.addText(1_030, 468, '完全安全', 17, '#fff9e8')
      .setBackgroundColor('#e95d5d')
      .setPadding(10, 6)
      .setRotation(0.025);
    this.addText(1_710, 350, '終點在右邊\n這次是真的', 18, '#1d2a33')
      .setAlign('center')
      .setBackgroundColor('#fff9e8')
      .setPadding(12, 8)
      .setRotation(-0.025);
  }

  private createPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();
    for (const definition of LEVEL_ONE_PLATFORM_LAYOUT) {
      const platform = this.addPlatform(definition.x, definition.y, definition.width);
      if (definition.id === 'first-landing') {
        this.firstLanding = platform;
      }
    }
  }

  private addPlatform(x: number, y: number, width: number, texture = 'platform'): Phaser.Physics.Arcade.Sprite {
    const platform = this.platforms.create(x, y, texture) as Phaser.Physics.Arcade.Sprite;
    platform.setScale(width / PLATFORM_TEXTURE_WIDTH, 1).refreshBody();
    return platform;
  }

  private createPlayer(): void {
    const level = this.dependencies.progressStore.snapshot.levels[LEVEL_ONE_ID];
    if (level !== undefined && level.progressOrder >= 2) {
      this.spawn = new Phaser.Math.Vector2(
        LEVEL_ONE_SPAWNS.afterWarningStrip.x,
        LEVEL_ONE_SPAWNS.afterWarningStrip.y,
      );
    } else if (level !== undefined && level.progressOrder >= 1) {
      this.spawn = new Phaser.Math.Vector2(LEVEL_ONE_SPAWNS.afterFirstGap.x, LEVEL_ONE_SPAWNS.afterFirstGap.y);
    }

    this.player = this.physics.add.sprite(this.spawn.x, this.spawn.y, 'player');
    this.player.setCollideWorldBounds(false);
    this.player.setMaxVelocity(this.moveSpeed, 780);
    this.player.body?.setSize(28, 39, true);
    this.physics.add.collider(this.player, this.platforms);
  }

  private createWarningHazard(width: number): void {
    this.warningOverlap?.destroy();
    this.warningOverlap = null;
    this.warningHazard?.destroy();
    this.warningHazard = null;

    const danger = this.add.rectangle(
      LEVEL_ONE_WARNING_HAZARD.x,
      LEVEL_ONE_WARNING_HAZARD.y,
      width,
      LEVEL_ONE_WARNING_HAZARD.height,
      0xe95d5d,
      1,
    );
    danger.setStrokeStyle(4, 0x1d2a33, 1);
    this.physics.add.existing(danger, true);
    this.warningHazard = danger;
    this.warningOverlap = this.physics.add.overlap(this.player, danger, () => {
      this.beginDeath({
        causeId: 'trusted-warning-strip',
        blockerId: 'warning-strip',
        message: '它說「完全安全」，但沒有說是對誰安全。',
      });
    });
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
    const level = this.dependencies.progressStore.snapshot.levels[LEVEL_ONE_ID];
    const currentOrder = level?.progressOrder ?? 0;

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
    const current = this.dependencies.progressStore.snapshot;
    const next = advanceProgress(current, LEVEL_ONE_ID, markerId, order);
    if (next === current) {
      return;
    }
    this.spawn = spawn;
    this.dependencies.progressStore.replace(next);
    publishGameStatus({ deaths: next.totalDeaths, message });
  }

  private beginDeath(context: DeathContext): void {
    if (this.dying || this.completed) {
      return;
    }

    this.dying = true;
    this.resetIdleClock();
    const state = this.dependencies.progressStore.snapshot;
    const level = state.levels[LEVEL_ONE_ID];
    const event: DeathEvent = {
      id: `${LEVEL_ONE_ID}:${level?.attempt ?? 1}:${Date.now()}`,
      levelId: LEVEL_ONE_ID,
      causeId: context.causeId,
      blockerId: context.blockerId,
      x: Math.round(this.player.x),
      y: Math.round(this.player.y),
      progressMarkerId: level?.progressMarkerId ?? 'start',
      attempt: level?.attempt ?? 1,
      occurredAt: Date.now(),
    };
    const result = recordDeath(state, event, LEVEL_ONE_REACTIONS);
    this.dependencies.progressStore.replace(result.state);

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
    return this.addText(this.player.x, Math.max(80, this.player.y - 72), `${prefix}　${message}`, 22, '#b9382c')
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
      deaths: this.dependencies.progressStore.snapshot.totalDeaths,
      message: '再一次。已經發生的援助不會收回。',
    });
  }

  private restorePersistedAssists(): void {
    const blockers = this.dependencies.progressStore.snapshot.levels[LEVEL_ONE_ID]?.blockers ?? {};
    for (const blocker of Object.values(blockers)) {
      for (const effectId of blocker.activeAssistIds) {
        this.applyEffectSafely(effectId);
      }
    }
  }

  private applyEffectSafely(effectId: string): void {
    if (this.appliedEffectIds.has(effectId)) {
      return;
    }

    try {
      switch (effectId) {
        case 'move-first-landing':
          this.firstLanding.setX(615).refreshBody();
          break;
        case 'deploy-gap-spring':
          this.deployGapSpring();
          break;
        case 'deploy-gap-bridge':
          this.addPlatform(490, 430, 158.4, 'tape-platform');
          break;
        case 'shrink-warning-strip':
          this.createWarningHazard(96);
          break;
        case 'deploy-strip-bypass':
          this.addPlatform(1_010, 345, 100.8, 'tape-platform');
          this.addPlatform(1_115, 315, 100.8, 'tape-platform');
          this.addPlatform(1_220, 345, 100.8, 'tape-platform');
          break;
        case 'retire-warning-strip':
          this.warningOverlap?.destroy();
          this.warningOverlap = null;
          this.warningHazard?.setFillStyle(0x9fd5e8, 0.4).setStrokeStyle(3, 0xb9382c, 0.75);
          this.addText(1_105, 492, '已下班', 18, '#b9382c').setOrigin(0.5).setRotation(-0.04);
          break;
        default:
          throw new Error(`Unknown sympathy effect: ${effectId}`);
      }
      this.appliedEffectIds.add(effectId);
    } catch (error) {
      console.error('[sympathy-effect]', effectId, error);
    }
  }

  private deployGapSpring(): void {
    if (this.spring !== null) {
      return;
    }
    this.spring = this.physics.add.staticSprite(444, 434, 'spring');
    this.physics.add.collider(this.player, this.spring, () => {
      if (!this.dying && this.player.body?.velocity.y !== undefined && this.player.body.velocity.y >= 0) {
        this.player.setVelocityY(-650);
      }
    });
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
    const current = this.dependencies.progressStore.snapshot;
    if (current.discoveredEasterEggIds.includes(eggId)) {
      return;
    }
    const next = discoverEasterEgg(current, eggId);
    this.dependencies.progressStore.replace(next);
    const message = '你是在等遊戲先道歉嗎？';
    publishGameStatus({ deaths: next.totalDeaths, message });
    const annotation = this.addText(this.player.x + 20, this.player.y - 76, message, 22, '#b9382c')
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
    let next = advanceProgress(this.dependencies.progressStore.snapshot, LEVEL_ONE_ID, 'goal', 3);
    next = completeLevel(next, LEVEL_ONE_ID);
    this.dependencies.progressStore.replace(next);
    publishGameStatus({
      deaths: next.totalDeaths,
      message: `抵達終點。世界總共心軟了 ${this.countActiveAssists()} 次。`,
      phase: 'completed',
    });
    this.addText(this.player.x - 40, 205, '通過\n（本題不計分）', 34, '#b9382c')
      .setAlign('center')
      .setOrigin(0.5)
      .setStroke('#fff9e8', 8)
      .setRotation(-0.055)
      .setDepth(20);
  }

  private countActiveAssists(): number {
    const blockers = this.dependencies.progressStore.snapshot.levels[LEVEL_ONE_ID]?.blockers ?? {};
    return Object.values(blockers).reduce((total, blocker) => total + blocker.activeAssistIds.length, 0);
  }

  private addText(x: number, y: number, text: string, fontSize: number, color: string): Phaser.GameObjects.Text {
    return this.add.text(x, y, text, {
      color,
      fontFamily: 'Fredoka, Nunito, Noto Sans TC, sans-serif',
      fontSize: `${fontSize}px`,
      fontStyle: 'bold',
      lineSpacing: 5,
    });
  }
}
