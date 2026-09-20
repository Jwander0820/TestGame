import { describe, expect, it } from 'vitest';
import { LEVEL_ONE_EFFECT_IDS as effects } from '../content/levelOne';
import { LEVEL_ONE_TRAP_DEATHS, LEVEL_ONE_DEATHS } from '../content/levelOneDeaths';
import { LearnedTrapState } from './LearnedTrapState';
import { LevelOneSession } from '../session/LevelOneSession';
import { ProgressStore } from './progress';

describe('learned traps and sympathy', () => {
  it('clears attempt attribution but preserves discovered clues on respawn', () => {
    const state = new LearnedTrapState();
    state.hitCeiling();
    expect(state.hitAirAmbush()).toBe(true);
    state.resetAttempt();
    expect(state.hitCeilingThisAttempt).toBe(false);
    expect(state.ceilingRevealed).toBe(true);
    expect(state.airAmbushRevealed).toBe(true);
    expect(state.ceilingEnabled).toBe(true);
  });

  it('restores discovered clues without attributing a previous attempt to the next death', () => {
    const state = new LearnedTrapState(true, true);
    expect(state.ceilingRevealed).toBe(true);
    expect(state.airAmbushRevealed).toBe(true);
    expect(state.hitCeilingThisAttempt).toBe(false);
  });

  it('makes assistance monotonic even when effects are repeated or restored out of order', () => {
    const state = new LearnedTrapState();
    for (const effect of [effects.retireWarningStrip, effects.deployGapBridge,
      effects.shrinkWarningStrip, effects.moveFirstLanding, effects.deployGapBridge]) {
      state.applyEffect(effect);
    }
    state.hitCeiling();
    expect(state.hitCeilingThisAttempt).toBe(false);
    expect(state.hitAirAmbush()).toBe(false);
    expect(state.landingStampEnabled).toBe(false);
    expect(state.floorRevealed).toBe(true);
    state.resetAttempt();
    expect(state.ceilingEnabled).toBe(false);
    expect(state.airAmbushEnabled).toBe(false);
  });

  it('counts mixed first-section failures together and removes the ceiling on the third death', () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); } };
    let time = 0;
    const session = new LevelOneSession(new ProgressStore(storage), () => ++time);
    const state = new LearnedTrapState();
    for (const context of [LEVEL_ONE_DEATHS.firstGap, LEVEL_ONE_DEATHS.landing, LEVEL_ONE_TRAP_DEATHS.ceiling]) {
      session.recordDeath({ ...context, x: 680, y: 380 }, (effect) => {
        if (effect === effects.moveFirstLanding) state.applyEffect(effect);
        return true;
      });
    }
    expect(session.blockerDeaths('first-gap')).toBe(3);
    expect(state.ceilingEnabled).toBe(false);
    expect(state.landingStampEnabled).toBe(true);
    const restored = new LevelOneSession(new ProgressStore(storage));
    expect(restored.activeAssistIds).toContain(effects.moveFirstLanding);
    expect(restored.causeDeaths(LEVEL_ONE_TRAP_DEATHS.ceiling.causeId)).toBe(1);
  });

  it('reveals the false floor on the third failure and retires the air ambush on the fifth', () => {
    const values = new Map<string, string>();
    let time = 0;
    const session = new LevelOneSession(new ProgressStore({
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => { values.set(key, value); },
    }), () => ++time);
    const state = new LearnedTrapState();
    for (let death = 1; death <= 5; death += 1) {
      session.recordDeath({ ...LEVEL_ONE_TRAP_DEATHS.airAmbush, x: 980, y: 340 }, (effect) => {
        if (effect === effects.shrinkWarningStrip || effect === effects.deployStripBypass) state.applyEffect(effect);
        return true;
      });
      if (death === 3) {
        expect(state.floorRevealed).toBe(true);
        expect(state.airAmbushEnabled).toBe(true);
      }
    }
    expect(state.hitAirAmbush()).toBe(false);
    expect(session.blockerDeaths('warning-strip')).toBe(5);
  });
});
