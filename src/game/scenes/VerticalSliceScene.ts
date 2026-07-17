import Phaser from 'phaser';
import {
  LEVEL_ONE_ID,
  LEVEL_ONE_ROUTE_BANTER,
  getLevelOneCompletionCopy,
  isLevelOneEffectId,
} from '../content/levelOne';
import {
  LEVEL_ONE_BLOCKER_ZONES,
  LEVEL_ONE_GOAL,
  LEVEL_ONE_PLAYER_PHYSICS,
  LEVEL_ONE_SPAWNS,
  LEVEL_ONE_WORLD,
} from '../content/levelOneLayout';
import {
  LEVEL_ONE_COLORS,
  LEVEL_ONE_INSPECTION_ROWS,
  LEVEL_ONE_SCENERY_REGIONS,
} from '../content/levelOneVisuals';
import { publishGameStatus } from '../events';
import type { InputController } from '../input/InputController';
import { LevelOneWorld } from './levelOne/LevelOneWorld';
import { LevelOneSession } from '../session/LevelOneSession';
import type { ProgressStore } from '../state/progress';
import { IdleTrigger } from '../state/IdleTrigger';
import { SceneLifecycle } from '../state/SceneLifecycle';
import type { ReactionDefinition } from '../sympathy/types';
import type { PlaytestDriver } from '../testing/PlaytestDriver';
import { addGameText } from '../visuals/addGameText';
import { createGameTextures } from '../visuals/createTextures';
import {
  LEVEL_ONE_ART_ANIMATIONS,
  LEVEL_ONE_ART_KEYS,
  hasLevelOneArt,
  preloadLevelOneArt,
  prepareLevelOneArt,
} from '../visuals/levelOneArt';

interface VerticalSliceSceneDependencies {
  readonly inputController: InputController;
  readonly progressStore: ProgressStore;
  readonly playtestDriver?: PlaytestDriver;
}

interface DeathContext {
  readonly causeId: string;
  readonly blockerId: string | null;
  readonly messages: readonly string[];
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
  private inspectionRows = new Map<string, Phaser.GameObjects.Text>();
  private inspectionStamp: Phaser.GameObjects.Text | null = null;
  private goalPole: Phaser.GameObjects.Rectangle | null = null;
  private goalFlag: Phaser.GameObjects.Triangle | null = null;
  private goalZone: Phaser.GameObjects.Zone | null = null;
  private goalMercyLabel: Phaser.GameObjects.Text | null = null;
  private goalShifted = false;
  private goalRelocationPending = false;
  private appliedEffectIds = new Set<string>();
  private seenRouteBanterIds = new Set<string>();
  private readonly lifecycle = new SceneLifecycle();
  private readonly idleTrigger = new IdleTrigger(8_000);

  private readonly resetIdleClock = (): void => {
    this.idleTrigger.reset();
  };

  constructor(private readonly dependencies: VerticalSliceSceneDependencies) {
    super('VerticalSliceScene');
    this.session = new LevelOneSession(dependencies.progressStore);
  }

  preload(): void {
    preloadLevelOneArt(this);
  }

  create(): void {
    this.resetRuntimeState();
    createGameTextures(this);
    prepareLevelOneArt(this);
    this.physics.world.setBounds(0, 0, LEVEL_ONE_WORLD.width, LEVEL_ONE_WORLD.height + 180);
    this.drawWorld();
    this.world.createPlatforms();
    this.createPlayer();
    this.createReverseEasterEgg();
    this.world.createWarningHazard();
    this.createGoal();
    this.createInspectionDossier();
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
        this.world.revealWarningHazard();
        this.beginDeath({
          causeId: 'trusted-warning-strip',
          blockerId: 'warning-strip',
          messages: [
            '王城認證是真的。認證內容不是「安全」。',
            '告示牌正在確認自己是不是也算受害者。',
            '步道表示：變紅只是停止偽裝，不是承認錯誤。',
          ],
        });
      },
      onLandingAmbush: () => {
        this.beginDeath({
          causeId: 'landing-stamp-ambush',
          blockerId: 'landing-ambush',
          messages: [
            '安全落地。然後平台補考了你一次。',
            '補考章表示：站穩也是考試範圍。',
            '你已經知道它在這裡，它還是很想蓋。',
          ],
        });
      },
      onGoalAmbush: () => {
        this.goalRelocationPending = true;
        this.beginDeath({
          causeId: 'goal-approval-stamp',
          blockerId: 'goal-ambush',
          messages: [
            '終點審核通過了。你沒有。',
            '那顆章只蓋第一次。行政流程偶爾也有良心。',
          ],
        });
      },
      isPlayerDying: () => this.lifecycle.isDying,
    }, {
      warningHazardRevealed: this.session.causeDeaths('trusted-warning-strip') > 0,
      landingAmbushRevealed: this.session.causeDeaths('landing-stamp-ambush') > 0,
      bridgeWeaknessRevealed: this.session.blockerDeaths('intern-bridge') > 0,
      goalAmbushSpent: this.session.causeDeaths('goal-approval-stamp') > 0,
    });
    this.reverseCoins = [];
    this.reverseCoinLabel = null;
    this.inspectionRows.clear();
    this.inspectionStamp = null;
    this.goalPole = null;
    this.goalFlag = null;
    this.goalZone = null;
    this.goalMercyLabel = null;
    this.goalShifted = false;
    this.goalRelocationPending = false;
    this.appliedEffectIds.clear();
    this.seenRouteBanterIds.clear();
    this.lifecycle.reset();
    this.idleTrigger.resetAll();
  }

  override update(): void {
    if (!this.lifecycle.isPlaying) {
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
      this.beginDeath(this.resolveFallDeathContext());
      return;
    }

    this.updateProgressMarkers();
    this.updateRouteBanter();
    this.updateIdleEgg();
  }

  private drawWorld(): void {
    this.cameras.main.setBackgroundColor('#ddf4ff');
    const scenery = this.add.graphics().setDepth(-12);
    scenery.fillStyle(LEVEL_ONE_COLORS.skyLight, 0.72);
    scenery.fillRect(0, 0, LEVEL_ONE_WORLD.width, 164);
    scenery.fillStyle(LEVEL_ONE_COLORS.documentYellow, 0.24);
    scenery.fillCircle(2_510, 92, 72);

    for (const [index, region] of LEVEL_ONE_SCENERY_REGIONS.entries()) {
      scenery.fillStyle(index % 2 === 0 ? LEVEL_ONE_COLORS.paper : LEVEL_ONE_COLORS.royalGreen, 0.045);
      scenery.fillRect(region.startX, 0, region.endX - region.startX, LEVEL_ONE_WORLD.height);
    }

    scenery.fillStyle(LEVEL_ONE_COLORS.farHill, 0.78);
    for (let x = -80; x <= LEVEL_ONE_WORLD.width + 260; x += 430) {
      scenery.fillEllipse(x, 425, 620, 250);
    }
    scenery.fillStyle(LEVEL_ONE_COLORS.nearHill, 0.52);
    for (let x = 160; x <= LEVEL_ONE_WORLD.width + 240; x += 520) {
      scenery.fillEllipse(x, 475, 570, 215);
    }

    scenery.lineStyle(4, LEVEL_ONE_COLORS.warningRed, 0.34);
    for (let x = 910; x < 2_610; x += 58) {
      scenery.lineBetween(x, 286 + ((x / 58) % 2) * 5, x + 28, 286 + ((x / 58) % 2) * 5);
    }

    scenery.fillStyle(LEVEL_ONE_COLORS.wood, 0.78);
    scenery.fillRect(2_704, 206, 52, 157);
    scenery.fillRect(2_818, 166, 82, 197);
    scenery.fillRect(2_940, 216, 44, 147);
    scenery.fillStyle(LEVEL_ONE_COLORS.castle, 0.78);
    scenery.fillTriangle(2_678, 206, 2_730, 142, 2_782, 206);
    scenery.fillTriangle(2_790, 166, 2_859, 94, 2_928, 166);
    scenery.fillTriangle(2_920, 216, 2_962, 160, 3_004, 216);
    scenery.fillStyle(LEVEL_ONE_COLORS.documentYellow, 0.78);
    scenery.fillRect(2_850, 214, 18, 34);

    const foliage = this.add.graphics().setDepth(-5);
    for (let x = 100; x <= LEVEL_ONE_WORLD.width; x += 245) {
      const constructionZone = x > 950 && x < 2_260;
      const crownY = constructionZone ? 360 : 372;
      foliage.fillStyle(LEVEL_ONE_COLORS.wood, 0.78);
      foliage.fillRect(x - 7, crownY, 14, 68);
      foliage.fillStyle(constructionZone ? LEVEL_ONE_COLORS.royalGreenDark : LEVEL_ONE_COLORS.royalGreen, 0.7);
      foliage.fillCircle(x, crownY, 30);
      foliage.fillCircle(x - 22, crownY + 14, 22);
      foliage.fillCircle(x + 22, crownY + 14, 22);
    }

    const worksite = this.add.graphics().setDepth(-3);
    for (const x of [970, 1_255, 1_730, 1_900, 2_250]) {
      worksite.fillStyle(LEVEL_ONE_COLORS.wood, 0.9);
      worksite.fillRect(x - 5, 366, 10, 72);
      worksite.fillStyle(LEVEL_ONE_COLORS.documentYellow, 0.95);
      worksite.fillTriangle(x - 22, 383, x + 22, 383, x, 346);
      worksite.lineStyle(3, LEVEL_ONE_COLORS.warningRed, 0.85);
      worksite.lineBetween(x - 11, 374, x + 11, 358);
    }

    for (const [x, y, width] of [
      [260, 98, 150],
      [1_080, 132, 190],
      [2_020, 90, 170],
    ] as const) {
      this.add.ellipse(x, y, width, 38, LEVEL_ONE_COLORS.paper, 0.76)
        .setStrokeStyle(3, LEVEL_ONE_COLORS.ink, 0.12)
        .setDepth(-8);
    }

    for (const region of LEVEL_ONE_SCENERY_REGIONS) {
      addGameText(this, region.labelX, 250, `${region.label}\n${region.note}`, 14, '#1d2a33')
        .setAlpha(0.48)
        .setLineSpacing(4)
        .setDepth(-2);
    }

    addGameText(this, 42, 38, '王城新手勇者測驗 · 第一關', 24, '#1d2a33').setAlpha(0.9);
    addGameText(this, 44, 74, '官方保證：大部分設施今天都固定好了。', 16, '#b9382c').setAlpha(0.84);
    addGameText(this, 500, 450, '測驗一\n跨過去', 17, '#1d2a33').setAlign('center').setRotation(-0.03);
    addGameText(this, 1_030, 468, '王城認證步道', 17, '#fff9e8')
      .setBackgroundColor('#147b70')
      .setPadding(10, 6)
      .setRotation(0.025);
    addGameText(this, 1_765, 330, '王國模範安全橋\n連續六年零事故', 17, '#1d2a33')
      .setAlign('center')
      .setBackgroundColor('#fff9e8')
      .setPadding(12, 8)
      .setRotation(-0.025);
    addGameText(this, 2_645, 332, '王城入口在右邊\n客服說這次是真的', 18, '#1d2a33')
      .setAlign('center')
      .setBackgroundColor('#fff9e8')
      .setPadding(12, 8)
      .setRotation(0.02);
  }

  private createPlayer(): void {
    const initialSpawn = this.session.initialSpawn;
    this.spawn = new Phaser.Math.Vector2(initialSpawn.x, initialSpawn.y);

    const hasHeroArt = hasLevelOneArt(this, LEVEL_ONE_ART_KEYS.heroIdle);
    this.player = this.physics.add.sprite(
      this.spawn.x,
      this.spawn.y,
      hasHeroArt ? LEVEL_ONE_ART_KEYS.heroIdle : 'player',
    );
    this.player.setCollideWorldBounds(false);
    this.player.setMaxVelocity(this.moveSpeed, 780);
    const body = this.player.body;
    body?.setSize(LEVEL_ONE_PLAYER_PHYSICS.bodyWidth, LEVEL_ONE_PLAYER_PHYSICS.bodyHeight, !hasHeroArt);
    if (hasHeroArt) {
      body?.setOffset(2, 1);
      this.player.play(LEVEL_ONE_ART_ANIMATIONS.heroIdle);
    }
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
    this.goalShifted = this.session.causeDeaths('goal-approval-stamp') > 0;
    const shiftX = this.goalShifted ? LEVEL_ONE_GOAL.mercyShiftX : 0;
    this.goalPole = this.add.rectangle(
      LEVEL_ONE_GOAL.x + shiftX,
      LEVEL_ONE_GOAL.poleY,
      12,
      190,
      LEVEL_ONE_COLORS.ink,
      1,
    );
    this.goalFlag = this.add.triangle(
      LEVEL_ONE_GOAL.flagX + shiftX,
      LEVEL_ONE_GOAL.flagY,
      0,
      0,
      0,
      70,
      92,
      35,
      LEVEL_ONE_COLORS.documentYellow,
      1,
    );
    this.goalFlag.setStrokeStyle(4, LEVEL_ONE_COLORS.ink, 1);
    this.goalZone = this.add.zone(LEVEL_ONE_GOAL.x - 10 + shiftX, LEVEL_ONE_GOAL.triggerY, 100, 150);
    this.physics.add.existing(this.goalZone, true);
    this.physics.add.overlap(this.player, this.goalZone, () => this.finishLevel());
    this.goalPole.setDepth(1);
    this.goalFlag.setDepth(1);

    if (this.goalShifted) {
      this.goalMercyLabel = addGameText(
        this,
        LEVEL_ONE_GOAL.x + shiftX - 8,
        198,
        '事故後免複驗\n終點已主動靠近',
        15,
        '#b9382c',
      )
        .setOrigin(0.5)
        .setAlign('center')
        .setBackgroundColor('#fff9e8')
        .setPadding(8, 5)
        .setRotation(-0.035)
        .setDepth(3);
    }
  }

  private createInspectionDossier(): void {
    const dossierX = 650;
    const panel = this.add.container(0, 0).setScrollFactor(0).setDepth(40);
    const shadow = this.add
      .rectangle(dossierX + 6, 76, 220, 112, LEVEL_ONE_COLORS.ink, 0.18)
      .setScrollFactor(0);
    const paper = this.add
      .rectangle(dossierX, 70, 220, 112, LEVEL_ONE_COLORS.paper, 0.94)
      .setStrokeStyle(3, LEVEL_ONE_COLORS.ink, 0.9)
      .setScrollFactor(0);
    const tab = this.add
      .rectangle(dossierX - 81, 18, 58, 18, LEVEL_ONE_COLORS.documentYellow, 1)
      .setStrokeStyle(2, LEVEL_ONE_COLORS.ink, 0.8)
      .setScrollFactor(0);
    panel.add([shadow, paper, tab]);

    panel.add(
      addGameText(this, dossierX - 94, 29, '王城驗收檔案 · 001', 13, '#b9382c')
        .setScrollFactor(0)
        .setDepth(41),
    );
    for (const [index, row] of LEVEL_ONE_INSPECTION_ROWS.entries()) {
      const text = addGameText(this, dossierX - 89, 52 + index * 21, row.label, 13, '#1d2a33')
        .setScrollFactor(0)
        .setDepth(41);
      this.inspectionRows.set(row.blockerId, text);
      panel.add(text);
    }
    this.inspectionStamp = addGameText(this, dossierX + 24, 88, '免驗錄取', 21, '#b9382c')
      .setOrigin(0.5)
      .setRotation(-0.12)
      .setStroke('#fff9e8', 4)
      .setAlpha(0)
      .setScrollFactor(0)
      .setDepth(42);
    panel.add(this.inspectionStamp);
    this.refreshInspectionDossier();
  }

  private refreshInspectionDossier(): void {
    for (const row of LEVEL_ONE_INSPECTION_ROWS) {
      const deaths = this.session.blockerDeaths(row.blockerId);
      const status = deaths === 0 ? '待驗' : deaths >= 7 ? `× ${deaths}　強制合格` : `事故 × ${deaths}`;
      this.inspectionRows.get(row.blockerId)
        ?.setText(`${row.label}　${status}`)
        .setColor(deaths === 0 ? '#1d2a33' : '#b9382c');
    }
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
    } else if (currentOrder < 3 && this.player.x >= 2_230) {
      this.advanceMarker(
        'after-intern-bridge',
        3,
        new Phaser.Math.Vector2(
          LEVEL_ONE_SPAWNS.afterInternBridge.x,
          LEVEL_ONE_SPAWNS.afterInternBridge.y,
        ),
        '安全橋通過。驗收人員迅速把鉛筆收進口袋。',
      );
    }
  }

  private updateRouteBanter(): void {
    const banter = LEVEL_ONE_ROUTE_BANTER.find(
      (entry) => this.player.x >= entry.triggerX && !this.seenRouteBanterIds.has(entry.id),
    );
    if (banter === undefined) {
      return;
    }
    this.seenRouteBanterIds.add(banter.id);
    publishGameStatus({ deaths: this.session.totalDeaths, message: banter.message });
    const annotation = addGameText(this, this.player.x + 90, 130, banter.message, 18, '#b9382c')
      .setOrigin(0.5)
      .setAlign('center')
      .setWordWrapWidth(430)
      .setStroke('#fff9e8', 6)
      .setRotation(-0.025)
      .setDepth(10);
    this.time.delayedCall(2_300, () => annotation.destroy());
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
    if (!this.lifecycle.beginDeath()) {
      return;
    }

    this.resetIdleClock();
    this.player.setTint(0xb9382c);
    this.player.setVelocity(0, -180);
    if (this.player.body !== null) {
      this.player.body.enable = false;
    }

    const result = this.session.recordDeath(
      {
        causeId: context.causeId,
        blockerId: context.blockerId,
        x: Math.round(this.player.x),
        y: Math.round(this.player.y),
      },
      (effectId) => this.applyEffectSafely(effectId),
    );
    this.refreshInspectionDossier();

    const causeDeaths = result.state.levels[LEVEL_ONE_ID]?.deathsByCause[context.causeId] ?? 1;
    const fallbackMessage = context.messages[(causeDeaths - 1) % context.messages.length] ?? context.messages[0];
    const message = result.reaction?.message ?? fallbackMessage ?? '這次事故仍在調查中。';
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
    if (!this.lifecycle.isDying) {
      return;
    }
    this.player.clearTint();
    this.world.resetTransientHazards();
    this.player.setPosition(this.spawn.x, this.spawn.y);
    this.player.setVelocity(0, 0);
    if (this.player.body !== null) {
      this.player.body.enable = true;
    }
    this.lifecycle.respawn();
    this.resetIdleClock();
    const goalRelocated = this.goalRelocationPending && this.relocateGoalAfterAudit();
    this.goalRelocationPending = false;
    publishGameStatus({
      deaths: this.session.totalDeaths,
      message: goalRelocated
        ? '鑑於剛才的審核事故，客服把終點搬近了。這次算公開放水。'
        : '再一次。已經發生的援助不會收回。',
    });
  }

  private relocateGoalAfterAudit(): boolean {
    if (this.goalShifted || this.goalPole === null || this.goalFlag === null || this.goalZone === null) {
      return false;
    }

    this.goalShifted = true;
    const shiftX = LEVEL_ONE_GOAL.mercyShiftX;
    const poleTargetX = this.goalPole.x + shiftX;
    const flagTargetX = this.goalFlag.x + shiftX;
    this.goalZone.setX(this.goalZone.x + shiftX);
    const goalBody = this.goalZone.body as Phaser.Physics.Arcade.StaticBody | null;
    goalBody?.updateFromGameObject();

    this.tweens.add({
      targets: this.goalPole,
      x: poleTargetX,
      duration: 620,
      ease: 'Back.Out',
    });
    this.tweens.add({
      targets: this.goalFlag,
      x: flagTargetX,
      duration: 620,
      ease: 'Back.Out',
    });
    this.goalMercyLabel = addGameText(
      this,
      poleTargetX - 8,
      198,
      '事故後免複驗\n終點已主動靠近',
      15,
      '#b9382c',
    )
      .setOrigin(0.5)
      .setAlign('center')
      .setBackgroundColor('#fff9e8')
      .setPadding(8, 5)
      .setRotation(-0.035)
      .setAlpha(0)
      .setDepth(3);
    this.tweens.add({
      targets: this.goalMercyLabel,
      alpha: 1,
      y: 188,
      duration: 520,
      delay: 160,
      ease: 'Quad.Out',
    });
    const correction = addGameText(this, LEVEL_ONE_GOAL.x + 18, 246, '原位置作廢　←', 15, '#b9382c')
      .setOrigin(0.5)
      .setBackgroundColor('#fff9e8')
      .setPadding(6, 3)
      .setRotation(0.04)
      .setDepth(3);
    this.tweens.add({
      targets: correction,
      alpha: 0,
      duration: 700,
      delay: 1_800,
      onComplete: () => correction.destroy(),
    });
    return true;
  }

  private restorePersistedAssists(): void {
    for (const effectId of this.session.activeAssistIds) {
      this.applyEffectSafely(effectId);
    }
  }

  private applyEffectSafely(effectId: string): boolean {
    if (this.appliedEffectIds.has(effectId)) {
      return true;
    }

    try {
      if (!isLevelOneEffectId(effectId)) {
        throw new Error(`Unknown sympathy effect: ${effectId}`);
      }
      this.world.applyAssistEffect(effectId);
      this.appliedEffectIds.add(effectId);
      return true;
    } catch (error) {
      console.error('[sympathy-effect]', effectId, error);
      return false;
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
    if (!this.lifecycle.complete()) {
      return;
    }
    this.player.setVelocity(0, 0);
    if (this.player.body !== null) {
      this.player.body.enable = false;
    }
    const next = this.session.complete();
    const copy = getLevelOneCompletionCopy(
      next.totalDeaths,
      this.session.activeAssistCount,
      this.session.causeDeaths('goal-approval-stamp') > 0,
    );
    publishGameStatus({
      deaths: next.totalDeaths,
      message: copy.status,
      phase: 'completed',
    });
    this.playCompletionSetpiece();
    addGameText(this, this.cameras.main.scrollX + 360, 150, copy.banner, 28, '#b9382c')
      .setAlign('center')
      .setOrigin(0.5)
      .setBackgroundColor('#fff9e8')
      .setPadding(14, 9)
      .setStroke('#fff9e8', 8)
      .setRotation(-0.055)
      .setDepth(20);
  }

  private playCompletionSetpiece(): void {
    if (this.goalMercyLabel !== null) {
      this.tweens.add({
        targets: this.goalMercyLabel,
        alpha: 0,
        duration: 280,
      });
    }
    this.inspectionStamp?.setAlpha(1).setScale(0.64);
    if (this.inspectionStamp !== null) {
      this.tweens.add({
        targets: this.inspectionStamp,
        scaleX: 1,
        scaleY: 1,
        duration: 360,
        ease: 'Back.Out',
      });
    }
    if (this.goalFlag !== null) {
      this.tweens.add({
        targets: this.goalFlag,
        y: this.goalFlag.y + 58,
        angle: 8,
        duration: 620,
        ease: 'Bounce.Out',
      });
    }

    const paperOffsets = [-112, -82, -48, -18, 18, 46, 78, 108];
    paperOffsets.forEach((offset, index) => {
      const paper = this.add
        .rectangle(
          this.player.x + offset * 0.2,
          232 - (index % 3) * 12,
          18,
          12,
          index % 2 === 0 ? LEVEL_ONE_COLORS.paper : LEVEL_ONE_COLORS.documentYellow,
          1,
        )
        .setStrokeStyle(2, LEVEL_ONE_COLORS.warningRed, 0.75)
        .setDepth(18);
      this.tweens.add({
        targets: paper,
        x: this.player.x + offset,
        y: 365 + (index % 2) * 34,
        angle: offset > 0 ? 105 : -105,
        alpha: 0.18,
        duration: 780 + index * 45,
        ease: 'Quad.In',
      });
    });
  }

  private resolveFallDeathContext(): DeathContext {
    const { firstGap, internBridge } = LEVEL_ONE_BLOCKER_ZONES;
    if (this.player.x >= firstGap.minX && this.player.x < firstGap.maxX) {
      return {
        causeId: 'fell-out-of-world',
        blockerId: 'first-gap',
        messages: [
          '那個坑確實比看起來更有企圖。',
          '坑洞提出異議：是勇者自己走進來的。',
          '考官正在確認「跨過去」是否寫得不夠具體。',
        ],
      };
    }
    if (this.player.x >= internBridge.minX && this.player.x < internBridge.maxX) {
      return {
        causeId: 'intern-bridge-collapse',
        blockerId: 'intern-bridge',
        messages: [
          '橋的保固剛好在你踏上去時到期。',
          '實習生說那不是塌，是快速收納。',
          '年度驗收報告正在安靜地改日期。',
        ],
      };
    }
    return {
      causeId: 'fell-out-of-world',
      blockerId: null,
      messages: ['地圖下面沒有隱藏道路。剛剛確認過了。', '這一帶的虛空目前不開放觀光。'],
    };
  }

}
