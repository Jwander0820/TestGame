import { LEVEL_ONE_ID, LEVEL_ONE_REACTIONS } from '../../src/game/content/levelOne';
import { createDefaultProgress, type ProgressState } from '../../src/game/state/progress';
import { advanceProgress, recordDeath, restartLevel } from '../../src/game/sympathy/director';
import type { DeathEvent } from '../../src/game/sympathy/types';

function deathEvent(index: number, blockerId: string, progressMarkerId: string): DeathEvent {
  const causeByBlocker: Readonly<Record<string, string>> = {
    'first-gap': 'fell-out-of-world',
    'warning-strip': 'trusted-warning-strip',
    'intern-bridge': 'intern-bridge-collapse',
  };
  const xByBlocker: Readonly<Record<string, number>> = {
    'first-gap': 500,
    'warning-strip': 1_105,
    'intern-bridge': 2_070,
  };
  return {
    id: `max-assistance-death-${index}`,
    levelId: LEVEL_ONE_ID,
    causeId: causeByBlocker[blockerId] ?? 'unknown',
    blockerId,
    x: xByBlocker[blockerId] ?? 0,
    y: 500,
    progressMarkerId,
    attempt: index,
    occurredAt: index * 1_000,
  };
}

export function createMaxAssistanceCheckpointProgress(): ProgressState {
  let state = createDefaultProgress();
  for (let index = 1; index <= 7; index += 1) {
    state = recordDeath(state, deathEvent(index, 'first-gap', 'start'), LEVEL_ONE_REACTIONS).state;
  }

  state = advanceProgress(state, LEVEL_ONE_ID, 'after-first-gap', 1);
  for (let index = 8; index <= 14; index += 1) {
    state = recordDeath(
      state,
      deathEvent(index, 'warning-strip', 'after-first-gap'),
      LEVEL_ONE_REACTIONS,
    ).state;
  }

  return state;
}

export function createMaxAssistanceProgress(): ProgressState {
  let state = advanceProgress(
    createMaxAssistanceCheckpointProgress(),
    LEVEL_ONE_ID,
    'after-warning-strip',
    2,
  );
  for (let index = 15; index <= 21; index += 1) {
    state = recordDeath(
      state,
      deathEvent(index, 'intern-bridge', 'after-warning-strip'),
      LEVEL_ONE_REACTIONS,
    ).state;
  }
  return restartLevel(state, LEVEL_ONE_ID);
}
