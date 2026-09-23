import { LEVEL_ONE_TRAP_CAUSES } from './levelOneTraps';
import { FIRST_PIT_CAUSES, type FirstPitCause } from './firstPitAmbush';
import { REAR_CAUSES, type RearCause } from './rearGauntlet';
import { LEVEL_ONE_SLIMES, type SlimeId } from './levelOneSlimes';

export interface DeathContext {
  readonly causeId: string;
  readonly blockerId: string | null;
  readonly messages: readonly string[];
}

export const SLIME_DEATHS = {
  charger: { causeId: LEVEL_ONE_SLIMES[0].causeId, blockerId: 'first-gap', messages: ['它剛才不動，是因為還沒看到你。'] },
  jumper: { causeId: LEVEL_ONE_SLIMES[1].causeId, blockerId: 'warning-strip', messages: ['你會跳。它也會，而且一直在等這一刻。'] },
} as const satisfies Record<SlimeId, DeathContext>;

export const REAR_DEATHS = {
  [REAR_CAUSES.returnSweep]: { causeId: REAR_CAUSES.returnSweep, blockerId: 'intern-bridge', messages: ['剛才那一發附有回程票。'] },
  [REAR_CAUSES.restHammer]: { causeId: REAR_CAUSES.restHammer, blockerId: 'intern-bridge', messages: ['休息處到了。重槌也到了。'] },
  [REAR_CAUSES.step]: { causeId: REAR_CAUSES.step, blockerId: 'intern-bridge', messages: ['落點已簽收。地板已下班。'] },
  [REAR_CAUSES.sweep]: { causeId: REAR_CAUSES.sweep, blockerId: 'intern-bridge', messages: ['橋還在。迎面來的東西也在。'] },
  [REAR_CAUSES.exit]: { causeId: REAR_CAUSES.exit, blockerId: 'intern-bridge', messages: ['過橋成功。橋尾另計。'] },
  [REAR_CAUSES.ceiling]: { causeId: REAR_CAUSES.ceiling, blockerId: 'intern-bridge', messages: ['這裡連跳起來都有人等你。'] },
  [REAR_CAUSES.finish]: { causeId: REAR_CAUSES.finish, blockerId: 'intern-bridge', messages: ['終點前的最後一步，還不是最後一招。'] },
} as const satisfies Record<RearCause, DeathContext>;

// Existing copy stays intact. Cause IDs and blocker IDs are gameplay data;
// messages may be replaced independently without changing saves or collision.
export const LEVEL_ONE_DEATHS = {
  warning: {
    causeId: 'trusted-warning-strip', blockerId: 'warning-strip',
    messages: ['王城認證是真的。認證內容不是「安全」。', '告示牌正在確認自己是不是也算受害者。',
      '步道表示：變紅只是停止偽裝，不是承認錯誤。'],
  },
  landing: {
    causeId: 'landing-stamp-ambush', blockerId: 'first-gap',
    messages: ['安全落地。然後王徽從地裡跳了出來。', '守衛表示：站穩也可能觸發古老傳統。',
      '你已經知道它在這裡，它還是很想撞。'],
  },
  goal: {
    causeId: 'goal-approval-stamp', blockerId: 'goal-ambush',
    messages: ['終點審核通過了。你沒有。', '兩顆章都下班了。行政流程偶爾也有良心。'],
  },
  firstGap: {
    causeId: 'fell-out-of-world', blockerId: 'first-gap',
    messages: ['那個坑確實比看起來更有企圖。', '坑洞提出異議：是勇者自己走進來的。',
      '考官正在確認「跨過去」是否寫得不夠具體。'],
  },
  bridge: {
    causeId: 'intern-bridge-collapse', blockerId: 'intern-bridge',
    messages: ['橋的保固剛好在你踏上去時到期。', '實習生說那不是塌，是快速收納。',
      '王橋的修繕紀錄正在安靜地改日期。'],
  },
  void: {
    causeId: 'fell-out-of-world', blockerId: null,
    messages: ['地圖下面沒有隱藏道路。剛剛確認過了。', '這一帶的虛空目前不開放觀光。'],
  },
} as const satisfies Record<string, DeathContext>;

export const LEVEL_ONE_TRAP_DEATHS = {
  ceiling: { ...LEVEL_ONE_DEATHS.landing, causeId: LEVEL_ONE_TRAP_CAUSES.ceiling },
  airAmbush: { ...LEVEL_ONE_DEATHS.warning, causeId: LEVEL_ONE_TRAP_CAUSES.airAmbush },
} as const satisfies Record<string, DeathContext>;

export const FIRST_PIT_DEATHS = {
  [FIRST_PIT_CAUSES.brick]: {
    causeId: FIRST_PIT_CAUSES.brick, blockerId: 'first-gap',
    messages: ['剛才那格空氣，現在主張自己是磚。'],
  },
  [FIRST_PIT_CAUSES.riser]: {
    causeId: FIRST_PIT_CAUSES.riser, blockerId: 'first-gap',
    messages: ['你在跨過坑。坑也正在跨過你。'],
  },
  [FIRST_PIT_CAUSES.coin]: {
    causeId: FIRST_PIT_CAUSES.coin, blockerId: 'first-gap',
    messages: ['金幣收到了你。'],
  },
} as const satisfies Record<FirstPitCause, DeathContext>;
