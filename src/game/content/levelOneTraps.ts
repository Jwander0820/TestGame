import { LEVEL_ONE_EFFECT_IDS } from './levelOne';

// Gameplay geometry is independent of the art used to draw these traps.
export const LEVEL_ONE_TRAPS = {
  ceiling: { x: 594, y: 296, width: 56, height: 20 },
  falseFloor: { x: 1_092, y: 430, width: 192, height: 24 },
  airAmbush: { x: 1_092, y: 328, width: 232, height: 48 },
  removeCeiling: LEVEL_ONE_EFFECT_IDS.moveFirstLanding,
  removeLandingStamp: LEVEL_ONE_EFFECT_IDS.deployGapSpring,
  revealFloor: LEVEL_ONE_EFFECT_IDS.shrinkWarningStrip,
  removeAirAmbush: LEVEL_ONE_EFFECT_IDS.deployStripBypass,
} as const;

export const LEVEL_ONE_TRAP_CAUSES = {
  ceiling: 'hidden-ceiling-bait',
  airAmbush: 'jumped-at-false-gap',
} as const;
