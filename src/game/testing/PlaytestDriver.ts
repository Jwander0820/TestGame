import type { ActionState } from '../input/ActionState';
import type { FeintSample } from '../content/feintPlatform';
import type { ClockworkMaliceSample } from '../state/ClockworkMaliceState';

export interface PlaytestFrame {
  readonly levelId?: 'level-one' | 'level-two';
  readonly area?: 'main' | 'backstage';
  /** Active scene time; excluded while paused or dying. Optional for simple unit fixtures. */
  readonly timeMs?: number;
  readonly x: number;
  readonly y: number;
  readonly grounded: boolean;
  readonly feint?: FeintSample;
  readonly clockwork?: {
    readonly carrierX: number;
    readonly carrierY: number;
    readonly carrierPhase: string;
    readonly steamPhase: string;
    readonly pressPhase: string;
    readonly finalMercy: boolean;
    readonly malice?: ClockworkMaliceSample;
  };
}

export interface PlaytestDriver {
  reset(actions: ActionState): void;
  update(frame: PlaytestFrame, actions: ActionState): void;
}
