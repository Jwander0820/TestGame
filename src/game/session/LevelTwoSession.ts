import { LEVEL_TWO_FINAL_MERCY_DEATHS, LEVEL_TWO_FINAL_MERCY_EFFECTS, LEVEL_TWO_ID, LEVEL_TWO_REACTIONS,
  LEVEL_TWO_SPAWNS } from '../content/levelTwo';
import type { ProgressState, ProgressStore } from '../state/progress';
import { advanceProgress, completeLevel, discoverEasterEgg, recordDeath } from '../sympathy/director';
import type { DirectorResult } from '../sympathy/types';

export interface LevelTwoSpawn { readonly x: number; readonly y: number }
export interface LevelTwoDeathInput {
  readonly causeId: string;
  readonly blockerId: string | null;
  readonly x: number;
  readonly y: number;
}

type Clock = () => number;
type EffectApplier = (effectId: string) => boolean;

export class LevelTwoSession {
  constructor(private readonly progressStore: ProgressStore, private readonly clock: Clock = Date.now) {}

  get totalDeaths(): number { return this.progressStore.snapshot.totalDeaths; }
  get levelDeaths(): number { return this.progressStore.snapshot.levels[LEVEL_TWO_ID]?.totalDeaths ?? 0; }
  get finalMercy(): boolean {
    return this.levelDeaths >= LEVEL_TWO_FINAL_MERCY_DEATHS || LEVEL_TWO_FINAL_MERCY_EFFECTS.every(id => this.activeAssistIds.includes(id));
  }
  get progressOrder(): number { return this.progressStore.snapshot.levels[LEVEL_TWO_ID]?.progressOrder ?? 0; }
  get initialSpawn(): LevelTwoSpawn {
    if (this.progressOrder >= 3) return LEVEL_TWO_SPAWNS.afterPress;
    if (this.progressOrder >= 2) return LEVEL_TWO_SPAWNS.afterSteam;
    if (this.progressOrder >= 1) return LEVEL_TWO_SPAWNS.afterCarrier;
    return LEVEL_TWO_SPAWNS.start;
  }
  get activeAssistIds(): readonly string[] {
    const blockers = this.progressStore.snapshot.levels[LEVEL_TWO_ID]?.blockers ?? {};
    return Object.values(blockers).flatMap(blocker => blocker.activeAssistIds);
  }
  get activeAssistCount(): number { return this.activeAssistIds.length; }
  causeDeaths(causeId: string): number { return this.progressStore.snapshot.levels[LEVEL_TWO_ID]?.deathsByCause[causeId] ?? 0; }
  blockerDeaths(blockerId: string): number { return this.progressStore.snapshot.levels[LEVEL_TWO_ID]?.blockers[blockerId]?.totalDeaths ?? 0; }
  hasDiscoveredEasterEgg(id: string): boolean { return this.progressStore.snapshot.discoveredEasterEggIds.includes(id); }

  discoverEasterEgg(id: string): ProgressState | null {
    const state = this.progressStore.snapshot;
    const next = discoverEasterEgg(state, id);
    return next === state ? null : this.progressStore.replace(next);
  }

  advanceMarker(id: string, order: number): ProgressState | null {
    const state = this.progressStore.snapshot;
    const next = advanceProgress(state, LEVEL_TWO_ID, id, order);
    return next === state ? null : this.progressStore.replace(next);
  }

  recordDeath(input: LevelTwoDeathInput, applyEffect: EffectApplier): DirectorResult {
    const state = this.progressStore.snapshot;
    const level = state.levels[LEVEL_TWO_ID];
    const time = this.clock();
    const attempt = level?.attempt ?? 1;
    const result = recordDeath(state, {
      id: `${LEVEL_TWO_ID}:${attempt}:${time}`, levelId: LEVEL_TWO_ID, causeId: input.causeId, blockerId: input.blockerId,
      x: Math.round(input.x), y: Math.round(input.y), progressMarkerId: level?.progressMarkerId ?? 'start', attempt, occurredAt: time,
    }, LEVEL_TWO_REACTIONS);
    const effectId = result.reaction?.effectId;
    let applied = effectId === undefined;
    if (effectId !== undefined) {
      try { applied = applyEffect(effectId); }
      catch (error) { console.error('[sympathy-effect-transaction]', effectId, error); }
    }
    this.progressStore.replace(applied ? result.state : result.stateWithoutReaction);
    return applied ? result : { ...result, state: result.stateWithoutReaction, reaction: null };
  }

  complete(): ProgressState {
    const state = advanceProgress(this.progressStore.snapshot, LEVEL_TWO_ID, 'goal', 4);
    return this.progressStore.replace(completeLevel(state, LEVEL_TWO_ID));
  }
}
