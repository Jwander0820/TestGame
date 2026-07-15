import { describe, expect, it } from 'vitest';
import {
  PROGRESS_STORAGE_KEY,
  PROGRESS_VERSION,
  ProgressStore,
  createDefaultProgress,
  parseProgress,
} from './progress';

class MemoryStorage implements Pick<Storage, 'getItem' | 'setItem'> {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('progress state', () => {
  it('falls back safely for missing, malformed or incompatible data', () => {
    expect(parseProgress(null)).toEqual(createDefaultProgress());
    expect(parseProgress('{broken')).toEqual(createDefaultProgress());
    expect(parseProgress('{"version":9,"totalDeaths":9}')).toEqual(createDefaultProgress());
    expect(parseProgress('{"version":1,"totalDeaths":-1}')).toEqual(createDefaultProgress());
  });

  it('migrates version one while preserving the death total', () => {
    expect(parseProgress('{"version":1,"totalDeaths":9}')).toEqual({
      ...createDefaultProgress(),
      totalDeaths: 9,
    });
  });

  it('replaces and persists version two state', () => {
    const storage = new MemoryStorage();
    const store = new ProgressStore(storage);
    const next = { ...createDefaultProgress(), totalDeaths: 2 };

    expect(store.replace(next)).toBe(next);
    expect(JSON.parse(storage.getItem(PROGRESS_STORAGE_KEY) ?? '{}')).toEqual(next);
    expect(new ProgressStore(storage).snapshot).toEqual(next);
  });

  it('rejects a partially valid version two payload', () => {
    const raw = JSON.stringify({
      version: PROGRESS_VERSION,
      totalDeaths: 3,
      levels: { broken: { totalDeaths: 1 } },
      discoveredEasterEggIds: [],
      globalTriggeredReactionIds: [],
    });
    expect(parseProgress(raw)).toEqual(createDefaultProgress());
  });

  it('keeps running when storage access fails', () => {
    const storage: Pick<Storage, 'getItem' | 'setItem'> = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    const store = new ProgressStore(storage);
    const next = { ...createDefaultProgress(), totalDeaths: 1 };

    expect(store.snapshot).toEqual(createDefaultProgress());
    expect(store.replace(next)).toBe(next);
  });
});
