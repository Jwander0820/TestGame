import Phaser from 'phaser';
import type { LevelOneEffectId } from '../../content/levelOne';
import { LEVEL_ONE_TRAPS } from '../../content/levelOneTraps';
import { LearnedTrapState } from '../../state/LearnedTrapState';
import { createLearnedTrapVisuals, type LearnedTrapVisuals } from '../../visuals/learnedTrapVisuals';

export class LearnedTraps {
  private readonly ceilingBody: Phaser.Physics.Arcade.StaticBody;
  private readonly airBody: Phaser.Physics.Arcade.StaticBody;
  private readonly visuals: LearnedTrapVisuals;

  constructor(
    scene: Phaser.Scene,
    player: Phaser.Physics.Arcade.Sprite,
    readonly state: LearnedTrapState,
    isPlayerDying: () => boolean,
    onAirAmbush: () => void,
  ) {
    this.visuals = createLearnedTrapVisuals(scene);
    const ceiling = this.createBody(scene, LEVEL_ONE_TRAPS.ceiling);
    this.ceilingBody = ceiling.body as Phaser.Physics.Arcade.StaticBody;
    // Only an upward head bump can hit the ceiling; it is not an invisible wall.
    this.ceilingBody.checkCollision.up = false;
    this.ceilingBody.checkCollision.left = false;
    this.ceilingBody.checkCollision.right = false;
    scene.physics.add.collider(player, ceiling, () => {
      if (isPlayerDying()) return;
      state.hitCeiling();
      this.sync();
    });

    const floor = this.createBody(scene, LEVEL_ONE_TRAPS.falseFloor);
    const floorBody = floor.body as Phaser.Physics.Arcade.StaticBody;
    floorBody.checkCollision.down = false;
    floorBody.checkCollision.left = false;
    floorBody.checkCollision.right = false;
    scene.physics.add.collider(player, floor, () => {
      if (isPlayerDying()) return;
      state.floorRevealed = true;
      this.sync();
    });

    const air = this.createBody(scene, LEVEL_ONE_TRAPS.airAmbush);
    this.airBody = air.body as Phaser.Physics.Arcade.StaticBody;
    scene.physics.add.overlap(player, air, () => {
      if (isPlayerDying() || !state.hitAirAmbush()) return;
      this.sync();
      onAirAmbush();
    });
    this.sync();
  }

  applyEffect(effect: LevelOneEffectId): void {
    this.state.applyEffect(effect);
    this.sync();
  }

  private sync(): void {
    this.ceilingBody.enable = this.state.ceilingEnabled;
    this.airBody.enable = this.state.airAmbushEnabled;
    this.visuals.showCeiling(this.state.ceilingRevealed, this.state.ceilingEnabled);
    this.visuals.showFloor(this.state.floorRevealed);
    this.visuals.showAirAmbush(this.state.airAmbushRevealed, this.state.airAmbushEnabled);
  }

  private createBody(scene: Phaser.Scene, rect: { x: number; y: number; width: number; height: number }): Phaser.GameObjects.Zone {
    const zone = scene.add.zone(rect.x, rect.y, rect.width, rect.height);
    scene.physics.add.existing(zone, true);
    return zone;
  }
}
