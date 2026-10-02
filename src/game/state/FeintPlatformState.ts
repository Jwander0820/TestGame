import { FEINT_PLATFORM as floor, type FeintApproach, type FeintSample } from '../content/feintPlatform';
import { LEVEL_ONE_EFFECT_IDS as effects, type LevelOneEffectId } from '../content/levelOne';

export class FeintPlatformState {
  private startedAt: number | null = null;
  private retired = false;

  approach(player: FeintApproach, now: number): void {
    const left = floor.x - floor.width / 2;
    if (this.retired || this.startedAt !== null || player.grounded || player.velocityX <= 0 ||
      player.x < left - floor.approachDistance || player.x >= left ||
      player.feet >= floor.top || player.feet < floor.top - floor.approachHeight) return;
    this.startedAt = now;
  }

  sample(now: number): FeintSample {
    if (this.retired) return { phase: 'retired', x: floor.x };
    if (this.startedAt === null) return { phase: 'idle', x: floor.x };
    const age = Math.max(0, now - this.startedAt);
    if (age < floor.dodgeMs) {
      const t = age / floor.dodgeMs;
      return { phase: 'dodging', x: floor.x + floor.distance * (1 - (1 - t) ** 3) };
    }
    if (age < floor.dodgeMs + floor.holdMs) return { phase: 'holding', x: floor.x + floor.distance };
    const t = (age - floor.dodgeMs - floor.holdMs) / floor.returnMs;
    if (t < 1) return { phase: 'returning', x: floor.x + floor.distance * (1 - t) ** 2 };
    return { phase: 'spent', x: floor.x };
  }

  get triggeredThisAttempt(): boolean { return !this.retired && this.startedAt !== null; }

  applyEffect(effect: LevelOneEffectId): void {
    if (effect === effects.reinforceInternBridge || effect === effects.deployBridgeSafetyNet ||
      effect === effects.certifyBridgePermanent) this.retire();
  }

  retire(): void { this.retired = true; this.startedAt = null; }
  resetAttempt(): void { this.startedAt = null; }
}
