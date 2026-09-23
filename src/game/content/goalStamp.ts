import { LEVEL_ONE_AMBUSH_LAYOUT } from './levelOneLayout';

export const GOAL_STRIKES = [
  { x: LEVEL_ONE_AMBUSH_LAYOUT.goalStamp.x, startMs: 0 },
  { x: LEVEL_ONE_AMBUSH_LAYOUT.goalStamp.x + 80, startMs: 1_020 },
] as const;
export const GOAL_STAMP_TIMING = { tellMs: 200, fallMs: 460, holdMs: 220 } as const;
