import { describe, expect, it } from 'vitest';
import { ActionState } from '../../src/game/input/ActionState';
import { RightOnlyDriver } from './RightOnlyDriver';

describe('最終援助只向右', () => {
  it('經過整關原有起跳區也不送出跳躍，重設釋放輸入', () => {
    const actions = new ActionState();
    const driver = new RightOnlyDriver();
    for (let x = 110; x < 3_000; x += 4) {
      driver.update({ x, y: 398.5, grounded: true }, actions);
      expect(actions.isDown('right')).toBe(true);
      expect(actions.consumeJumpPressed()).toBe(false);
    }
    driver.reset(actions);
    expect(actions.isAnyDown()).toBe(false);
  });
});
