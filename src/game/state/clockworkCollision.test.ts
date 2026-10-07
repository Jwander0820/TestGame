import { describe, expect, it } from 'vitest';
import type { CollisionRect } from './GoalStampState';
import { clockworkContact } from './clockworkCollision';

describe('鐘塔機關與玩家相對掃碰', () => {
  it('60fps 配重已升離後才走入落點，不把時間錯開的聯集判成死亡', () => {
    const trap: CollisionRect = { x: 2_680, y: 243, width: 100, height: 70 };
    const player: CollisionRect = { x: 2_649, y: 311, width: 28, height: 39 };
    // 配重底面在本幀 26.7% 升離玩家；玩家在 75% 才走到水平重疊處。
    expect(clockworkContact(trap, { ...trap, y: 235.5 }, player, { ...player, x: 2_653 }, true, true)).toBe(false);
  });

  it('高速落下完整穿越靜止勇者仍計入接觸，不靠本幀終點重疊', () => {
    const trap: CollisionRect = { x: 790, y: 78, width: 52, height: 152 };
    const player: CollisionRect = { x: 802, y: 311, width: 28, height: 39 };
    expect(clockworkContact(trap, { ...trap, y: 430 }, player, player, false, true)).toBe(true);
  });

  it('雙方相向移動交錯時碰撞，即使兩端矩形都沒有重疊', () => {
    const trap: CollisionRect = { x: 200, y: 100, width: 52, height: 152 };
    const player: CollisionRect = { x: 100, y: 120, width: 28, height: 39 };
    expect(clockworkContact(trap, { ...trap, x: 50 }, player, { ...player, x: 250 }, true, true)).toBe(true);
  });

  it('軌跡在不同時間穿越同一區域，不能以包圍盒聯集造成誤判', () => {
    const trap: CollisionRect = { x: 200, y: 200, width: 52, height: 68 };
    const player: CollisionRect = { x: 100, y: 100, width: 28, height: 39 };
    expect(clockworkContact(trap, { ...trap, x: 100, y: -300 }, player, { ...player, x: 200 }, true, true)).toBe(false);
  });

  it('預告、待命或退休的前後兩端都不殺傷，即使身體重疊', () => {
    const trap: CollisionRect = { x: 2_680, y: 280, width: 100, height: 70 };
    const player: CollisionRect = { x: 2_700, y: 311, width: 28, height: 39 };
    expect(clockworkContact(trap, trap, player, player, false, false)).toBe(false);
  });

  it('剛退出殺傷窗口仍保留本幀真實接觸，不漏掉回收邊界', () => {
    const trap: CollisionRect = { x: 2_680, y: 280, width: 100, height: 70 };
    const player: CollisionRect = { x: 2_700, y: 311, width: 28, height: 39 };
    expect(clockworkContact(trap, { ...trap, y: 100 }, player, player, true, false)).toBe(true);
  });

  it('回收完成後再進入原落點，不因上一端仍 active 而幽靈命中', () => {
    const trap: CollisionRect = { x: 2_680, y: 107.5, width: 100, height: 70 };
    const player: CollisionRect = { x: 2_649, y: 311, width: 28, height: 39 };
    expect(clockworkContact(trap, { ...trap, y: 100 }, player, { ...player, x: 2_653 }, true, false)).toBe(false);
  });
});
