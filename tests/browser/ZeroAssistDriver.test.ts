import { describe, expect, it } from 'vitest';
import { ActionState } from '../../src/game/input/ActionState';
import { ZeroAssistDriver } from './ZeroAssistDriver';

describe('ZeroAssistDriver', () => {
  it('waits past the hidden ceiling and walks across the false gap on the learned route', () => {
    const actions = new ActionState();
    const driver = new ZeroAssistDriver();
    driver.update({ x: 580, y: 376, grounded: true }, actions);
    expect(actions.consumeJumpPressed()).toBe(false);
    driver.update({ x: 618, y: 376, grounded: true }, actions);
    expect(actions.consumeJumpPressed()).toBe(true);
    driver.update({ x: 640, y: 350, grounded: false }, actions);
    driver.update({ x: 980, y: 398, grounded: true }, actions);
    expect(actions.consumeJumpPressed()).toBe(false);
    expect(actions.isDown('right')).toBe(true);
  });
  it('holds right and sends one jump edge while crossing a configured takeoff zone', () => {
    const actions = new ActionState();
    const driver = new ZeroAssistDriver();

    driver.update({ x: 200, y: 390, grounded: true }, actions);
    expect(actions.isDown('right')).toBe(true);
    expect(actions.consumeJumpPressed()).toBe(false);

    driver.update({ x: 380, y: 390, grounded: true }, actions);
    expect(actions.consumeJumpPressed()).toBe(true);
    driver.update({ x: 390, y: 370, grounded: false }, actions);
    expect(actions.isDown('jump')).toBe(false);
  });

  it('releases every source it owns when the scene resets', () => {
    const actions = new ActionState();
    const driver = new ZeroAssistDriver();

    driver.update({ x: 380, y: 390, grounded: true }, actions);
    driver.reset(actions);

    expect(actions.isDown('right')).toBe(false);
    expect(actions.isDown('jump')).toBe(false);
  });

  it('can intentionally accept the first goal audit and jump on the retry', () => {
    const actions = new ActionState();
    const driver = new ZeroAssistDriver({ allowFirstGoalAmbush: true });

    driver.update({ x: 2_650, y: 390, grounded: true }, actions);
    expect(actions.consumeJumpPressed()).toBe(false);
    driver.update({ x: 2_680, y: 390, grounded: true }, actions);
    driver.update({ x: 2_650, y: 390, grounded: true }, actions);
    expect(actions.consumeJumpPressed()).toBe(true);
  });
});
