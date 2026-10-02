import { LEVEL_ONE_PLATFORM_LAYOUT } from './levelOneLayout';
import type { DeathContext } from './levelOneDeaths';

const step = LEVEL_ONE_PLATFORM_LAYOUT.find(platform => platform.id === 'raised-step');
if (step === undefined) throw new Error('Missing raised step for feint platform');

export const FEINT_PLATFORM = {
  platformId: step.id,
  x: step.x,
  y: step.y,
  width: step.width,
  top: step.y - 12,
  approachDistance: 96,
  approachHeight: 130,
  distance: 96,
  dodgeMs: 120,
  holdMs: 240,
  returnMs: 1_100,
  fallMinX: 1_450,
  fallMaxX: 1_800,
} as const;

export const FEINT_DEATH = {
  causeId: 'feint-platform-miss', blockerId: 'intern-bridge',
  messages: ['你在找落點。落點正在躲你。', '地板說它沒逃，只是調整站位。'],
} as const satisfies DeathContext;

export interface FeintApproach {
  readonly x: number;
  readonly feet: number;
  readonly velocityX: number;
  readonly grounded: boolean;
}

export type FeintPhase = 'idle' | 'dodging' | 'holding' | 'returning' | 'spent' | 'retired';
export interface FeintSample {
  readonly phase: FeintPhase;
  readonly x: number;
}
