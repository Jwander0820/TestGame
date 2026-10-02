import { BACKSTAGE } from '../content/backstage';

export interface WorkshopBody {
  readonly left: number; readonly right: number;
  readonly top: number; readonly bottom: number;
}

/** Only room-local time and geometry; never owns progress or player input. */
export class BackstageSpring {
  phase: 'ready' | 'charging' | 'flight' | 'release' = 'ready';
  elapsed = 0;
  passes = 0;
  private rang = false;
  private airborne = false;
  private previous: WorkshopBody | null = null;

  resetCycle(): void {
    this.phase = 'ready'; this.elapsed = 0; this.rang = false; this.airborne = false; this.previous = null;
  }

  advance(delta: number, x: number, grounded: boolean, jumped: boolean): boolean {
    const onPad = Math.abs(x - BACKSTAGE.spring.x) <= BACKSTAGE.spring.halfWidth;
    if (this.phase === 'flight') {
      if (!grounded) this.airborne = true;
      if (grounded && this.airborne) this.phase = 'release';
      else return false;
    }
    if (this.phase === 'release') {
      // Landing on the pad is safe and does not cause an involuntary bounce loop.
      if (!onPad && grounded) this.resetCycle();
      return false;
    }
    if (!onPad || !grounded || jumped) { this.resetCycle(); return false; }
    this.phase = 'charging'; this.elapsed += Math.max(0, delta);
    if (this.elapsed < BACKSTAGE.spring.chargeMs) return false;
    this.phase = 'flight'; this.previous = null;
    return true;
  }

  touchBell(body: WorkshopBody): boolean {
    const previous = this.previous;
    this.previous = body;
    if (this.phase !== 'flight' || this.rang) return false;
    const bell = BACKSTAGE.bell;
    // Sweep vertical travel only while both sampled bodies overlap the bell's column.
    const inColumn = (b: WorkshopBody): boolean => b.left < bell.x + bell.halfWidth && b.right > bell.x - bell.halfWidth;
    const top = previous !== null && inColumn(previous) ? Math.min(body.top, previous.top) : body.top;
    const bottom = previous !== null && inColumn(previous) ? Math.max(body.bottom, previous.bottom) : body.bottom;
    if (!inColumn(body) || top >= bell.y + bell.halfHeight || bottom <= bell.y - bell.halfHeight) return false;
    this.rang = true; this.passes++;
    return true;
  }
}

export class BackstageSlimeWorker {
  working = false;
  catches = 0;
  workMs = 0;
  private restingMs: number = BACKSTAGE.slime.restMs;

  advance(delta: number, playerX: number, facingLeft: boolean): boolean {
    const offset = playerX - BACKSTAGE.slime.x;
    const watched = Math.abs(offset) <= BACKSTAGE.slime.watchRange && (offset >= 0 ? facingLeft : !facingLeft);
    const wasWorking = this.working;
    this.working = watched;
    if (!watched) { this.restingMs += Math.max(0, delta); return false; }
    this.workMs += Math.max(0, delta);
    const caught = !wasWorking && this.restingMs >= BACKSTAGE.slime.restMs;
    this.restingMs = 0;
    if (caught) this.catches++;
    return caught;
  }

  get x(): number {
    if (!this.working) return BACKSTAGE.slime.x;
    const cycle = (this.workMs % 1_600) / 800;
    return Math.round(BACKSTAGE.slime.x + 27 * (cycle <= 1 ? cycle : 2 - cycle));
  }
}
