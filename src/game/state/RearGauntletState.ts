import { LEVEL_ONE_EFFECT_IDS as effects, type LevelOneEffectId } from '../content/levelOne';
import { REAR_STEP, type RearHazardDefinition, type RearHazardId } from '../content/rearGauntlet';

export class RearGauntletState {
  stepRetired = false;
  private stepLandedAt: number | null = null;
  private readonly armedAt = new Map<RearHazardId, number>();
  private readonly retired = new Set<RearHazardId>();
  private readonly revealed: Set<RearHazardId>;

  constructor(revealed: readonly RearHazardId[] = []) {
    this.revealed = new Set(revealed);
  }

  landOnStep(now: number): void {
    if (!this.stepRetired) this.stepLandedAt ??= now;
  }

  stepCollapsed(now: number): boolean {
    return !this.stepRetired && this.stepLandedAt !== null && now - this.stepLandedAt >= REAR_STEP.collapseMs;
  }

  arm(id: RearHazardId, now: number): void {
    if (!this.retired.has(id) && !this.armedAt.has(id)) this.armedAt.set(id, now);
  }

  reveal(id: RearHazardId): void { this.revealed.add(id); }

  sample(definition: RearHazardDefinition, now: number) {
    const retired = this.retired.has(definition.id);
    const armed = this.armedAt.get(definition.id);
    const age = armed === undefined ? -Infinity : now - armed - definition.delayMs;
    const active = !retired && (definition.triggerX === null || (age >= 0 && age < definition.durationMs));
    // A ceiling stays hidden until it actually catches someone or assistance exposes it.
    const visible = this.revealed.has(definition.id) || (definition.triggerX !== null && active);
    return { active, visible, retired,
      x: definition.x + (active && definition.velocityX !== 0 ? Math.max(0, age) * definition.velocityX / 1_000 : 0) };
  }

  applyEffect(effect: LevelOneEffectId): void {
    if ([effects.reinforceInternBridge, effects.deployBridgeSafetyNet, effects.certifyBridgePermanent].some((id) => id === effect)) {
      this.stepRetired = true;
      this.revealed.add('exit'); this.revealed.add('ceiling'); this.revealed.add('finish');
    }
    if (effect === effects.deployBridgeSafetyNet || effect === effects.certifyBridgePermanent) {
      this.retired.add('sweep'); this.retired.add('ceiling');
    }
    if (effect === effects.certifyBridgePermanent) {
      this.retired.add('exit'); this.retired.add('finish');
    }
  }

  resetAttempt(): void {
    this.stepLandedAt = null;
    this.armedAt.clear();
  }
}
