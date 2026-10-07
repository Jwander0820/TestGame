import { describe, expect, it } from 'vitest';
import { CLOCKWORK_MALICE as layout } from '../content/clockworkMalice';
import { LEVEL_TWO_EFFECT_IDS as effects } from '../content/levelTwo';
import { ClockworkMaliceState } from './ClockworkMaliceState';

function triggerAll(state: ClockworkMaliceState): readonly boolean[] {
  return [state.triggerDock(), state.triggerBackwash(), state.triggerRecall(), state.triggerBell()];
}

const warnings = [
  { name: '卸貨閘', effect: effects.carrierRail, normal: layout.dock.tellMs, assisted: layout.dock.assistedTellMs,
    trigger: (state: ClockworkMaliceState) => state.triggerDock(), phase: (state: ClockworkMaliceState) => state.sample.dockPhase },
  { name: '蒸汽旁管', effect: effects.steamWarning, normal: layout.backwash.tellMs, assisted: layout.backwash.assistedTellMs,
    trigger: (state: ClockworkMaliceState) => state.triggerBackwash(), phase: (state: ClockworkMaliceState) => state.sample.backwashPhase },
  { name: '出口夾口', effect: effects.sorterWarning, normal: layout.recall.tellMs, assisted: layout.recall.assistedTellMs,
    trigger: (state: ClockworkMaliceState) => state.triggerRecall(), phase: (state: ClockworkMaliceState) => state.sample.recallPhase },
  { name: '鐘配重', effect: effects.sorterWarning, normal: layout.bell.tellMs, assisted: layout.bell.assistedTellMs,
    trigger: (state: ClockworkMaliceState) => state.triggerBell(), phase: (state: ClockworkMaliceState) => state.sample.bellPhase },
] as const;

describe('鐘塔四種安全提示後手', () => {
  it('未觸發不消耗時間，每個後手每命只觸發一次，重生後可再次啟動', () => {
    const state = new ClockworkMaliceState();
    const initial = state.sample;
    state.advance(10_000);
    expect(state.sample).toEqual(initial);
    expect(triggerAll(state)).toEqual([true, true, true, true]);
    expect(triggerAll(state)).toEqual([false, false, false, false]);
    state.advance(10_000);
    expect([state.sample.dockPhase, state.sample.backwashPhase, state.sample.recallPhase, state.sample.bellPhase])
      .toEqual(['spent', 'spent', 'spent', 'spent']);
    expect(triggerAll(state)).toEqual([false, false, false, false]);
    state.resetAttempt();
    expect(state.sample).toEqual(initial);
    expect(triggerAll(state)).toEqual([true, true, true, true]);
  });

  it('到站閘刀從 78 落到 230，停留及整段回收都有殺傷', () => {
    const state = new ClockworkMaliceState();
    state.triggerDock(); state.advance(layout.dock.tellMs - 1);
    expect(state.sample.dockPhase).toBe('tell');
    expect(state.sample.dockY).toBe(78);
    expect(state.sample.dockActive).toBe(false);
    state.advance(1);
    expect(state.sample.dockPhase).toBe('fall');
    expect(state.sample.dockActive).toBe(true);
    state.advance(layout.dock.fallMs / 2);
    expect(state.sample.dockY).toBe(154);
    state.advance(layout.dock.fallMs / 2);
    expect(state.sample.dockPhase).toBe('hold');
    expect(state.sample.dockY).toBe(230);
    state.advance(layout.dock.holdMs);
    expect(state.sample.dockPhase).toBe('retract');
    expect(state.sample.dockActive).toBe(true);
    state.advance(layout.dock.retractMs / 2);
    expect(state.sample.dockY).toBe(154);
    expect(state.sample.dockActive).toBe(true);
    state.advance(layout.dock.retractMs / 2);
    expect(state.sample.dockPhase).toBe('spent');
    expect(state.sample.dockY).toBe(78);
    expect(state.sample.dockActive).toBe(false);
  });

  it('鐘配重由 100 落到 280，完整回收後才可安全進入落點', () => {
    const state = new ClockworkMaliceState();
    state.triggerBell(); state.advance(layout.bell.tellMs - 1);
    expect(state.sample.bellPhase).toBe('tell');
    expect(state.sample.bellActive).toBe(false);
    state.advance(1);
    expect(state.sample.bellPhase).toBe('fall');
    expect(state.sample.bellActive).toBe(true);
    state.advance(layout.bell.fallMs / 2);
    expect(state.sample.bellY).toBe(190);
    state.advance(layout.bell.fallMs / 2);
    expect(state.sample.bellPhase).toBe('hold');
    expect(state.sample.bellY).toBe(280);
    state.advance(layout.bell.holdMs);
    expect(state.sample.bellPhase).toBe('retract');
    expect(state.sample.bellActive).toBe(true);
    state.advance(layout.bell.retractMs - 1);
    expect(state.sample.bellActive).toBe(true);
    state.advance(1);
    expect(state.sample.bellPhase).toBe('spent');
    expect(state.sample.bellY).toBe(100);
    expect(state.sample.bellActive).toBe(false);
  });

  it('旁管只有固定噴發窗口殺傷；一次噴完後不再復活', () => {
    const state = new ClockworkMaliceState();
    state.triggerBackwash(); state.advance(layout.backwash.tellMs - 1);
    expect(state.sample.backwashPhase).toBe('tell');
    expect(state.sample.backwashActive).toBe(false);
    state.advance(1);
    expect(state.sample.backwashPhase).toBe('active');
    expect(state.sample.backwashActive).toBe(true);
    state.advance(layout.backwash.activeMs - 1);
    expect(state.sample.backwashActive).toBe(true);
    state.advance(1);
    expect(state.sample.backwashPhase).toBe('spent');
    expect(state.sample.backwashActive).toBe(false);
    expect(state.triggerBackwash()).toBe(false);
  });

  it('夾口開啟時輸送帶突變向右，收完後回復由主機關決定', () => {
    const state = new ClockworkMaliceState();
    expect(state.sample.conveyorOverride).toBeNull();
    state.triggerRecall(); state.advance(layout.recall.tellMs - 1);
    expect(state.sample.recallPhase).toBe('tell');
    expect(state.sample.recallActive).toBe(false);
    expect(state.sample.conveyorOverride).toBeNull();
    state.advance(1);
    expect(state.sample.recallPhase).toBe('active');
    expect(state.sample.recallActive).toBe(true);
    expect(state.sample.conveyorOverride).toBe(300);
    state.advance(layout.recall.activeMs - 1);
    expect(state.sample.conveyorOverride).toBe(300);
    state.advance(1);
    expect(state.sample.recallPhase).toBe('spent');
    expect(state.sample.recallActive).toBe(false);
    expect(state.sample.conveyorOverride).toBeNull();
  });

  it.each(warnings)('$name 援助延長本命預告，跨重生保持但已出招不倒帶', entry => {
    const warned = new ClockworkMaliceState();
    entry.trigger(warned); warned.advance(entry.normal - 1); warned.setAssists([entry.effect]); warned.advance(1);
    expect(entry.phase(warned)).toBe('tell');
    warned.advance(entry.assisted - entry.normal - 1);
    expect(entry.phase(warned)).toBe('tell');
    warned.advance(1);
    expect(entry.phase(warned)).not.toBe('tell');
    warned.resetAttempt(); warned.setAssists([]); entry.trigger(warned); warned.advance(entry.normal);
    expect(entry.phase(warned)).toBe('tell');

    const active = new ClockworkMaliceState();
    entry.trigger(active); active.advance(entry.normal);
    const before = active.sample;
    active.setAssists([entry.effect]);
    expect(entry.phase(active)).not.toBe('tell');
    expect(active.sample.dockY).toBe(before.dockY);
    expect(active.sample.bellY).toBe(before.bellY);
  });

  it('揭露只作用於對應段落，保存永久援助也會揭露已解除的後手', () => {
    const state = new ClockworkMaliceState();
    expect(state.sample.revealed).toEqual({ dock: false, backwash: false, sorter: false });
    state.setAssists([effects.carrierRail]);
    expect(state.sample.revealed).toEqual({ dock: true, backwash: false, sorter: false });
    state.setAssists([effects.closeSteamValve, effects.retireSorter]);
    expect(state.sample.revealed).toEqual({ dock: true, backwash: true, sorter: true });
    state.resetAttempt(); state.setAssists([]);
    expect(state.sample.revealed).toEqual({ dock: true, backwash: true, sorter: true });
  });

  it('第 5 死停帶只取消突加速，夾口及鐘配重仍可正常啟動', () => {
    const state = new ClockworkMaliceState();
    state.triggerRecall(); state.advance(layout.recall.tellMs);
    expect(state.sample.conveyorOverride).toBe(300);
    state.setAssists([effects.stopConveyor]);
    expect(state.sample.recallActive).toBe(true);
    expect(state.sample.conveyorOverride).toBe(0);
    expect(state.triggerBell()).toBe(true);
    state.advance(layout.recall.activeMs);
    expect(state.sample.conveyorOverride).toBeNull();
    state.resetAttempt(); state.setAssists([]); state.triggerRecall(); state.advance(layout.recall.tellMs);
    expect(state.sample.recallActive).toBe(true);
    expect(state.sample.conveyorOverride).toBe(0);
  });

  it.each([effects.carrierBridge, effects.retireCarrier])('%s 立即取消卸貨閘，不影響其他兩段', effect => {
    const state = new ClockworkMaliceState();
    triggerAll(state); state.advance(500); state.setAssists([effect]);
    expect(state.sample.dockPhase).toBe('retired');
    expect(state.sample.dockY).toBe(layout.dock.hiddenY);
    expect(state.sample.dockActive).toBe(false);
    expect(state.sample.backwashActive).toBe(true);
    expect(state.sample.recallActive).toBe(true);
    expect(state.sample.bellActive).toBe(true);
    state.resetAttempt(); state.setAssists([]);
    expect(state.triggerDock()).toBe(false);
  });

  it.each([effects.closeSteamValve, effects.retireSteam])('%s 立即取消旁管，不影響載台及分揀', effect => {
    const state = new ClockworkMaliceState();
    triggerAll(state); state.advance(500); state.setAssists([effect]);
    expect(state.sample.backwashPhase).toBe('retired');
    expect(state.sample.backwashActive).toBe(false);
    expect(state.sample.dockActive).toBe(true);
    expect(state.sample.recallActive).toBe(true);
    state.resetAttempt(); state.setAssists([]);
    expect(state.triggerBackwash()).toBe(false);
  });

  it('分揀退休同時中止夾口及鐘配重，本段第 7 死效果跨重生保持', () => {
    const state = new ClockworkMaliceState();
    triggerAll(state); state.advance(500); state.setAssists([effects.retireSorter]);
    expect(state.sample.recallPhase).toBe('retired');
    expect(state.sample.bellPhase).toBe('retired');
    expect(state.sample.recallActive).toBe(false);
    expect(state.sample.bellActive).toBe(false);
    expect(state.sample.conveyorOverride).toBeNull();
    expect(state.sample.dockActive).toBe(true);
    expect(state.sample.backwashActive).toBe(true);
    state.resetAttempt(); state.setAssists([]);
    expect(state.triggerRecall()).toBe(false);
    expect(state.triggerBell()).toBe(false);
  });

  it('最高援助在預告或殺傷中立即全部退休，不能以較早快照重新武裝', () => {
    for (const age of [100, 500]) {
      const state = new ClockworkMaliceState();
      triggerAll(state); state.advance(age); state.setAssists([], true);
      expect([state.sample.dockPhase, state.sample.backwashPhase, state.sample.recallPhase, state.sample.bellPhase])
        .toEqual(['retired', 'retired', 'retired', 'retired']);
      expect([state.sample.dockActive, state.sample.backwashActive, state.sample.recallActive, state.sample.bellActive])
        .toEqual([false, false, false, false]);
      expect(state.sample.conveyorOverride).toBeNull();
      state.resetAttempt(); state.setAssists([], false);
      expect(triggerAll(state)).toEqual([false, false, false, false]);
    }
  });

  it('有效時間分幀一致、暫停與無效時間不改樣本；首關援助不能關閉後手', () => {
    const single = new ClockworkMaliceState(), sliced = new ClockworkMaliceState();
    triggerAll(single); triggerAll(sliced);
    single.setAssists(['deploy-gap-bridge', 'retire-warning-strip', 'certify-bridge-permanent']);
    single.advance(450);
    for (let index = 0; index < 30; index++) sliced.advance(15);
    expect(single.sample).toEqual(sliced.sample);
    const frozen = single.sample;
    for (const delta of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) single.advance(delta);
    expect(single.sample).toEqual(frozen);
    expect(single.sample.revealed).toEqual({ dock: false, backwash: false, sorter: false });
  });
});
