import { LEVEL_ONE_ID, LEVEL_ONE_REACTIONS } from '../../src/game/content/levelOne';
import { createDefaultProgress, type ProgressState } from '../../src/game/state/progress';
import { advanceProgress, recordDeath, restartLevel } from '../../src/game/sympathy/director';
import type { DeathEvent } from '../../src/game/sympathy/types';

function deathEvent(index: number, blockerId: string, progressMarkerId: string): DeathEvent {
  return {
    id: `max-assistance-death-${index}`,
    levelId: LEVEL_ONE_ID,
    causeId: blockerId === 'first-gap' ? 'fell-out-of-world' : 'trusted-warning-strip',
    blockerId,
    x: blockerId === 'first-gap' ? 500 : 1_105,
    y: 500,
    progressMarkerId,
    attempt: index,
    occurredAt: index * 1_000,
  };
}

export function createMaxAssistanceProgress(): ProgressState {
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

  return restartLevel(state, LEVEL_ONE_ID);
}
