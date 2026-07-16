import { describe, expect, it } from 'vitest';
import { LEVEL_ONE_EFFECT_IDS, LEVEL_ONE_REACTIONS, isLevelOneEffectId } from './levelOne';

describe('level one assistance catalog', () => {
  it('registers every configured world effect in the typed effect catalog', () => {
    const catalog = Object.values(LEVEL_ONE_EFFECT_IDS);
    const configured = LEVEL_ONE_REACTIONS.flatMap((reaction) =>
      'effectId' in reaction ? [reaction.effectId] : [],
    );

    expect(new Set(configured)).toEqual(new Set(catalog));
    expect(configured).toHaveLength(catalog.length);
  });

  it('recognizes persisted effect identifiers without accepting unknown strings', () => {
    for (const effectId of Object.values(LEVEL_ONE_EFFECT_IDS)) {
      expect(isLevelOneEffectId(effectId)).toBe(true);
    }
    expect(isLevelOneEffectId('typo-gap-bridge')).toBe(false);
  });

  it('keeps each blocker on the accepted 2, 3, 5, 7 assistance thresholds', () => {
    for (const blockerId of ['first-gap', 'warning-strip']) {
      const thresholds = LEVEL_ONE_REACTIONS.filter((reaction) => reaction.blockerId === blockerId).map(
        (reaction) => reaction.threshold,
      );
      expect(thresholds).toEqual([2, 3, 5, 7]);
    }
  });
});
