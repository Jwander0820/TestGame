import { RETURN_AUDIT as d } from '../content/returnAudit';
import { sweptContact, type CollisionRect } from './GoalStampState';

export class ReturnAuditState {
  private elapsed: number | null = null;
  private x = 0;
  constructor(private retired = false) {}

  observe(player: { x: number; vx: number; vy: number }): void {
    if (this.retired || this.elapsed !== null || player.vx >= 0 || player.vy >= 0 ||
      player.x < d.minX || player.x > d.maxX) return;
    this.x = player.x + d.offsetX;
    this.elapsed = 0;
  }
  retire(): void { this.retired = true; }
  resetAttempt(): void { this.elapsed = null; }
  sample(time = this.elapsed) {
    const age = time ?? -1;
    const phase = this.retired ? 'retired' : age < 0 ? 'idle' : age < d.tellMs ? 'tell' :
      age < d.tellMs + d.fallMs ? 'fall' : age < d.tellMs + d.fallMs + d.holdMs ? 'hold' : 'spent';
    const y = d.startY + (d.endY - d.startY) * Math.min(1, Math.max(0, (age - d.tellMs) / d.fallMs));
    return { phase, x: this.x, y, bounds: { x: this.x - d.width / 2, y: y - d.height / 2, width: d.width, height: d.height } };
  }
  advance(delta: number, before: CollisionRect, after: CollisionRect): boolean {
    if (this.elapsed === null || this.retired) return false;
    const from = this.elapsed, to = from + delta;
    this.elapsed = to;
    const playerAt = (time: number): CollisionRect => {
      const ratio = delta === 0 ? 1 : (time - from) / delta;
      return { ...after, x: before.x + (after.x - before.x) * ratio, y: before.y + (after.y - before.y) * ratio };
    };
    const land = d.tellMs + d.fallMs, end = land + d.holdMs;
    return [[d.tellMs, land], [land, end]].some(([start, finish]) => {
      const a = Math.max(from, start!), b = Math.min(to, finish!);
      return a <= b && from < end && to >= d.tellMs &&
        sweptContact(this.sample(a).bounds, this.sample(b).bounds, playerAt(a), playerAt(b));
    });
  }
}
