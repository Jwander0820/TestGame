import type { ActionState } from '../../src/game/input/ActionState';
import type { PlaytestDriver, PlaytestFrame } from '../../src/game/testing/PlaytestDriver';
import { FirstPitApproach } from './FirstPitApproach';

const RIGHT_SOURCE = 'playtest:zero-assist:right';
const JUMP_SOURCE = 'playtest:zero-assist:jump';

const JUMP_ZONES = [
  { minX: 376, maxX: 405 },
  { minX: 614, maxX: 638 },
  { minX: 1_405, maxX: 1_455 },
  { minX: 1_585, maxX: 1_610 },
  { minX: 1_840, maxX: 1_870 },
  { minX: 2_340, maxX: 2_360 },
  { minX: 2_648, maxX: 2_670 },
] as const;

interface ZeroAssistDriverOptions {
  readonly allowFirstGoalAmbush?: boolean;
  readonly earlyLandingJump?: boolean;
  readonly jumpAtFalseGap?: boolean;
  readonly rushFirstPit?: boolean;
  readonly lateFirstPitJump?: boolean;
  readonly rearFault?: 'step' | 'sweep' | 'exit' | 'ceiling';
}

export class ZeroAssistDriver implements PlaytestDriver {
  private jumpHeld = false;
  private goalAmbushAttempted = false;
  private readonly pitApproach = new FirstPitApproach();

  constructor(private readonly options: ZeroAssistDriverOptions = {}) {}

  reset(actions: ActionState): void {
    actions.releaseSource(RIGHT_SOURCE);
    actions.releaseSource(JUMP_SOURCE);
    this.jumpHeld = false;
    this.goalAmbushAttempted = false;
    this.pitApproach.reset();
  }

  update(frame: PlaytestFrame, actions: ActionState): void {
    if (!this.options.rushFirstPit && this.pitApproach.shouldWait(frame)) {
      actions.releaseSource(RIGHT_SOURCE);
      actions.releaseSource(JUMP_SOURCE);
      this.jumpHeld = false;
      return;
    }
    actions.press('right', RIGHT_SOURCE);
    const shouldSkipGoalJump =
      this.options.allowFirstGoalAmbush === true && !this.goalAmbushAttempted;
    const zones = JUMP_ZONES.map((zone, index) => {
      if (index === 0 && this.options.lateFirstPitJump) return { minX: 410, maxX: 421 };
      if (index === 1 && this.options.earlyLandingJump) return { minX: 580, maxX: 610 };
      if ((index === 3 && this.options.rearFault === 'step') || (index === 4 && this.options.rearFault === 'sweep')) return { minX: -1, maxX: -1 };
      if (index === 5 && this.options.rearFault === 'exit') return { minX: 2_385, maxX: 2_430 };
      if (index === 6 && this.options.rearFault === 'ceiling') return { minX: 2_585, maxX: 2_635 };
      return zone;
    });
    const shouldJump = frame.grounded && (zones.some((zone, index) => {
      const isGoalJump = index === JUMP_ZONES.length - 1;
      return (!isGoalJump || !shouldSkipGoalJump) && frame.x >= zone.minX && frame.x <= zone.maxX;
    }) || (this.options.jumpAtFalseGap === true && frame.x >= 970 && frame.x <= 1_005));

    if (frame.x > 2_670) {
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
