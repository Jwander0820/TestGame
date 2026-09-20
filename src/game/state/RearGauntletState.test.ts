import { describe, expect, it } from 'vitest';
import { RearGauntletState } from './RearGauntletState';
import { REAR_HAZARDS, REAR_STEP } from '../content/rearGauntlet';
import { LEVEL_ONE_EFFECT_IDS as effects } from '../content/levelOne';

describe('rear gauntlet', () => {
  it('delays the return shot, then pursues from behind only once until respawn', () => {
    const returning = REAR_HAZARDS[4];
    const state = new RearGauntletState();
    state.arm('returnSweep', 100);
    expect(state.sample(returning, 999)).toMatchObject({ active: false, pending: true, x: 1_620 });
    expect(state.sample(returning, 1_000)).toMatchObject({ active: true, x: 1_620 });
    expect(state.sample(returning, 1_400)).toMatchObject({ active: true, x: 1_940 });
    expect(state.sample(returning, 1_850).active).toBe(false);
    state.arm('returnSweep', 1_900);
    expect(state.sample(returning, 2_800).active).toBe(false);
    state.resetAttempt(); state.arm('returnSweep', 3_000);
    expect(state.sample(returning, 3_900)).toMatchObject({ active: true, x: 1_620 });
  });

  it('shows the hammer warning before falling, freezes at the same play time and resets its position', () => {
    const hammer = REAR_HAZARDS[5];
    const state = new RearGauntletState();
    expect(state.sample(hammer, 0)).toMatchObject({ visible: false, active: false });
    state.arm('restHammer', 100);
    expect(state.sample(hammer, 499)).toMatchObject({ visible: true, pending: true, active: false, y: 160 });
    const falling = state.sample(hammer, 700);
    expect(falling).toMatchObject({ active: true, pending: false, y: 280 });
    expect(state.sample(hammer, 700)).toEqual(falling);
    expect(state.sample(hammer, 1_100).active).toBe(false);
    state.reveal('restHammer'); state.resetAttempt();
    expect(state.sample(hammer, 1_200)).toMatchObject({ visible: true, active: false, y: 160 });
  });

  it('reveals second-wave clues at three and cancels pending attacks at five without revival', () => {
    const state = new RearGauntletState();
    const secondWave = REAR_HAZARDS.slice(4);
    for (const hazard of secondWave) state.arm(hazard.id, 0);
    state.applyEffect(effects.reinforceInternBridge);
    for (const hazard of secondWave) expect(state.sample(hazard, 100).visible).toBe(true);
    state.applyEffect(effects.deployBridgeSafetyNet);
    state.resetAttempt(); state.applyEffect(effects.reinforceInternBridge);
    for (const hazard of secondWave) {
      state.arm(hazard.id, 0);
      for (const now of [100, 500, 900, 1_000, 1_500]) {
        expect(state.sample(hazard, now)).toMatchObject({ active: false, pending: false, retired: true });
      }
    }
  });

  it.each(REAR_HAZARDS.slice(4))('withdraws an already moving $id immediately', (hazard) => {
    const state = new RearGauntletState();
    state.arm(hazard.id, 0);
    const now = hazard.delayMs + 100;
    expect(state.sample(hazard, now).active).toBe(true);
    state.applyEffect(effects.deployBridgeSafetyNet);
    expect(state.sample(hazard, now)).toMatchObject({ active: false, retired: true });
    expect(state.sample(hazard, now + 100).active).toBe(false);
  });

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
