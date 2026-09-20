import { LEVEL_ONE_EFFECT_IDS as effects, type LevelOneEffectId } from './levelOne';

export type SlimeId = 'charger' | 'jumper';
export interface SlimeDefinition {
  readonly id: SlimeId;
  readonly label: string;
  readonly hint: string;
  readonly causeId: string;
  readonly blockerId: 'first-gap' | 'warning-strip';
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly triggerMinX: number;
  readonly triggerMaxX: number;
  readonly tellMs: number;
  readonly actionMs: number;
  readonly travelX: number;
  readonly jumpHeight: number;
  readonly revealEffect: LevelOneEffectId;
  readonly retireEffects: readonly LevelOneEffectId[];
}

export const LEVEL_ONE_SLIMES = [
  { id: 'charger', label: '方塊史萊姆', hint: '靠近會突進', causeId: 'slime-surprise-charge', blockerId: 'first-gap',
    x: 300, y: 404, width: 36, height: 28, triggerMinX: 180, triggerMaxX: 350,
    tellMs: 180, actionMs: 400, travelX: -120, jumpHeight: 0,
    revealEffect: effects.moveFirstLanding, retireEffects: [effects.deployGapSpring, effects.deployGapBridge] },
  { id: 'jumper', label: '圓形史萊姆', hint: '你跳，它也跳', causeId: 'slime-jump-intercept', blockerId: 'warning-strip',
    x: 930, y: 402, width: 32, height: 32, triggerMinX: 840, triggerMaxX: 1_000,
    tellMs: 60, actionMs: 800, travelX: 0, jumpHeight: 108,
    revealEffect: effects.shrinkWarningStrip, retireEffects: [effects.deployStripBypass, effects.retireWarningStrip] },
] as const satisfies readonly SlimeDefinition[];
