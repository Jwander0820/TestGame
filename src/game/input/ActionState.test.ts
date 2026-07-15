import { describe, expect, it } from 'vitest';
import { ActionState } from './ActionState';

describe('ActionState', () => {
  it('keeps an action active while any input source remains pressed', () => {
    const state = new ActionState();

    state.press('left', 'keyboard:ArrowLeft');
    state.press('left', 'pointer:left');
    state.release('left', 'keyboard:ArrowLeft');

    expect(state.isDown('left')).toBe(true);

    state.release('left', 'pointer:left');
    expect(state.isDown('left')).toBe(false);
  });

  it('reports whether any abstract action is active', () => {
    const state = new ActionState();
    expect(state.isAnyDown()).toBe(false);

    state.press('right', 'pointer:right:1');
    expect(state.isAnyDown()).toBe(true);

    state.releaseAll();
    expect(state.isAnyDown()).toBe(false);
  });

  it('emits a single jump edge until jump is fully released', () => {
    const state = new ActionState();

    state.press('jump', 'keyboard:Space');
    expect(state.consumeJumpPressed()).toBe(true);
    expect(state.consumeJumpPressed()).toBe(false);

    state.press('jump', 'pointer:jump');
    expect(state.consumeJumpPressed()).toBe(false);

    state.release('jump', 'keyboard:Space');
    state.release('jump', 'pointer:jump');
    state.press('jump', 'keyboard:Space');
    expect(state.consumeJumpPressed()).toBe(true);
  });

  it('clears every source on window blur', () => {
    const state = new ActionState();
    state.press('left', 'keyboard:ArrowLeft');
    state.press('jump', 'pointer:jump');

    state.releaseAll();

    expect(state.isDown('left')).toBe(false);
    expect(state.isDown('jump')).toBe(false);
    expect(state.consumeJumpPressed()).toBe(false);
  });
});
