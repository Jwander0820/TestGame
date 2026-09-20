import { requireTestElement, getTestFrameWindow } from './dom';
import { LEVEL_ONE_ID } from '../../src/game/content/levelOne';
import { PROGRESS_STORAGE_KEY, parseProgress } from '../../src/game/state/progress';

type TestPhase = 'initial' | 'reloading' | 'finished';

const IDLE_EGG_ID = 'idle-apology';
const IDLE_MESSAGE = '你是在等遊戲先道歉嗎？';
const frame = requireTestElement<HTMLIFrameElement>('#production-frame');
const focusSink = requireTestElement<HTMLButtonElement>('#focus-sink');
const result = requireTestElement<HTMLOutputElement>('#playtest-result');

let phase: TestPhase = 'initial';
let frameWindow: (Window & typeof globalThis) | null = null;
let frameDocument: Document | null = null;
let timeoutTimer: number | null = null;
let consoleWarningCount = 0;
let consoleErrorCount = 0;

function delay(durationMs: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, durationMs));
}

function requireFrameElement<T extends Element>(selector: string): T {
  const element = frameDocument?.querySelector<T>(selector) ?? null;
  if (element === null) {
    throw new Error(`Production frame element is missing: ${selector}`);
  }
  return element;
}

function readProgress() {
  return parseProgress(window.localStorage.getItem(PROGRESS_STORAGE_KEY));
}

function hasIdleEgg(): boolean {
  return readProgress().discoveredEasterEggIds.includes(IDLE_EGG_ID);
}

function countActiveAssists(): number {
  const blockers = readProgress().levels[LEVEL_ONE_ID]?.blockers ?? {};
  return Object.values(blockers).reduce((total, blocker) => total + blocker.activeAssistIds.length, 0);
}

function reportConsoleCounts(): void {
  result.dataset.consoleWarnings = String(consoleWarningCount);
  result.dataset.consoleErrors = String(consoleErrorCount);
}

function attachConsoleDiagnostics(target: Window & typeof globalThis): void {
  const originalWarn = target.console.warn.bind(target.console);
  const originalError = target.console.error.bind(target.console);
  target.console.warn = (...data: unknown[]): void => {
    consoleWarningCount += 1;
    reportConsoleCounts();
    originalWarn(...data);
  };
  target.console.error = (...data: unknown[]): void => {
    consoleErrorCount += 1;
    reportConsoleCounts();
    originalError(...data);
  };
  target.addEventListener('error', () => {
    consoleErrorCount += 1;
    reportConsoleCounts();
  });
  target.addEventListener('unhandledrejection', () => {
    consoleErrorCount += 1;
    reportConsoleCounts();
  });
}

async function waitForIdleEgg(timeoutMs: number): Promise<number | null> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (hasIdleEgg()) {
      return Date.now() - startedAt;
    }
    await delay(100);
  }
  return null;
}

function fail(message: string): void {
  phase = 'finished';
  result.dataset.status = 'failed';
  result.textContent = message;
  if (timeoutTimer !== null) {
    window.clearTimeout(timeoutTimer);
    timeoutTimer = null;
  }
  window.localStorage.removeItem(PROGRESS_STORAGE_KEY);
}

async function runInitialPass(): Promise<void> {
  result.dataset.status = 'waiting-foreground';
  requireFrameElement<HTMLButtonElement>('#start-button').click();
  const gameRoot = requireFrameElement<HTMLElement>('#game-root');
  gameRoot.focus({ preventScroll: true });
  await delay(150);
  result.dataset.initialHasFocus = String(frameDocument?.hasFocus() === true);

  await delay(4_000);
  result.dataset.eggAfterPartialWait = String(hasIdleEgg());

  focusSink.focus({ preventScroll: true });
  await delay(150);
  result.dataset.backgroundHasFocus = String(frameDocument?.hasFocus() === true);
  result.dataset.status = 'waiting-background';
  await delay(8_500);
  result.dataset.eggAfterBackgroundWait = String(hasIdleEgg());

  const refocusedAt = Date.now();
  gameRoot.focus({ preventScroll: true });
  await delay(150);
  result.dataset.restoredHasFocus = String(frameDocument?.hasFocus() === true);
  result.dataset.status = 'waiting-refocused';
  const detectedAfterMs = await waitForIdleEgg(10_000);
  const triggerElapsedMs = detectedAfterMs === null ? null : Date.now() - refocusedAt;
  result.dataset.triggerElapsedMs = String(triggerElapsedMs ?? -1);
  result.dataset.firstMessage = requireFrameElement<HTMLElement>('#game-status').textContent?.trim() ?? '';

  const firstProgress = readProgress();
  result.dataset.firstEggCount = String(
    firstProgress.discoveredEasterEggIds.filter((eggId) => eggId === IDLE_EGG_ID).length,
  );
  result.dataset.firstDeaths = String(firstProgress.totalDeaths);
  result.dataset.firstAssists = String(countActiveAssists());

  const firstPassValid =
    result.dataset.initialHasFocus === 'true' &&
    result.dataset.eggAfterPartialWait === 'false' &&
    result.dataset.backgroundHasFocus === 'false' &&
    result.dataset.eggAfterBackgroundWait === 'false' &&
    result.dataset.restoredHasFocus === 'true' &&
    triggerElapsedMs !== null &&
    triggerElapsedMs >= 8_000 &&
    result.dataset.firstMessage === IDLE_MESSAGE &&
    result.dataset.firstEggCount === '1' &&
    firstProgress.totalDeaths === 0 &&
    countActiveAssists() === 0;

  if (!firstPassValid) {
    fail('原地等待彩蛋的前景／背景計時欄位不符合規格。');
    return;
  }

  phase = 'reloading';
  result.dataset.status = 'reloading';
  result.textContent = '首次彩蛋已保存；正在重載正式產物驗證不重播。';
  frameWindow?.location.reload();
}

async function runReloadPass(): Promise<void> {
  requireFrameElement<HTMLButtonElement>('#start-button').click();
  const gameRoot = requireFrameElement<HTMLElement>('#game-root');
  gameRoot.focus({ preventScroll: true });
  result.dataset.status = 'waiting-after-reload';
  await delay(8_500);

  const reloadedProgress = readProgress();
  const reloadedMessage = requireFrameElement<HTMLElement>('#game-status').textContent?.trim() ?? '';
  result.dataset.reloadedEggCount = String(
    reloadedProgress.discoveredEasterEggIds.filter((eggId) => eggId === IDLE_EGG_ID).length,
  );
  result.dataset.reloadedMessage = reloadedMessage;
  result.dataset.reloadedDeaths = String(reloadedProgress.totalDeaths);
  result.dataset.reloadedAssists = String(countActiveAssists());

  const passed =
    result.dataset.reloadedEggCount === '1' &&
    reloadedMessage !== IDLE_MESSAGE &&
    reloadedProgress.totalDeaths === 0 &&
    countActiveAssists() === 0 &&
    consoleWarningCount === 0 &&
    consoleErrorCount === 0;

  phase = 'finished';
  result.dataset.status = passed ? 'completed' : 'failed';
  result.textContent = passed
    ? '正式 dist 的原地等待、背景排除、保存與不重播驗證通過。'
    : '重載後的原地等待彩蛋欄位不符合規格。';
  if (timeoutTimer !== null) {
    window.clearTimeout(timeoutTimer);
    timeoutTimer = null;
  }
  window.localStorage.removeItem(PROGRESS_STORAGE_KEY);
}

frame.addEventListener('load', () => {
  frameWindow = getTestFrameWindow(frame);
  frameDocument = frame.contentDocument;
  if (frameWindow === null || frameDocument === null) {
    fail('無法讀取正式 dist iframe。');
    return;
  }

  attachConsoleDiagnostics(frameWindow);
  const currentPhase = phase;
  const run = currentPhase === 'initial' ? runInitialPass() : runReloadPass();
  void run.catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    fail(`原地等待彩蛋測試發生錯誤：${message}`);
  });
});

window.localStorage.removeItem(PROGRESS_STORAGE_KEY);
reportConsoleCounts();
timeoutTimer = window.setTimeout(() => {
  if (phase !== 'finished') {
    fail('原地等待彩蛋測試未在 40 秒內完成。');
  }
}, 40_000);
frame.src = '/dist/';
