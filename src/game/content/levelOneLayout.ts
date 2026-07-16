export interface PlatformDefinition {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
}

export const LEVEL_ONE_WORLD = {
  width: 2_200,
  height: 540,
} as const;

export const LEVEL_ONE_PLAYER_PHYSICS = {
  moveSpeed: 240,
  jumpSpeed: 470,
  gravityY: 1_150,
} as const;

export const LEVEL_ONE_SPAWNS = {
  start: { x: 110, y: 350 },
  afterFirstGap: { x: 820, y: 360 },
  afterWarningStrip: { x: 1_340, y: 360 },
} as const;

export const LEVEL_ONE_PLATFORM_LAYOUT: readonly PlatformDefinition[] = [
  { id: 'start', x: 220, y: 430, width: 384 },
  { id: 'first-landing', x: 663, y: 408, width: 192 },
  { id: 'after-first-gap', x: 900, y: 430, width: 216 },
  { id: 'after-warning-strip', x: 1_320, y: 430, width: 288 },
  { id: 'raised-step', x: 1_625, y: 382, width: 153.6 },
  { id: 'goal-approach', x: 1_825, y: 430, width: 235.2 },
  { id: 'goal-platform', x: 2_080, y: 430, width: 201.6 },
] as const;

export const LEVEL_ONE_WARNING_HAZARD = {
  x: 1_105,
  y: 492,
  width: 190,
  height: 54,
} as const;
