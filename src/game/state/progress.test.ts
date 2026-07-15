import { describe, expect, it } from 'vitest';
import { DEFAULT_PROGRESS, PROGRESS_STORAGE_KEY, ProgressStore, parseProgress } from './progress';

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
    expect(parseProgress(null)).toEqual(DEFAULT_PROGRESS);
    expect(parseProgress('{broken')).toEqual(DEFAULT_PROGRESS);
    expect(parseProgress('{"version":2,"totalDeaths":9}')).toEqual(DEFAULT_PROGRESS);
    expect(parseProgress('{"version":1,"totalDeaths":-1}')).toEqual(DEFAULT_PROGRESS);
  });

  it('records and persists one death at a time', () => {
    const storage = new MemoryStorage();
    const store = new ProgressStore(storage);

    expect(store.recordDeath().totalDeaths).toBe(1);
    expect(store.recordDeath().totalDeaths).toBe(2);
    expect(storage.getItem(PROGRESS_STORAGE_KEY)).toBe('{"version":1,"totalDeaths":2}');

    const reloaded = new ProgressStore(storage);
    expect(reloaded.snapshot.totalDeaths).toBe(2);
  });

  it('keeps running when storage writes fail', () => {
    const storage: Pick<Storage, 'getItem' | 'setItem'> = {
      getItem: () => null,
      setItem: () => {
        throw new Error('blocked');
      },
    };
    const store = new ProgressStore(storage);

    expect(store.recordDeath().totalDeaths).toBe(1);
  });

  it('starts safely when storage reads are blocked', () => {
    const storage: Pick<Storage, 'getItem' | 'setItem'> = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => undefined,
    };

    const store = new ProgressStore(storage);
    expect(store.snapshot).toEqual(DEFAULT_PROGRESS);
  });
});
