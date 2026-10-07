import { describe, expect, it } from 'vitest';
import { LEVEL_TWO_CLOCKWORK as layout, LEVEL_TWO_EFFECT_IDS as effects } from '../content/levelTwo';
import { ClockworkState } from './ClockworkState';

function activateAll(state: ClockworkState): void {
  state.triggerCarrier(); state.triggerSteam(); state.triggerPress();
}

describe('第二關鐘塔機關有效時間', () => {
  it('載台先等候再斜行，抵達對岸後停留，每命只出發一次', () => {
    const state = new ClockworkState();
    expect(state.carrier).toEqual({ x: 484, y: 430, phase: 'idle' });
    expect(state.triggerCarrier()).toBe(true);
    state.advance(699);
    expect(state.carrier.phase).toBe('waiting');
    expect(state.triggerCarrier()).toBe(false);
    state.advance(751);
    expect(state.carrier).toEqual({ x: 577, y: 406, phase: 'moving' });
    state.advance(750);
    expect(state.carrier).toEqual({ x: 670, y: 382, phase: 'arrived' });
    state.advance(30_000);
    expect(state.carrier).toEqual({ x: 670, y: 382, phase: 'arrived' });
    expect(state.triggerCarrier()).toBe(false);
    state.resetAttempt();
    expect(state.carrier.phase).toBe('idle');
    expect(state.triggerCarrier()).toBe(true);
  });

  it('蒸汽只在噴發窗口有殺傷，等一次就能安全通過', () => {
    const state = new ClockworkState();
    expect(state.steamActive).toBe(false);
    state.triggerSteam(); state.advance(799);
    expect(state.steamPhase).toBe('tell');
    expect(state.steamActive).toBe(false);
    state.advance(1);
    expect(state.steamActive).toBe(true);
    state.advance(1_099);
    expect(state.steamPhase).toBe('active');
    state.advance(1);
    expect(state.steamPhase).toBe('spent');
    expect(state.steamActive).toBe(false);
    expect(state.triggerSteam()).toBe(false);
    state.resetAttempt();
    expect(state.triggerSteam()).toBe(true);
  });

  it('分揀壓機頂面由 150 落到 362，回收與預告沒有殺傷', () => {
    const state = new ClockworkState();
    state.triggerPress(); state.advance(899);
    expect(state.pressPhase).toBe('tell');
    expect(state.pressY).toBe(150);
    expect(state.pressActive).toBe(false);
    state.advance(126);
    expect(state.pressPhase).toBe('fall');
    expect(state.pressY).toBe(256);
    expect(state.pressActive).toBe(true);
    state.advance(125);
    expect(state.pressPhase).toBe('hold');
    expect(state.pressY + layout.press.height).toBe(layout.conveyor.topY);
    state.advance(200);
    expect(state.pressPhase).toBe('retract');
    expect(state.pressY).toBe(362);
    expect(state.pressActive).toBe(false);
    state.advance(300);
    expect(state.pressY).toBe(256);
    state.advance(300);
    expect(state.pressPhase).toBe('spent');
    expect(state.pressY).toBe(150);
    expect(state.triggerPress()).toBe(false);
  });

  it('拆幀與一次推進得到相同結果，暫停及無效時間不改位置', () => {
    const sliced = new ClockworkState();
    const single = new ClockworkState();
    activateAll(sliced); activateAll(single);
    for (let index = 0; index < 100; index++) sliced.advance(12);
    single.advance(1_200);
    expect(sliced.carrier).toEqual(single.carrier);
    expect(sliced.steamPhase).toBe(single.steamPhase);
    expect(sliced.pressY).toBe(single.pressY);
    const paused = { carrier: single.carrier, steam: single.steamPhase, press: single.pressY };
    for (const delta of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) single.advance(delta);
    expect({ carrier: single.carrier, steam: single.steamPhase, press: single.pressY }).toEqual(paused);
    single.advance(1_000);
    expect(single.carrier.phase).toBe('arrived');
    expect(single.steamPhase).toBe('spent');
  });

  it('第 3 次援助延長預告，已開始的攻擊不倒帶', () => {
    const state = new ClockworkState();
    state.setAssists([effects.steamWarning, effects.sorterWarning], false);
    state.triggerSteam(); state.triggerPress(); state.advance(900);
    expect(state.steamPhase).toBe('tell');
    expect(state.pressPhase).toBe('tell');
    state.advance(500);
    expect(state.steamPhase).toBe('active');
    expect(state.pressPhase).toBe('tell');
    state.advance(100);
    expect(state.pressPhase).toBe('fall');
    const active = new ClockworkState();
    active.triggerSteam(); active.triggerPress(); active.advance(1_000);
    const previousY = active.pressY;
    active.setAssists([effects.steamWarning, effects.sorterWarning], false);
    expect(active.steamPhase).toBe('active');
    expect(active.pressPhase).toBe('fall');
    expect(active.pressY).toBe(previousY);
    active.resetAttempt(); active.triggerSteam(); active.triggerPress(); active.advance(1_000);
    expect(active.steamPhase).toBe('tell');
    expect(active.pressPhase).toBe('tell');
  });

  it('停帶援助保留壓機動作，關閥立即停止蒸汽並跨重生保持', () => {
    const state = new ClockworkState();
    activateAll(state); state.advance(1_000);
    state.setAssists([effects.stopConveyor, effects.closeSteamValve], false);
    expect(state.conveyorSpeed).toBe(0);
    expect(state.steamPhase).toBe('retired');
    expect(state.steamActive).toBe(false);
    expect(state.pressPhase).toBe('fall');
    state.resetAttempt(); state.setAssists([], false);
    expect(state.triggerSteam()).toBe(false);
    expect(state.triggerPress()).toBe(true);
    expect(state.conveyorSpeed).toBe(0);
  });

  it('永久退休與紅毯取消預備攻擊；較早快照和重生都不能復活', () => {
    const state = new ClockworkState();
    activateAll(state); state.advance(200);
    state.setAssists([effects.retireCarrier, effects.retireSteam, effects.retireSorter], false);
    expect(state.carrier.phase).toBe('retired');
    expect(state.steamPhase).toBe('retired');
    expect(state.pressPhase).toBe('retired');
    expect(state.pressY).toBe(150);
    state.resetAttempt(); state.setAssists([], false); state.advance(10_000);
    expect([state.triggerCarrier(), state.triggerSteam(), state.triggerPress()]).toEqual([false, false, false]);
    expect(state.conveyorSpeed).toBe(0);
    const mercy = new ClockworkState();
    activateAll(mercy); mercy.advance(1_000); mercy.setAssists([], true);
    expect([mercy.carrier.phase, mercy.steamPhase, mercy.pressPhase]).toEqual(['retired', 'retired', 'retired']);
    mercy.resetAttempt(); mercy.setAssists([], false);
    expect(mercy.conveyorSpeed).toBe(0);
    expect(mercy.triggerPress()).toBe(false);
  });

  it('首關援助不影響第二關機器', () => {
    const state = new ClockworkState();
    state.setAssists(['deploy-gap-bridge', 'retire-warning-strip', 'certify-bridge-permanent'], false);
    activateAll(state); state.advance(1_000);
    expect(state.carrier.phase).toBe('moving');
    expect(state.steamActive).toBe(true);
    expect(state.pressActive).toBe(true);
    expect(state.conveyorSpeed).toBe(-95);
  });
});
