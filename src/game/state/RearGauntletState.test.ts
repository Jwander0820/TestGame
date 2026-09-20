import { describe, expect, it } from 'vitest';
import { RearGauntletState } from './RearGauntletState';
import { REAR_HAZARDS, REAR_STEP } from '../content/rearGauntlet';
import { LEVEL_ONE_EFFECT_IDS as effects } from '../content/levelOne';

describe('rear gauntlet', () => {
  it('collapses only after landing, without extending the delay on repeated contact', () => {
    const state = new RearGauntletState();
    expect(state.stepCollapsed(10_000)).toBe(false);
    state.landOnStep(100); state.landOnStep(200);
    expect(state.stepCollapsed(100 + REAR_STEP.collapseMs - 1)).toBe(false);
    expect(state.stepCollapsed(100 + REAR_STEP.collapseMs)).toBe(true);
    state.resetAttempt();
    expect(state.stepCollapsed(10_000)).toBe(false);
  });

  it('fires once per attempt, pauses with the supplied game clock, and rearms on reset', () => {
    const sweep = REAR_HAZARDS[0];
    const state = new RearGauntletState();
    expect(state.sample(sweep, 100).active).toBe(false);
    state.arm('sweep', 100); state.arm('sweep', 200);
    const beforePause = state.sample(sweep, 300);
    expect(state.sample(sweep, 300)).toEqual(beforePause);
    expect(beforePause.x).toBe(sweep.x - 120);
    expect(state.sample(sweep, 1_000).active).toBe(false);
    state.arm('sweep', 1_100);
    expect(state.sample(sweep, 1_100).active).toBe(false);
    state.resetAttempt(); state.arm('sweep', 1_200);
    expect(state.sample(sweep, 1_200).active).toBe(true);
  });

  it('reveals hidden traps after contact and restores known clues on reload', () => {
    const ceiling = REAR_HAZARDS[2];
    const state = new RearGauntletState();
    expect(state.sample(ceiling, 0)).toMatchObject({ active: true, visible: false });
    state.reveal('ceiling'); state.resetAttempt();
    expect(state.sample(ceiling, 0).visible).toBe(true);
    expect(new RearGauntletState(['ceiling']).sample(ceiling, 0).visible).toBe(true);
  });

  it('third, fifth and seventh death effects remove distinct layers, including armed attacks', () => {
    const state = new RearGauntletState();
    for (const hazard of REAR_HAZARDS) state.arm(hazard.id, 0);
    state.landOnStep(0);
    state.applyEffect(effects.reinforceInternBridge);
    expect(state.stepCollapsed(1_000)).toBe(false);
    expect(state.sample(REAR_HAZARDS[1], 300)).toMatchObject({ visible: true, active: true });
    state.applyEffect(effects.deployBridgeSafetyNet);
    expect(state.sample(REAR_HAZARDS[0], 300).active).toBe(false);
    expect(state.sample(REAR_HAZARDS[2], 300).active).toBe(false);
    expect(state.sample(REAR_HAZARDS[3], 300).active).toBe(true);
    state.applyEffect(effects.certifyBridgePermanent);
    state.resetAttempt(); state.applyEffect(effects.reinforceInternBridge);
    for (const hazard of REAR_HAZARDS) {
      state.arm(hazard.id, 0);
      expect(state.sample(hazard, 300).active).toBe(false);
    }
  });

  it('restores maximum assistance safely in any effect order', () => {
    const state = new RearGauntletState();
    state.applyEffect(effects.certifyBridgePermanent);
    state.landOnStep(0);
    expect(state.stepCollapsed(1_000)).toBe(false);
    for (const hazard of REAR_HAZARDS) {
      state.arm(hazard.id, 0);
      expect(state.sample(hazard, 300)).toMatchObject({ active: false, retired: true });
    }
  });
});
