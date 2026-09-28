import { BACKSTAGE } from '../content/backstage';

export interface BackstageEntryFrame {
  readonly x: number; readonly y: number; readonly feet: number;
  readonly grounded: boolean; readonly leftJump: boolean; readonly alive: boolean;
}

/** A visit requires a real landing and a new leftward jump, never a discovery flag. */
export class BackstageEntry {
  private onShelf = false;
  private jumpingLeft = false;
  private airborne = false;
  reset(): void { this.onShelf = false; this.jumpingLeft = false; this.airborne = false; }
  update(frame: BackstageEntryFrame): boolean {
    if (!frame.alive) { this.reset(); return false; }
    if (frame.grounded) {
      this.onShelf = Math.abs(frame.feet - BACKSTAGE.entry.shelfTop) < 3 && frame.x >= -50 && frame.x <= 154;
      if (!this.onShelf || this.airborne) this.jumpingLeft = false;
      this.airborne = false;
      if (this.onShelf && frame.leftJump) this.jumpingLeft = true;
    }
    if (!frame.grounded && this.jumpingLeft) this.airborne = true;
    if (frame.y > 280) this.reset();
    return this.jumpingLeft && frame.x <= BACKSTAGE.entry.x && frame.x >= BACKSTAGE.entry.minX &&
      frame.y >= BACKSTAGE.entry.minY && frame.y <= BACKSTAGE.entry.maxY;
  }
}

export class BackstageSign {
  phase: 'idle' | 'warning' | 'falling' | 'spent' = 'idle';
  elapsed = 0;
  y: number = BACKSTAGE.sign.startY;
  trigger(): void { if (this.phase === 'idle') this.phase = 'warning'; }
  advance(delta: number): void {
    if (this.phase === 'idle' || this.phase === 'spent') return;
    this.elapsed += Math.max(0, delta);
    const t = this.elapsed - BACKSTAGE.sign.tellMs;
    if (t < 0) return;
    this.phase = t >= BACKSTAGE.sign.fallMs ? 'spent' : 'falling';
    this.y = BACKSTAGE.sign.startY + (BACKSTAGE.sign.endY - BACKSTAGE.sign.startY) * Math.min(1, t / BACKSTAGE.sign.fallMs);
  }
  hits(left: number, right: number, top: number, bottom: number, previousY: number): boolean {
    return this.phase !== 'idle' && this.elapsed >= BACKSTAGE.sign.tellMs &&
      left < BACKSTAGE.sign.x + BACKSTAGE.sign.width / 2 && right > BACKSTAGE.sign.x - BACKSTAGE.sign.width / 2 &&
      top < this.y + 21 && bottom > previousY - 21;
  }
}
