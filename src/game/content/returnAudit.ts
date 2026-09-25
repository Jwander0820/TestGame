import type { DeathContext } from './levelOneDeaths';

export const RETURN_AUDIT = {
  minX: 790, maxX: 2_500, offsetX: -96,
  tellMs: 300, fallMs: 220, holdMs: 300,
  startY: 180, endY: 386, width: 64, height: 64, retireDeaths: 5,
} as const;

export const RETURN_DEATHS = {
  audit: { causeId: 'backtrack-audit', blockerId: 'backtrack',
    messages: ['前進不用驗票。回頭需要。', '退件章：原路返回不等於原路安全。'] },
  exit: { causeId: 'backtrack-exit', blockerId: 'backtrack',
    messages: ['你往回跳了。世界把這張申請歸類為退件。', '出口在右邊。左邊是離職窗口。',
      '工務處：我們在修前面，你一直拆自己的退路。', '回程保險拒絕理賠。施工預算倒是增加了。'] },
} as const satisfies Record<string, DeathContext>;

export function isBacktrackFall(x: number, spawnX: number, progressOrder: number): boolean {
  return x < 0 || (progressOrder > 0 && x < spawnX - 60);
}
