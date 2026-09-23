import type { LevelOneEffectId } from '../content/levelOne';
import { LEVEL_ONE_SLIMES, type SlimeDefinition, type SlimeId } from '../content/levelOneSlimes';

export type SlimePhase = 'idle' | 'tell' | 'attack' | 'fake-rest' | 'wake' | 'revenge' | 'spent' | 'retired';
export interface SlimeSample {
  readonly phase: SlimePhase;
  readonly x: number;
  readonly y: number;
  readonly dangerous: boolean;
  readonly revealed: boolean;
}

export class SlimeState {
  private readonly armedAt = new Map<SlimeId, number>();
  private readonly retired = new Set<SlimeId>();
  private readonly revealed: Set<SlimeId>;

  constructor(revealed: readonly SlimeId[] = []) { this.revealed = new Set(revealed); }

  observePlayer(player: { x: number; y: number; velocityY: number }, now: number): void {
    for (const definition of LEVEL_ONE_SLIMES) {
      if (this.retired.has(definition.id) || this.armedAt.has(definition.id)) continue;
      if (player.x < definition.triggerMinX || player.x > definition.triggerMaxX || player.y < 270 || player.y > 440) continue;
      if (definition.id === 'jumper' && player.velocityY >= 0) continue;
      this.armedAt.set(definition.id, now);
    }
  }

  sample(definition: SlimeDefinition, now: number): SlimeSample {
    const armed = this.armedAt.get(definition.id);
    const age = armed === undefined ? 0 : Math.max(0, now - armed);
    const restAt = definition.tellMs + definition.actionMs;
    const wakeAt = restAt + definition.fakeRestMs;
    const revengeAt = wakeAt + definition.wakeMs;
    const phase: SlimePhase = this.retired.has(definition.id) ? 'retired' : armed === undefined ? 'idle' :
      age < definition.tellMs ? 'tell' : age < restAt ? 'attack' : age < wakeAt ? 'fake-rest' :
      age < revengeAt ? 'wake' : age < revengeAt + definition.revengeMs ? 'revenge' : 'spent';
    const progress = phase === 'retired' ? 0 : Math.min(1, Math.max(0, (age - definition.tellMs) / definition.actionMs));
    const revenge = phase === 'retired' ? 0 : Math.min(1, Math.max(0, (age - revengeAt) / definition.revengeMs));
    return { phase, dangerous: phase === 'idle' || phase === 'tell' || phase === 'attack' || phase === 'revenge',
      revealed: this.revealed.has(definition.id),
      x: definition.x + definition.travelX * progress + definition.revengeTravelX * revenge,
      y: definition.y - 4 * definition.jumpHeight * progress * (1 - progress) -
        4 * definition.revengeJumpHeight * revenge * (1 - revenge) };
  }

  reveal(id: SlimeId): void { this.revealed.add(id); }
  resetAttempt(): void { this.armedAt.clear(); }

  applyEffect(effect: LevelOneEffectId): void {
    for (const definition of LEVEL_ONE_SLIMES) {
      if (effect === definition.revealEffect || definition.retireEffects.some((id) => id === effect)) this.reveal(definition.id);
      if (definition.retireEffects.some((id) => id === effect)) this.retired.add(definition.id);
    }
  }
}
