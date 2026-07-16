import type { ActionState } from '../../src/game/input/ActionState';
import type { PlaytestDriver, PlaytestFrame } from '../../src/game/testing/PlaytestDriver';

const RIGHT_SOURCE = 'playtest:zero-assist:right';
const JUMP_SOURCE = 'playtest:zero-assist:jump';

const JUMP_ZONES = [
  { minX: 376, maxX: 405 },
  { minX: 970, maxX: 1_005 },
  { minX: 1_405, maxX: 1_455 },
  { minX: 1_890, maxX: 1_935 },
] as const;

export class ZeroAssistDriver implements PlaytestDriver {
  private jumpHeld = false;

  reset(actions: ActionState): void {
    actions.releaseSource(RIGHT_SOURCE);
    actions.releaseSource(JUMP_SOURCE);
    this.jumpHeld = false;
  }

  update(frame: PlaytestFrame, actions: ActionState): void {
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
