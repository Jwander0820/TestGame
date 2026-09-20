import { describe, expect, it } from 'vitest';
import { FirstPitState } from './FirstPitState';
import { FIRST_PIT_AMBUSH as layout } from '../content/firstPitAmbush';
import { LEVEL_ONE_EFFECT_IDS as effects } from '../content/levelOne';

describe('first pit malice', () => {
  it('fires upward only once per life and rearms on respawn', () => {
    const state = new FirstPitState();
    state.launch(100);
    expect(state.riserY(100)).toBe(layout.riser.startY);
    expect(state.riserY(400)).toBeLessThan(layout.riser.startY);
    state.launch(400);
    expect(state.riserY(400)).toBe(layout.riser.startY - 0.3 * layout.riser.speed);
    expect(state.riserY(1_000)).toBeNull();
    state.launch(1_100);
    expect(state.riserY(1_100)).toBeNull();
    state.resetAttempt();
    state.launch(1_200);
    expect(state.riserY(1_200)).toBe(layout.riser.startY);
  });

  it('coins are bait, then fuse, then lethal, then spent without extending the fuse on overlap', () => {
    const state = new FirstPitState();
    expect(state.coinPhase('a', 0)).toBe('bait');
    state.armCoin('a', 0);
    state.armCoin('a', 100);
    expect(state.coinPhase('a', layout.coinFuseMs - 1)).toBe('fuse');
    expect(state.coinPhase('a', layout.coinFuseMs)).toBe('burst');
    expect(state.coinPhase('a', layout.coinFuseMs + layout.coinActiveMs)).toBe('spent');
    state.armCoin('a', 2_000);
    expect(state.coinPhase('a', 2_000)).toBe('spent');
  });

  it('death resets weapons and attribution but preserves the revealed brick', () => {
    const state = new FirstPitState();
    state.hitBrick(); state.launch(0); state.armCoin('a', 0);
    state.resetAttempt();
    expect(state.riserY(500)).toBeNull();
    expect(state.coinPhase('a', 500)).toBe('bait');
    expect(state.hitBrickThisAttempt).toBe(false);
    expect(state.brickRevealed).toBe(true);
  });

  it('third-death assistance removes the brick; fifth cancels even already armed attacks', () => {
    const state = new FirstPitState();
    state.applyEffect(effects.moveFirstLanding);
    expect(state.brickEnabled).toBe(false);
    expect(state.coinsRevealed).toBe(true);
    expect(state.attacksEnabled).toBe(true);
    state.launch(0); state.armCoin('a', 0);
    state.applyEffect(effects.deployGapSpring);
    expect(state.riserY(200)).toBeNull();
    expect(state.coinPhase('a', layout.coinFuseMs)).toBe('safe');
    state.resetAttempt(); state.applyEffect(effects.moveFirstLanding); state.launch(1_000);
    expect(state.riserY(1_100)).toBeNull();
    state.hitBrick();
    expect(state.hitBrickThisAttempt).toBe(false);
  });

  it('highest aid restores safely without relying on earlier effects running first', () => {
    const state = new FirstPitState(true, true);
    state.applyEffect(effects.deployGapBridge);
    expect(state.brickEnabled).toBe(false);
    expect(state.attacksEnabled).toBe(false);
    expect(state.hitBrickThisAttempt).toBe(false);
  });

  it('keeps running movement outside the coin burst before its fuse ends', () => {
    // Touch begins at pickup half-width + player half-width before the coin center.
    const bodyHalfWidth = 14;
    const entryDistance = layout.coinPickupSize / 2 + bodyHalfWidth;
    const escapeDistance = 240 * layout.coinFuseMs / 1_000 - entryDistance;
    expect(escapeDistance - bodyHalfWidth - layout.coinBurstSize / 2).toBeGreaterThanOrEqual(8);
  });
});
