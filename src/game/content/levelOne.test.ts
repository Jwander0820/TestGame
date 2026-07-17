import { describe, expect, it } from 'vitest';
import {
  LEVEL_ONE_EFFECT_IDS,
  LEVEL_ONE_REACTIONS,
  getLevelOneCompletionCopy,
  isLevelOneEffectId,
} from './levelOne';

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
    for (const blockerId of ['first-gap', 'warning-strip', 'intern-bridge']) {
      const thresholds = LEVEL_ONE_REACTIONS.filter((reaction) => reaction.blockerId === blockerId).map(
        (reaction) => reaction.threshold,
      );
      expect(thresholds).toEqual([2, 3, 5, 7]);
    }
  });

  it('changes the ending joke based on whether the world had to intervene', () => {
    expect(getLevelOneCompletionCopy(0, 0)).toEqual({
      status: '零次死亡。工務處準備的援助演出全部報廢。',
      banner: '通過\n（世界有點失落）',
    });
    expect(getLevelOneCompletionCopy(3, 0).status).toContain('沒有偷偷幫忙');
    expect(getLevelOneCompletionCopy(1, 0, true)).toEqual({
      status: '抵達終點。客服強調：搬終點不列入協助申報。',
      banner: '勇者認證通過\n（終點已配合）',
    });
    expect(getLevelOneCompletionCopy(8, 4).status).toContain('心軟 4 次');
  });
});
