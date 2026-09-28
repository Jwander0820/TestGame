import { describe, expect, it } from 'vitest';
import { BackstageEntry, BackstageSign } from './BackstageState';
import { BACKSTAGE } from '../content/backstage';
import { LEVEL_ONE_PLAYER_PHYSICS as physics } from '../content/levelOneLayout';
import { getLevelOneCompletionCopy, LEVEL_ONE_ID } from '../content/levelOne';
import { createDefaultProgress, ProgressStore } from './progress';
import { LevelOneSession } from '../session/LevelOneSession';

const landing = { x: -36, y: 240.5, feet: 260, grounded: true, leftJump: false, alive: true };
const crossing = { ...landing, x: -62, y: 194, feet: 213.5, grounded: false };
describe('後台入口與局部機關', () => {
  it('必須先站上最高平台，再向左起跳', () => {
    const gate = new BackstageEntry();
    expect(gate.update(crossing)).toBe(false);
    gate.update(landing);
    expect(gate.update(crossing)).toBe(false);
    gate.update({ ...landing, leftJump: true });
    expect(gate.update(crossing)).toBe(true);
    gate.reset(); expect(gate.update(crossing)).toBe(false);
  });
  it('排除死亡、地面跳躍、錯誤高度與跳出後再繞回', () => {
    for (const bad of [{ ...landing, feet: 418, leftJump: true }, { ...landing, alive: false, leftJump: true }]) {
      const gate = new BackstageEntry(); gate.update(bad); expect(gate.update(crossing)).toBe(false);
    }
    const gate = new BackstageEntry(); gate.update({ ...landing, leftJump: true });
    expect(gate.update({ ...crossing, y: 300 })).toBe(false);
    expect(gate.update(crossing)).toBe(false);
  });
  it('入口跨越具至少 20px 水平餘裕，返回落點遠離金幣', () => {
    const seconds = (physics.jumpSpeed + Math.sqrt(physics.jumpSpeed ** 2 - 2 * physics.gravityY * 4)) / physics.gravityY;
    expect(seconds * physics.moveSpeed - Math.abs(BACKSTAGE.entry.x - landing.x)).toBeGreaterThan(20);
    expect(BACKSTAGE.returnPoint.y - physics.bodyHeight / 2).toBeGreaterThan(225 + 24);
  });
  it('落牌完整預告 650ms，固定下落且每次拜訪只觸發一次', () => {
    const sign = new BackstageSign(); sign.trigger(); sign.advance(649);
    expect(sign.phase).toBe('warning'); expect(sign.y).toBe(220);
    sign.advance(1); expect(sign.phase).toBe('falling');
    sign.advance(240); expect(sign.phase).toBe('spent'); expect(sign.y).toBe(397);
    sign.trigger(); sign.advance(1000); expect(sign.phase).toBe('spent');
  });
  it('跨幀掃掠會命中，但旁邊及出口保持安全', () => {
    const sign = new BackstageSign(); sign.trigger(); sign.advance(890);
    expect(sign.hits(691, 719, 378, 417, 220)).toBe(true);
    expect(sign.hits(790, 818, 378, 417, 220)).toBe(false);
    expect(sign.hits(871, 899, 378, 417, 220)).toBe(false);
  });
  it('發現保存一次，重載仍保留據點、死亡、援助與結局輸入', () => {
    const memory = new Map<string, string>();
    const storage = { getItem: (k: string) => memory.get(k) ?? null, setItem: (k: string, v: string) => { memory.set(k, v); } };
    const store = new ProgressStore(storage); store.replace(createDefaultProgress());
    const session = new LevelOneSession(store); session.advanceMarker('after-first-gap', 1);
    const before = structuredClone(store.snapshot);
    session.discoverEasterEgg(BACKSTAGE.egg); expect(session.discoverEasterEgg(BACKSTAGE.egg)).toBeNull();
    const after = new ProgressStore(storage).snapshot;
    expect(after.levels[LEVEL_ONE_ID]).toEqual(before.levels[LEVEL_ONE_ID]);
    expect(after.totalDeaths).toBe(before.totalDeaths);
    expect(after.discoveredEasterEggIds).toEqual([BACKSTAGE.egg]);
    expect(getLevelOneCompletionCopy(after.totalDeaths, session.activeAssistCount)).toEqual(getLevelOneCompletionCopy(before.totalDeaths, 0));
  });
});
