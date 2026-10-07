import { afterEach, describe, expect, it, vi } from 'vitest';
import { LEVEL_ONE_ID } from '../content/levelOne';
import { LEVEL_TWO_DEATHS, LEVEL_TWO_EFFECT_IDS as effects, LEVEL_TWO_ID, LEVEL_TWO_SPAWNS } from '../content/levelTwo';
import { ClockworkState } from '../state/ClockworkState';
import { ProgressStore, createDefaultProgress, createLevelProgress } from '../state/progress';
import { LevelTwoSession } from './LevelTwoSession';

function fixture() {
  const values = new Map<string, string>();
  const storage = { getItem: (key: string): string | null => values.get(key) ?? null,
    setItem: (key: string, value: string): void => { values.set(key, value); } };
  const store = new ProgressStore(storage);
  let now = 1_000;
  return { storage, store, session: new LevelTwoSession(store, () => ++now) };
}

const carrierDeath = { ...LEVEL_TWO_DEATHS.carrier, x: 600.4, y: 580.6 };
afterEach(() => vi.restoreAllMocks());

describe('第二關 Session 保存與援助交易', () => {
  it('首次進入及重載接續正確據點，進度不後退', () => {
    const { session, storage } = fixture();
    expect(session.initialSpawn).toBe(LEVEL_TWO_SPAWNS.start);
    session.advanceMarker('after-carrier', 1);
    expect(session.initialSpawn).toBe(LEVEL_TWO_SPAWNS.afterCarrier);
    session.advanceMarker('after-steam', 2);
    expect(session.initialSpawn).toBe(LEVEL_TWO_SPAWNS.afterSteam);
    session.advanceMarker('after-press', 3);
    expect(session.initialSpawn).toBe(LEVEL_TWO_SPAWNS.afterPress);
    expect(session.advanceMarker('after-carrier', 1)).toBeNull();
    expect(new LevelTwoSession(new ProgressStore(storage)).initialSpawn).toEqual(LEVEL_TWO_SPAWNS.afterPress);
  });

  it('三段依序 2／3／5／7 死解鎖，最高三段援助退休整關', () => {
    const { session, storage } = fixture();
    for (const context of [LEVEL_TWO_DEATHS.carrier, LEVEL_TWO_DEATHS.steam, LEVEL_TWO_DEATHS.press]) {
      const reactions: number[] = [];
      for (let index = 1; index <= 7; index++) {
        const result = session.recordDeath({ ...context, x: 600, y: 580 }, () => true);
        if (result.reaction !== null) reactions.push(index);
      }
      expect(reactions).toEqual([2, 3, 5, 7]);
    }
    expect(session.levelDeaths).toBe(21);
    expect(session.totalDeaths).toBe(21);
    expect(session.finalMercy).toBe(true);
    expect(session.activeAssistCount).toBe(9);
    const restored = new LevelTwoSession(new ProgressStore(storage));
    const machine = new ClockworkState();
    machine.setAssists(restored.activeAssistIds, restored.finalMercy);
    expect([machine.triggerCarrier(), machine.triggerSteam(), machine.triggerPress()]).toEqual([false, false, false]);
    expect(machine.conveyorSpeed).toBe(0);
  });

  it('第一關累積 21 死與完成資料不提前解鎖第二關，局部死亡仍計入全旅程', () => {
    const { store, session } = fixture();
    const firstLevel = { ...createLevelProgress(), totalDeaths: 21, completed: true, progressOrder: 4, progressMarkerId: 'goal' };
    store.replace({ ...createDefaultProgress(), totalDeaths: 21, levels: { [LEVEL_ONE_ID]: firstLevel } });
    expect(session.totalDeaths).toBe(21);
    expect(session.levelDeaths).toBe(0);
    expect(session.finalMercy).toBe(false);
    expect(session.activeAssistIds).toEqual([]);
    session.recordDeath(carrierDeath, () => true);
    expect(session.totalDeaths).toBe(22);
    expect(session.levelDeaths).toBe(1);
    expect(store.snapshot.levels[LEVEL_ONE_ID]).toBe(firstLevel);
    expect(session.finalMercy).toBe(false);
  });

  it('所有死因都會累積局部 21 死紅毯，無 blocker 也不例外', () => {
    const { session } = fixture();
    for (let index = 0; index < 20; index++) session.recordDeath({ ...LEVEL_TWO_DEATHS.void, x: -80, y: 600 }, () => true);
    expect(session.finalMercy).toBe(false);
    session.recordDeath({ ...LEVEL_TWO_DEATHS.void, x: -80, y: 600 }, () => true);
    expect(session.finalMercy).toBe(true);
    expect(session.activeAssistIds).toEqual([]);
    expect(session.causeDeaths('clockwork-void')).toBe(21);
  });

  it('三段永久援助已保存時直接恢復紅毯，少一段則保持各段機關', () => {
    const { store, session } = fixture();
    const blocker = (activeAssistIds: readonly string[]) => ({ totalDeaths: 7, consecutiveDeaths: 0,
      streakMarkerId: 'after-press', triggeredReactionIds: [], activeAssistIds });
    const level = { ...createLevelProgress(), totalDeaths: 17, blockers: {
      'clockwork-carrier': blocker([effects.retireCarrier]),
      'clockwork-steam': blocker([effects.retireSteam]),
    } };
    store.replace({ ...createDefaultProgress(), totalDeaths: 17, levels: { [LEVEL_TWO_ID]: level } });
    expect(session.finalMercy).toBe(false);
    store.replace({ ...store.snapshot, levels: { [LEVEL_TWO_ID]: { ...level,
      blockers: { ...level.blockers, 'clockwork-sorter': blocker([effects.retireSorter]) } } } });
    expect(session.levelDeaths).toBe(17);
    expect(session.finalMercy).toBe(true);
  });

  it('效果失敗保留死亡但不保存援助，下次死亡可重新嘗試', () => {
    const { session, storage } = fixture();
    session.recordDeath(carrierDeath, () => true); session.recordDeath(carrierDeath, () => true);
    const failed = session.recordDeath(carrierDeath, () => false);
    expect(failed.reaction).toBeNull();
    expect(session.levelDeaths).toBe(3);
    expect(session.activeAssistIds).toEqual([]);
    expect(new LevelTwoSession(new ProgressStore(storage)).activeAssistIds).toEqual([]);
    const retriedEffects: string[] = [];
    const retried = session.recordDeath(carrierDeath, id => { retriedEffects.push(id); return true; });
    expect(retried.reaction?.effectId).toBe(effects.carrierRail);
    expect(retriedEffects).toEqual([effects.carrierRail]);
    expect(session.activeAssistIds).toEqual([effects.carrierRail]);
    expect(session.blockerDeaths('clockwork-carrier')).toBe(4);
  });

  it('世界效果例外不破壞保存，進到新據點會重置連續死亡', () => {
    const { session } = fixture();
    session.recordDeath(carrierDeath, () => true); session.recordDeath(carrierDeath, () => true);
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(session.recordDeath(carrierDeath, () => { throw new Error('world effect failed'); }).reaction).toBeNull();
    expect(error).toHaveBeenCalledOnce();
    expect(session.levelDeaths).toBe(3);
    session.advanceMarker('after-carrier', 1);
    expect(session.recordDeath(carrierDeath, () => true).reaction).toBeNull();
    expect(session.activeAssistIds).toEqual([]);
    expect(session.blockerDeaths('clockwork-carrier')).toBe(4);
  });

  it('固定時鐘仍讓每次獨立死亡有不同 attempt，不被誤當重複事件', () => {
    const { store } = fixture();
    const session = new LevelTwoSession(store, () => 1_000);
    session.recordDeath(carrierDeath, () => true); session.recordDeath(carrierDeath, () => true);
    expect(session.levelDeaths).toBe(2);
    expect(store.snapshot.levels[LEVEL_TWO_ID]?.processedDeathEventIds).toEqual(['level-two:1:1000', 'level-two:2:1000']);
  });

  it('旁支只保存一次且不推進據點，完成只修改第二關', () => {
    const { store, session, storage } = fixture();
    const firstLevel = { ...createLevelProgress(), completed: true };
    store.replace({ ...createDefaultProgress(), levels: { [LEVEL_ONE_ID]: firstLevel } });
    expect(session.discoverEasterEgg('clockwork-break-room')).not.toBeNull();
    expect(session.discoverEasterEgg('clockwork-break-room')).toBeNull();
    expect(session.progressOrder).toBe(0);
    session.complete();
    const restoredStore = new ProgressStore(storage);
    expect(restoredStore.snapshot.levels[LEVEL_ONE_ID]).toEqual(firstLevel);
    expect(restoredStore.snapshot.levels[LEVEL_TWO_ID]?.completed).toBe(true);
    expect(restoredStore.snapshot.levels[LEVEL_TWO_ID]?.progressOrder).toBe(4);
    expect(new LevelTwoSession(restoredStore).hasDiscoveredEasterEgg('clockwork-break-room')).toBe(true);
  });
});
