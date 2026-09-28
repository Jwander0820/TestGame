import type { ActionState } from '../input/ActionState';

export interface PlaytestFrame {
  readonly area?: 'main' | 'backstage';
  /** Active scene time; excluded while paused or dying. Optional for simple unit fixtures. */
  readonly timeMs?: number;
  readonly x: number;
  readonly y: number;
  readonly grounded: boolean;
}

export interface PlaytestDriver {
  reset(actions: ActionState): void;
  update(frame: PlaytestFrame, actions: ActionState): void;
}
