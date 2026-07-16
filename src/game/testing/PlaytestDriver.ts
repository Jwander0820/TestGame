import type { ActionState } from '../input/ActionState';

export interface PlaytestFrame {
  readonly x: number;
  readonly y: number;
  readonly grounded: boolean;
}

export interface PlaytestDriver {
  reset(actions: ActionState): void;
  update(frame: PlaytestFrame, actions: ActionState): void;
}
