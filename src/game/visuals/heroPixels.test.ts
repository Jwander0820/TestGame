import { describe, expect, it } from 'vitest';
import { HERO_COLORS, heroFrame } from './heroPixels';
import { PIXEL_PALETTE } from '../content/levelOneVisuals';

describe('hero art contract', () => {
  it('keeps every animation inside the unchanged 32×48 texture and world palette', () => {
    const palette = new Set<number>(Object.values(PIXEL_PALETTE));
    for (const pose of ['idle', 'stride', 'pass', 'jump'] as const) {
      const frame = heroFrame(pose);
      expect(frame).toHaveLength(24);
      for (const row of frame) {
        expect(row).toHaveLength(16);
        for (const pixel of row) {
          if (pixel !== '.') {
            const color = HERO_COLORS[pixel];
            expect(color !== undefined && palette.has(color)).toBe(true);
          }
        }
      }
    }
  });

  it('keeps grounded feet on the same baseline across all walking poses', () => {
    for (const pose of ['idle', 'stride', 'pass'] as const) {
      expect(heroFrame(pose)[23]).toContain('o');
    }
  });
});
