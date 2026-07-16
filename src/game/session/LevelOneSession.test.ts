import { afterEach, describe, expect, it, vi } from 'vitest';
import { LEVEL_ONE_ID } from '../content/levelOne';
import { LEVEL_ONE_SPAWNS } from '../content/levelOneLayout';
import { ProgressStore } from '../state/progress';
import { LevelOneSession } from './LevelOneSession';

function createSession(): LevelOneSession {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string): string | null => values.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      values.set(key, value);
    },
  };
  let now = 1_000;
  return new LevelOneSession(new ProgressStore(storage), () => {
    now += 1;
    return now;
  });
}

const applySuccessfully = (): boolean => true;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LevelOneSession', () => {
  it('resolves the restart position from the furthest saved progress marker', () => {
    const session = createSession();

    expect(session.initialSpawn).toBe(LEVEL_ONE_SPAWNS.start);
    session.advanceMarker('after-first-gap', 1);
    expect(session.initialSpawn).toBe(LEVEL_ONE_SPAWNS.afterFirstGap);
    session.advanceMarker('after-warning-strip', 2);
    expect(session.initialSpawn).toBe(LEVEL_ONE_SPAWNS.afterWarningStrip);
  });

  it('persists death reactions and exposes active assistance to the scene', () => {
    const session = createSession();
    const death = {
      causeId: 'fell-out-of-world',
      blockerId: 'first-gap',
      x: 500.4,
      y: 600.6,
    } as const;

    expect(session.recordDeath(death, applySuccessfully).reaction).toBeNull();
    expect(session.recordDeath(death, applySuccessfully).reaction?.id).toBe('first-gap-comment');
    expect(session.recordDeath(death, applySuccessfully).reaction?.id).toBe('first-gap-move-landing');
    expect(session.totalDeaths).toBe(3);
    expect(session.activeAssistIds).toEqual(['move-first-landing']);
    expect(session.activeAssistCount).toBe(1);
  });

  it('saves the death but not a half-applied reaction when a world effect fails', () => {
    const session = createSession();
    const death = {
      causeId: 'fell-out-of-world',
      blockerId: 'first-gap',
      x: 500,
      y: 600,
    } as const;

    session.recordDeath(death, applySuccessfully);
    session.recordDeath(death, applySuccessfully);
    const failed = session.recordDeath(death, () => false);

    expect(failed.reaction).toBeNull();
    expect(failed.state.totalDeaths).toBe(3);
    expect(session.activeAssistIds).toEqual([]);

    const appliedEffectIds: string[] = [];
    const retried = session.recordDeath(death, (effectId) => {
      appliedEffectIds.push(effectId);
      return true;
    });

    expect(retried.reaction?.id).toBe('first-gap-move-landing');
    expect(appliedEffectIds).toEqual(['move-first-landing']);
    expect(session.activeAssistIds).toEqual(['move-first-landing']);
  });

  it('contains an unexpected effect exception and keeps the session retryable', () => {
    const session = createSession();
    const death = {
      causeId: 'fell-out-of-world',
      blockerId: 'first-gap',
      x: 500,
      y: 600,
    } as const;
    session.recordDeath(death, applySuccessfully);
    session.recordDeath(death, applySuccessfully);
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const failed = session.recordDeath(death, () => {
      throw new Error('broken world effect');
    });

    expect(failed.reaction).toBeNull();
    expect(session.totalDeaths).toBe(3);
    expect(session.activeAssistIds).toEqual([]);
    expect(error).toHaveBeenCalledOnce();
  });

  it('persists an easter egg once and reports repeated discovery without mutation', () => {
    const session = createSession();

    expect(session.hasDiscoveredEasterEgg('reverse-zero-coins')).toBe(false);
    expect(session.discoverEasterEgg('reverse-zero-coins')).not.toBeNull();
    expect(session.hasDiscoveredEasterEgg('reverse-zero-coins')).toBe(true);
    expect(session.discoverEasterEgg('reverse-zero-coins')).toBeNull();
  });

  it('owns the goal marker and completion transition', () => {
    const session = createSession();

    const completed = session.complete();

    expect(completed.levels[LEVEL_ONE_ID]?.progressMarkerId).toBe('goal');
    expect(completed.levels[LEVEL_ONE_ID]?.progressOrder).toBe(3);
    expect(completed.levels[LEVEL_ONE_ID]?.completed).toBe(true);
  });
});
