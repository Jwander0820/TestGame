import Phaser from 'phaser';
import { LEVEL_ONE_EFFECT_IDS, type LevelOneEffectId } from '../../content/levelOne';
import {
  LEVEL_ONE_ASSISTANCE_LAYOUT,
  LEVEL_ONE_PLATFORM_LAYOUT,
  LEVEL_ONE_SECRET_PLATFORM_LAYOUT,
  LEVEL_ONE_WARNING_HAZARD,
} from '../../content/levelOneLayout';
import { addGameText } from '../../visuals/addGameText';
import { PLATFORM_TEXTURE_WIDTH } from '../../visuals/createTextures';

interface LevelOneWorldCallbacks {
  readonly onWarningHazard: () => void;
  readonly isPlayerDying: () => boolean;
}

export class LevelOneWorld {
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private firstLanding: Phaser.Physics.Arcade.Sprite | null = null;
  private player: Phaser.Physics.Arcade.Sprite | null = null;
  private warningHazard: Phaser.GameObjects.Rectangle | null = null;
  private warningOverlap: Phaser.Physics.Arcade.Collider | null = null;
  private spring: Phaser.Physics.Arcade.Sprite | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly callbacks: LevelOneWorldCallbacks,
  ) {}

  createPlatforms(): void {
    this.platforms = this.scene.physics.add.staticGroup();
    for (const definition of LEVEL_ONE_PLATFORM_LAYOUT) {
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
      0xe95d5d,
      1,
    );
    danger.setStrokeStyle(4, 0x1d2a33, 1);
    this.scene.physics.add.existing(danger, true);
    this.warningHazard = danger;
    this.warningOverlap = this.scene.physics.add.overlap(this.requirePlayer(), danger, this.callbacks.onWarningHazard);
  }

  applyAssistEffect(effectId: LevelOneEffectId): void {
    switch (effectId) {
      case LEVEL_ONE_EFFECT_IDS.moveFirstLanding:
        this.requireFirstLanding().setX(LEVEL_ONE_ASSISTANCE_LAYOUT.firstLandingX).refreshBody();
        return;
      case LEVEL_ONE_EFFECT_IDS.deployGapSpring:
        this.deployGapSpring();
        return;
      case LEVEL_ONE_EFFECT_IDS.deployGapBridge: {
        const bridge = LEVEL_ONE_ASSISTANCE_LAYOUT.gapBridge;
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
    }

    const unhandledEffect: never = effectId;
    throw new Error(`Unhandled level one effect: ${unhandledEffect}`);
  }

  private addPlatform(x: number, y: number, width: number, texture = 'platform'): Phaser.Physics.Arcade.Sprite {
    const platform = this.platforms.create(x, y, texture) as Phaser.Physics.Arcade.Sprite;
    platform.setScale(width / PLATFORM_TEXTURE_WIDTH, 1).refreshBody();
    return platform;
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

  private deployGapSpring(): void {
    if (this.spring !== null) {
      return;
    }
    const definition = LEVEL_ONE_ASSISTANCE_LAYOUT.gapSpring;
    this.spring = this.scene.physics.add.staticSprite(definition.x, definition.y, 'spring');
    this.scene.physics.add.collider(this.requirePlayer(), this.spring, () => {
      const player = this.requirePlayer();
      if (!this.callbacks.isPlayerDying() && player.body?.velocity.y !== undefined && player.body.velocity.y >= 0) {
        player.setVelocityY(-definition.launchSpeed);
      }
    });
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
}
