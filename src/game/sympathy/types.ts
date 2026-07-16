import type { ProgressState } from '../state/progress';

export type ReactionTier = 1 | 2 | 3 | 4;

export interface DeathEvent {
  readonly id: string;
  readonly levelId: string;
  readonly causeId: string;
  readonly blockerId: string | null;
  readonly x: number;
  readonly y: number;
  readonly progressMarkerId: string;
  readonly attempt: number;
  readonly occurredAt: number;
}

export interface ReactionDefinition<EffectId extends string = string> {
  readonly id: string;
  readonly levelId: string;
  readonly blockerId: string;
  readonly threshold: number;
  readonly tier: ReactionTier;
  readonly priority: number;
  readonly message: string;
  readonly effectId?: EffectId;
}

export interface DirectorResult {
  readonly state: ProgressState;
  readonly stateWithoutReaction: ProgressState;
  readonly reaction: ReactionDefinition | null;
  readonly candidateReactionIds: readonly string[];
  readonly duplicate: boolean;
}
