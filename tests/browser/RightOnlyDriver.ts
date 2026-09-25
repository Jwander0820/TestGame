import type { ActionState } from '../../src/game/input/ActionState';
import type { PlaytestDriver, PlaytestFrame } from '../../src/game/testing/PlaytestDriver';

export class RightOnlyDriver implements PlaytestDriver {
  lastFrame: PlaytestFrame | null = null;
  reset(actions: ActionState): void { actions.releaseSource('playtest:right-only'); this.lastFrame = null; }
  update(frame: PlaytestFrame, actions: ActionState): void {
    this.lastFrame = frame;
    actions.press('right', 'playtest:right-only');
  }
}
