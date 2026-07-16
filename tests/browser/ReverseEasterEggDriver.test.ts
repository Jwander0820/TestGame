import { describe, expect, it } from 'vitest';
import { ActionState } from '../../src/game/input/ActionState';
import { ReverseEasterEggDriver } from './ReverseEasterEggDriver';

describe('reverse easter egg browser route', () => {
  it('waits for the starting floor before moving left and jumping', () => {
    const actions = new ActionState();
    const driver = new ReverseEasterEggDriver();

    driver.update({ x: 110, y: 350, grounded: false }, actions);
    expect(actions.isAnyDown()).toBe(false);

    driver.update({ x: 110, y: 398, grounded: true }, actions);
    expect(actions.isDown('left')).toBe(true);
    expect(actions.consumeJumpPressed()).toBe(true);
  });

  it('uses actual landings for the second jump, then returns to the main route', () => {
    const actions = new ActionState();
    const driver = new ReverseEasterEggDriver();

    driver.update({ x: 110, y: 398, grounded: true }, actions);
    actions.consumeJumpPressed();
    driver.update({ x: 44, y: 300, grounded: false }, actions);
    expect(actions.isDown('left')).toBe(false);

    driver.update({ x: 44, y: 320, grounded: true }, actions);
    driver.update({ x: 44, y: 320, grounded: true }, actions);
    expect(actions.consumeJumpPressed()).toBe(true);

    driver.update({ x: 44, y: 285, grounded: false }, actions);
    expect(driver.reachedReverseCache).toBe(true);
    expect(actions.isDown('right')).toBe(true);
  });
});
