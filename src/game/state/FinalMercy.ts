import { LEVEL_ONE_EFFECT_IDS as effects, LEVEL_ONE_ID } from '../content/levelOne';
import type { ProgressState } from './progress';

export const FINAL_MERCY_DEATHS = 21;
export const FINAL_MERCY_MESSAGE = '工務處接管：坑已填平，陷阱全員下班。只要一直向右走。';
export const FINAL_MERCY_EFFECTS = [effects.deployGapBridge, effects.retireWarningStrip, effects.certifyBridgePermanent] as const;

export function hasFinalMercy(state: ProgressState): boolean {
  const level = state.levels[LEVEL_ONE_ID];
  if (!level) return false;
  const active = Object.values(level.blockers).flatMap(blocker => blocker.activeAssistIds);
  return level.totalDeaths >= FINAL_MERCY_DEATHS || FINAL_MERCY_EFFECTS.every(effect => active.includes(effect));
}
