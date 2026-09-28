import type { ActionState } from '../../src/game/input/ActionState';
import type { PlaytestDriver, PlaytestFrame } from '../../src/game/testing/PlaytestDriver';
import { ZeroAssistDriver } from './ZeroAssistDriver';

export class BackstageDriver implements PlaytestDriver {
  private main = new ZeroAssistDriver();
  phase = 'first';
  last: PlaytestFrame | null = null;
  visits = 0;
  private jumpStarted = false;
  private roomStart = 0;
  private roomPhase = 'sign';
  private stopAt = 0;
  private returnedAt = 0;
  constructor(readonly mode = 'dodge') {}
  reset(actions: ActionState): void { actions.releaseAll(); this.main.reset(actions); this.phase = 'first'; this.jumpStarted = false; }
  update(frame: PlaytestFrame, actions: ActionState): void {
    this.last = frame;
    const move = (direction: 'left' | 'right'): void => { actions.press(direction, 'backstage-route'); };
    actions.releaseSource('backstage-route');
    if (frame.area === 'backstage') {
      if (this.phase !== 'room') { this.phase = 'room'; this.visits++; this.roomStart = frame.timeMs ?? 0; this.roomPhase = 'sign'; }
      const time = (frame.timeMs ?? 0) - this.roomStart;
      if (this.mode === 'immediate' || this.visits > 1) { move('right'); return; }
      if (this.roomPhase === 'sign') {
        if (this.mode === 'hit' && time < 1700) { if (frame.x > 705) move('left'); return; }
        // Waiting before the marked landing area avoids the sign without pixel-perfect input.
        if (time < 1500) { if (frame.x > 752) move('left'); return; }
        this.roomPhase = 'desk';
      }
      if (this.roomPhase === 'desk') {
        if (frame.x > 520) move('left');
        else { this.roomPhase = 'read'; this.stopAt = time; }
      } else if (this.roomPhase === 'read') {
        if (time - this.stopAt > 10500) this.roomPhase = 'spikes';
      } else if (this.roomPhase === 'spikes') {
        if (frame.x > 292) move('left');
        else { this.roomPhase = 'read-spikes'; this.stopAt = time; }
      } else if (this.roomPhase === 'read-spikes') {
        if (time - this.stopAt > 3400) this.roomPhase = 'slime';
      } else if (this.roomPhase === 'slime') {
        if (frame.x > 145) move('left');
        else { this.roomPhase = 'read-slime'; this.stopAt = time; }
      } else if (this.roomPhase === 'read-slime') {
        if (time - this.stopAt > 3400) this.roomPhase = 'exit';
      } else move('right');
      return;
    }
    if (this.phase === 'room') {
      this.phase = this.mode === 'repeat' && this.visits === 1 ? 'wait-coins' : 'main';
      this.returnedAt = frame.timeMs ?? 0;
      this.jumpStarted = false;
    }
    if (this.phase === 'wait-coins') {
      // Main hazards are frozen during the visit. Let the remaining original coin burst finish safely below it.
      if ((frame.timeMs ?? 0) - this.returnedAt < 800 || !frame.grounded) return;
      this.phase = 'second';
    }
    if (this.phase === 'main') {
      if (this.mode === 'max' || this.mode === 'checkpoint') move('right');
      else this.main.update(frame, actions);
      return;
    }
    if (this.phase === 'first' && !this.jumpStarted && frame.x > 114) { move('left'); return; }
    if (this.phase === 'first') {
      if (!this.jumpStarted && frame.grounded) { actions.press('jump', 'backstage-route'); this.jumpStarted = true; }
      if (this.jumpStarted && frame.x > 43) move('left');
      if (this.jumpStarted && frame.grounded && frame.y < 350) { this.phase = 'second'; this.jumpStarted = false; }
    } else if (this.phase === 'second') {
      if (!this.jumpStarted && frame.grounded) { actions.press('jump', 'backstage-route'); this.jumpStarted = true; }
      if (this.jumpStarted && frame.x > -36) move('left');
      if (this.jumpStarted && frame.grounded && frame.y < 255) { this.phase = 'enter'; this.jumpStarted = false; }
    } else if (this.phase === 'enter') {
      move('left');
      if (frame.grounded && !this.jumpStarted) { actions.press('jump', 'backstage-route'); this.jumpStarted = true; }
    }
  }
}
