import type Phaser from 'phaser';
import { RETURN_AUDIT as d } from '../../content/returnAudit';
import { LEVEL_ONE_TEXT_COLORS as T } from '../../content/levelOneVisuals';
import { ReturnAuditState } from '../../state/ReturnAuditState';
import type { CollisionRect } from '../../state/GoalStampState';
import { addGameText } from '../../visuals/addGameText';
import { paintRoyalSeal } from '../../visuals/trapPixelArt';

export class ReturnAudit {
  private readonly state: ReturnAuditState;
  private previous: CollisionRect | null = null;
  private readonly seal;
  private readonly label;
  private readonly warning;
  constructor(scene: Phaser.Scene, private readonly player: Phaser.Physics.Arcade.Sprite,
    retired: boolean, private readonly onDeath: () => void) {
    this.state = new ReturnAuditState(retired);
    this.seal = scene.add.graphics().setDepth(5);
    paintRoyalSeal(this.seal, d.width, d.height);
    this.label = addGameText(scene, 0, d.startY, '退\n件', 18, T.parchment).setOrigin(0.5).setDepth(6);
    this.warning = addGameText(scene, 0, 440, '▼ 回頭查票', 14, T.danger)
      .setOrigin(0.5).setBackgroundColor(T.parchment).setPadding(4, 2).setDepth(6);
    this.render();
  }
  update(delta: number): void {
    const body = this.player.body;
    if (!body?.enable) return;
    this.state.observe({ x: this.player.x, vx: body.velocity.x, vy: body.velocity.y });
    const rect = { x: body.x, y: body.y, width: body.width, height: body.height };
    const hit = this.state.advance(delta, this.previous ?? rect, rect);
    this.previous = rect;
    this.render();
    if (hit) this.onDeath();
  }
  retire(): void { this.state.retire(); this.render(); }
  resetAttempt(): void { this.previous = null; this.state.resetAttempt(); this.render(); }
  private render(): void {
    const s = this.state.sample();
    const visible = ['tell', 'fall', 'hold'].includes(s.phase);
    this.seal.setPosition(s.x, s.y).setVisible(visible).setAlpha(s.phase === 'tell' ? 0.35 : 1);
    this.label.setPosition(s.x, s.y).setVisible(visible);
    this.warning.setX(s.x).setVisible(visible);
  }
}
