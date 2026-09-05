import { describe, expect, it } from 'vitest';
import { GAME_RENDERING } from './rendering';

describe('game rendering baseline', () => {
  it('keeps every game layer on the pixel-art rendering contract', () => {
    expect(GAME_RENDERING).toEqual({
      pixelArt: true,
      antialias: false,
      roundPixels: true,
    });
  });
});
