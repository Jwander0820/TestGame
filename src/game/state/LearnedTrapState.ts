import { LEVEL_ONE_EFFECT_IDS, type LevelOneEffectId } from '../content/levelOne';
import { LEVEL_ONE_TRAPS } from '../content/levelOneTraps';

/** Only rules and attempt state. No art, physics objects, or persistence writes. */
export class LearnedTrapState {
  ceilingEnabled = true;
  ceilingRevealed: boolean;
  airAmbushEnabled = true;
  airAmbushRevealed: boolean;
  floorRevealed = false;
  landingStampEnabled = true;
  hitCeilingThisAttempt = false;

  constructor(ceilingRevealed = false, airAmbushRevealed = false) {
    this.ceilingRevealed = ceilingRevealed;
    this.airAmbushRevealed = airAmbushRevealed;
  }

  hitCeiling(): void {
    if (!this.ceilingEnabled) return;
    this.ceilingRevealed = true;
    this.hitCeilingThisAttempt = true;
  }

  hitAirAmbush(): boolean {
    if (!this.airAmbushEnabled) return false;
    this.airAmbushRevealed = true;
    return true;
  }

  resetAttempt(): void {
    this.hitCeilingThisAttempt = false;
  }

  applyEffect(effect: LevelOneEffectId): void {
    if ([LEVEL_ONE_TRAPS.removeCeiling, LEVEL_ONE_TRAPS.removeLandingStamp,
      LEVEL_ONE_EFFECT_IDS.deployGapBridge].some((id) => id === effect)) {
      this.ceilingEnabled = false;
    }
    if (effect === LEVEL_ONE_TRAPS.removeLandingStamp || effect === LEVEL_ONE_EFFECT_IDS.deployGapBridge) {
      this.landingStampEnabled = false;
    }
    if ([LEVEL_ONE_TRAPS.revealFloor, LEVEL_ONE_TRAPS.removeAirAmbush,
      LEVEL_ONE_EFFECT_IDS.retireWarningStrip].some((id) => id === effect)) {
      this.floorRevealed = true;
    }
    if (effect === LEVEL_ONE_TRAPS.removeAirAmbush || effect === LEVEL_ONE_EFFECT_IDS.retireWarningStrip) {
      this.airAmbushEnabled = false;
    }
  }
}
