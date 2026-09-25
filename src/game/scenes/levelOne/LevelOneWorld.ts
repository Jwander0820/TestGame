import Phaser from 'phaser';
import { LEVEL_ONE_EFFECT_IDS, type LevelOneEffectId } from '../../content/levelOne';
import {
  LEVEL_ONE_ASSISTANCE_LAYOUT,
  LEVEL_ONE_AMBUSH_LAYOUT,
  LEVEL_ONE_COLLAPSING_BRIDGE,
  LEVEL_ONE_PLATFORM_LAYOUT,
  LEVEL_ONE_SECRET_PLATFORM_LAYOUT,
  LEVEL_ONE_WARNING_HAZARD,
  type PlatformDefinition,
} from '../../content/levelOneLayout';
import { LEVEL_ONE_COLORS, LEVEL_ONE_TEXT_COLORS } from '../../content/levelOneVisuals';
import { addGameText } from '../../visuals/addGameText';
import { PLATFORM_TEXTURE_WIDTH } from '../../visuals/createTextures';
import { LearnedTrapState } from '../../state/LearnedTrapState';
import { LearnedTraps } from './LearnedTraps';
import { LEVEL_ONE_COPY as copy } from '../../content/levelOneCopy';
import { FirstPitAmbush } from './FirstPitAmbush';
import { FirstPitState } from '../../state/FirstPitState';
import type { FirstPitCause } from '../../content/firstPitAmbush';
import { RearGauntlet } from './RearGauntlet';
import { RearGauntletState } from '../../state/RearGauntletState';
import type { RearCause, RearHazardId } from '../../content/rearGauntlet';
import { GoalStamp } from './GoalStamp';
import { SlimeEnemies } from './SlimeEnemies';
import { SlimeState } from '../../state/SlimeState';
import type { SlimeId } from '../../content/levelOneSlimes';
import { drawRedCarpet } from '../../visuals/redCarpet';

interface LevelOneWorldCallbacks {
  readonly onWarningHazard: () => void;
  readonly onLandingAmbush: () => void;
  readonly onGoalAmbush: () => void;
  readonly onAirAmbush: () => void;
  readonly onFirstPitDeath: (cause: FirstPitCause) => void;
  readonly onRearDeath: (cause: RearCause) => void;
  readonly onSlimeDeath: (id: SlimeId, revenge: boolean) => void;
  readonly isPlayerDying: () => boolean;
}

export interface LevelOneWorldInitialState {
  readonly warningHazardRevealed: boolean;
  readonly landingAmbushRevealed: boolean;
  readonly bridgeWeaknessRevealed: boolean;
  readonly goalAmbushSpent: boolean;
  readonly ceilingRevealed: boolean;
  readonly airAmbushRevealed: boolean;
  readonly pitBrickRevealed: boolean;
  readonly coinsRevealed: boolean;
  readonly rearRevealed: readonly RearHazardId[];
  readonly slimesRevealed: readonly SlimeId[];
}

export class LevelOneWorld {
  finalMercyActive = false;
  private readonly slimeState: SlimeState;
  private slimes: SlimeEnemies | null = null;
  private readonly rearState: RearGauntletState;
  private rear: RearGauntlet | null = null;
  private raisedStep: Phaser.Physics.Arcade.Sprite | null = null;
  private readonly firstPitState: FirstPitState;
  private firstPit: FirstPitAmbush | null = null;
  private readonly trapState: LearnedTrapState;
  private learnedTraps: LearnedTraps | null = null;
  private landingStamp: Phaser.GameObjects.Rectangle | null = null;
  private landingStampLabel: Phaser.GameObjects.Text | null = null;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private readonly platformVisuals = new Map<Phaser.Physics.Arcade.Sprite, Phaser.GameObjects.TileSprite>();
  private firstLanding: Phaser.Physics.Arcade.Sprite | null = null;
  private player: Phaser.Physics.Arcade.Sprite | null = null;
  private warningHazard: Phaser.GameObjects.Rectangle | null = null;
  private warningMarks: Phaser.GameObjects.Graphics | null = null;
  private warningOverlap: Phaser.Physics.Arcade.Collider | null = null;
  private spring: Phaser.Physics.Arcade.Sprite | null = null;
  private springVisual: Phaser.GameObjects.Sprite | null = null;
  private collapsingBridge: Phaser.Physics.Arcade.Sprite | null = null;
  private bridgeSafetyNet: Phaser.Physics.Arcade.Sprite | null = null;
  private bridgeCollapseTimer: Phaser.Time.TimerEvent | null = null;
  private bridgeCollapseDelayMs: number = LEVEL_ONE_COLLAPSING_BRIDGE.collapseDelayMs;
  private bridgeCertified = false;
  private warningHazardRevealed: boolean;
  private landingAmbushArmed = false;
  private bridgeWeaknessRevealed: boolean;
  private readonly goalAmbushSpent: boolean;
  private goalStamp: GoalStamp | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly callbacks: LevelOneWorldCallbacks,
    initialState: LevelOneWorldInitialState,
  ) {
    this.rearState = new RearGauntletState(initialState.rearRevealed);
    this.slimeState = new SlimeState(initialState.slimesRevealed);
    this.firstPitState = new FirstPitState(initialState.pitBrickRevealed, initialState.coinsRevealed);
    this.trapState = new LearnedTrapState(initialState.ceilingRevealed, initialState.airAmbushRevealed);
    this.warningHazardRevealed = initialState.warningHazardRevealed;
    this.bridgeWeaknessRevealed = initialState.bridgeWeaknessRevealed;
    this.goalAmbushSpent = initialState.goalAmbushSpent;
    this.landingAmbushArmed = initialState.landingAmbushRevealed;
  }

  createPlatforms(): void {
    this.platforms = this.scene.physics.add.staticGroup();
    for (const definition of LEVEL_ONE_PLATFORM_LAYOUT) {
      if (definition.kind === 'collapsing') {
        this.createCollapsingBridge(definition);
        continue;
      }
      const platform = this.addPlatform(definition.x, definition.y, definition.width);
      if (definition.id === 'raised-step') this.raisedStep = platform;
      if (definition.id === 'first-landing') {
        this.firstLanding = platform;
      }
    }

    for (const definition of LEVEL_ONE_SECRET_PLATFORM_LAYOUT) {
      this.addOneWayPlatform(definition.x, definition.y, definition.width);
    }
  }

  attachPlayer(player: Phaser.Physics.Arcade.Sprite): void {
    this.player = player;
    this.scene.physics.add.collider(player, this.platforms, (_player, platform) => {
      if (platform === this.raisedStep && player.body?.blocked.down && !this.callbacks.isPlayerDying()) {
        this.rear?.landOnStep();
      }
    });
    if (this.collapsingBridge !== null) {
      this.scene.physics.add.collider(player, this.collapsingBridge, () => this.armCollapsingBridge());
    }
    this.createLandingAmbush();
    this.slimes = new SlimeEnemies(this.scene, player, this.slimeState,
      this.callbacks.isPlayerDying, this.callbacks.onSlimeDeath);
    this.createGoalAmbush();
    this.learnedTraps = new LearnedTraps(this.scene, player, this.trapState,
      this.callbacks.isPlayerDying, this.callbacks.onAirAmbush);
    this.firstPit = new FirstPitAmbush(this.scene, player, this.firstPitState,
      this.callbacks.isPlayerDying, this.callbacks.onFirstPitDeath);
    this.rear = new RearGauntlet(this.scene, player, this.rearState,
      this.callbacks.isPlayerDying, this.callbacks.onRearDeath, (collapsed) => {
        const step = this.raisedStep;
        if (step?.body) step.body.enable = !collapsed;
        if (step) this.platformVisuals.get(step)?.setAlpha(collapsed ? 0.2 : 1)
          .setY(step.y + 15 + (collapsed ? 90 : 0));
      });
  }

  update(deltaMs: number): void {
    if (this.finalMercyActive) return;
    this.goalStamp?.update(deltaMs);
    if (this.callbacks.isPlayerDying()) return;
    this.slimes?.update(deltaMs);
    this.firstPit?.update(deltaMs);
    this.rear?.update(deltaMs);
  }

  get raisedStepCollapsed(): boolean { return this.rear?.stepCollapsed ?? false; }

  get hitPitBrickThisAttempt(): boolean {
    return this.firstPitState.hitBrickThisAttempt;
  }

  get hitCeilingThisAttempt(): boolean {
    return this.trapState.hitCeilingThisAttempt;
  }

  createWarningHazard(width: number = LEVEL_ONE_WARNING_HAZARD.width): void {
    this.warningOverlap?.destroy();
    this.warningOverlap = null;
    this.warningHazard?.destroy();
    this.warningHazard = null;
    this.warningMarks?.destroy();
    this.warningMarks = null;

    const danger = this.scene.add.rectangle(
      LEVEL_ONE_WARNING_HAZARD.x,
      LEVEL_ONE_WARNING_HAZARD.y,
      width,
      LEVEL_ONE_WARNING_HAZARD.height,
      this.warningHazardRevealed ? LEVEL_ONE_COLORS.hazard : LEVEL_ONE_COLORS.safeBody,
      1,
    );
    danger.setStrokeStyle(4, LEVEL_ONE_COLORS.outline, 1);
    this.scene.physics.add.existing(danger, true);
    this.warningHazard = danger;
    if (this.warningHazardRevealed) {
      this.drawWarningMarks(width);
    }
    this.warningOverlap = this.scene.physics.add.overlap(this.requirePlayer(), danger, this.callbacks.onWarningHazard);
  }

  revealWarningHazard(): void {
    if (this.warningHazardRevealed) {
      return;
    }
    this.warningHazardRevealed = true;
    this.warningHazard?.setFillStyle(LEVEL_ONE_COLORS.hazard, 1);
    this.drawWarningMarks(this.warningHazard?.displayWidth ?? LEVEL_ONE_WARNING_HAZARD.width);
    addGameText(
      this.scene,
      LEVEL_ONE_WARNING_HAZARD.x,
      470,
      copy.warningRevealed,
      16,
      LEVEL_ONE_TEXT_COLORS.parchment,
    )
      .setOrigin(0.5)
      .setBackgroundColor(LEVEL_ONE_TEXT_COLORS.danger)
      .setPadding(8, 4)
      .setDepth(3);
  }

  applyAssistEffect(effectId: LevelOneEffectId): void {
    if (effectId === LEVEL_ONE_EFFECT_IDS.certifyBridgePermanent) this.goalStamp?.retire();
    this.slimes?.applyEffect(effectId);
    this.rear?.applyEffect(effectId);
    this.firstPit?.applyEffect(effectId);
    this.learnedTraps?.applyEffect(effectId);
    if (!this.trapState.landingStampEnabled) {
      const stampBody = this.landingStamp?.body as Phaser.Physics.Arcade.StaticBody | null;
      if (stampBody) stampBody.enable = false;
      this.landingStamp?.setAlpha(0.18);
      this.landingStampLabel?.setAlpha(0.18);
    }
    switch (effectId) {
      case LEVEL_ONE_EFFECT_IDS.moveFirstLanding:
        this.movePlatform(
          this.requireFirstLanding(),
          LEVEL_ONE_ASSISTANCE_LAYOUT.firstLandingX,
          this.requireFirstLanding().y,
        );
        return;
      case LEVEL_ONE_EFFECT_IDS.deployGapSpring:
        this.deployGapSpring();
        return;
      case LEVEL_ONE_EFFECT_IDS.deployGapBridge: {
        const bridge = LEVEL_ONE_ASSISTANCE_LAYOUT.gapBridge;
        this.retireGapSpring();
        this.movePlatform(this.requireFirstLanding(), this.requireFirstLanding().x, bridge.y);
        this.addPlatform(bridge.x, bridge.y, bridge.width, 'mercy-platform');
        return;
      }
      case LEVEL_ONE_EFFECT_IDS.shrinkWarningStrip:
        this.createWarningHazard(LEVEL_ONE_ASSISTANCE_LAYOUT.warningStripWidth);
        return;
      case LEVEL_ONE_EFFECT_IDS.deployStripBypass:
        for (const platform of LEVEL_ONE_ASSISTANCE_LAYOUT.warningBypass) {
          this.addOneWayPlatform(platform.x, platform.y, platform.width);
        }
        return;
      case LEVEL_ONE_EFFECT_IDS.retireWarningStrip: {
        this.warningOverlap?.destroy();
        this.warningOverlap = null;
        this.warningMarks?.destroy();
        this.warningMarks = null;
        this.warningHazard
          ?.setFillStyle(LEVEL_ONE_COLORS.midSilhouette, 0.58)
          .setStrokeStyle(3, LEVEL_ONE_COLORS.assist, 1);
        const label = LEVEL_ONE_ASSISTANCE_LAYOUT.retiredLabel;
        addGameText(this.scene, label.x, label.y, copy.warningRetired, 17, LEVEL_ONE_TEXT_COLORS.ink)
          .setOrigin(0.5)
          .setBackgroundColor(LEVEL_ONE_TEXT_COLORS.assist)
          .setPadding(7, 4);
        return;
      }
      case LEVEL_ONE_EFFECT_IDS.reinforceInternBridge:
        this.bridgeCollapseDelayMs = LEVEL_ONE_COLLAPSING_BRIDGE.reinforcedDelayMs;
        this.requireCollapsingBridge().setTint(LEVEL_ONE_COLORS.assistHighlight);
        return;
      case LEVEL_ONE_EFFECT_IDS.deployBridgeSafetyNet: {
        if (this.bridgeSafetyNet === null) {
          const net = LEVEL_ONE_COLLAPSING_BRIDGE.safetyNet;
          this.bridgeSafetyNet = this.addOneWayPlatform(net.x, net.y, net.width);
          addGameText(
            this.scene,
            net.x,
            net.y + 14,
            copy.safetyNet,
            14,
            LEVEL_ONE_TEXT_COLORS.ink,
          )
            .setOrigin(0.5, 0)
            .setBackgroundColor(LEVEL_ONE_TEXT_COLORS.assist)
            .setPadding(6, 3);
        }
        return;
      }
      case LEVEL_ONE_EFFECT_IDS.certifyBridgePermanent: {
        this.bridgeCertified = true;
        this.resetTransientHazards();
        this.requireCollapsingBridge().setTexture('platform').clearTint().refreshBody();
        const label = LEVEL_ONE_COLLAPSING_BRIDGE.certifiedLabel;
        addGameText(
          this.scene,
          label.x,
          label.y,
          copy.bridgeCertified,
          16,
          LEVEL_ONE_TEXT_COLORS.danger,
        )
          .setOrigin(0.5)
          .setBackgroundColor(LEVEL_ONE_TEXT_COLORS.parchment)
          .setPadding(7, 4)
          .setDepth(3);
        return;
      }
    }

    const unhandledEffect: never = effectId;
    throw new Error(`Unhandled level one effect: ${unhandledEffect}`);
  }

  resetTransientHazards(): void {
    if (this.finalMercyActive) return;
    this.goalStamp?.resetAttempt();
    this.slimes?.resetAttempt();
    this.rear?.resetAttempt();
    this.firstPit?.resetAttempt();
    this.trapState.resetAttempt();
    this.bridgeCollapseTimer?.remove(false);
    this.bridgeCollapseTimer = null;

    const bridge = this.collapsingBridge;
    if (bridge === null) {
      return;
    }
    this.scene.tweens.killTweensOf(bridge);
    const definition = this.requireCollapsingBridgeDefinition();
    bridge.setPosition(definition.x, definition.y).setAlpha(1).setAngle(0).setActive(true).setVisible(true);
    bridge.setTexture(
      this.bridgeCertified ? 'platform' : this.bridgeWeaknessRevealed ? 'mercy-platform' : 'platform',
    );
    if (!this.bridgeCertified && this.bridgeCollapseDelayMs > LEVEL_ONE_COLLAPSING_BRIDGE.collapseDelayMs) {
      bridge.setTint(LEVEL_ONE_COLORS.assistHighlight);
    } else {
      bridge.clearTint();
    }
    if (bridge.body !== null) {
      bridge.body.enable = true;
    }
    bridge.refreshBody();
  }

  private addPlatform(x: number, y: number, width: number, texture = 'platform'): Phaser.Physics.Arcade.Sprite {
    const platform = this.platforms.create(x, y, texture) as Phaser.Physics.Arcade.Sprite;
    platform.setScale(width / PLATFORM_TEXTURE_WIDTH, 1).refreshBody();
    if (texture === 'platform') {
      platform.setAlpha(0);
      const visual = this.scene.add
        .tileSprite(x, y + 15, width, 54, 'forest-ground')
        .setDepth(0);
      this.platformVisuals.set(platform, visual);
    }
    return platform;
  }

  deployRedCarpet(): void {
    if (this.finalMercyActive) return;
    this.bridgeCollapseTimer?.remove(false);
    this.bridgeCollapseTimer = null;
    this.retireGapSpring();
    for (const child of this.platforms.getChildren()) {
      const platform = child as Phaser.Physics.Arcade.Sprite;
      if (platform.body) platform.body.enable = false;
      platform.setAlpha(0.15);
      this.platformVisuals.get(platform)?.setAlpha(0.15);
    }
    if (this.collapsingBridge?.body) this.collapsingBridge.body.enable = false;
    this.collapsingBridge?.setAlpha(0.15);
    const road = this.scene.add.zone(1_500, 430, 3_000, 24);
    this.scene.physics.add.existing(road, true);
    this.scene.physics.add.collider(this.requirePlayer(), road);
    this.requirePlayer().setCollideWorldBounds(true);
    drawRedCarpet(this.scene);
    this.finalMercyActive = true;
  }

  private drawWarningMarks(width: number): void {
    this.warningMarks?.destroy();
    const marks = this.scene.add.graphics().setDepth(2);
    const left = LEVEL_ONE_WARNING_HAZARD.x - width / 2;
    const top = LEVEL_ONE_WARNING_HAZARD.y - LEVEL_ONE_WARNING_HAZARD.height / 2;
    marks.fillStyle(LEVEL_ONE_COLORS.hazardDark, 1);
    for (let x = left + 12; x < left + width - 8; x += 26) {
      marks.fillTriangle(x, top + 3, x + 8, top + 15, x + 16, top + 3);
    }
    marks.lineStyle(3, LEVEL_ONE_COLORS.outline, 1);
    marks.lineBetween(left + 8, top + 2, left + 20, top + 14);
    marks.lineBetween(left + width - 20, top + 2, left + width - 8, top + 14);
    this.warningMarks = marks;
  }

  private movePlatform(platform: Phaser.Physics.Arcade.Sprite, x: number, y: number): void {
    platform.setPosition(x, y).refreshBody();
    this.platformVisuals.get(platform)?.setPosition(x, y + 15);
  }

  private addOneWayPlatform(x: number, y: number, width: number): Phaser.Physics.Arcade.Sprite {
    const platform = this.addPlatform(x, y, width, 'mercy-platform');
    if (platform.body !== null) {
      platform.body.checkCollision.down = false;
      platform.body.checkCollision.left = false;
      platform.body.checkCollision.right = false;
    }
    return platform;
  }

  private createCollapsingBridge(definition: PlatformDefinition): void {
    const bridge = this.scene.physics.add.staticSprite(
      definition.x,
      definition.y,
      this.bridgeWeaknessRevealed ? 'mercy-platform' : 'platform',
    );
    bridge.setScale(definition.width / PLATFORM_TEXTURE_WIDTH, 1).refreshBody();
    this.collapsingBridge = bridge;
  }

  private armCollapsingBridge(): void {
    const player = this.requirePlayer();
    if (
      this.bridgeCertified ||
      this.bridgeCollapseTimer !== null ||
      this.callbacks.isPlayerDying() ||
      player.y >= this.requireCollapsingBridge().y
    ) {
      return;
    }

    const bridge = this.requireCollapsingBridge();
    this.bridgeWeaknessRevealed = true;
    bridge.setTexture('mercy-platform').refreshBody();
    bridge.setTint(LEVEL_ONE_COLORS.assistHighlight);
    this.scene.tweens.add({
      targets: bridge,
      angle: { from: -0.8, to: 0.8 },
      duration: 70,
      yoyo: true,
      repeat: 4,
    });
    this.bridgeCollapseTimer = this.scene.time.delayedCall(this.bridgeCollapseDelayMs, () => {
      this.bridgeCollapseTimer = null;
      this.collapseBridge();
    });
  }

  private createLandingAmbush(): void {
    const definition = LEVEL_ONE_AMBUSH_LAYOUT.landingStamp;
    const revealed = this.landingAmbushArmed;
    const stamp = this.scene.add.rectangle(
      definition.x,
      definition.revealedY,
      definition.width,
      definition.height,
      LEVEL_ONE_COLORS.hazard,
      revealed ? 1 : 0,
    );
    stamp.setStrokeStyle(4, LEVEL_ONE_COLORS.outline, revealed ? 1 : 0);
    this.landingStamp = stamp;
    this.scene.physics.add.existing(stamp, true);
    const stampBody = stamp.body as Phaser.Physics.Arcade.StaticBody | null;
    if (stampBody !== null) {
      stampBody.enable = revealed;
    }
    this.scene.physics.add.overlap(this.requirePlayer(), stamp, () => {
      if (this.trapState.landingStampEnabled) this.callbacks.onLandingAmbush();
    });

    const label = addGameText(
      this.scene,
      definition.x,
      definition.revealedY,
      copy.landingStamp,
      14,
      LEVEL_ONE_TEXT_COLORS.parchment,
    )
      .setOrigin(0.5)
      .setAlpha(revealed ? 1 : 0)
      .setDepth(2);
    this.landingStampLabel = label;
    const trigger = this.scene.add.zone(definition.triggerX, 360, 70, 150);
    this.scene.physics.add.existing(trigger, true);
    this.scene.physics.add.overlap(this.requirePlayer(), trigger, () => {
      if (!this.trapState.landingStampEnabled || this.landingAmbushArmed || this.callbacks.isPlayerDying()) {
        return;
      }
      this.landingAmbushArmed = true;
      this.scene.time.delayedCall(definition.revealDelayMs, () => {
        if (!this.trapState.landingStampEnabled) return;
        stamp.setAlpha(1).setStrokeStyle(4, LEVEL_ONE_COLORS.outline, 1);
        label.setAlpha(1);
        if (stampBody !== null) {
          stampBody.enable = true;
        }
      });
    });
  }

  private createGoalAmbush(): void {
    this.goalStamp = new GoalStamp(this.scene, this.requirePlayer(), this.goalAmbushSpent, this.callbacks.onGoalAmbush);
  }

  private collapseBridge(): void {
    if (this.bridgeCertified) {
      return;
    }
    const bridge = this.requireCollapsingBridge();
    if (bridge.body !== null) {
      bridge.body.enable = false;
    }
    this.scene.tweens.add({
      targets: bridge,
      y: bridge.y + 90,
      angle: 7,
      alpha: 0.18,
      duration: 360,
      ease: 'Quad.In',
    });
  }

  private deployGapSpring(): void {
    if (this.spring !== null) {
      return;
    }
    const definition = LEVEL_ONE_ASSISTANCE_LAYOUT.gapSpring;
    this.spring = this.scene.physics.add.staticSprite(definition.x, definition.y, 'spring').setAlpha(0);
    this.springVisual = this.scene.add
      .sprite(definition.x, definition.y + 15, 'spring')
      .setOrigin(0.5, 1)
      .setDepth(2);
    this.scene.physics.add.collider(this.requirePlayer(), this.spring, () => {
      const player = this.requirePlayer();
      if (!this.callbacks.isPlayerDying() && player.body?.velocity.y !== undefined && player.body.velocity.y >= 0) {
        if (this.springVisual !== null) {
          this.scene.tweens.killTweensOf(this.springVisual);
          this.springVisual.setScale(1, 0.72);
          this.scene.tweens.add({
            targets: this.springVisual,
            scaleY: 1,
            duration: 180,
            ease: 'Back.Out',
          });
        }
        player.setVelocityY(-definition.launchSpeed);
      }
    });
  }

  private retireGapSpring(): void {
    if (this.spring === null) {
      return;
    }
    if (this.spring.body !== null) {
      this.spring.body.enable = false;
    }
    this.spring.setAlpha(0);
    this.springVisual?.setAlpha(0.35);
  }

  private requirePlayer(): Phaser.Physics.Arcade.Sprite {
    if (this.player === null) {
      throw new Error('Level one player must be attached before creating interactive world objects.');
    }
    return this.player;
  }

  private requireFirstLanding(): Phaser.Physics.Arcade.Sprite {
    if (this.firstLanding === null) {
      throw new Error('Level one first landing platform is missing.');
    }
    return this.firstLanding;
  }

  private requireCollapsingBridge(): Phaser.Physics.Arcade.Sprite {
    if (this.collapsingBridge === null) {
      throw new Error('Level one collapsing bridge is missing.');
    }
    return this.collapsingBridge;
  }

  private requireCollapsingBridgeDefinition(): PlatformDefinition {
    const definition = LEVEL_ONE_PLATFORM_LAYOUT.find(
      (platform) => platform.id === LEVEL_ONE_COLLAPSING_BRIDGE.id,
    );
    if (definition === undefined) {
      throw new Error('Level one collapsing bridge definition is missing.');
    }
    return definition;
  }
}
