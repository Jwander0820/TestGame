import { describe, expect, it } from 'vitest';
import { ReturnAuditState } from './ReturnAuditState';
import { isBacktrackFall } from '../content/returnAudit';

const body = { x: 730, y: 300, width: 28, height: 39 };
describe('回頭查票', () => {
  it('前進、下落、起點彩蛋不觸發；回跳鎖定位置每生命一次', () => {
    const s = new ReturnAuditState();
    for (const p of [{ x: 850, vx: 240, vy: -400 }, { x: 850, vx: -240, vy: 100 }, { x: 180, vx: -240, vy: -400 }]) s.observe(p);
    expect(s.sample().phase).toBe('idle');
    s.observe({ x: 850, vx: -240, vy: -400 });
    expect(s.sample()).toMatchObject({ phase: 'tell', x: 754 });
    s.observe({ x: 950, vx: -240, vy: -400 });
    expect(s.sample().x).toBe(754);
    expect(s.advance(299, body, body)).toBe(false);
    expect(s.sample().phase).toBe('tell');
    expect(s.advance(300, body, body)).toBe(true);
    s.advance(300, body, body);
    expect(s.sample().phase).toBe('spent');
    s.resetAttempt();
    expect(s.sample().phase).toBe('idle');
    s.retire(); s.resetAttempt(); s.observe({ x: 850, vx: -240, vy: -400 });
    expect(s.advance(1_000, body, body)).toBe(false);
    expect(s.sample().phase).toBe('retired');
  });
  it('大時間步會命中，離開鎖定區則躲過；同一時間不偷走預告', () => {
    const s = new ReturnAuditState(); s.observe({ x: 850, vx: -240, vy: -400 });
    const warning = s.sample();
    expect(s.advance(0, body, body)).toBe(false);
    expect(s.sample()).toEqual(warning);
    expect(s.advance(1_000, body, body)).toBe(true);
    s.resetAttempt(); s.observe({ x: 850, vx: -240, vy: -400 });
    expect(s.advance(1_000, { ...body, x: 950 }, { ...body, x: 950 })).toBe(false);
  });
  it('左側出界和退回 checkpoint 後方算回程死亡，正常前進落坑不誤算', () => {
    expect(isBacktrackFall(-30, 110, 0)).toBe(true);
    expect(isBacktrackFall(700, 820, 1)).toBe(true);
    expect(isBacktrackFall(500, 110, 0)).toBe(false);
    expect(isBacktrackFall(1_100, 820, 1)).toBe(false);
  });
});
