import { createGame } from '../../src/game/config';
import { LEVEL_ONE_ID } from '../../src/game/content/levelOne';
import { subscribeToGameStatus } from '../../src/game/events';
import { InputController } from '../../src/game/input/InputController';
import { PROGRESS_STORAGE_KEY, ProgressStore } from '../../src/game/state/progress';
import { ReverseEasterEggDriver } from './ReverseEasterEggDriver';

const REVERSE_EGG_ID = 'reverse-zero-coins';
const REVERSE_MESSAGE = '你特地往左找到了 8 枚沒有用途的金幣。很會。';
const STORAGE_NAMESPACE = 'playtest:reverse-easter-egg:';
const STAGE_KEY = `${STORAGE_NAMESPACE}stage`;
const namespacedStorage: Pick<Storage, 'getItem' | 'setItem'> = {
  getItem: (key) => window.localStorage.getItem(`${STORAGE_NAMESPACE}${key}`),
  setItem: (key, value) => window.localStorage.setItem(`${STORAGE_NAMESPACE}${key}`, value),
};

interface FirstPassEvidence {
  readonly message: string;
  readonly deaths: number;
  readonly assists: number;
  readonly eggCount: number;
  readonly consoleWarnings: number;
  readonly consoleErrors: number;
}

const result = document.querySelector<HTMLOutputElement>('#playtest-result');
if (result === null) {
  throw new Error('Reverse easter egg playtest output is missing.');
}

let consoleWarningCount = 0;
let consoleErrorCount = 0;
const originalConsoleWarn = console.warn.bind(console);
const originalConsoleError = console.error.bind(console);
const reportConsoleCounts = (): void => {
  result.dataset.consoleWarnings = String(consoleWarningCount);
  result.dataset.consoleErrors = String(consoleErrorCount);
};
console.warn = (...data: unknown[]): void => {
  consoleWarningCount += 1;
  reportConsoleCounts();
  originalConsoleWarn(...data);
};
console.error = (...data: unknown[]): void => {
  consoleErrorCount += 1;
  reportConsoleCounts();
  originalConsoleError(...data);
};
window.addEventListener('error', () => {
  consoleErrorCount += 1;
  reportConsoleCounts();
});
window.addEventListener('unhandledrejection', () => {
  consoleErrorCount += 1;
  reportConsoleCounts();
});
reportConsoleCounts();

function testStorageKey(): string {
  return `${STORAGE_NAMESPACE}${PROGRESS_STORAGE_KEY}`;
}

function countEggs(progressStore: ProgressStore): number {
  return progressStore.snapshot.discoveredEasterEggIds.filter((eggId) => eggId === REVERSE_EGG_ID).length;
}

function countAssists(progressStore: ProgressStore): number {
  const blockers = progressStore.snapshot.levels[LEVEL_ONE_ID]?.blockers ?? {};
  return Object.values(blockers).reduce((total, blocker) => total + blocker.activeAssistIds.length, 0);
}

function navigationType(): string {
  const navigation = performance.getEntriesByType('navigation')[0];
  return navigation instanceof PerformanceNavigationTiming ? navigation.type : 'unavailable';
}

const savedEvidence = window.sessionStorage.getItem(STAGE_KEY);
const isReloadPass = savedEvidence !== null;
if (!isReloadPass) {
  window.localStorage.removeItem(testStorageKey());
}

const progressStore = new ProgressStore(namespacedStorage);
const inputController = new InputController();
const playtestDriver = new ReverseEasterEggDriver();
let reverseMessageCount = 0;
let reloadScheduled = false;

const unsubscribe = subscribeToGameStatus((detail) => {
  result.textContent = detail.message;
  result.dataset.deaths = String(detail.deaths);
  if (detail.message === REVERSE_MESSAGE) {
    reverseMessageCount += 1;
  }

  if (!isReloadPass && detail.message === REVERSE_MESSAGE && !reloadScheduled) {
    const evidence: FirstPassEvidence = {
      message: detail.message,
      deaths: progressStore.snapshot.totalDeaths,
      assists: countAssists(progressStore),
      eggCount: countEggs(progressStore),
      consoleWarnings: consoleWarningCount,
      consoleErrors: consoleErrorCount,
    };
    window.sessionStorage.setItem(STAGE_KEY, JSON.stringify(evidence));
    result.dataset.status = 'reloading';
    reloadScheduled = true;
    window.setTimeout(() => window.location.reload(), 100);
    return;
  }

  if (detail.phase !== 'completed') {
    return;
  }

  if (!isReloadPass || savedEvidence === null) {
    result.dataset.status = 'completed-without-reload';
    return;
  }

  let firstEvidence: FirstPassEvidence | null = null;
  try {
    firstEvidence = JSON.parse(savedEvidence) as FirstPassEvidence;
  } catch {
    // Invalid test evidence fails the final predicate below.
  }
  const finalEggCount = countEggs(progressStore);
  const finalAssists = countAssists(progressStore);
  result.dataset.navigation = navigationType();
  result.dataset.firstMessage = firstEvidence?.message ?? 'missing';
  result.dataset.firstDeaths = String(firstEvidence?.deaths ?? -1);
  result.dataset.firstAssists = String(firstEvidence?.assists ?? -1);
  result.dataset.firstEggCount = String(firstEvidence?.eggCount ?? -1);
  result.dataset.reachedReverseCache = String(playtestDriver.reachedReverseCache);
  result.dataset.reverseMessageCountAfterReload = String(reverseMessageCount);
  result.dataset.finalDeaths = String(progressStore.snapshot.totalDeaths);
  result.dataset.finalAssists = String(finalAssists);
  result.dataset.finalEggCount = String(finalEggCount);

  const passed =
    navigationType() === 'reload' &&
    firstEvidence?.message === REVERSE_MESSAGE &&
    firstEvidence.deaths === 0 &&
    firstEvidence.assists === 0 &&
    firstEvidence.eggCount === 1 &&
    firstEvidence.consoleWarnings === 0 &&
    firstEvidence.consoleErrors === 0 &&
    playtestDriver.reachedReverseCache &&
    reverseMessageCount === 0 &&
    progressStore.snapshot.totalDeaths === 0 &&
    finalAssists === 0 &&
    finalEggCount === 1 &&
    consoleWarningCount === 0 &&
    consoleErrorCount === 0;
  result.dataset.status = passed ? 'completed' : 'completed-with-invalid-evidence';
  window.sessionStorage.removeItem(STAGE_KEY);
  window.localStorage.removeItem(testStorageKey());
});

const game = createGame({ inputController, progressStore, playtestDriver });
result.dataset.status = isReloadPass ? 'running-after-reload' : 'running-first-pass';
window.setTimeout(() => {
  if (result.dataset.status?.startsWith('running') === true) {
    result.dataset.driverPhase = playtestDriver.currentPhase;
    result.dataset.lastX = String(Math.round(playtestDriver.lastFrame?.x ?? -1));
    result.dataset.lastY = String(Math.round(playtestDriver.lastFrame?.y ?? -1));
    result.dataset.lastGrounded = String(playtestDriver.lastFrame?.grounded === true);
    result.dataset.reachedReverseCache = String(playtestDriver.reachedReverseCache);
    result.dataset.status = 'timeout';
    result.textContent = '反向彩蛋實際碰撞路線未在 25 秒內完成。';
    window.sessionStorage.removeItem(STAGE_KEY);
    window.localStorage.removeItem(testStorageKey());
  }
}, 25_000);

window.addEventListener(
  'beforeunload',
  () => {
    unsubscribe();
    inputController.destroy();
    game.destroy(true);
  },
  { once: true },
);
