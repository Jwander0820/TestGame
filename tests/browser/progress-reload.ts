import { createGame } from '../../src/game/config';
import { LEVEL_ONE_ID } from '../../src/game/content/levelOne';
import { subscribeToGameStatus } from '../../src/game/events';
import { InputController } from '../../src/game/input/InputController';
import { PROGRESS_STORAGE_KEY, ProgressStore } from '../../src/game/state/progress';
import { MaxAssistanceDriver } from './MaxAssistanceDriver';
import { createMaxAssistanceCheckpointProgress } from './maxAssistanceState';

const EXPECTED_DEATHS = 14;
const EXPECTED_ASSISTS = 6;
const STORAGE_NAMESPACE = 'playtest:progress-reload:';
const STAGE_KEY = `${STORAGE_NAMESPACE}stage`;
const namespacedStorage: Pick<Storage, 'getItem' | 'setItem'> = {
  getItem: (key) => window.localStorage.getItem(`${STORAGE_NAMESPACE}${key}`),
  setItem: (key, value) => window.localStorage.setItem(`${STORAGE_NAMESPACE}${key}`, value),
};

const result = document.querySelector<HTMLOutputElement>('#playtest-result');
if (result === null) {
  throw new Error('Playtest result output is missing.');
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

function countActiveAssists(progressStore: ProgressStore): number {
  const blockers = progressStore.snapshot.levels[LEVEL_ONE_ID]?.blockers ?? {};
  return Object.values(blockers).reduce((total, blocker) => total + blocker.activeAssistIds.length, 0);
}

function navigationType(): string {
  const navigation = performance.getEntriesByType('navigation')[0];
  return navigation instanceof PerformanceNavigationTiming ? navigation.type : 'unavailable';
}

function testStorageKey(): string {
  return `${STORAGE_NAMESPACE}${PROGRESS_STORAGE_KEY}`;
}

if (window.sessionStorage.getItem(STAGE_KEY) !== 'seeded') {
  window.localStorage.removeItem(testStorageKey());
  const seedStore = new ProgressStore(namespacedStorage);
  seedStore.replace(createMaxAssistanceCheckpointProgress());
  window.sessionStorage.setItem(STAGE_KEY, 'seeded');
  result.dataset.status = 'reloading';
  result.textContent = '已保存 14 次死亡、六個援助與 checkpoint；正在真正重新整理頁面。';
  window.setTimeout(() => window.location.reload(), 80);
} else {
  window.sessionStorage.removeItem(STAGE_KEY);
  const progressStore = new ProgressStore(namespacedStorage);
  const restoredLevel = progressStore.snapshot.levels[LEVEL_ONE_ID];
  const restoredAssists = countActiveAssists(progressStore);
  const restoredNavigation = navigationType();

  result.dataset.status = 'running';
  result.dataset.navigation = restoredNavigation;
  result.dataset.restoredDeaths = String(progressStore.snapshot.totalDeaths);
  result.dataset.restoredMarker = restoredLevel?.progressMarkerId ?? 'missing';
  result.dataset.restoredOrder = String(restoredLevel?.progressOrder ?? -1);
  result.dataset.restoredAssists = String(restoredAssists);

  const restoredCorrectly =
    restoredNavigation === 'reload' &&
    progressStore.snapshot.totalDeaths === EXPECTED_DEATHS &&
    restoredLevel?.progressMarkerId === 'after-first-gap' &&
    restoredLevel.progressOrder === 1 &&
    restoredAssists === EXPECTED_ASSISTS &&
    restoredLevel.completed === false;

  if (!restoredCorrectly) {
    result.dataset.status = 'restore-failed';
    result.textContent = '瀏覽器重載後的保存欄位不符合測試規格。';
    throw new Error('Progress reload verification failed before starting Phaser.');
  }

  const inputController = new InputController();
  const playtestDriver = new MaxAssistanceDriver();
  const unsubscribe = subscribeToGameStatus((detail) => {
    result.textContent = detail.message;
    result.dataset.finalDeaths = String(detail.deaths);
    if (detail.phase !== 'completed') {
      return;
    }

    const finalLevel = progressStore.snapshot.levels[LEVEL_ONE_ID];
    result.dataset.finalMarker = finalLevel?.progressMarkerId ?? 'missing';
    result.dataset.finalCompleted = String(finalLevel?.completed === true);
    result.dataset.status =
      detail.deaths === EXPECTED_DEATHS &&
      finalLevel?.progressMarkerId === 'goal' &&
      finalLevel.completed === true &&
      consoleWarningCount === 0 &&
      consoleErrorCount === 0
        ? 'completed'
        : 'completed-with-invalid-progress';
    window.localStorage.removeItem(testStorageKey());
  });

  const game = createGame({ inputController, progressStore, playtestDriver });
  window.setTimeout(() => {
    if (result.dataset.status === 'running') {
      result.dataset.status = 'timeout';
      result.textContent = '保存重載自動路線未在 20 秒內完成。';
      window.localStorage.removeItem(testStorageKey());
    }
  }, 20_000);

  window.addEventListener(
    'beforeunload',
    () => {
      unsubscribe();
      inputController.destroy();
      game.destroy(true);
    },
    { once: true },
  );
}
