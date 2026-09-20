import Phaser from 'phaser';
import type { LevelOneEffectId } from '../../content/levelOne';
import { LEVEL_ONE_SLIMES, type SlimeDefinition, type SlimeId } from '../../content/levelOneSlimes';
import { SlimeState } from '../../state/SlimeState';
import { createSlimePrototypeVisual } from '../../visuals/slimePrototypeVisuals';

export class SlimeEnemies {
  private elapsedMs = 0;
  private readonly enemies: {
    definition: SlimeDefinition;
    zone: Phaser.GameObjects.Zone;
    body: Phaser.Physics.Arcade.StaticBody;
    visual: ReturnType<typeof createSlimePrototypeVisual>;
  }[] = [];

  constructor(scene: Phaser.Scene, private readonly player: Phaser.Physics.Arcade.Sprite,
    private readonly state: SlimeState, isDying: () => boolean, onDeath: (id: SlimeId) => void) {
    for (const definition of LEVEL_ONE_SLIMES) {
      const zone = scene.add.zone(definition.x, definition.y, definition.width, definition.height);
      scene.physics.add.existing(zone, true);
      const body = zone.body as Phaser.Physics.Arcade.StaticBody;
      if (definition.id === 'jumper') body.setCircle(definition.width / 2);
      this.enemies.push({ definition, zone, body, visual: createSlimePrototypeVisual(scene, definition) });
      scene.physics.add.overlap(player, zone, () => {
        if (isDying() || !body.enable) return;
        state.reveal(definition.id);
        this.render();
        onDeath(definition.id);
      });
    }
    this.render();
  }

  update(deltaMs: number): void {
    this.elapsedMs += deltaMs;
    this.state.observePlayer({ x: this.player.x, y: this.player.y, velocityY: this.player.body?.velocity.y ?? 0 }, this.elapsedMs);
    this.render();
  }

  applyEffect(effect: LevelOneEffectId): void { this.state.applyEffect(effect); this.render(); }
  resetAttempt(): void { this.state.resetAttempt(); this.render(); }

  private render(): void {
    for (const enemy of this.enemies) {
      const sample = this.state.sample(enemy.definition, this.elapsedMs);
      enemy.body.enable = sample.dangerous;
      enemy.zone.setPosition(sample.x, sample.y);
      enemy.body.updateFromGameObject();
      enemy.visual.show(sample);
    }
  }
}
