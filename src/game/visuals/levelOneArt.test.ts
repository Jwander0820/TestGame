import { describe, expect, it } from 'vitest';
import { LEVEL_ONE_ART_ASSET_PATHS } from './levelOneArtManifest';

describe('level one art bundle', () => {
  it('includes the selected third-batch gameplay images', () => {
    expect(Object.keys(LEVEL_ONE_ART_ASSET_PATHS).sort()).toEqual([
      'coin-source', 'forest-backdrop', 'goal-gate-source', 'ground-source', 'hero-source', 'slime-round-source', 'slime-square-source',
    ]);
  });

  it('does not reference rejected P1 trial sheets', () => {
    const manifest = Object.values(LEVEL_ONE_ART_ASSET_PATHS).join('\n');
    expect(manifest).not.toContain('chr_hero_');
    expect(manifest).not.toContain('assist_slime_spring_sheet');
  });
});
