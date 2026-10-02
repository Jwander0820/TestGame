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
  readonly rearFault?: 'step' | 'sweep' | 'exit' | 'ceiling' | 'returnSweep' | 'restEcho';
  readonly slimeFault?: 'charger' | 'jumper';
  readonly slimeRevengeFault?: 'charger' | 'jumper';
  readonly rushGoalStamp?: boolean;
  readonly goalWaitMs?: number;
  readonly rushFeint?: boolean;
}

export class ZeroAssistDriver implements PlaytestDriver {
  private jumpHeld = false;
  private goalAmbushAttempted = false;
  private readonly pitApproach = new FirstPitApproach();
  private slimeBaitAt: number | null = null;
  private slimeBaitCleared = false;
  private lastX = 0;
  private landingBeforeCharger = false;
  private goalBaitAt: number | null = null;
  private chargerBaitAt: number | null = null;
  private encoreWaitAt: number | null = null;

  constructor(private readonly options: ZeroAssistDriverOptions = {}) {}

  reset(actions: ActionState): void {
    actions.releaseSource(RIGHT_SOURCE);
    actions.releaseSource(JUMP_SOURCE);
    this.jumpHeld = false;
    this.goalAmbushAttempted = false;
    this.pitApproach.reset();
    this.slimeBaitAt = null;
    this.slimeBaitCleared = false;
    this.lastX = 0;
    this.landingBeforeCharger = false;
    this.goalBaitAt = null;
    this.chargerBaitAt = null;
    this.encoreWaitAt = null;
  }

  update(frame: PlaytestFrame, actions: ActionState): void {
    if (frame.x < this.lastX - 80) {
      this.goalBaitAt = null;
      this.slimeBaitAt = null;
      this.slimeBaitCleared = false;
      this.landingBeforeCharger = false;
      this.chargerBaitAt = null;
      this.encoreWaitAt = null;
    }
    this.lastX = frame.x;
    // 在岸邊引出移動，再收腳等它回位；保持向右朝向，不觸發回頭查票。
    if (!this.options.rushFeint && frame.feint !== undefined && frame.x >= 1_456 && frame.x < 1_490 &&
      frame.feint.phase !== 'retired') {
      if (frame.feint.phase !== 'spent') {
        actions.releaseSource(RIGHT_SOURCE);
        actions.releaseSource(JUMP_SOURCE);
        this.jumpHeld = false;
        return;
      }
      if (frame.grounded) {
        actions.press('right', RIGHT_SOURCE);
        actions.press('jump', JUMP_SOURCE);
        this.jumpHeld = true;
        return;
      }
    }
    // 高台返回時下落至觸發高度就已引怪，不能等落地才計時。
    if (frame.x >= 180 && frame.x < 340 && frame.y >= 270 && frame.timeMs !== undefined) {
      this.chargerBaitAt ??= frame.timeMs;
    }
    // 從左側高台返回時，先在突進範圍邊緣落地，再用地面跳躍避開。
    if (frame.x >= 180 && frame.x < 210 && frame.y < 270 && !frame.grounded) this.landingBeforeCharger = true;
    if (this.landingBeforeCharger && !frame.grounded) {
      actions.releaseSource(RIGHT_SOURCE);
      actions.releaseSource(JUMP_SOURCE);
      this.jumpHeld = false;
      return;
    }
    this.landingBeforeCharger = false;
    // 兩把重槌之間只有這段安全落點；等第二槌結束才進入門口等待區。
    if (this.options.rearFault !== 'restEcho' && frame.x >= 2_582 && frame.x < 2_600 && frame.timeMs !== undefined) {
      this.encoreWaitAt ??= frame.timeMs;
      if (frame.timeMs - this.encoreWaitAt < 1_350) {
        actions.releaseSource(RIGHT_SOURCE);
        actions.releaseSource(JUMP_SOURCE);
        this.jumpHeld = false;
        return;
      }
    }
    // 方塊假睡後會折返；先留在岸內，第二次原地跳過追撞才進坑。
    if (this.options.slimeRevengeFault !== 'charger' && frame.x >= 340 && frame.x < 372 &&
      frame.timeMs !== undefined && this.chargerBaitAt !== null && frame.timeMs - this.chargerBaitAt < 1_800) {
      actions.releaseSource(RIGHT_SOURCE);
      if (frame.grounded && frame.timeMs - this.chargerBaitAt >= 1_100 && !this.jumpHeld) {
        actions.press('jump', JUMP_SOURCE);
        this.jumpHeld = true;
      } else if (!frame.grounded) {
        actions.releaseSource(JUMP_SOURCE);
        this.jumpHeld = false;
      }
      return;
    }
    // 先在最後高台引完兩次落印，再執行原本避開地刺的跳躍。
    if (!this.options.rushGoalStamp && !this.options.allowFirstGoalAmbush &&
      frame.x >= 2_626 && frame.x < 2_646 && frame.timeMs !== undefined) {
      this.goalBaitAt ??= frame.timeMs;
      if (frame.timeMs - this.goalBaitAt < (this.options.goalWaitMs ?? 2_050)) {
        actions.releaseSource(RIGHT_SOURCE);
        actions.releaseSource(JUMP_SOURCE);
        this.jumpHeld = false;
        return;
      }
    }
    // 跳過方塊後先在岸內落地，保留第一坑原本的引怪起跳位置。
    if (frame.x >= 340 && frame.x < 372 && !frame.grounded) {
      actions.releaseSource(RIGHT_SOURCE);
      actions.releaseSource(JUMP_SOURCE);
      this.jumpHeld = false;
      return;
    }
    if (this.options.slimeFault !== 'jumper' && !this.slimeBaitCleared &&
      frame.x >= 850 && frame.x < 880 && frame.timeMs !== undefined) {
      actions.releaseSource(RIGHT_SOURCE);
      if (this.slimeBaitAt === null && frame.grounded) {
        this.slimeBaitAt = frame.timeMs;
        actions.press('jump', JUMP_SOURCE);
        this.jumpHeld = true;
      } else {
        actions.releaseSource(JUMP_SOURCE);
        this.jumpHeld = false;
      }
      const waitMs = this.options.slimeRevengeFault === 'jumper' ? 1_100 : 2_200;
      if (this.slimeBaitAt === null || frame.timeMs - this.slimeBaitAt < waitMs) return;
      this.slimeBaitCleared = true;
    }
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
      if (index === 3 && frame.feint?.phase === 'spent' && this.options.rearFault !== 'step') return { minX: 1_585, maxX: 1_660 };
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
    }) || (this.options.jumpAtFalseGap === true && frame.x >= 970 && frame.x <= 1_005) ||
      (this.options.rearFault !== 'returnSweep' && frame.x >= 2_100 && frame.x <= 2_120) ||
      (this.options.slimeFault !== 'charger' && frame.x >= 180 && frame.x <= 210) ||
      (this.options.slimeFault === 'jumper' && frame.x >= 885 && frame.x <= 900));

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
