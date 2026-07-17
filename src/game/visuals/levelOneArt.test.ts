import { describe, expect, it } from 'vitest';
import { LEVEL_ONE_ART_ASSET_PATHS } from './levelOneArtManifest';

describe('level one art bundle', () => {
  it('includes only the three assets approved for the P1 trial integration', () => {
    expect(Object.values(LEVEL_ONE_ART_ASSET_PATHS)).toEqual([
      'assets/level-one/character/chr_hero_idle_sheet.png',
      'assets/level-one/assists/assist_slime_spring_sheet.png',
      'assets/level-one/environment/tile_forest_ground.png',
      'assets/level-one/environment/tile_forest_ground.atlas.json',
    ]);
  });

  it('does not publish the rejected flattened run sheet', () => {
    expect(Object.values(LEVEL_ONE_ART_ASSET_PATHS).join('\n')).not.toContain('hero_run');
  });
});
