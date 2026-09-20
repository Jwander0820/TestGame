import type { PlaytestFrame } from '../../src/game/testing/PlaytestDriver';

/** Walk into the trigger on solid ground, wait for the upward shot to leave, then jump. */
export class FirstPitApproach {
  private waitingSince: number | null = null;
  private cleared = false;

  reset(): void {
    this.waitingSince = null;
    this.cleared = false;
  }

  shouldWait(frame: PlaytestFrame): boolean {
    if (frame.x < 300) this.reset();
    if (frame.timeMs === undefined || this.cleared || frame.x < 372 || frame.x > 420 || !frame.grounded) return false;
    this.waitingSince ??= frame.timeMs;
    if (frame.timeMs - this.waitingSince < 900) return true;
    this.cleared = true;
    return false;
  }
}
