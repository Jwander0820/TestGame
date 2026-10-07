import type { ActionState } from '../../src/game/input/ActionState';
import type { PlaytestDriver, PlaytestFrame } from '../../src/game/testing/PlaytestDriver';

const RIGHT = 'playtest:clockwork:right';
const LEFT = 'playtest:clockwork:left';
const JUMP = 'playtest:clockwork:jump';

export type ClockworkFault = 'steam' | 'press' | 'dock' | 'backwash' | 'recall' | 'bell';
export type ClockworkNaive = 'dock' | 'backwash' | 'recall' | 'bell';
export interface ClockworkDriverOptions {
  readonly fault?: ClockworkFault;
  readonly naive?: ClockworkNaive;
  readonly rightOnly?: boolean;
}

/** 只發出玩家可用的方向與跳躍；不修改位置、機關或保存。 */
export class ClockworkDriver implements PlaytestDriver {
  jumpCommands = 0;
  finalJumpCommands = 0;
  private jumpHeld = false;

  constructor(private readonly options: ClockworkDriverOptions = {}) {}

  reset(actions: ActionState): void {
    actions.releaseSource(RIGHT); actions.releaseSource(LEFT); actions.releaseSource(JUMP);
    this.jumpHeld = false; this.jumpCommands = 0; this.finalJumpCommands = 0;
  }

  update(frame: PlaytestFrame, actions: ActionState): void {
    actions.releaseSource(RIGHT); actions.releaseSource(LEFT);
    if (!frame.grounded) { actions.releaseSource(JUMP); this.jumpHeld = false; }
    const machine = frame.clockwork;
    if (this.options.rightOnly || machine?.finalMercy) {
      actions.releaseSource(JUMP); this.jumpHeld = false;
      actions.press('right', RIGHT); return;
    }
    if (machine === undefined) return;
    const malice = machine.malice;

    if (frame.x < 710) {
      // 第五次載台援助已把整段鋪平；載台本身尚未退休也能直接走。
      if (malice?.dockPhase === 'retired') { actions.press('right', RIGHT); return; }
      if (machine.carrierPhase === 'arrived') {
        if (malice !== undefined && this.options.naive !== 'dock' && malice.dockPhase !== 'spent') {
          if (this.options.fault !== 'dock' || !['fall', 'hold'].includes(malice.dockPhase)) return;
        }
        actions.press('right', RIGHT);
        if (frame.grounded) this.jump(frame, actions);
      } else if (frame.x < 468) actions.press('right', RIGHT);
      // 站在候車台；有效時間到達後，載台自行承載到較高對岸。
      return;
    }
    if (malice !== undefined) {
      if (this.options.naive !== 'backwash' && !['idle', 'spent', 'retired'].includes(malice.backwashPhase)) {
        if (this.options.fault === 'backwash') {
          if (frame.x < 1188) actions.press('right', RIGHT);
        } else if (frame.x > 1080) actions.press('left', LEFT);
        return;
      }
      if (this.options.naive !== 'recall' && !['idle', 'spent', 'retired'].includes(malice.recallPhase)) {
        if (this.options.fault === 'recall') {
          if (malice.recallActive) actions.press('left', LEFT);
          else if (frame.x < 1978) actions.press('right', RIGHT);
        } else actions.press('left', LEFT);
        return;
      }
      if (this.options.naive !== 'bell' && !['idle', 'spent', 'retired'].includes(malice.bellPhase)) {
        const waitX = this.options.fault === 'bell' ? 2728 : 2628;
        if (frame.x >= waitX) return;
      }
    }
    if (this.options.fault === 'steam' && machine.steamPhase !== 'retired' && frame.x >= 960 && frame.x < 1130) {
      if (frame.x < 1054) actions.press('right', RIGHT);
      return;
    }
    if (this.options.fault !== 'steam' && frame.x >= 960 && frame.x < 1100 &&
      machine.steamPhase !== 'spent' && machine.steamPhase !== 'retired') return;

    if (this.options.fault === 'press' && machine.pressPhase !== 'retired' && frame.x >= 1725 && frame.x < 1930) {
      // 輸送帶持續往左搬；間歇向右抵銷它，留在標示的壓機落點。
      if (frame.x < 1852) actions.press('right', RIGHT);
      return;
    }
    if (this.options.fault !== 'press' && frame.x >= 1725 && frame.x < 1800 &&
      machine.pressPhase !== 'spent' && machine.pressPhase !== 'retired') {
      if (frame.x < 1740) actions.press('right', RIGHT);
      return;
    }

    // 在兩層階梯各自落穩，避免第一次跳躍尚在空中就走出第二次起跳區。
    if (!frame.grounded && (frame.x >= 2390 && frame.x < 2425 || frame.x >= 2560 && frame.x < 2600)) return;
    actions.press('right', RIGHT);
    if (frame.grounded && (frame.x >= 880 && frame.x < 950 || frame.x >= 2280 && frame.x < 2310 ||
      frame.x >= 2425 && frame.x < 2460)) this.jump(frame, actions);
  }

  private jump(frame: PlaytestFrame, actions: ActionState): void {
    if (this.jumpHeld) return;
    actions.press('jump', JUMP); this.jumpHeld = true; this.jumpCommands++;
    if (frame.clockwork?.finalMercy) this.finalJumpCommands++;
  }
}
