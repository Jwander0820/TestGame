export const REAR_CAUSES = {
  step: 'crumbled-high-step',
  sweep: 'bridge-countershot',
  exit: 'bridge-exit-spikes',
  ceiling: 'goal-ceiling-bait',
  finish: 'finish-landing-spikes',
  returnSweep: 'bridge-return-shot',
  restHammer: 'rest-platform-hammer',
  restEcho: 'rest-platform-encore',
} as const;
export type RearCause = (typeof REAR_CAUSES)[keyof typeof REAR_CAUSES];
export type RearHazardId = Exclude<keyof typeof REAR_CAUSES, 'step'>;

export interface RearHazardDefinition {
  readonly id: RearHazardId;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly triggerX: number | null;
  readonly delayMs: number;
  readonly durationMs: number;
  readonly velocityX: number;
  readonly velocityY?: number;
  readonly warnDuringDelay?: boolean;
}

export const REAR_STEP = { collapseMs: 180, minFallX: 1_450, maxFallX: 1_800 } as const;

export const REAR_HAZARDS = [
  { id: 'sweep', x: 2_160, y: 394, width: 52, height: 24,
    triggerX: 1_810, delayMs: 0, durationMs: 900, velocityX: -600 },
  { id: 'exit', x: 2_410, y: 408, width: 60, height: 20,
    triggerX: 2_290, delayMs: 200, durationMs: Infinity, velocityX: 0 },
  { id: 'ceiling', x: 2_610, y: 282, width: 56, height: 24,
    triggerX: null, delayMs: 0, durationMs: Infinity, velocityX: 0 },
  { id: 'finish', x: 2_800, y: 408, width: 64, height: 20,
    triggerX: 2_700, delayMs: 120, durationMs: Infinity, velocityX: 0 },
  { id: 'returnSweep', x: 1_620, y: 394, width: 52, height: 24,
    triggerX: 1_810, delayMs: 900, durationMs: 850, velocityX: 800 },
  { id: 'restHammer', x: 2_540, y: 160, width: 56, height: 40,
    triggerX: 2_490, delayMs: 400, durationMs: 600, velocityX: 0, velocityY: 600, warnDuringDelay: true },
  { id: 'restEcho', x: 2_660, y: 160, width: 56, height: 40,
    triggerX: 2_490, delayMs: 1_100, durationMs: 600, velocityX: 0, velocityY: 600, warnDuringDelay: true },
] as const satisfies readonly RearHazardDefinition[];
