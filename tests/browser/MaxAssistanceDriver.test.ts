import { describe, expect, it } from 'vitest';
import { LEVEL_ONE_ID } from '../../src/game/content/levelOne';
import { ActionState } from '../../src/game/input/ActionState';
import { MaxAssistanceDriver } from './MaxAssistanceDriver';
import { createMaxAssistanceProgress } from './maxAssistanceState';

describe('maximum assistance browser route', () => {
  it('builds the approved tier 4 save with every persistent world effect', () => {
    const state = createMaxAssistanceProgress();
    const level = state.levels[LEVEL_ONE_ID];

    expect(state.totalDeaths).toBe(14);
    expect(level?.progressMarkerId).toBe('start');
    expect(level?.progressOrder).toBe(0);
    expect(level?.blockers['first-gap']?.activeAssistIds).toEqual([
      'move-first-landing',
      'deploy-gap-spring',
      'deploy-gap-bridge',
    ]);
    expect(level?.blockers['warning-strip']?.activeAssistIds).toEqual([
      'shrink-warning-strip',
      'deploy-strip-bypass',
      'retire-warning-strip',
    ]);
  });

  it('walks into the first bridge without sending a normal first-gap jump', () => {
    const actions = new ActionState();
    const driver = new MaxAssistanceDriver();

    driver.update({ x: 390, y: 390, grounded: true }, actions);

    expect(actions.isDown('right')).toBe(true);
    expect(actions.consumeJumpPressed()).toBe(false);
  });
});
