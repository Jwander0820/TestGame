import { describe, expect, it } from 'vitest';
import { SceneLifecycle } from './SceneLifecycle';

describe('SceneLifecycle', () => {
  it('starts in the only state that accepts player updates', () => {
    const lifecycle = new SceneLifecycle();

    expect(lifecycle.phase).toBe('playing');
    expect(lifecycle.isPlaying).toBe(true);
    expect(lifecycle.isDying).toBe(false);
  });

  it('accepts only one death until the matching respawn finishes', () => {
    const lifecycle = new SceneLifecycle();

    expect(lifecycle.beginDeath()).toBe(true);
    expect(lifecycle.beginDeath()).toBe(false);
    expect(lifecycle.complete()).toBe(false);
    expect(lifecycle.isDying).toBe(true);
    expect(lifecycle.respawn()).toBe(true);
    expect(lifecycle.respawn()).toBe(false);
    expect(lifecycle.isPlaying).toBe(true);
  });

  it('makes completion terminal until an explicit scene reset', () => {
    const lifecycle = new SceneLifecycle();

    expect(lifecycle.complete()).toBe(true);
    expect(lifecycle.complete()).toBe(false);
    expect(lifecycle.beginDeath()).toBe(false);
    expect(lifecycle.respawn()).toBe(false);
    expect(lifecycle.phase).toBe('completed');

    lifecycle.reset();
    expect(lifecycle.isPlaying).toBe(true);
  });

  it('can reset an interrupted death when Phaser recreates the scene', () => {
    const lifecycle = new SceneLifecycle();
    lifecycle.beginDeath();

    lifecycle.reset();

    expect(lifecycle.isPlaying).toBe(true);
    expect(lifecycle.beginDeath()).toBe(true);
  });
});
