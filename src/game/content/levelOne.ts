import type { ReactionDefinition } from '../sympathy/types';

export const LEVEL_ONE_ID = 'level-one';

export const LEVEL_ONE_EFFECT_IDS = {
  moveFirstLanding: 'move-first-landing',
  deployGapSpring: 'deploy-gap-spring',
  deployGapBridge: 'deploy-gap-bridge',
  shrinkWarningStrip: 'shrink-warning-strip',
  deployStripBypass: 'deploy-strip-bypass',
  retireWarningStrip: 'retire-warning-strip',
  reinforceInternBridge: 'reinforce-intern-bridge',
  deployBridgeSafetyNet: 'deploy-bridge-safety-net',
  certifyBridgePermanent: 'certify-bridge-permanent',
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
    message: '「王城認證」這四個字開始彼此切割了。',
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
  {
    id: 'intern-bridge-comment',
    levelId: LEVEL_ONE_ID,
    blockerId: 'intern-bridge',
    threshold: 2,
    tier: 1,
    priority: 100,
    message: '承辦人強調：橋塌掉不代表驗收沒有通過。',
  },
  {
    id: 'intern-bridge-reinforced',
    levelId: LEVEL_ONE_ID,
    blockerId: 'intern-bridge',
    threshold: 3,
    tier: 2,
    priority: 100,
    message: '補發三張安全證明。木板現在比較不敢塌。',
    effectId: LEVEL_ONE_EFFECT_IDS.reinforceInternBridge,
  },
  {
    id: 'intern-bridge-safety-net',
    levelId: LEVEL_ONE_ID,
    blockerId: 'intern-bridge',
    threshold: 5,
    tier: 3,
    priority: 100,
    message: '守衛：我沒有修橋，我只是在下面接你。',
    effectId: LEVEL_ONE_EFFECT_IDS.deployBridgeSafetyNet,
  },
  {
    id: 'intern-bridge-certified',
    levelId: LEVEL_ONE_ID,
    blockerId: 'intern-bridge',
    threshold: 7,
    tier: 4,
    priority: 100,
    message: '王城公告：即日起，這座橋依法不得倒塌。',
    effectId: LEVEL_ONE_EFFECT_IDS.certifyBridgePermanent,
  },
] as const satisfies readonly ReactionDefinition<LevelOneEffectId>[];

export interface LevelOneRouteBanter {
  readonly id: string;
  readonly triggerX: number;
  readonly message: string;
}

export const LEVEL_ONE_ROUTE_BANTER = [
  {
    id: 'bridge-briefing',
    triggerX: 1_500,
    message: '前方是王國模範橋。牌子比橋新很多。',
  },
  {
    id: 'goal-pressure',
    triggerX: 2_500,
    message: '王城就在前面。客服已經把手放在跳關按鈕上。',
  },
] as const satisfies readonly LevelOneRouteBanter[];

export interface LevelOneCompletionCopy {
  readonly status: string;
  readonly banner: string;
}

export function getLevelOneCompletionCopy(
  totalDeaths: number,
  activeAssistCount: number,
  goalMercyUsed = false,
): LevelOneCompletionCopy {
  if (totalDeaths === 0) {
    return {
      status: '零次死亡。工務處準備的援助演出全部報廢。',
      banner: '通過\n（世界有點失落）',
    };
  }
  if (activeAssistCount === 0) {
    if (goalMercyUsed) {
      return {
        status: '抵達終點。客服強調：搬終點不列入協助申報。',
        banner: '勇者認證通過\n（終點已配合）',
      };
    }
    return {
      status: '抵達終點。世界堅稱剛才沒有偷偷幫忙。',
      banner: '勇者認證通過\n（無可疑協助）',
    };
  }
  return {
    status: `抵達終點。王城正式否認曾經心軟 ${activeAssistCount} 次。`,
    banner: '勇者認證通過\n（紀錄已經銷毀）',
  };
}
