import Phaser from 'phaser';
import { FIRST_PIT_AMBUSH as layout, FIRST_PIT_CAUSES, type FirstPitCause } from '../../content/firstPitAmbush';
import type { LevelOneEffectId } from '../../content/levelOne';
import { FirstPitState } from '../../state/FirstPitState';
import { createBaitCoinVisual, createFirstPitVisuals } from '../../visuals/firstPitVisuals';

export class FirstPitAmbush {
  // The scene advances this only during active play; pause/death time never skips a fuse or flight.
  private elapsedMs = 0;
  private readonly brick: Phaser.Physics.Arcade.StaticBody;
  private readonly riser: Phaser.GameObjects.Zone;
  private readonly riserBody: Phaser.Physics.Arcade.StaticBody;
  private readonly visuals: ReturnType<typeof createFirstPitVisuals>;
  private readonly coins: {
    id: string;
    body: Phaser.Physics.Arcade.StaticBody;
    visual: ReturnType<typeof createBaitCoinVisual>;
  }[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    player: Phaser.Physics.Arcade.Sprite,
    readonly state: FirstPitState,
    isDying: () => boolean,
    onDeath: (cause: FirstPitCause) => void,
  ) {
    this.visuals = createFirstPitVisuals(scene);
    const brick = this.zone(layout.brick);
    this.brick = this.body(brick);
    this.brick.checkCollision.up = false;
    this.brick.checkCollision.left = false;
    this.brick.checkCollision.right = false;
    scene.physics.add.collider(player, brick, () => {
      if (!isDying()) state.hitBrick();
    });
    const trigger = this.zone(layout.trigger);
    scene.physics.add.overlap(player, trigger, () => {
      if (!isDying()) state.launch(this.elapsedMs);
    });
    this.riser = this.zone({ ...layout.riser, y: layout.riser.startY });
    this.riserBody = this.body(this.riser);
    this.riserBody.enable = false;
    scene.physics.add.overlap(player, this.riser, () => {
      if (!isDying() && state.attacksEnabled) onDeath(FIRST_PIT_CAUSES.riser);
    });
    for (const definition of layout.coins) {
      const pickup = this.zone({ ...definition, width: layout.coinPickupSize, height: layout.coinPickupSize });
      const hurt = this.zone({ ...definition, width: layout.coinBurstSize, height: layout.coinBurstSize });
      const body = this.body(hurt);
      body.enable = false;
      const visual = createBaitCoinVisual(scene, definition.x, definition.y);
      this.coins.push({ id: definition.id, body, visual });
      scene.physics.add.overlap(player, pickup, () => {
        if (!isDying()) state.armCoin(definition.id, this.elapsedMs);
      });
      scene.physics.add.overlap(player, hurt, () => {
        if (!isDying() && state.attacksEnabled) {
          state.coinsRevealed = true;
          onDeath(FIRST_PIT_CAUSES.coin);
        }
      });
    }
    this.update();
  }

  update(deltaMs = 0): void {
    this.elapsedMs += deltaMs;
    const now = this.elapsedMs;
    this.brick.enable = this.state.brickEnabled;
    this.visuals.showBrick(this.state.brickRevealed, this.state.brickEnabled);
    const y = this.state.riserY(now);
    this.riserBody.enable = y !== null;
    if (y !== null) {
      this.riser.setY(y);
      this.riserBody.updateFromGameObject();
    }
    this.visuals.showRiser(y);
    for (const coin of this.coins) {
      const phase = this.state.coinPhase(coin.id, now);
      coin.body.enable = phase === 'burst';
      coin.visual.show(phase, this.state.coinsRevealed);
    }
  }

  resetAttempt(): void {
    this.state.resetAttempt();
    this.update();
  }

  applyEffect(effect: LevelOneEffectId): void {
    this.state.applyEffect(effect);
    this.update();
  }

  private zone(rect: { x: number; y: number; width: number; height: number }): Phaser.GameObjects.Zone {
    const zone = this.scene.add.zone(rect.x, rect.y, rect.width, rect.height);
    this.scene.physics.add.existing(zone, true);
    return zone;
  }

  private body(zone: Phaser.GameObjects.Zone): Phaser.Physics.Arcade.StaticBody {
    return zone.body as Phaser.Physics.Arcade.StaticBody;
  }
}
