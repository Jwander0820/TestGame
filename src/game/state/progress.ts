export const PROGRESS_STORAGE_KEY = 'pity-platformer:progress';
export const PROGRESS_VERSION = 2;

export interface BlockerProgress {
  readonly totalDeaths: number;
  readonly consecutiveDeaths: number;
  readonly streakMarkerId: string;
  readonly triggeredReactionIds: readonly string[];
  readonly activeAssistIds: readonly string[];
}

export interface LevelProgress {
  readonly totalDeaths: number;
  readonly attempt: number;
  readonly progressMarkerId: string;
  readonly progressOrder: number;
  readonly deathsByCause: Readonly<Record<string, number>>;
  readonly blockers: Readonly<Record<string, BlockerProgress>>;
  readonly processedDeathEventIds: readonly string[];
  readonly completed: boolean;
}

export interface ProgressState {
  readonly version: typeof PROGRESS_VERSION;
  readonly totalDeaths: number;
  readonly levels: Readonly<Record<string, LevelProgress>>;
  readonly discoveredEasterEggIds: readonly string[];
  readonly globalTriggeredReactionIds: readonly string[];
}

export function createDefaultProgress(): ProgressState {
  return {
    version: PROGRESS_VERSION,
    totalDeaths: 0,
    levels: {},
    discoveredEasterEggIds: [],
    globalTriggeredReactionIds: [],
  };
}

export const DEFAULT_PROGRESS: ProgressState = Object.freeze(createDefaultProgress());

export function createLevelProgress(): LevelProgress {
  return {
    totalDeaths: 0,
    attempt: 1,
    progressMarkerId: 'start',
    progressOrder: 0,
    deathsByCause: {},
    blockers: {},
    processedDeathEventIds: [],
    completed: false,
  };
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 1;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isCountRecord(value: unknown): value is Record<string, number> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every(isNonNegativeInteger)
  );
}

function isBlockerProgress(value: unknown): value is BlockerProgress {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Partial<BlockerProgress>;
  return (
    isNonNegativeInteger(candidate.totalDeaths) &&
    isNonNegativeInteger(candidate.consecutiveDeaths) &&
    typeof candidate.streakMarkerId === 'string' &&
    isStringArray(candidate.triggeredReactionIds) &&
    isStringArray(candidate.activeAssistIds)
  );
}

function isBlockerRecord(value: unknown): value is Record<string, BlockerProgress> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every(isBlockerProgress)
  );
}

function isLevelProgress(value: unknown): value is LevelProgress {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Partial<LevelProgress>;
  return (
    isNonNegativeInteger(candidate.totalDeaths) &&
    isPositiveInteger(candidate.attempt) &&
    typeof candidate.progressMarkerId === 'string' &&
    isNonNegativeInteger(candidate.progressOrder) &&
    isCountRecord(candidate.deathsByCause) &&
    isBlockerRecord(candidate.blockers) &&
    isStringArray(candidate.processedDeathEventIds) &&
    typeof candidate.completed === 'boolean'
  );
}

function isLevelRecord(value: unknown): value is Record<string, LevelProgress> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every(isLevelProgress)
  );
}

function isProgressState(value: unknown): value is ProgressState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Partial<ProgressState>;
  return (
    candidate.version === PROGRESS_VERSION &&
    isNonNegativeInteger(candidate.totalDeaths) &&
    isLevelRecord(candidate.levels) &&
    isStringArray(candidate.discoveredEasterEggIds) &&
    isStringArray(candidate.globalTriggeredReactionIds)
  );
}

function migrateVersionOne(value: unknown): ProgressState | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  const candidate = value as { readonly version?: unknown; readonly totalDeaths?: unknown };
  if (candidate.version !== 1 || !isNonNegativeInteger(candidate.totalDeaths)) {
    return null;
  }

  return {
    ...createDefaultProgress(),
    totalDeaths: candidate.totalDeaths,
  };
}

export function parseProgress(raw: string | null): ProgressState {
  if (raw === null) {
    return createDefaultProgress();
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (isProgressState(parsed)) {
      return parsed;
    }
    return migrateVersionOne(parsed) ?? createDefaultProgress();
  } catch {
    return createDefaultProgress();
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

  replace(state: ProgressState): ProgressState {
    this.state = state;
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
