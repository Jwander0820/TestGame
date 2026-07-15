import {
  PROGRESS_VERSION,
  createLevelProgress,
  type BlockerProgress,
  type LevelProgress,
  type ProgressState,
} from '../state/progress';
import type { DeathEvent, DirectorResult, ReactionDefinition } from './types';

const MAX_PROCESSED_DEATH_EVENTS = 32;

function uniqueAppend(values: readonly string[], value: string): readonly string[] {
  return values.includes(value) ? values : [...values, value];
}

function getBlockerProgress(level: LevelProgress, blockerId: string): BlockerProgress {
  return (
    level.blockers[blockerId] ?? {
      totalDeaths: 0,
      consecutiveDeaths: 0,
      streakMarkerId: level.progressMarkerId,
      triggeredReactionIds: [],
      activeAssistIds: [],
    }
  );
}

function selectReaction(
  definitions: readonly ReactionDefinition[],
  event: DeathEvent,
  blocker: BlockerProgress,
): { readonly reaction: ReactionDefinition | null; readonly candidateReactionIds: readonly string[] } {
  if (event.blockerId === null) {
    return { reaction: null, candidateReactionIds: [] };
  }

  const candidates = definitions
    .filter(
      (definition) =>
        definition.levelId === event.levelId &&
        definition.blockerId === event.blockerId &&
        definition.threshold <= blocker.consecutiveDeaths &&
        !blocker.triggeredReactionIds.includes(definition.id),
    )
    .sort(
      (left, right) =>
        right.priority - left.priority || left.threshold - right.threshold || left.id.localeCompare(right.id),
    );

  return {
    reaction: candidates[0] ?? null,
    candidateReactionIds: candidates.map((candidate) => candidate.id),
  };
}

export function recordDeath(
  state: ProgressState,
  event: DeathEvent,
  definitions: readonly ReactionDefinition[],
): DirectorResult {
  const currentLevel = state.levels[event.levelId] ?? createLevelProgress();
  if (currentLevel.processedDeathEventIds.includes(event.id)) {
    return { state, reaction: null, candidateReactionIds: [], duplicate: true };
  }

  const nextDeathsByCause = {
    ...currentLevel.deathsByCause,
    [event.causeId]: (currentLevel.deathsByCause[event.causeId] ?? 0) + 1,
  };
  let nextBlockers = currentLevel.blockers;
  let updatedBlocker: BlockerProgress | null = null;

  if (event.blockerId !== null) {
    const currentBlocker = getBlockerProgress(currentLevel, event.blockerId);
    const continuesAtSameMarker = currentBlocker.streakMarkerId === event.progressMarkerId;
    updatedBlocker = {
      ...currentBlocker,
      totalDeaths: currentBlocker.totalDeaths + 1,
      consecutiveDeaths: continuesAtSameMarker ? currentBlocker.consecutiveDeaths + 1 : 1,
      streakMarkerId: event.progressMarkerId,
    };
    nextBlockers = {
      ...nextBlockers,
      [event.blockerId]: updatedBlocker,
    };
  }

  const selection =
    updatedBlocker === null
      ? { reaction: null, candidateReactionIds: [] as readonly string[] }
      : selectReaction(definitions, event, updatedBlocker);

  if (event.blockerId !== null && updatedBlocker !== null && selection.reaction !== null) {
    updatedBlocker = {
      ...updatedBlocker,
      triggeredReactionIds: uniqueAppend(updatedBlocker.triggeredReactionIds, selection.reaction.id),
      activeAssistIds:
        selection.reaction.effectId === undefined
          ? updatedBlocker.activeAssistIds
          : uniqueAppend(updatedBlocker.activeAssistIds, selection.reaction.effectId),
    };
    nextBlockers = {
      ...nextBlockers,
      [event.blockerId]: updatedBlocker,
    };
  }

  const processedDeathEventIds = [...currentLevel.processedDeathEventIds, event.id].slice(
    -MAX_PROCESSED_DEATH_EVENTS,
  );
  const nextLevel: LevelProgress = {
    ...currentLevel,
    totalDeaths: currentLevel.totalDeaths + 1,
    attempt: Math.max(currentLevel.attempt, event.attempt + 1),
    deathsByCause: nextDeathsByCause,
    blockers: nextBlockers,
    processedDeathEventIds,
  };
  const nextState: ProgressState = {
    ...state,
    version: PROGRESS_VERSION,
    totalDeaths: state.totalDeaths + 1,
    levels: {
      ...state.levels,
      [event.levelId]: nextLevel,
    },
  };

  return {
    state: nextState,
    reaction: selection.reaction,
    candidateReactionIds: selection.candidateReactionIds,
    duplicate: false,
  };
}

export function advanceProgress(
  state: ProgressState,
  levelId: string,
  markerId: string,
  markerOrder: number,
): ProgressState {
  const level = state.levels[levelId] ?? createLevelProgress();
  if (markerOrder <= level.progressOrder) {
    return state;
  }

  const blockers = Object.fromEntries(
    Object.entries(level.blockers).map(([blockerId, blocker]) => [
      blockerId,
      {
        ...blocker,
        consecutiveDeaths: 0,
        streakMarkerId: markerId,
      },
    ]),
  );

  return {
    ...state,
    levels: {
      ...state.levels,
      [levelId]: {
        ...level,
        progressMarkerId: markerId,
        progressOrder: markerOrder,
        blockers,
      },
    },
  };
}

export function completeLevel(state: ProgressState, levelId: string): ProgressState {
  const level = state.levels[levelId] ?? createLevelProgress();
  if (level.completed) {
    return state;
  }
  return {
    ...state,
    levels: {
      ...state.levels,
      [levelId]: { ...level, completed: true },
    },
  };
}

export function discoverEasterEgg(state: ProgressState, easterEggId: string): ProgressState {
  if (state.discoveredEasterEggIds.includes(easterEggId)) {
    return state;
  }
  return {
    ...state,
    discoveredEasterEggIds: [...state.discoveredEasterEggIds, easterEggId],
  };
}
