import type Phaser from 'phaser';
import type { LevelOneEffectId } from '../../content/levelOne';
import { FeintPlatformState } from '../../state/FeintPlatformState';
import { createFeintPlatformVisual } from '../../visuals/feintPlatformVisuals';

export class FeintPlatform {
  private elapsedMs = 0;
  private readonly state = new FeintPlatformState();
  private readonly visual: ReturnType<typeof createFeintPlatformVisual>;

  constructor(scene: Phaser.Scene, private readonly player: Phaser.Physics.Arcade.Sprite,
    private readonly move: (x: number) => void) {
    this.visual = createFeintPlatformVisual(scene);
  }

  get sample() { return this.state.sample(this.elapsedMs); }
  get triggeredThisAttempt(): boolean { return this.state.triggeredThisAttempt; }

  update(deltaMs: number, collapsed: boolean): void {
    this.elapsedMs += deltaMs;
    const body = this.player.body;
    if (body !== null && !collapsed) this.state.approach({ x: this.player.x, feet: body.bottom,
      velocityX: body.velocity.x, grounded: body.blocked.down }, this.elapsedMs);
    this.sync(collapsed);
  }

  applyEffect(effect: LevelOneEffectId): void { this.state.applyEffect(effect); this.sync(false); }
  resetAttempt(): void { this.state.resetAttempt(); this.sync(false); }
  retire(): void { this.state.retire(); this.sync(false); this.visual.hide(); }

  private sync(collapsed: boolean): void {
    this.move(Math.round(this.sample.x));
    this.visual.show(this.sample, collapsed);
  }
}
