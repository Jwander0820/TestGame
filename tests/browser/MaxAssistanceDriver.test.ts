import { describe, expect, it } from 'vitest';
import { LEVEL_ONE_ID } from '../../src/game/content/levelOne';
import { ActionState } from '../../src/game/input/ActionState';
import { MaxAssistanceDriver } from './MaxAssistanceDriver';
import {
  createMaxAssistanceCheckpointProgress,
  createMaxAssistanceProgress,
} from './maxAssistanceState';

describe('maximum assistance browser route', () => {
  it('builds the approved tier 4 save with every persistent world effect', () => {
    const state = createMaxAssistanceProgress();
    const level = state.levels[LEVEL_ONE_ID];

    expect(state.totalDeaths).toBe(21);
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
    expect(level?.blockers['intern-bridge']?.activeAssistIds).toEqual([
      'reinforce-intern-bridge',
      'deploy-bridge-safety-net',
      'certify-bridge-permanent',
    ]);
  });

  it('walks into the first bridge without sending a normal first-gap jump', () => {
    const actions = new ActionState();
    const driver = new MaxAssistanceDriver();

    driver.update({ x: 390, y: 390, grounded: true }, actions);

    expect(actions.isDown('right')).toBe(true);
    expect(actions.consumeJumpPressed()).toBe(false);
  });

  it('preserves the highest assists at the first checkpoint for reload verification', () => {
    const state = createMaxAssistanceCheckpointProgress();
    const level = state.levels[LEVEL_ONE_ID];
    const activeAssistCount = Object.values(level?.blockers ?? {}).reduce(
      (total, blocker) => total + blocker.activeAssistIds.length,
      0,
    );

    expect(state.totalDeaths).toBe(14);
    expect(level?.progressMarkerId).toBe('after-first-gap');
    expect(level?.progressOrder).toBe(1);
    expect(level?.completed).toBe(false);
    expect(activeAssistCount).toBe(6);
  });
});
