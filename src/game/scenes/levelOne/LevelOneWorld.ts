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
import { addGameText } from '../../visuals/addGameText';
import { PLATFORM_TEXTURE_WIDTH } from '../../visuals/createTextures';
import {
  LEVEL_ONE_ART_ANIMATIONS,
  LEVEL_ONE_ART_KEYS,
  hasLevelOneArt,
} from '../../visuals/levelOneArt';

interface LevelOneWorldCallbacks {
  readonly onWarningHazard: () => void;
  readonly onLandingAmbush: () => void;
  readonly onGoalAmbush: () => void;
  readonly isPlayerDying: () => boolean;
}

export interface LevelOneWorldInitialState {
  readonly warningHazardRevealed: boolean;
  readonly landingAmbushRevealed: boolean;
  readonly bridgeWeaknessRevealed: boolean;
  readonly goalAmbushSpent: boolean;
}

export class LevelOneWorld {
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private readonly platformVisuals = new Map<Phaser.Physics.Arcade.Sprite, Phaser.GameObjects.TileSprite>();
  private firstLanding: Phaser.Physics.Arcade.Sprite | null = null;
  private player: Phaser.Physics.Arcade.Sprite | null = null;
  private warningHazard: Phaser.GameObjects.Rectangle | null = null;
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
  private goalAmbushSpent: boolean;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly callbacks: LevelOneWorldCallbacks,
    initialState: LevelOneWorldInitialState,
  ) {
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
    this.scene.physics.add.collider(player, this.platforms);
    if (this.collapsingBridge !== null) {
      this.scene.physics.add.collider(player, this.collapsingBridge, () => this.armCollapsingBridge());
    }
    this.createLandingAmbush();
    this.createGoalAmbush();
  }

  createWarningHazard(width: number = LEVEL_ONE_WARNING_HAZARD.width): void {
    this.warningOverlap?.destroy();
    this.warningOverlap = null;
    this.warningHazard?.destroy();
    this.warningHazard = null;

    const danger = this.scene.add.rectangle(
      LEVEL_ONE_WARNING_HAZARD.x,
      LEVEL_ONE_WARNING_HAZARD.y,
      width,
      LEVEL_ONE_WARNING_HAZARD.height,
      this.warningHazardRevealed ? 0xe95d5d : 0x1faf9d,
      1,
    );
    danger.setStrokeStyle(4, 0x1d2a33, 1);
    this.scene.physics.add.existing(danger, true);
    this.warningHazard = danger;
    this.warningOverlap = this.scene.physics.add.overlap(this.requirePlayer(), danger, this.callbacks.onWarningHazard);
  }

  revealWarningHazard(): void {
    if (this.warningHazardRevealed) {
      return;
    }
    this.warningHazardRevealed = true;
    this.warningHazard?.setFillStyle(0xe95d5d, 1);
    addGameText(this.scene, LEVEL_ONE_WARNING_HAZARD.x, 470, '認證撤回', 17, '#fff9e8')
      .setOrigin(0.5)
      .setBackgroundColor('#b9382c')
      .setPadding(8, 4)
      .setRotation(-0.04);
  }

  applyAssistEffect(effectId: LevelOneEffectId): void {
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
        this.addPlatform(bridge.x, bridge.y, bridge.width, 'tape-platform');
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
        this.warningHazard?.setFillStyle(0x9fd5e8, 0.4).setStrokeStyle(3, 0xb9382c, 0.75);
        const label = LEVEL_ONE_ASSISTANCE_LAYOUT.retiredLabel;
        addGameText(this.scene, label.x, label.y, '已下班', 18, '#b9382c')
          .setOrigin(0.5)
          .setRotation(-0.04);
        return;
      }
      case LEVEL_ONE_EFFECT_IDS.reinforceInternBridge:
        this.bridgeCollapseDelayMs = LEVEL_ONE_COLLAPSING_BRIDGE.reinforcedDelayMs;
        this.requireCollapsingBridge().setTint(0xfff1b2);
        return;
      case LEVEL_ONE_EFFECT_IDS.deployBridgeSafetyNet: {
        if (this.bridgeSafetyNet === null) {
          const net = LEVEL_ONE_COLLAPSING_BRIDGE.safetyNet;
          this.bridgeSafetyNet = this.addOneWayPlatform(net.x, net.y, net.width);
          addGameText(this.scene, net.x, net.y + 14, '臨時接住區', 15, '#b9382c')
            .setOrigin(0.5, 0)
            .setRotation(-0.025);
        }
        return;
      }
      case LEVEL_ONE_EFFECT_IDS.certifyBridgePermanent: {
        this.bridgeCertified = true;
        this.resetTransientHazards();
        this.requireCollapsingBridge().setTexture('platform').clearTint().refreshBody();
        const label = LEVEL_ONE_COLLAPSING_BRIDGE.certifiedLabel;
        addGameText(this.scene, label.x, label.y, '永久合格（禁止倒塌）', 16, '#b9382c')
          .setOrigin(0.5)
          .setBackgroundColor('#fff9e8')
          .setPadding(7, 4)
          .setRotation(-0.025);
        return;
      }
    }

    const unhandledEffect: never = effectId;
    throw new Error(`Unhandled level one effect: ${unhandledEffect}`);
  }

  resetTransientHazards(): void {
    this.bridgeCollapseTimer?.remove(false);
    this.bridgeCollapseTimer = null;

    const bridge = this.collapsingBridge;
    if (bridge === null) {
      return;
    }
    this.scene.tweens.killTweensOf(bridge);
    const definition = this.requireCollapsingBridgeDefinition();
    bridge.setPosition(definition.x, definition.y).setAlpha(1).setAngle(0).setActive(true).setVisible(true);
    bridge.setTexture(this.bridgeCertified ? 'platform' : this.bridgeWeaknessRevealed ? 'tape-platform' : 'platform');
    if (!this.bridgeCertified && this.bridgeCollapseDelayMs > LEVEL_ONE_COLLAPSING_BRIDGE.collapseDelayMs) {
      bridge.setTint(0xfff1b2);
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
    if (texture === 'platform' && hasLevelOneArt(this.scene, LEVEL_ONE_ART_KEYS.forestGround)) {
      platform.setAlpha(0);
      const visual = this.scene.add
        .tileSprite(x, y + 15, width, 54, LEVEL_ONE_ART_KEYS.forestGround, 'grass-platform')
        .setDepth(0);
      this.platformVisuals.set(platform, visual);
    }
    return platform;
  }

  private movePlatform(platform: Phaser.Physics.Arcade.Sprite, x: number, y: number): void {
    platform.setPosition(x, y).refreshBody();
    this.platformVisuals.get(platform)?.setPosition(x, y + 15);
  }

  private addOneWayPlatform(x: number, y: number, width: number): Phaser.Physics.Arcade.Sprite {
    const platform = this.addPlatform(x, y, width, 'tape-platform');
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
      this.bridgeWeaknessRevealed ? 'tape-platform' : 'platform',
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
    bridge.setTexture('tape-platform').refreshBody();
    bridge.setTint(0xffd447);
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
      0xe95d5d,
      revealed ? 1 : 0,
    );
    stamp.setStrokeStyle(4, 0x1d2a33, revealed ? 1 : 0);
    this.scene.physics.add.existing(stamp, true);
    const stampBody = stamp.body as Phaser.Physics.Arcade.StaticBody | null;
    if (stampBody !== null) {
      stampBody.enable = revealed;
    }
    this.scene.physics.add.overlap(this.requirePlayer(), stamp, this.callbacks.onLandingAmbush);

    const label = addGameText(this.scene, definition.x, definition.revealedY, '補考', 14, '#fff9e8')
      .setOrigin(0.5)
      .setAlpha(revealed ? 1 : 0)
      .setDepth(2);
    const trigger = this.scene.add.zone(definition.triggerX, 360, 70, 150);
    this.scene.physics.add.existing(trigger, true);
    this.scene.physics.add.overlap(this.requirePlayer(), trigger, () => {
      if (this.landingAmbushArmed || this.callbacks.isPlayerDying()) {
        return;
      }
      this.landingAmbushArmed = true;
      this.scene.time.delayedCall(definition.revealDelayMs, () => {
        stamp.setAlpha(1).setStrokeStyle(4, 0x1d2a33, 1);
        label.setAlpha(1);
        if (stampBody !== null) {
          stampBody.enable = true;
        }
      });
    });
  }

  private createGoalAmbush(): void {
    const definition = LEVEL_ONE_AMBUSH_LAYOUT.goalStamp;
    const initialY = this.goalAmbushSpent ? definition.revealedY : definition.hiddenY;
    const seal = this.scene.add.rectangle(
      definition.x,
      initialY,
      definition.width,
      definition.height,
      0xffd447,
      1,
    );
    seal.setStrokeStyle(5, 0xb9382c, 1).setDepth(3);
    const label = addGameText(this.scene, definition.x, initialY, '審\n核', 19, '#b9382c')
      .setOrigin(0.5)
      .setAlign('center')
      .setDepth(4);

    const trigger = this.scene.add.zone(definition.triggerX, 350, definition.triggerWidth, 170);
    this.scene.physics.add.existing(trigger, true);
    this.scene.physics.add.overlap(this.requirePlayer(), trigger, () => {
      if (this.goalAmbushSpent || this.callbacks.isPlayerDying()) {
        return;
      }
      this.goalAmbushSpent = true;
      this.scene.tweens.add({
        targets: [seal, label],
        y: definition.revealedY,
        duration: definition.dropDelayMs,
        ease: 'Quad.In',
        onComplete: () => {
          const player = this.requirePlayer();
          if (
            !this.callbacks.isPlayerDying() &&
            player.x >= definition.dangerMinX &&
            player.x <= definition.dangerMaxX &&
            player.y >= definition.safeJumpY
          ) {
            this.callbacks.onGoalAmbush();
          }
        },
      });
    });
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
    this.spring = this.scene.physics.add.staticSprite(definition.x, definition.y, 'spring');
    if (hasLevelOneArt(this.scene, LEVEL_ONE_ART_KEYS.slimeSpring)) {
      this.spring.setAlpha(0);
      this.springVisual = this.scene.add
        .sprite(definition.x, definition.y - 24, LEVEL_ONE_ART_KEYS.slimeSpring, 2)
        .setScale(1.25)
        .setDepth(2);
    }
    this.scene.physics.add.collider(this.requirePlayer(), this.spring, () => {
      const player = this.requirePlayer();
      if (!this.callbacks.isPlayerDying() && player.body?.velocity.y !== undefined && player.body.velocity.y >= 0) {
        this.springVisual?.play(LEVEL_ONE_ART_ANIMATIONS.slimeBounce);
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
    this.spring.setAlpha(this.springVisual === null ? 0.35 : 0);
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
