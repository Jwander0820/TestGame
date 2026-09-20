import { describe, expect, it } from 'vitest';
import { FirstPitApproach } from './FirstPitApproach';

describe('learned first-pit approach', () => {
  it('waits on the bank before takeoff, then resets that wait after respawn', () => {
    const approach = new FirstPitApproach();
    expect(approach.shouldWait({ x: 350, y: 398, grounded: true, timeMs: 1_000 })).toBe(false);
    expect(approach.shouldWait({ x: 374, y: 398, grounded: true, timeMs: 1_100 })).toBe(true);
    expect(approach.shouldWait({ x: 374, y: 398, grounded: true, timeMs: 1_999 })).toBe(true);
    expect(approach.shouldWait({ x: 374, y: 398, grounded: true, timeMs: 2_000 })).toBe(false);
    expect(approach.shouldWait({ x: 380, y: 398, grounded: true, timeMs: 2_020 })).toBe(false);
    approach.shouldWait({ x: 110, y: 350, grounded: false, timeMs: 3_000 });
    expect(approach.shouldWait({ x: 374, y: 398, grounded: true, timeMs: 4_000 })).toBe(true);
  });
});
