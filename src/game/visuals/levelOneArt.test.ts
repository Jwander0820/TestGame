import { describe, expect, it } from 'vitest';
import { LEVEL_ONE_ART_ASSET_PATHS } from './levelOneArtManifest';

describe('level one art bundle', () => {
  it('publishes only the limited forest placeholder from the rejected P1 batch', () => {
    expect(Object.values(LEVEL_ONE_ART_ASSET_PATHS)).toEqual([
      'assets/level-one/environment/tile_forest_ground.png',
      'assets/level-one/environment/tile_forest_ground.atlas.json',
    ]);
  });

  it('does not publish any rejected hero or slime sheet', () => {
    const manifest = Object.values(LEVEL_ONE_ART_ASSET_PATHS).join('\n');
    expect(manifest).not.toContain('hero_');
    expect(manifest).not.toContain('slime_');
  });
});
