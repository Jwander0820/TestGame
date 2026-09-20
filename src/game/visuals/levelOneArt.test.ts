import { describe, expect, it } from 'vitest';
import { LEVEL_ONE_ART_ASSET_PATHS } from './levelOneArtManifest';

describe('level one art bundle', () => {
  it('does not load the retired P1 placeholder at runtime', () => {
    expect(Object.values(LEVEL_ONE_ART_ASSET_PATHS)).toEqual([]);
  });

  it('does not publish any rejected hero or slime sheet', () => {
    const manifest = Object.values(LEVEL_ONE_ART_ASSET_PATHS).join('\n');
    expect(manifest).not.toContain('hero_');
    expect(manifest).not.toContain('slime_');
  });
});
