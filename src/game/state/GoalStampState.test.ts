import { describe, expect, it } from 'vitest';
import { GoalStampState, sweptContact } from './GoalStampState';

const rect = (x: number, y: number) => ({ x, y, width: 28, height: 39 });
describe('終點印章實體判定', () => {
  it('下落中撞到空中角色就死亡，不等落地或檢查中心高度', () => {
    const state = new GoalStampState(); state.arm();
    expect(state.advance(430, rect(2720, 270), rect(2720, 270))).toBe(true);
  });
  it('包含圖形邊緣，排除旁邊沒有重疊的玩家', () => {
    const state = new GoalStampState(); state.arm();
    expect(state.advance(650, rect(2674, 330), rect(2674, 330))).toBe(true);
    const safe = new GoalStampState(); safe.arm();
    expect(safe.advance(650, rect(2673, 330), rect(2673, 330))).toBe(false);
  });
  it('一幀跨過整次下落仍會命中，預告期間不傷害', () => {
    const state = new GoalStampState(); state.arm();
    expect(state.advance(199, rect(2720, 110), rect(2720, 110))).toBe(false);
    expect(state.advance(900, rect(2720, 330), rect(2720, 330))).toBe(true);
  });
  it('第二波補蓋有獨立位置與時間，收起後無傷害', () => {
    const state = new GoalStampState(); state.arm();
    expect(state.advance(1_020, rect(2800, 330), rect(2800, 330))).toBe(false);
    expect(state.advance(650, rect(2800, 330), rect(2800, 330))).toBe(true);
    state.advance(1_000, rect(2600, 330), rect(2600, 330));
    expect(state.advance(16, rect(2800, 330), rect(2800, 330))).toBe(false);
  });
  it('重生重設未命中的攻擊，撤除狀態不會重新啟動', () => {
    const state = new GoalStampState(); state.arm(); state.advance(500, rect(2500, 300), rect(2500, 300));
    state.resetAttempt(); expect(state.sample(0).phase).toBe('idle');
    state.arm(); state.retire(); state.resetAttempt(); state.arm();
    expect(state.advance(800, rect(2720, 330), rect(2720, 330))).toBe(false);
    expect(new GoalStampState(true).sample(0).phase).toBe('retired');
  });
  it('錯開的相對移動不因包圍盒覆蓋就誤判', () => {
    expect(sweptContact(rect(0, 0), rect(100, 0), rect(50, 100), rect(150, 100))).toBe(false);
    expect(sweptContact(rect(0, 0), rect(100, 0), rect(70, 0), rect(-30, 0))).toBe(true);
  });
});
