import { expect, it } from 'vitest';
import { ActionState } from '../../src/game/input/ActionState';
import { BackstageDriver } from './BackstageDriver';

it('第二次拜訪先在下層等原本金幣爆發結束，再用正式跳躍重返', () => {
  const actions = new ActionState(); const driver = new BackstageDriver('repeat');
  driver.update({ area: 'backstage', x: 790, y: 398.5, grounded: true, timeMs: 10 }, actions);
  driver.update({ area: 'main', x: 35, y: 320.5, grounded: true, timeMs: 1500 }, actions);
  expect(actions.isAnyDown()).toBe(false);
  driver.update({ area: 'main', x: 35, y: 320.5, grounded: true, timeMs: 2299 }, actions);
  expect(actions.isAnyDown()).toBe(false);
  driver.update({ area: 'main', x: 35, y: 320.5, grounded: true, timeMs: 2300 }, actions);
  expect(actions.consumeJumpPressed()).toBe(true); expect(actions.isDown('left')).toBe(true);
});
