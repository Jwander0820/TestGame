import { describe, expect, it } from 'vitest';
import { ActionState } from '../../src/game/input/ActionState';
import { ZeroAssistDriver } from './ZeroAssistDriver';

describe('ZeroAssistDriver', () => {
  it('從高台下落進觸發高度時就開始計時，不延到落地才計時', () => {
    const actions = new ActionState();
    const driver = new ZeroAssistDriver();
    driver.update({ x: 180, y: 250, grounded: false, timeMs: 0 }, actions);
    driver.update({ x: 180, y: 275, grounded: false, timeMs: 100 }, actions);
    driver.update({ x: 180, y: 398, grounded: true, timeMs: 400 }, actions);
    actions.consumeJumpPressed();
    driver.update({ x: 340, y: 370, grounded: false, timeMs: 1_080 }, actions);
    driver.update({ x: 340, y: 398, grounded: true, timeMs: 1_280 }, actions);
    expect(actions.consumeJumpPressed()).toBe(true);
    expect(actions.isDown('right')).toBe(false);
  });
  it('留在岸內原地跳過方塊的回頭追撞，再接第一坑', () => {
    const actions = new ActionState();
    const driver = new ZeroAssistDriver();
    driver.update({ x: 180, y: 398, grounded: true, timeMs: 0 }, actions);
    actions.consumeJumpPressed();
    driver.update({ x: 340, y: 370, grounded: false, timeMs: 700 }, actions);
    expect(actions.isDown('right')).toBe(false);
    driver.update({ x: 340, y: 398, grounded: true, timeMs: 1_100 }, actions);
    expect(actions.consumeJumpPressed()).toBe(true);
    expect(actions.isDown('right')).toBe(false);
    driver.update({ x: 340, y: 398, grounded: true, timeMs: 1_900 }, actions);
    expect(actions.isDown('right')).toBe(true);
  });
  it('在圓形補跳結束前留在安全區，重生後重新引招', () => {
    const actions = new ActionState();
    const driver = new ZeroAssistDriver();
    driver.update({ x: 850, y: 398, grounded: true, timeMs: 0 }, actions);
    expect(actions.consumeJumpPressed()).toBe(true);
    driver.update({ x: 850, y: 350, grounded: false, timeMs: 100 }, actions);
    driver.update({ x: 850, y: 398, grounded: true, timeMs: 1_500 }, actions);
    expect(actions.isDown('right')).toBe(false);
    driver.update({ x: 850, y: 398, grounded: true, timeMs: 2_200 }, actions);
    expect(actions.isDown('right')).toBe(true);
    driver.reset(actions);
    driver.update({ x: 850, y: 398, grounded: true, timeMs: 3_000 }, actions);
    expect(actions.isDown('right')).toBe(false);
    expect(actions.consumeJumpPressed()).toBe(true);
  });
  it('在最後高台等待兩次蓋章結束再前進', () => {
    const actions = new ActionState();
    const driver = new ZeroAssistDriver();
    driver.update({ x: 2626, y: 350, grounded: true, timeMs: 1000 }, actions);
    expect(actions.isDown('right')).toBe(false);
    driver.update({ x: 2626, y: 350, grounded: true, timeMs: 2900 }, actions);
    expect(actions.isDown('right')).toBe(false);
    driver.update({ x: 2626, y: 350, grounded: true, timeMs: 3100 }, actions);
    expect(actions.isDown('right')).toBe(true);
  });
  it('從反向高台返回時先在突進怪前落地，不直接落進攻擊路線', () => {
    const actions = new ActionState();
    const driver = new ZeroAssistDriver();
    driver.update({ x: 180, y: 250, grounded: false }, actions);
    expect(actions.isDown('right')).toBe(false);
    driver.update({ x: 180, y: 340, grounded: false }, actions);
    expect(actions.isDown('right')).toBe(false);
    driver.update({ x: 180, y: 398, grounded: true }, actions);
    expect(actions.isDown('right')).toBe(true);
    expect(actions.consumeJumpPressed()).toBe(true);
  });
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

    driver.update({ x: 150, y: 390, grounded: true }, actions);
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
