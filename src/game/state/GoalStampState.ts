import { LEVEL_ONE_AMBUSH_LAYOUT } from '../content/levelOneLayout';
import { GOAL_STRIKES, GOAL_STAMP_TIMING } from '../content/goalStamp';

const stamp = LEVEL_ONE_AMBUSH_LAYOUT.goalStamp;
export interface CollisionRect { x: number; y: number; width: number; height: number }

// 相對運動的 slab 判定；同一幀雙方移動也不會把整個包圍區誤當成命中。
export function sweptContact(a0: CollisionRect, a1: CollisionRect, b0: CollisionRect, b1: CollisionRect): boolean {
  let enter = 0;
  let leave = 1;
  for (const axis of ['x', 'y'] as const) {
    const size = axis === 'x' ? 'width' : 'height';
    const distance = a0[axis] - b0[axis];
    const velocity = (a1[axis] - a0[axis]) - (b1[axis] - b0[axis]);
    const min = -a0[size];
    const max = b0[size];
    if (velocity === 0) {
      if (distance < min || distance > max) return false;
    } else {
      const first = (min - distance) / velocity;
      const last = (max - distance) / velocity;
      enter = Math.max(enter, Math.min(first, last));
      leave = Math.min(leave, Math.max(first, last));
      if (enter > leave) return false;
    }
  }
  return true;
}

export class GoalStampState {
  private elapsed: number | null = null;
  constructor(private retired = false) {}
  arm(): void { if (!this.retired) this.elapsed ??= 0; }
  retire(): void { this.retired = true; }
  resetAttempt(): void { this.elapsed = null; }

  sample(index: number, elapsed = this.elapsed) {
    const strike = GOAL_STRIKES[index]!;
    const age = elapsed === null ? -1 : elapsed - strike.startMs;
    const { tellMs, fallMs, holdMs } = GOAL_STAMP_TIMING;
    const phase = this.retired ? 'retired' : age < 0 ? 'idle' : age < tellMs ? 'tell' :
      age < tellMs + fallMs ? 'fall' : age < tellMs + fallMs + holdMs ? 'hold' : 'spent';
    const progress = Math.min(1, Math.max(0, (age - tellMs) / fallMs));
    const y = stamp.hiddenY + (stamp.revealedY - stamp.hiddenY) * progress;
    return { phase, x: strike.x, y, active: phase === 'fall' || phase === 'hold',
      bounds: { x: strike.x - stamp.width / 2, y: y - stamp.height / 2, width: stamp.width, height: stamp.height } };
  }

  advance(deltaMs: number, previousPlayer: CollisionRect, player: CollisionRect): boolean {
    if (this.elapsed === null || this.retired) return false;
    const from = this.elapsed;
    const to = from + deltaMs;
    this.elapsed = to;
    const playerAt = (time: number): CollisionRect => {
      const ratio = deltaMs === 0 ? 1 : (time - from) / deltaMs;
      return { ...player, x: previousPlayer.x + (player.x - previousPlayer.x) * ratio,
        y: previousPlayer.y + (player.y - previousPlayer.y) * ratio };
    };
    return GOAL_STRIKES.some((strike, index) => {
      const fall = strike.startMs + GOAL_STAMP_TIMING.tellMs;
      const land = fall + GOAL_STAMP_TIMING.fallMs;
      const end = land + GOAL_STAMP_TIMING.holdMs;
      // 在落地轉折拆段，避免低幀率跳過整個攻擊或算到預告期。
      return [[fall, land], [land, end]].some(([start, finish]) => {
        const a = Math.max(from, start!);
        const b = Math.min(to, finish!);
        if (a > b || from >= end || to < fall) return false;
        return sweptContact(this.sample(index, a).bounds, this.sample(index, b).bounds, playerAt(a), playerAt(b));
      });
    });
  }
}
