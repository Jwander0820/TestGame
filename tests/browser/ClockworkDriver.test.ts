import { describe, expect, it } from 'vitest';
import { ActionState } from '../../src/game/input/ActionState';
import type { PlaytestFrame } from '../../src/game/testing/PlaytestDriver';
import { ClockworkDriver } from './ClockworkDriver';
import type { ClockworkMaliceSample } from '../../src/game/state/ClockworkMaliceState';

function frame(x: number, sample: Partial<NonNullable<PlaytestFrame['clockwork']>> = {}, grounded = true): PlaytestFrame {
  return { levelId: 'level-two', x, y: 400, grounded, clockwork: {
    carrierX: 484, carrierY: 430, carrierPhase: 'idle', steamPhase: 'spent', pressPhase: 'spent',
    finalMercy: false, ...sample,
  } };
}

function malice(changes: Partial<ClockworkMaliceSample> = {}): ClockworkMaliceSample {
  return { dockPhase: 'spent', dockY: 78, dockActive: false, backwashPhase: 'spent', backwashActive: false,
    recallPhase: 'spent', recallActive: false, bellPhase: 'spent', bellY: 100, bellActive: false,
    conveyorOverride: null, revealed: { dock: false, backwash: false, sorter: false }, ...changes };
}

describe('ClockworkDriver', () => {
  it('站定搭乘，抵達才跳離；尚未離地時不連續發出跳躍', () => {
    const actions = new ActionState(); const driver = new ClockworkDriver();
    driver.update(frame(470, { carrierPhase: 'waiting' }), actions);
    expect(actions.isAnyDown()).toBe(false);
    driver.update(frame(620, { carrierPhase: 'moving' }), actions);
    expect(actions.isDown('right')).toBe(false);
    driver.update(frame(620, { carrierPhase: 'moving' }, false), actions);
    expect(actions.isDown('right')).toBe(false);
    expect(actions.consumeJumpPressed()).toBe(false);
    driver.update(frame(656, { carrierPhase: 'arrived' }), actions);
    expect(actions.isDown('right')).toBe(true);
    expect(actions.consumeJumpPressed()).toBe(true);
    driver.update(frame(660, { carrierPhase: 'arrived' }), actions);
    expect(actions.consumeJumpPressed()).toBe(false);
    driver.update(frame(680, { carrierPhase: 'arrived' }, false), actions);
    expect(actions.isDown('right')).toBe(true);
    expect(actions.isDown('jump')).toBe(false);
  });

  it('在蒸汽閘前等它洩壓，故意犯錯案例才站到噴口', () => {
    const actions = new ActionState(); const driver = new ClockworkDriver();
    driver.update(frame(960, { steamPhase: 'active' }), actions);
    expect(actions.isDown('right')).toBe(false);
    driver.update(frame(960, { steamPhase: 'spent' }), actions);
    expect(actions.isDown('right')).toBe(true);
    const fault = new ClockworkDriver({ fault: 'steam' });
    fault.update(frame(960, { steamPhase: 'tell' }), actions);
    expect(actions.isDown('right')).toBe(true);
    fault.update(frame(1056, { steamPhase: 'tell' }), actions);
    expect(actions.isDown('right')).toBe(false);
    fault.update(frame(1056, { steamPhase: 'retired' }), actions);
    expect(actions.isDown('right')).toBe(true);
  });

  it('抵銷逆向輸送帶保持安全站位，壓機收回後才走', () => {
    const actions = new ActionState(); const driver = new ClockworkDriver();
    driver.update(frame(1738, { pressPhase: 'tell' }), actions);
    expect(actions.isDown('right')).toBe(true);
    driver.update(frame(1742, { pressPhase: 'fall' }), actions);
    expect(actions.isDown('right')).toBe(false);
    driver.update(frame(1738, { pressPhase: 'hold' }), actions);
    expect(actions.isDown('right')).toBe(true);
    driver.update(frame(1742, { pressPhase: 'spent' }), actions);
    expect(actions.isDown('right')).toBe(true);
    const fault = new ClockworkDriver({ fault: 'press' });
    fault.update(frame(1853, { pressPhase: 'tell' }), actions);
    expect(actions.isDown('right')).toBe(false);
  });

  it('階梯跳躍先落穩，最終援助與只往右案例不產生跳躍', () => {
    const actions = new ActionState(); const driver = new ClockworkDriver();
    driver.update(frame(2282), actions); expect(actions.consumeJumpPressed()).toBe(true);
    driver.update(frame(2392, {}, false), actions); expect(actions.isDown('right')).toBe(false);
    driver.update(frame(2392), actions); expect(actions.isDown('right')).toBe(true);
    driver.update(frame(2428), actions); expect(actions.consumeJumpPressed()).toBe(true);
    driver.update(frame(2562, {}, false), actions); expect(actions.isDown('right')).toBe(false);
    driver.update(frame(2282, { finalMercy: true }), actions);
    expect(actions.isDown('right')).toBe(true); expect(actions.isDown('jump')).toBe(false);
    expect(driver.finalJumpCommands).toBe(0);
    const right = new ClockworkDriver({ rightOnly: true });
    right.update(frame(2282), actions); expect(actions.consumeJumpPressed()).toBe(false);
    expect(right.jumpCommands).toBe(0);
  });

  it('到站仍等閘刀回收，援助鋪橋後不再停等尚未退休的載台', () => {
    const actions = new ActionState(); const driver = new ClockworkDriver();
    driver.update(frame(656, { carrierPhase: 'arrived', malice: malice({ dockPhase: 'tell' }) }), actions);
    expect(actions.isAnyDown()).toBe(false);
    driver.update(frame(656, { carrierPhase: 'arrived', malice: malice({ dockPhase: 'hold', dockActive: true }) }), actions);
    expect(actions.isAnyDown()).toBe(false);
    driver.update(frame(656, { carrierPhase: 'arrived', malice: malice() }), actions);
    expect(actions.consumeJumpPressed()).toBe(true);
    driver.update(frame(470, { carrierPhase: 'idle', malice: malice({ dockPhase: 'retired' }) }), actions);
    expect(actions.isDown('right')).toBe(true);
    const fault = new ClockworkDriver({ fault: 'dock' }); fault.reset(actions);
    fault.update(frame(656, { carrierPhase: 'arrived', malice: malice({ dockPhase: 'tell' }) }), actions);
    expect(actions.isAnyDown()).toBe(false);
    fault.update(frame(656, { carrierPhase: 'arrived', malice: malice({ dockPhase: 'fall', dockActive: true }) }), actions);
    expect(actions.consumeJumpPressed()).toBe(true);
  });

  it('旁管觸發便退到1080左側，受害案例留在旁管落點', () => {
    const actions = new ActionState(); const driver = new ClockworkDriver();
    driver.update(frame(1104, { malice: malice({ backwashPhase: 'tell' }) }), actions);
    expect(actions.isDown('left')).toBe(true); expect(actions.isDown('right')).toBe(false);
    driver.update(frame(1080, { malice: malice({ backwashPhase: 'active', backwashActive: true }) }), actions);
    expect(actions.isAnyDown()).toBe(false);
    driver.update(frame(1080, { malice: malice() }), actions);
    expect(actions.isDown('right')).toBe(true);
    const fault = new ClockworkDriver({ fault: 'backwash' });
    fault.update(frame(1189, { malice: malice({ backwashPhase: 'tell' }) }), actions);
    expect(actions.isAnyDown()).toBe(false);
  });

  it('快速出貨預告立即撤回，啟動時持續向左抵銷右搬運，收完才前進', () => {
    const actions = new ActionState(); const driver = new ClockworkDriver();
    driver.update(frame(1904, { malice: malice({ recallPhase: 'tell' }) }), actions);
    expect(actions.isDown('left')).toBe(true);
    driver.update(frame(1820, { malice: malice({ recallPhase: 'active', recallActive: true, conveyorOverride: 300 }) }), actions);
    expect(actions.isDown('left')).toBe(true); expect(actions.isDown('right')).toBe(false);
    driver.update(frame(1820, { malice: malice() }), actions);
    expect(actions.isDown('left')).toBe(false); expect(actions.isDown('right')).toBe(true);
    const fault = new ClockworkDriver({ fault: 'recall' });
    fault.update(frame(1979, { malice: malice({ recallPhase: 'tell' }) }), actions);
    expect(actions.isAnyDown()).toBe(false);
    fault.update(frame(1979, { malice: malice({ recallPhase: 'active', recallActive: true, conveyorOverride: 0 }) }), actions);
    expect(actions.isDown('left')).toBe(true);
  });

  it('配重回收前留在鐘前，受害案例在配重正下方等待', () => {
    const actions = new ActionState(); const driver = new ClockworkDriver();
    driver.update(frame(2630, { malice: malice({ bellPhase: 'hold', bellActive: true }) }), actions);
    expect(actions.isAnyDown()).toBe(false);
    driver.update(frame(2630, { malice: malice() }), actions);
    expect(actions.isDown('right')).toBe(true);
    const fault = new ClockworkDriver({ fault: 'bell' });
    fault.update(frame(2730, { malice: malice({ bellPhase: 'tell' }) }), actions);
    expect(actions.isAnyDown()).toBe(false);
    fault.update(frame(2730, { malice: malice({ bellPhase: 'retired' }) }), actions);
    expect(actions.isDown('right')).toBe(true);
  });

  it('各直覺案例只忽略指定後手，最終援助清空先前撤退輸入', () => {
    const actions = new ActionState();
    const dock = new ClockworkDriver({ naive: 'dock' });
    dock.update(frame(656, { carrierPhase: 'arrived', malice: malice({ dockPhase: 'tell' }) }), actions);
    expect(actions.consumeJumpPressed()).toBe(true);
    const backwash = new ClockworkDriver({ naive: 'backwash' });
    backwash.update(frame(1104, { malice: malice({ backwashPhase: 'tell' }) }), actions);
    expect(actions.isDown('right')).toBe(true);
    const learned = new ClockworkDriver();
    learned.update(frame(1904, { malice: malice({ recallPhase: 'active', recallActive: true, conveyorOverride: 300 }) }), actions);
    expect(actions.isDown('left')).toBe(true);
    learned.update(frame(1904, { finalMercy: true, malice: malice({ recallPhase: 'retired' }) }), actions);
    expect(actions.isDown('left')).toBe(false); expect(actions.isDown('right')).toBe(true);
    expect(learned.finalJumpCommands).toBe(0);
  });
});
