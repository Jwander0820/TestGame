export interface PlatformDefinition {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly kind?: 'stable' | 'collapsing';
}

export const LEVEL_ONE_WORLD = {
  width: 3_000,
  height: 540,
} as const;

export const LEVEL_ONE_PLAYER_PHYSICS = {
  moveSpeed: 240,
  jumpSpeed: 470,
  gravityY: 1_150,
  bodyWidth: 28,
  bodyHeight: 39,
} as const;

export const LEVEL_ONE_SPAWNS = {
  start: { x: 110, y: 350 },
  afterFirstGap: { x: 820, y: 360 },
  afterWarningStrip: { x: 1_340, y: 360 },
  afterInternBridge: { x: 2_330, y: 360 },
} as const;

export const LEVEL_ONE_PLATFORM_LAYOUT: readonly PlatformDefinition[] = [
  { id: 'start', x: 220, y: 430, width: 384 },
  { id: 'first-landing', x: 663, y: 408, width: 192 },
  { id: 'after-first-gap', x: 900, y: 430, width: 216 },
  { id: 'after-warning-strip', x: 1_320, y: 430, width: 288 },
  { id: 'raised-step', x: 1_625, y: 382, width: 153.6 },
  { id: 'bridge-entry', x: 1_815, y: 430, width: 230.4 },
  { id: 'intern-bridge', x: 2_070, y: 430, width: 240, kind: 'collapsing' },
  { id: 'bridge-exit', x: 2_320, y: 430, width: 230.4 },
  { id: 'final-step', x: 2_580, y: 382, width: 192 },
  { id: 'goal-approach', x: 2_770, y: 430, width: 192 },
  { id: 'goal-platform', x: 2_920, y: 430, width: 160 },
] as const;

export const LEVEL_ONE_SECRET_PLATFORM_LAYOUT: readonly PlatformDefinition[] = [
  { id: 'reverse-step', x: 35, y: 350, width: 110 },
  { id: 'reverse-cache', x: 45, y: 270, width: 190 },
] as const;

export const LEVEL_ONE_WARNING_HAZARD = {
  x: 1_105,
  y: 492,
  width: 190,
  height: 54,
} as const;

export const LEVEL_ONE_GOAL = {
  x: 2_920,
  poleY: 322,
  flagX: 2_965,
  flagY: 255,
  triggerY: 360,
  mercyShiftX: -120,
} as const;

export const LEVEL_ONE_BLOCKER_ZONES = {
  firstGap: { minX: 390, maxX: 790 },
  internBridge: { minX: 1_930, maxX: 2_225 },
} as const;

export const LEVEL_ONE_COLLAPSING_BRIDGE = {
  id: 'intern-bridge',
  collapseDelayMs: 1_350,
  reinforcedDelayMs: 2_250,
  safetyNet: { x: 2_070, y: 510, width: 360 },
  certifiedLabel: { x: 2_070, y: 458 },
} as const;

export const LEVEL_ONE_AMBUSH_LAYOUT = {
  landingStamp: {
    triggerX: 600,
    x: 690,
    hiddenY: 402,
    revealedY: 386,
    width: 58,
    height: 20,
    revealDelayMs: 320,
  },
  goalStamp: {
    triggerX: 2_630,
    triggerWidth: 18,
    x: 2_740,
    hiddenY: 125,
    revealedY: 350,
    width: 76,
    height: 84,
    dropDelayMs: 460,
    dangerMinX: 2_695,
    dangerMaxX: 2_785,
    safeJumpY: 310,
  },
} as const;

export const LEVEL_ONE_ASSISTANCE_LAYOUT = {
  firstLandingX: 640,
  gapSpring: { x: 444, y: 434, launchSpeed: 650 },
  gapBridge: { x: 490, y: 430, width: 158.4 },
  warningStripWidth: 96,
  warningBypass: [
    { id: 'warning-bypass-left', x: 1_010, y: 345, width: 100.8 },
    { id: 'warning-bypass-middle', x: 1_115, y: 315, width: 100.8 },
    { id: 'warning-bypass-right', x: 1_220, y: 345, width: 100.8 },
  ] as const satisfies readonly PlatformDefinition[],
  retiredLabel: { x: 1_105, y: 492 },
} as const;
