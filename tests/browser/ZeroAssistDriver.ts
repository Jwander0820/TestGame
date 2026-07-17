import type { ActionState } from '../../src/game/input/ActionState';
import type { PlaytestDriver, PlaytestFrame } from '../../src/game/testing/PlaytestDriver';

const RIGHT_SOURCE = 'playtest:zero-assist:right';
const JUMP_SOURCE = 'playtest:zero-assist:jump';

const JUMP_ZONES = [
  { minX: 376, maxX: 405 },
  { minX: 580, maxX: 625 },
  { minX: 970, maxX: 1_005 },
  { minX: 1_405, maxX: 1_455 },
  { minX: 2_385, maxX: 2_430 },
  { minX: 2_585, maxX: 2_635 },
] as const;

interface ZeroAssistDriverOptions {
  readonly allowFirstGoalAmbush?: boolean;
}

export class ZeroAssistDriver implements PlaytestDriver {
  private jumpHeld = false;
  private goalAmbushAttempted = false;

  constructor(private readonly options: ZeroAssistDriverOptions = {}) {}

  reset(actions: ActionState): void {
    actions.releaseSource(RIGHT_SOURCE);
    actions.releaseSource(JUMP_SOURCE);
    this.jumpHeld = false;
    this.goalAmbushAttempted = false;
  }

  update(frame: PlaytestFrame, actions: ActionState): void {
    actions.press('right', RIGHT_SOURCE);
    const shouldSkipGoalJump =
      this.options.allowFirstGoalAmbush === true && !this.goalAmbushAttempted;
    const shouldJump = frame.grounded && JUMP_ZONES.some((zone, index) => {
      const isGoalJump = index === JUMP_ZONES.length - 1;
      return (!isGoalJump || !shouldSkipGoalJump) && frame.x >= zone.minX && frame.x <= zone.maxX;
    });

    if (frame.x > 2_635) {
      this.goalAmbushAttempted = true;
    }

    if (shouldJump && !this.jumpHeld) {
      actions.press('jump', JUMP_SOURCE);
      this.jumpHeld = true;
    } else if (!frame.grounded && this.jumpHeld) {
      actions.release('jump', JUMP_SOURCE);
      this.jumpHeld = false;
    }
  }
}
