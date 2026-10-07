import type { ReactionDefinition } from '../sympathy/types';

export const LEVEL_TWO_ID = 'level-two';

export interface LevelTwoPlatform {
  readonly id: string;
  readonly x: number;
  /** 平台頂面；碰撞與呈現共用，避免把中心當成落腳高度。 */
  readonly y: number;
  readonly width: number;
}

export const LEVEL_TWO_WORLD = { width: 3_000, height: 540 } as const;

export const LEVEL_TWO_PLATFORMS = [
  { id: 'entrance', x: 210, y: 430, width: 420 },
  { id: 'carrier-shore', x: 830, y: 382, width: 240 },
  { id: 'steam-floor', x: 1_170, y: 430, width: 440 },
  { id: 'conveyor-floor', x: 1_700, y: 430, width: 620 },
  { id: 'sorter-landing', x: 2_160, y: 430, width: 300 },
  { id: 'clock-step', x: 2_420, y: 382, width: 150 },
  { id: 'clock-upper-step', x: 2_560, y: 350, width: 180 },
  { id: 'bell-platform', x: 2_780, y: 350, width: 260 },
] as const satisfies readonly LevelTwoPlatform[];

export const LEVEL_TWO_SPAWNS = {
  start: { x: 110, y: 390 },
  afterCarrier: { x: 830, y: 355 },
  afterSteam: { x: 1_420, y: 400 },
  afterPress: { x: 2_160, y: 400 },
} as const;

export const LEVEL_TWO_CHECKPOINTS = [
  { id: 'after-carrier', order: 1, x: 830, message: '已到運送線對岸。載台說剛才只是順路。' },
  { id: 'after-steam', order: 2, x: 1_420, message: '已通過蒸汽閘。鍋爐房正在刪除事故報表。' },
  { id: 'after-press', order: 3, x: 2_160, message: '已離開分揀區。你沒有被分到「易碎品」。' },
] as const;

export const LEVEL_TWO_CLOCKWORK = {
  carrier: { startX: 484, startY: 430, endX: 670, endY: 382, width: 144, waitMs: 700, travelMs: 1_500 },
  steam: { x: 1_060, topY: 346, width: 44, height: 84, tellMs: 800, assistedTellMs: 1_400, activeMs: 1_100 },
  press: { x: 1_860, hiddenY: 150, loweredY: 362, width: 64, height: 68,
    tellMs: 900, assistedTellMs: 1_500, fallMs: 250, holdMs: 200, retractMs: 600 },
  conveyor: { left: 1_540, right: 1_960, topY: 430, speed: -95 },
  goal: { x: 2_780, platformTopY: 350 },
  assistance: {
    carrierRail: { id: 'carrier-help-rail', x: 510, y: 430, width: 180 },
    carrierBridge: { id: 'carrier-service-walkway', x: 685, y: 430, width: 530 },
    finalWalkway: { id: 'clockwork-final-walkway', x: 1_500, y: 430, width: 3_000 },
  },
} as const;

export const LEVEL_TWO_DEATHS = {
  carrier: { causeId: 'carrier-fall', blockerId: 'clockwork-carrier' },
  steam: { causeId: 'steam-burst', blockerId: 'clockwork-steam' },
  press: { causeId: 'sorting-press', blockerId: 'clockwork-sorter' },
  void: { causeId: 'clockwork-void', blockerId: null },
} as const;

export const LEVEL_TWO_EFFECT_IDS = {
  carrierRail: 'clockwork-carrier-hand-rail',
  carrierBridge: 'clockwork-carrier-service-walkway',
  retireCarrier: 'clockwork-carrier-certified-floor',
  steamWarning: 'clockwork-steam-pressure-warning',
  closeSteamValve: 'clockwork-steam-close-valve',
  retireSteam: 'clockwork-steam-retired',
  sorterWarning: 'clockwork-sorter-floor-warning',
  stopConveyor: 'clockwork-sorter-stop-belt',
  retireSorter: 'clockwork-sorter-retired',
} as const;

export type LevelTwoEffectId = (typeof LEVEL_TWO_EFFECT_IDS)[keyof typeof LEVEL_TWO_EFFECT_IDS];
const effectIds: ReadonlySet<string> = new Set(Object.values(LEVEL_TWO_EFFECT_IDS));

export function isLevelTwoEffectId(value: string): value is LevelTwoEffectId {
  return effectIds.has(value);
}

const effects = LEVEL_TWO_EFFECT_IDS;

export const LEVEL_TWO_REACTIONS = [
  { id: 'clockwork-carrier-comment', levelId: LEVEL_TWO_ID, blockerId: 'clockwork-carrier', threshold: 2,
    tier: 1, priority: 100, message: '卸貨閘｜到站請下貨。\n工務處｜先把閘刀收回去，再請人下車。' },
  { id: 'clockwork-carrier-rail', levelId: LEVEL_TWO_ID, blockerId: 'clockwork-carrier', threshold: 3,
    tier: 2, priority: 100, message: '工務處｜踏板加好了，卸貨閘延後。到站先等它完整收回。\n卸貨閘｜我的歡迎儀式被取消了。', effectId: effects.carrierRail },
  { id: 'clockwork-carrier-bridge', levelId: LEVEL_TWO_ID, blockerId: 'clockwork-carrier', threshold: 5,
    tier: 3, priority: 100, message: '工務處｜步道接好，卸貨閘拔電。直接走過對岸。\n載台｜下貨現在真的可以下了。', effectId: effects.carrierBridge },
  { id: 'clockwork-carrier-certified', levelId: LEVEL_TWO_ID, blockerId: 'clockwork-carrier', threshold: 7,
    tier: 4, priority: 100, message: '工務處｜載台和閘刀一起退休。運送區改成永久步道。\n卸貨閘｜我只剩門框了。', effectId: effects.retireCarrier },
  { id: 'clockwork-steam-comment', levelId: LEVEL_TWO_ID, blockerId: 'clockwork-steam', threshold: 2,
    tier: 1, priority: 100, message: '鍋爐｜洩壓完成，請往前。\n工務處｜旁管還在噴，這是哪一版完成？' },
  { id: 'clockwork-steam-warning', levelId: LEVEL_TWO_ID, blockerId: 'clockwork-steam', threshold: 3,
    tier: 2, priority: 100, message: '工務處｜旁管標出了，預告延長。引出後先退回去，兩次都噴完再走。\n鍋爐｜連備用驚喜也被登記了。', effectId: effects.steamWarning },
  { id: 'clockwork-steam-valve', levelId: LEVEL_TWO_ID, blockerId: 'clockwork-steam', threshold: 5,
    tier: 3, priority: 100, message: '工務處｜主閥和旁管全關。那塊「洩壓完成」現在才算真的。\n鍋爐｜我現在是一個很貴的路燈。', effectId: effects.closeSteamValve },
  { id: 'clockwork-steam-retired', levelId: LEVEL_TWO_ID, blockerId: 'clockwork-steam', threshold: 7,
    tier: 4, priority: 100, message: '工務處｜主閘、旁管和所有備用閥永久停工。\n鍋爐｜我連偷噴的藉口都沒有了。', effectId: effects.retireSteam },
  { id: 'clockwork-sorter-comment', levelId: LEVEL_TWO_ID, blockerId: 'clockwork-sorter', threshold: 2,
    tier: 1, priority: 100, message: '分揀機｜驗收完成，快速出貨。\n工務處｜先過夾口再被鐘壓，哪裡完成了？' },
  { id: 'clockwork-sorter-warning', levelId: LEVEL_TWO_ID, blockerId: 'clockwork-sorter', threshold: 3,
    tier: 2, priority: 100, message: '工務處｜出口夾口和鐘配重都標好了，警鈴延長。先退回，等完整收回再走。\n分揀機｜不要讀我的流程圖。', effectId: effects.sorterWarning },
  { id: 'clockwork-sorter-belt', levelId: LEVEL_TWO_ID, blockerId: 'clockwork-sorter', threshold: 5,
    tier: 3, priority: 100, message: '工務處｜輸送帶拔電，不會突然送你出貨。夾口和鐘配重仍要等它們收完。\n分揀機｜我還能自己動。', effectId: effects.stopConveyor },
  { id: 'clockwork-sorter-retired', levelId: LEVEL_TWO_ID, blockerId: 'clockwork-sorter', threshold: 7,
    tier: 4, priority: 100, message: '工務處｜壓機、出口夾口和鐘配重全員退休。今天勇者直接放行。\n分揀機｜鐘塔也別想加班。', effectId: effects.retireSorter },
] as const satisfies readonly ReactionDefinition<LevelTwoEffectId>[];

export const LEVEL_TWO_FINAL_MERCY_DEATHS = 21;
export const LEVEL_TWO_FINAL_MERCY_EFFECTS = [effects.retireCarrier, effects.retireSteam, effects.retireSorter] as const;
export const LEVEL_TWO_FINAL_MERCY_MESSAGE = '工務處接管：運送線改成平地，所有機器退休。一直向右走就能敲鐘。';

export function getLevelTwoCompletionCopy(levelDeaths: number, activeAssistCount: number, finalMercy: boolean):
  { readonly status: string; readonly banner: string } {
  if (finalMercy) return { status: '鐘塔通行鐘已響。全工坊退休，只剩勇者還在上班。', banner: '鐘塔通行認證\n（工務處代辦）' };
  if (levelDeaths === 0) return { status: '第二關零次死亡。機器們一致認為是自己放水。', banner: '鐘塔通行認證\n（機器拒絕承認）' };
  if (activeAssistCount === 0) return { status: '鐘塔通行鐘已響。這次勇者自己讀懂了操作說明。', banner: '鐘塔通行認證\n（正常運送）' };
  return { status: `鐘塔通行鐘已響。工務處否認曾修改 ${activeAssistCount} 項設備。`, banner: '鐘塔通行認證\n（維修紀錄遺失）' };
}
