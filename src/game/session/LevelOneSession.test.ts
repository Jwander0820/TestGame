import { describe, expect, it } from 'vitest';
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

    expect(session.recordDeath(death).reaction).toBeNull();
    expect(session.recordDeath(death).reaction?.id).toBe('first-gap-comment');
    expect(session.recordDeath(death).reaction?.id).toBe('first-gap-move-landing');
    expect(session.totalDeaths).toBe(3);
    expect(session.activeAssistIds).toEqual(['move-first-landing']);
    expect(session.activeAssistCount).toBe(1);
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
