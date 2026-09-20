import { requireTestElement, getTestFrameWindow } from './dom';
import { LEVEL_ONE_ID } from '../../src/game/content/levelOne';
import { PROGRESS_STORAGE_KEY, parseProgress } from '../../src/game/state/progress';

type TestPhase = 'initial' | 'playing' | 'reloading' | 'finished';

const frame = requireTestElement<HTMLIFrameElement>('#production-frame');
const result = requireTestElement<HTMLOutputElement>('#playtest-result');
const originalProgress = window.localStorage.getItem(PROGRESS_STORAGE_KEY);

function restoreOriginalProgress(): void {
  if (originalProgress === null) window.localStorage.removeItem(PROGRESS_STORAGE_KEY);
  else window.localStorage.setItem(PROGRESS_STORAGE_KEY, originalProgress);
  result.dataset.originalProgressRestored = String(window.localStorage.getItem(PROGRESS_STORAGE_KEY) === originalProgress);
}

window.addEventListener('beforeunload', restoreOriginalProgress, { once: true });

let phase: TestPhase = 'initial';
let frameWindow: (Window & typeof globalThis) | null = null;
let frameDocument: Document | null = null;
let jumpInterval: number | null = null;
let jumpReleaseTimer: number | null = null;
let progressPoll: number | null = null;
let timeoutTimer: number | null = null;
let checkpointTransitionsChecked = false;
let completedDeaths = -1;
let consoleWarningCount = 0;
let consoleErrorCount = 0;

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

function dispatchKey(type: 'keydown' | 'keyup', code: 'ArrowRight' | 'Space' | 'Escape'): void {
  if (frameWindow === null) {
    return;
  }
  const key = code === 'Space' ? ' ' : code === 'Escape' ? 'Escape' : 'ArrowRight';
  frameWindow.dispatchEvent(
    new frameWindow.KeyboardEvent(type, {
      key,
      code,
      bubbles: true,
      cancelable: true,
      repeat: false,
    }),
  );
}

function stopDriving(): void {
  if (jumpInterval !== null) {
    window.clearInterval(jumpInterval);
    jumpInterval = null;
  }
  if (jumpReleaseTimer !== null) {
    window.clearTimeout(jumpReleaseTimer);
    jumpReleaseTimer = null;
  }
  dispatchKey('keyup', 'Space');
  dispatchKey('keyup', 'ArrowRight');
}

function startDriving(): void {
  dispatchKey('keydown', 'ArrowRight');
  jumpInterval = window.setInterval(() => {
    dispatchKey('keydown', 'Space');
    jumpReleaseTimer = window.setTimeout(() => {
      dispatchKey('keyup', 'Space');
      jumpReleaseTimer = null;
    }, 90);
  }, 280);
}

function checkCheckpointTransitions(): void {
  checkpointTransitionsChecked = true;
  dispatchKey('keydown', 'Escape');
  dispatchKey('keyup', 'Escape');

  requireFrameElement<HTMLButtonElement>('#resume-button').click();
  result.dataset.resumeMarker =
    readProgress().levels[LEVEL_ONE_ID]?.progressMarkerId ?? 'missing';

  dispatchKey('keydown', 'Escape');
  dispatchKey('keyup', 'Escape');
  requireFrameElement<HTMLButtonElement>('#restart-button').click();
  result.dataset.restartMarker =
    readProgress().levels[LEVEL_ONE_ID]?.progressMarkerId ?? 'missing';

  dispatchKey('keydown', 'ArrowRight');
}

function finishPlaying(): void {
  stopDriving();
  if (progressPoll !== null) {
    window.clearInterval(progressPoll);
    progressPoll = null;
  }

  const completePanel = requireFrameElement<HTMLElement>('[data-menu-panel="complete"]');
  const completeSummary = requireFrameElement<HTMLElement>('#complete-summary').textContent?.trim() ?? '';
  completedDeaths = Number(requireFrameElement<HTMLElement>('#death-count').textContent ?? '-1');
  result.dataset.completedDeaths = String(completedDeaths);
  result.dataset.completePanelVisible = String(!completePanel.hidden);
  result.dataset.completeSummary = completeSummary;

  phase = 'reloading';
  result.dataset.status = 'reloading';
  result.textContent = '正式產物已完成；正在重新整理並核對保存。';
  frameWindow?.location.reload();
}

function pollProgress(): void {
  const level = readProgress().levels[LEVEL_ONE_ID];
  if (!checkpointTransitionsChecked && (level?.progressOrder ?? 0) >= 1) {
    checkCheckpointTransitions();
    return;
  }
  if (level?.completed === true) {
    finishPlaying();
  }
}

function beginProductionRun(): void {
  phase = 'playing';
  result.dataset.status = 'running';
  result.textContent = '正在以正式鍵盤事件操作 dist 完整流程。';
  requireFrameElement<HTMLButtonElement>('#start-button').click();
  startDriving();
  progressPoll = window.setInterval(pollProgress, 50);
  timeoutTimer = window.setTimeout(() => {
    if (phase !== 'playing') {
      return;
    }
    phase = 'finished';
    stopDriving();
    result.dataset.status = 'timeout';
    result.textContent = '正式產物未在 90 秒內完成。';
    restoreOriginalProgress();
  }, 90_000);
}

function verifyReloadedTitle(): void {
  const startLabel = requireFrameElement<HTMLButtonElement>('#start-button').textContent?.trim() ?? '';
  const continueSummary = requireFrameElement<HTMLElement>('#continue-summary').textContent?.trim() ?? '';
  const reloadedDeaths = Number(requireFrameElement<HTMLElement>('#death-count').textContent ?? '-1');
  result.dataset.reloadedStartLabel = startLabel;
  result.dataset.reloadedSummary = continueSummary;
  result.dataset.reloadedDeaths = String(reloadedDeaths);

  const passed =
    result.dataset.resumeMarker === 'after-first-gap' &&
    result.dataset.restartMarker === 'start' &&
    result.dataset.completePanelVisible === 'true' &&
    startLabel === '再次啟程' &&
    continueSummary.includes('王城試煉已完成') &&
    reloadedDeaths === completedDeaths &&
    consoleWarningCount === 0 &&
    consoleErrorCount === 0;

  phase = 'finished';
  result.dataset.status = passed ? 'completed' : 'failed';
  result.textContent = passed
    ? `正式 dist 已完成並保存，共死亡 ${completedDeaths} 次。`
    : '正式產物流程完成，但驗收欄位不符合規格。';
  if (timeoutTimer !== null) {
    window.clearTimeout(timeoutTimer);
    timeoutTimer = null;
  }
  restoreOriginalProgress();
}

frame.addEventListener('load', () => {
  frameWindow = getTestFrameWindow(frame);
  frameDocument = frame.contentDocument;
  if (frameWindow === null || frameDocument === null) {
    result.dataset.status = 'frame-unavailable';
    return;
  }

  attachConsoleDiagnostics(frameWindow);
  if (phase === 'initial') {
    beginProductionRun();
  } else if (phase === 'reloading') {
    verifyReloadedTitle();
  }
});

window.localStorage.removeItem(PROGRESS_STORAGE_KEY);
reportConsoleCounts();
frame.src = '/dist/';
