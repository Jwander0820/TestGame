import { describe, expect, it } from 'vitest';
import { LEVEL_ONE_ID } from '../content/levelOne';
import { ProgressStore, createDefaultProgress, parseProgress } from './progress';
import { LevelOneSession } from '../session/LevelOneSession';
import { hasFinalMercy } from './FinalMercy';
import { restartLevel } from '../sympathy/director';
import { createMaxAssistanceProgress } from '../../../tests/browser/maxAssistanceState';

describe('最終紅毯', () => {
  it.each(['backtrack-exit', 'backtrack-audit', 'fell-out-of-world'])('%s 沒有區段援助也會在第 21 死啟用，保存與重玩保留', causeId => {
    const store = new ProgressStore({ getItem: () => null, setItem: () => undefined });
    const session = new LevelOneSession(store);
    for (let i = 0; i < 20; i++) session.recordDeath({ causeId, blockerId: null, x: -80, y: 580 }, () => true);
    expect(session.finalMercy).toBe(false);
    session.recordDeath({ causeId, blockerId: null, x: -80, y: 580 }, () => true);
    expect(session.finalMercy).toBe(true);
    expect(hasFinalMercy(parseProgress(JSON.stringify(store.snapshot)))).toBe(true);
    expect(hasFinalMercy(restartLevel(store.snapshot, LEVEL_ONE_ID))).toBe(true);
    expect(hasFinalMercy(createDefaultProgress())).toBe(false);
  });
  it('舊的三段最高援助可還原，不拿其他關卡死亡解鎖', () => {
    const legacy = createMaxAssistanceProgress();
    expect(hasFinalMercy(legacy)).toBe(true);
    expect(hasFinalMercy({ ...createDefaultProgress(), totalDeaths: 100 })).toBe(false);
    const level = legacy.levels[LEVEL_ONE_ID]!;
    expect(hasFinalMercy({ ...legacy, levels: { [LEVEL_ONE_ID]: { ...level, totalDeaths: 0 } } })).toBe(true);
  });
});
