import { LEVEL_ONE_ID, LEVEL_ONE_REACTIONS } from '../content/levelOne';
import { LEVEL_ONE_SPAWNS } from '../content/levelOneLayout';
import type { ProgressState, ProgressStore } from '../state/progress';
import { advanceProgress, completeLevel, discoverEasterEgg, recordDeath } from '../sympathy/director';
import type { DirectorResult } from '../sympathy/types';
import { hasFinalMercy } from '../state/FinalMercy';

export interface LevelOneSpawn {
  readonly x: number;
  readonly y: number;
}

export interface LevelOneDeathInput {
  readonly causeId: string;
  readonly blockerId: string | null;
  readonly x: number;
  readonly y: number;
}

type Clock = () => number;
type EffectApplier = (effectId: string) => boolean;

export class LevelOneSession {
  constructor(
    private readonly progressStore: ProgressStore,
    private readonly clock: Clock = Date.now,
  ) {}

  get totalDeaths(): number {
    return this.progressStore.snapshot.totalDeaths;
  }

  get finalMercy(): boolean { return hasFinalMercy(this.progressStore.snapshot); }

  get progressOrder(): number {
    return this.progressStore.snapshot.levels[LEVEL_ONE_ID]?.progressOrder ?? 0;
  }

  get initialSpawn(): LevelOneSpawn {
    if (this.progressOrder >= 3) {
      return LEVEL_ONE_SPAWNS.afterInternBridge;
    }
    if (this.progressOrder >= 2) {
      return LEVEL_ONE_SPAWNS.afterWarningStrip;
    }
    if (this.progressOrder >= 1) {
      return LEVEL_ONE_SPAWNS.afterFirstGap;
    }
    return LEVEL_ONE_SPAWNS.start;
  }

  get activeAssistIds(): readonly string[] {
    const blockers = this.progressStore.snapshot.levels[LEVEL_ONE_ID]?.blockers ?? {};
    return Object.values(blockers).flatMap((blocker) => blocker.activeAssistIds);
  }

  get activeAssistCount(): number {
    return this.activeAssistIds.length;
  }

  causeDeaths(causeId: string): number {
    return this.progressStore.snapshot.levels[LEVEL_ONE_ID]?.deathsByCause[causeId] ?? 0;
  }

  blockerDeaths(blockerId: string): number {
    return this.progressStore.snapshot.levels[LEVEL_ONE_ID]?.blockers[blockerId]?.totalDeaths ?? 0;
  }

  hasDiscoveredEasterEgg(easterEggId: string): boolean {
    return this.progressStore.snapshot.discoveredEasterEggIds.includes(easterEggId);
  }

  discoverEasterEgg(easterEggId: string): ProgressState | null {
    const current = this.progressStore.snapshot;
    const next = discoverEasterEgg(current, easterEggId);
    if (next === current) {
      return null;
    }
    return this.progressStore.replace(next);
  }

  advanceMarker(markerId: string, markerOrder: number): ProgressState | null {
    const current = this.progressStore.snapshot;
    const next = advanceProgress(current, LEVEL_ONE_ID, markerId, markerOrder);
    if (next === current) {
      return null;
    }
    return this.progressStore.replace(next);
  }

  recordDeath(input: LevelOneDeathInput, applyEffect: EffectApplier): DirectorResult {
    const state = this.progressStore.snapshot;
    const level = state.levels[LEVEL_ONE_ID];
    const eventIdTime = this.clock();
    const result = recordDeath(
      state,
      {
        id: `${LEVEL_ONE_ID}:${level?.attempt ?? 1}:${eventIdTime}`,
        levelId: LEVEL_ONE_ID,
        causeId: input.causeId,
        blockerId: input.blockerId,
        x: Math.round(input.x),
        y: Math.round(input.y),
        progressMarkerId: level?.progressMarkerId ?? 'start',
        attempt: level?.attempt ?? 1,
        occurredAt: this.clock(),
      },
      LEVEL_ONE_REACTIONS,
    );

    const effectId = result.reaction?.effectId;
    let effectApplied = effectId === undefined;
    if (effectId !== undefined) {
      try {
        effectApplied = applyEffect(effectId);
      } catch (error) {
        console.error('[sympathy-effect-transaction]', effectId, error);
      }
    }

    if (effectApplied) {
      this.progressStore.replace(result.state);
      return result;
    }

    this.progressStore.replace(result.stateWithoutReaction);
    return {
      ...result,
      state: result.stateWithoutReaction,
      reaction: null,
    };
  }

  complete(): ProgressState {
    let next = advanceProgress(this.progressStore.snapshot, LEVEL_ONE_ID, 'goal', 4);
    next = completeLevel(next, LEVEL_ONE_ID);
    return this.progressStore.replace(next);
  }
}
