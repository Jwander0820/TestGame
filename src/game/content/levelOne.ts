import type { ReactionDefinition } from '../sympathy/types';

export const LEVEL_ONE_ID = 'level-one';

export const LEVEL_ONE_EFFECT_IDS = {
  moveFirstLanding: 'move-first-landing',
  deployGapSpring: 'deploy-gap-spring',
  deployGapBridge: 'deploy-gap-bridge',
  shrinkWarningStrip: 'shrink-warning-strip',
  deployStripBypass: 'deploy-strip-bypass',
  retireWarningStrip: 'retire-warning-strip',
} as const;

export type LevelOneEffectId = (typeof LEVEL_ONE_EFFECT_IDS)[keyof typeof LEVEL_ONE_EFFECT_IDS];

const LEVEL_ONE_EFFECT_ID_SET: ReadonlySet<string> = new Set(Object.values(LEVEL_ONE_EFFECT_IDS));

export function isLevelOneEffectId(value: string): value is LevelOneEffectId {
  return LEVEL_ONE_EFFECT_ID_SET.has(value);
}

export const LEVEL_ONE_REACTIONS = [
  {
    id: 'first-gap-comment',
    levelId: LEVEL_ONE_ID,
    blockerId: 'first-gap',
    threshold: 2,
    tier: 1,
    priority: 100,
    message: '這個坑今天有點積極。',
  },
  {
    id: 'first-gap-move-landing',
    levelId: LEVEL_ONE_ID,
    blockerId: 'first-gap',
    threshold: 3,
    tier: 2,
    priority: 100,
    message: '風太大了，平台只是自己滑過來。',
    effectId: LEVEL_ONE_EFFECT_IDS.moveFirstLanding,
  },
  {
    id: 'first-gap-spring',
    levelId: LEVEL_ONE_ID,
    blockerId: 'first-gap',
    threshold: 5,
    tier: 3,
    priority: 100,
    message: '工安臨檢：臨時加裝彈簧。',
    effectId: LEVEL_ONE_EFFECT_IDS.deployGapSpring,
  },
  {
    id: 'first-gap-bridge',
    levelId: LEVEL_ONE_ID,
    blockerId: 'first-gap',
    threshold: 7,
    tier: 4,
    priority: 100,
    message: '算了。這裡現在是一座橋。',
    effectId: LEVEL_ONE_EFFECT_IDS.deployGapBridge,
  },
  {
    id: 'warning-strip-comment',
    levelId: LEVEL_ONE_ID,
    blockerId: 'warning-strip',
    threshold: 2,
    tier: 1,
    priority: 100,
    message: '「完全安全」這四個字開始心虛了。',
  },
  {
    id: 'warning-strip-shrink',
    levelId: LEVEL_ONE_ID,
    blockerId: 'warning-strip',
    threshold: 3,
    tier: 2,
    priority: 100,
    message: '正常耗損而已，危險區本來就這麼短。',
    effectId: LEVEL_ONE_EFFECT_IDS.shrinkWarningStrip,
  },
  {
    id: 'warning-strip-bypass',
    levelId: LEVEL_ONE_ID,
    blockerId: 'warning-strip',
    threshold: 5,
    tier: 3,
    priority: 100,
    message: '臨時繞道已核准，請假裝沒看到施工。',
    effectId: LEVEL_ONE_EFFECT_IDS.deployStripBypass,
  },
  {
    id: 'warning-strip-retired',
    levelId: LEVEL_ONE_ID,
    blockerId: 'warning-strip',
    threshold: 7,
    tier: 4,
    priority: 100,
    message: '危險帶今日提早下班。',
    effectId: LEVEL_ONE_EFFECT_IDS.retireWarningStrip,
  },
] as const satisfies readonly ReactionDefinition<LevelOneEffectId>[];
