export const PROGRESS_STORAGE_KEY = 'pity-platformer:progress';
export const PROGRESS_VERSION = 1;

export interface ProgressState {
  readonly version: typeof PROGRESS_VERSION;
  readonly totalDeaths: number;
}

export const DEFAULT_PROGRESS: ProgressState = Object.freeze({
  version: PROGRESS_VERSION,
  totalDeaths: 0,
});

function isProgressState(value: unknown): value is ProgressState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<ProgressState>;
  return (
    candidate.version === PROGRESS_VERSION &&
    typeof candidate.totalDeaths === 'number' &&
    Number.isSafeInteger(candidate.totalDeaths) &&
    candidate.totalDeaths >= 0
  );
}

export function parseProgress(raw: string | null): ProgressState {
  if (raw === null) {
    return DEFAULT_PROGRESS;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isProgressState(parsed) ? parsed : DEFAULT_PROGRESS;
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export class ProgressStore {
  private state: ProgressState;

  constructor(private readonly storage: Pick<Storage, 'getItem' | 'setItem'>) {
    let raw: string | null = null;
    try {
      raw = storage.getItem(PROGRESS_STORAGE_KEY);
    } catch {
      // Reading storage can be blocked by browser privacy settings.
    }
    this.state = parseProgress(raw);
  }

  get snapshot(): ProgressState {
    return this.state;
  }

  recordDeath(): ProgressState {
    this.state = {
      version: PROGRESS_VERSION,
      totalDeaths: this.state.totalDeaths + 1,
    };
    this.persist();
    return this.state;
  }

  private persist(): void {
    try {
      this.storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // The game remains playable when storage is blocked or full.
    }
  }
}
