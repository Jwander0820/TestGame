import { describe, expect, it } from 'vitest';
import { FEINT_PLATFORM as floor, type FeintApproach } from '../content/feintPlatform';
import { LEVEL_ONE_EFFECT_IDS as effects } from '../content/levelOne';
import { FeintPlatformState } from './FeintPlatformState';

const left = floor.x - floor.width / 2;
const approach: FeintApproach = { x: left - 60, feet: floor.top - 40, velocityX: 240, grounded: false };
const end = floor.dodgeMs + floor.holdMs + floor.returnMs;

describe('虛晃地板', () => {
  it.each([
    { grounded: true }, { velocityX: 0 }, { velocityX: -240 }, { x: left },
    { x: left - floor.approachDistance - 1 }, { feet: floor.top },
    { feet: floor.top - floor.approachHeight - 1 },
  ])('地面、反向、平台上方與範圍外不觸發：%j', patch => {
    const state = new FeintPlatformState();
    state.approach({ ...approach, ...patch }, 0);
    expect(state.sample(1_000)).toEqual({ phase: 'idle', x: floor.x });
  });

  it('接近邊界會快退、停留、慢回，時間與位置連續', () => {
    const state = new FeintPlatformState();
    state.approach({ ...approach, x: left - floor.approachDistance, feet: floor.top - floor.approachHeight }, 100);
    expect(state.sample(100)).toEqual({ phase: 'dodging', x: floor.x });
    expect(state.sample(160).x).toBeCloseTo(floor.x + floor.distance * 0.875);
    expect(state.sample(100 + floor.dodgeMs)).toEqual({ phase: 'holding', x: floor.x + floor.distance });
    const returnStart = 100 + floor.dodgeMs + floor.holdMs;
    expect(state.sample(returnStart)).toEqual({ phase: 'returning', x: floor.x + floor.distance });
    expect(state.sample(returnStart + floor.returnMs / 2).x).toBeCloseTo(floor.x + floor.distance / 4);
    expect(state.sample(100 + end)).toEqual({ phase: 'spent', x: floor.x });
  });

  it('每命一次，不延長動作；暫停使用同一有效時間；重生重新啟動', () => {
    const state = new FeintPlatformState();
    state.approach(approach, 0);
    state.approach(approach, 90);
    const paused = state.sample(100);
    expect(state.sample(100)).toEqual(paused);
    expect(state.sample(end)).toEqual({ phase: 'spent', x: floor.x });
    state.approach(approach, end + 10);
    expect(state.sample(end + 20).phase).toBe('spent');
    state.resetAttempt();
    expect(state.triggeredThisAttempt).toBe(false);
    state.approach(approach, end + 100);
    expect(state.sample(end + 101).phase).toBe('dodging');
  });

  it.each([effects.reinforceInternBridge, effects.deployBridgeSafetyNet, effects.certifyBridgePermanent])(
    '援助 %s 立即取消退開並永久固定，重生與較低援助不復活', effect => {
      const state = new FeintPlatformState();
      state.approach(approach, 0);
      expect(state.sample(floor.dodgeMs).x).toBe(floor.x + floor.distance);
      state.applyEffect(effect);
      expect(state.sample(150)).toEqual({ phase: 'retired', x: floor.x });
      state.resetAttempt(); state.applyEffect(effects.reinforceInternBridge); state.approach(approach, 200);
      expect(state.sample(210)).toEqual({ phase: 'retired', x: floor.x });
      expect(state.triggeredThisAttempt).toBe(false);
    });

  it('別區援助不撤除，紅毯明確退休', () => {
    const state = new FeintPlatformState();
    state.applyEffect(effects.deployGapBridge); state.approach(approach, 0);
    expect(state.sample(1).phase).toBe('dodging');
    state.retire(); state.resetAttempt();
    expect(state.sample(2)).toEqual({ phase: 'retired', x: floor.x });
  });
});
