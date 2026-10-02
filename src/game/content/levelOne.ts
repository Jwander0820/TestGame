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
    message: '關卡｜坑沒有問題。\n工務處｜它今天已經吃兩個人了。',
  },
  {
    id: 'first-gap-move-landing',
    levelId: LEVEL_ONE_ID,
    blockerId: 'first-gap',
    threshold: 3,
    tier: 2,
    priority: 100,
    message: '工務處｜落點搬近，頭頂磚拆掉。\n關卡｜風大，吹的。',
    effectId: LEVEL_ONE_EFFECT_IDS.moveFirstLanding,
  },
  {
    id: 'first-gap-spring',
    levelId: LEVEL_ONE_ID,
    blockerId: 'first-gap',
    threshold: 5,
    tier: 3,
    priority: 100,
    message: '工務處｜彈簧裝好了，金幣和伏擊停工。方塊也去睡。',
    effectId: LEVEL_ONE_EFFECT_IDS.deployGapSpring,
  },
  {
    id: 'first-gap-bridge',
    levelId: LEVEL_ONE_ID,
    blockerId: 'first-gap',
    threshold: 7,
    tier: 4,
    priority: 100,
    message: '工務處｜坑填成橋了，走過去。\n關卡｜我的坑！',
    effectId: LEVEL_ONE_EFFECT_IDS.deployGapBridge,
  },
  {
    id: 'warning-strip-comment',
    levelId: LEVEL_ONE_ID,
    blockerId: 'warning-strip',
    threshold: 2,
    tier: 1,
    priority: 100,
    message: '關卡｜安全認證還有效。\n工務處｜認證員已經辭職了。',
  },
  {
    id: 'warning-strip-shrink',
    levelId: LEVEL_ONE_ID,
    blockerId: 'warning-strip',
    threshold: 3,
    tier: 2,
    priority: 100,
    message: '工務處｜危險帶縮短，假斷路標出來了。那段直接走。',
    effectId: LEVEL_ONE_EFFECT_IDS.shrinkWarningStrip,
  },
  {
    id: 'warning-strip-bypass',
    levelId: LEVEL_ONE_ID,
    blockerId: 'warning-strip',
    threshold: 5,
    tier: 3,
    priority: 100,
    message: '工務處｜繞道蓋好，空中埋伏和圓形停工。別跟考官說。',
    effectId: LEVEL_ONE_EFFECT_IDS.deployStripBypass,
  },
  {
    id: 'warning-strip-retired',
    levelId: LEVEL_ONE_ID,
    blockerId: 'warning-strip',
    threshold: 7,
    tier: 4,
    priority: 100,
    message: '工務處｜危險帶整段停用。\n關卡｜至少把牌子留給我。',
    effectId: LEVEL_ONE_EFFECT_IDS.retireWarningStrip,
  },
  {
    id: 'intern-bridge-comment',
    levelId: LEVEL_ONE_ID,
    blockerId: 'intern-bridge',
    threshold: 2,
    tier: 1,
    priority: 100,
    message: '關卡｜橋的安全證明有三張。\n工務處｜木板只有兩片。',
  },
  {
    id: 'intern-bridge-reinforced',
    levelId: LEVEL_ONE_ID,
    blockerId: 'intern-bridge',
    threshold: 3,
    tier: 2,
    priority: 100,
    message: '工務處｜高台釘住，不准再閃也不准塌。橋已加固，陷阱標好了。',
    effectId: LEVEL_ONE_EFFECT_IDS.reinforceInternBridge,
  },
  {
    id: 'intern-bridge-safety-net',
    levelId: LEVEL_ONE_ID,
    blockerId: 'intern-bridge',
    threshold: 5,
    tier: 3,
    priority: 100,
    message: '工務處｜安全網就位，飛行物、頂刺和兩把重槌全下班。',
    effectId: LEVEL_ONE_EFFECT_IDS.deployBridgeSafetyNet,
  },
  {
    id: 'intern-bridge-certified',
    levelId: LEVEL_ONE_ID,
    blockerId: 'intern-bridge',
    threshold: 7,
    tier: 4,
    priority: 100,
    message: '工務處｜橋不准再塌，橋尾和終點地刺撤掉。這次真的。',
    effectId: LEVEL_ONE_EFFECT_IDS.certifyBridgePermanent,
  },
] as const satisfies readonly ReactionDefinition<LevelOneEffectId>[];

export interface LevelOneCompletionCopy {
  readonly status: string;
  readonly banner: string;
}

export function getLevelOneCompletionCopy(
  totalDeaths: number,
  activeAssistCount: number,
  goalMercyUsed = false,
  redCarpetUsed = false,
): LevelOneCompletionCopy {
  if (redCarpetUsed) return { status: '全程紅毯通關。工務處：恭喜，你成功迫使世界改變了自己。',
    banner: '勇者認證通過\n（全關已改成走廊）' };
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
