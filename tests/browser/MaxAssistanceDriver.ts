import type { ActionState } from '../../src/game/input/ActionState';
import type { PlaytestDriver, PlaytestFrame } from '../../src/game/testing/PlaytestDriver';

const RIGHT_SOURCE = 'playtest:max-assistance:right';
const JUMP_SOURCE = 'playtest:max-assistance:jump';

const JUMP_ZONES = [
  { minX: 835, maxX: 870 },
  { minX: 600, maxX: 635 },
  { minX: 985, maxX: 1_015 },
  { minX: 1_405, maxX: 1_455 },
  { minX: 2_385, maxX: 2_430 },
  { minX: 2_585, maxX: 2_635 },
] as const;

export class MaxAssistanceDriver implements PlaytestDriver {
  private jumpHeld = false;
  lastFrame: PlaytestFrame | null = null;

  reset(actions: ActionState): void {
    actions.releaseSource(RIGHT_SOURCE);
    actions.releaseSource(JUMP_SOURCE);
    this.jumpHeld = false;
    this.lastFrame = null;
  }

  update(frame: PlaytestFrame, actions: ActionState): void {
    this.lastFrame = frame;
    actions.press('right', RIGHT_SOURCE);
    const shouldJump = frame.grounded && JUMP_ZONES.some((zone) => frame.x >= zone.minX && frame.x <= zone.maxX);

    if (shouldJump && !this.jumpHeld) {
      actions.press('jump', JUMP_SOURCE);
      this.jumpHeld = true;
    } else if (!frame.grounded && this.jumpHeld) {
      actions.release('jump', JUMP_SOURCE);
      this.jumpHeld = false;
    }
  }
}
