import type { ActionState } from '../../src/game/input/ActionState';
import type { PlaytestDriver, PlaytestFrame } from '../../src/game/testing/PlaytestDriver';

const LEFT_SOURCE = 'playtest:reverse-easter-egg:left';
const RIGHT_SOURCE = 'playtest:reverse-easter-egg:right';
const JUMP_SOURCE = 'playtest:reverse-easter-egg:jump';

const MAIN_ROUTE_JUMP_ZONES = [
  { minX: 376, maxX: 405 },
  { minX: 580, maxX: 625 },
  { minX: 970, maxX: 1_005 },
  { minX: 1_405, maxX: 1_455 },
  { minX: 2_385, maxX: 2_430 },
  { minX: 2_585, maxX: 2_635 },
] as const;

type DriverPhase = 'first-jump' | 'second-jump' | 'main-route';

export class ReverseEasterEggDriver implements PlaytestDriver {
  private phase: DriverPhase = 'first-jump';
  private firstJumpStarted = false;
  private secondJumpStarted = false;
  private jumpHeld = false;
  reachedReverseCache = false;
  lastFrame: PlaytestFrame | null = null;

  get currentPhase(): DriverPhase {
    return this.phase;
  }

  reset(actions: ActionState): void {
    actions.releaseSource(LEFT_SOURCE);
    actions.releaseSource(RIGHT_SOURCE);
    actions.releaseSource(JUMP_SOURCE);
    this.phase = 'first-jump';
    this.firstJumpStarted = false;
    this.secondJumpStarted = false;
    this.jumpHeld = false;
    this.reachedReverseCache = false;
    this.lastFrame = null;
  }

  update(frame: PlaytestFrame, actions: ActionState): void {
    this.lastFrame = frame;
    if (this.phase === 'first-jump') {
      this.updateFirstJump(frame, actions);
    } else if (this.phase === 'second-jump') {
      this.updateSecondJump(frame, actions);
    } else {
      this.updateMainRoute(frame, actions);
    }
  }

  private updateFirstJump(frame: PlaytestFrame, actions: ActionState): void {
    actions.releaseSource(RIGHT_SOURCE);
    if (!this.firstJumpStarted) {
      if (!frame.grounded) {
        return;
      }
      actions.press('left', LEFT_SOURCE);
      this.pressJump(actions);
      this.firstJumpStarted = true;
      return;
    }

    if (frame.x > 45) {
      actions.press('left', LEFT_SOURCE);
    } else {
      actions.releaseSource(LEFT_SOURCE);
    }
    this.releaseJumpAfterTakeoff(frame, actions);

    if (frame.grounded && frame.y < 350) {
      actions.releaseSource(LEFT_SOURCE);
      this.phase = 'second-jump';
    }
  }

  private updateSecondJump(frame: PlaytestFrame, actions: ActionState): void {
    actions.releaseSource(LEFT_SOURCE);
    actions.releaseSource(RIGHT_SOURCE);
    if (!this.secondJumpStarted) {
      if (!frame.grounded) {
        return;
      }
      this.pressJump(actions);
      this.secondJumpStarted = true;
      return;
    }

    this.releaseJumpAfterTakeoff(frame, actions);
    if (frame.y < 290) {
      actions.releaseSource(JUMP_SOURCE);
      this.jumpHeld = false;
      this.reachedReverseCache = true;
      this.phase = 'main-route';
      actions.press('right', RIGHT_SOURCE);
    }
  }

  private updateMainRoute(frame: PlaytestFrame, actions: ActionState): void {
    actions.releaseSource(LEFT_SOURCE);
    actions.press('right', RIGHT_SOURCE);
    const shouldJump =
      frame.grounded &&
      MAIN_ROUTE_JUMP_ZONES.some((zone) => frame.x >= zone.minX && frame.x <= zone.maxX);
    if (shouldJump && !this.jumpHeld) {
      this.pressJump(actions);
    } else {
      this.releaseJumpAfterTakeoff(frame, actions);
    }
  }

  private pressJump(actions: ActionState): void {
    actions.press('jump', JUMP_SOURCE);
    this.jumpHeld = true;
  }

  private releaseJumpAfterTakeoff(frame: PlaytestFrame, actions: ActionState): void {
    if (!frame.grounded && this.jumpHeld) {
      actions.releaseSource(JUMP_SOURCE);
      this.jumpHeld = false;
    }
  }
}
