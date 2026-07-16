import { describe, expect, it } from 'vitest';
import { LEVEL_ONE_ID, LEVEL_ONE_REACTIONS } from '../content/levelOne';
import { createDefaultProgress } from '../state/progress';
import { advanceProgress, completeLevel, discoverEasterEgg, recordDeath, restartLevel } from './director';
import type { DeathEvent, ReactionDefinition } from './types';

function death(index: number, overrides: Partial<DeathEvent> = {}): DeathEvent {
  return {
    id: `death-${index}`,
    levelId: LEVEL_ONE_ID,
    causeId: 'fell',
    blockerId: 'first-gap',
    x: 500,
    y: 560,
    progressMarkerId: 'start',
    attempt: index,
    occurredAt: index * 1_000,
    ...overrides,
  };
}

describe('sympathy director', () => {
  it('triggers the approved 2, 3, 5 and 7 sequence exactly once', () => {
    let state = createDefaultProgress();
    const triggered: Array<string | null> = [];

    for (let index = 1; index <= 8; index += 1) {
      const result = recordDeath(state, death(index), LEVEL_ONE_REACTIONS);
      state = result.state;
      triggered.push(result.reaction?.id ?? null);
    }

    expect(triggered).toEqual([
      null,
      'first-gap-comment',
      'first-gap-move-landing',
      null,
      'first-gap-spring',
      null,
      'first-gap-bridge',
      null,
    ]);
    expect(state.levels[LEVEL_ONE_ID]?.blockers['first-gap']?.activeAssistIds).toEqual([
      'move-first-landing',
      'deploy-gap-spring',
      'deploy-gap-bridge',
    ]);
  });

  it('uses deterministic priority, threshold and id sorting', () => {
    const definitions: readonly ReactionDefinition[] = [
      { ...LEVEL_ONE_REACTIONS[0]!, id: 'z-last', threshold: 1, priority: 10 },
      { ...LEVEL_ONE_REACTIONS[0]!, id: 'b-second', threshold: 1, priority: 20 },
      { ...LEVEL_ONE_REACTIONS[0]!, id: 'a-first', threshold: 1, priority: 20 },
    ];
    const first = recordDeath(createDefaultProgress(), death(1), definitions);
    const second = recordDeath(createDefaultProgress(), death(1), definitions);

    expect(first.reaction?.id).toBe('a-first');
    expect(second.reaction?.id).toBe('a-first');
    expect(first.candidateReactionIds).toEqual(['a-first', 'b-second', 'z-last']);
  });

  it('ignores a duplicate death event', () => {
    const first = recordDeath(createDefaultProgress(), death(1), LEVEL_ONE_REACTIONS);
    const duplicate = recordDeath(first.state, death(1), LEVEL_ONE_REACTIONS);

    expect(duplicate.duplicate).toBe(true);
    expect(duplicate.state).toBe(first.state);
    expect(duplicate.state.totalDeaths).toBe(1);
  });

  it('counts an unknown blocker safely without applying a specific reaction', () => {
    const result = recordDeath(
      createDefaultProgress(),
      death(1, { blockerId: 'not-registered' }),
      LEVEL_ONE_REACTIONS,
    );

    expect(result.reaction).toBeNull();
    expect(result.state.totalDeaths).toBe(1);
    expect(result.state.levels[LEVEL_ONE_ID]?.blockers['not-registered']?.totalDeaths).toBe(1);
  });

  it('resets local streaks only when reaching a newer marker', () => {
    let state = recordDeath(createDefaultProgress(), death(1), LEVEL_ONE_REACTIONS).state;
    state = recordDeath(state, death(2), LEVEL_ONE_REACTIONS).state;
    const unchanged = advanceProgress(state, LEVEL_ONE_ID, 'start-again', 0);
    const advanced = advanceProgress(state, LEVEL_ONE_ID, 'after-first-gap', 1);

    expect(unchanged).toBe(state);
    expect(advanced.totalDeaths).toBe(2);
    expect(advanced.levels[LEVEL_ONE_ID]?.blockers['first-gap']?.consecutiveDeaths).toBe(0);
    expect(advanced.levels[LEVEL_ONE_ID]?.blockers['first-gap']?.triggeredReactionIds).toEqual([
      'first-gap-comment',
    ]);
  });

  it('records each easter egg only once', () => {
    const first = discoverEasterEgg(createDefaultProgress(), 'idle-apology');
    const second = discoverEasterEgg(first, 'idle-apology');

    expect(first.discoveredEasterEggIds).toEqual(['idle-apology']);
    expect(second).toBe(first);
  });

  it('restarts a completed level from the beginning while preserving cumulative reactions', () => {
    let state = createDefaultProgress();
    state = recordDeath(state, death(1), LEVEL_ONE_REACTIONS).state;
    state = recordDeath(state, death(2), LEVEL_ONE_REACTIONS).state;
    state = recordDeath(state, death(3), LEVEL_ONE_REACTIONS).state;
    state = advanceProgress(state, LEVEL_ONE_ID, 'after-warning-strip', 2);
    state = completeLevel(state, LEVEL_ONE_ID);

    const restarted = restartLevel(state, LEVEL_ONE_ID);
    const level = restarted.levels[LEVEL_ONE_ID];
    const blocker = level?.blockers['first-gap'];

    expect(restarted.totalDeaths).toBe(3);
    expect(level?.progressMarkerId).toBe('start');
    expect(level?.progressOrder).toBe(0);
    expect(level?.completed).toBe(false);
    expect(level?.deathsByCause).toEqual({ fell: 3 });
    expect(blocker?.consecutiveDeaths).toBe(0);
    expect(blocker?.streakMarkerId).toBe('start');
    expect(blocker?.triggeredReactionIds).toEqual(['first-gap-comment', 'first-gap-move-landing']);
    expect(blocker?.activeAssistIds).toEqual(['move-first-landing']);
  });
});
