import './styles.css';
import { paintTitle } from './game/visuals/titlePainting';
import { createGame } from './game/config';
import { LEVEL_ONE_ID } from './game/content/levelOne';
import { subscribeToGameStatus } from './game/events';
import { InputController } from './game/input/InputController';
import type { GameAction } from './game/input/ActionState';
import { ProgressStore, createDefaultProgress } from './game/state/progress';
import { restartLevel } from './game/sympathy/director';

type MenuName = 'title' | 'pause' | 'complete';

const AUDIO_MUTED_STORAGE_KEY = 'pity-platformer:audio-muted';

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`找不到必要介面元素：${selector}`);
  }
  return element;
}

const gameShell = requireElement<HTMLElement>('.game-shell');
const deathCount = requireElement<HTMLElement>('#death-count');
const gameStatus = requireElement<HTMLElement>('#game-status');
const gameRoot = requireElement<HTMLElement>('#game-root');
paintTitle(requireElement<HTMLCanvasElement>('#title-landscape'));
const gameMenu = requireElement<HTMLElement>('#game-menu');
const touchControls = requireElement<HTMLElement>('.touch-controls');
const pauseButton = requireElement<HTMLButtonElement>('#pause-button');
const startButton = requireElement<HTMLButtonElement>('#start-button');
const resumeButton = requireElement<HTMLButtonElement>('#resume-button');
const restartButton = requireElement<HTMLButtonElement>('#restart-button');
const muteButton = requireElement<HTMLButtonElement>('#mute-button');
const clearButton = requireElement<HTMLButtonElement>('#clear-button');
const replayButton = requireElement<HTMLButtonElement>('#replay-button');
const titleButton = requireElement<HTMLButtonElement>('#title-button');
const continueSummary = requireElement<HTMLElement>('#continue-summary');
const completeSummary = requireElement<HTMLElement>('#complete-summary');
const menuPanels = Array.from(document.querySelectorAll<HTMLElement>('[data-menu-panel]'));

const inputController = new InputController();
inputController.attach();

const touchCleanups = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-action]')).map((button) => {
  const action = button.dataset.action as GameAction | undefined;
  if (action === undefined) {
    return () => undefined;
  }
  return inputController.bindTouchButton(button, action);
});

const progressStore = new ProgressStore(window.localStorage);
let game: ReturnType<typeof createGame> | null = null;
let activeMenu: MenuName | null = 'title';
let clearArmed = false;
let clearArmTimer: number | null = null;
let muted = loadMutedPreference();

function updateDeathBadge(deaths: number): void {
  deathCount.textContent = String(deaths);
  gameShell.dataset.visualStage = deaths === 0 ? 'royal-trial' : deaths < 3 ? 'observed' : 'assisted';
}

function loadMutedPreference(): boolean {
  try {
    return window.localStorage.getItem(AUDIO_MUTED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function persistMutedPreference(): void {
  try {
    window.localStorage.setItem(AUDIO_MUTED_STORAGE_KEY, String(muted));
  } catch {
    // Audio preference remains active for this session when storage is unavailable.
  }
}

function updateMuteButton(): void {
  muteButton.textContent = muted ? '恢復聲音' : '靜音';
  muteButton.setAttribute('aria-pressed', String(muted));
  if (game !== null) {
    game.sound.mute = muted;
  }
}

function updateProgressSummary(): void {
  const snapshot = progressStore.snapshot;
  const level = snapshot.levels[LEVEL_ONE_ID];
  updateDeathBadge(snapshot.totalDeaths);

  if (level === undefined) {
    startButton.textContent = '踏上旅程';
    continueSummary.textContent = '從王城外圍的新手森林出發。';
    return;
  }
  if (level.completed) {
    startButton.textContent = '再次啟程';
    continueSummary.textContent = `王城試煉已完成，累積陣亡 ${snapshot.totalDeaths} 次。可以再次啟程。`;
    return;
  }
  startButton.textContent = '繼續旅程';
  continueSummary.textContent = `從上次的安全據點繼續，累積陣亡 ${snapshot.totalDeaths} 次。`;
}

function resetClearConfirmation(): void {
  clearArmed = false;
  clearButton.textContent = '清除紀錄';
  if (clearArmTimer !== null) {
    window.clearTimeout(clearArmTimer);
    clearArmTimer = null;
  }
}

function showMenu(menu: MenuName | null): void {
  activeMenu = menu;
  gameMenu.hidden = menu === null;
  gameShell.dataset.menuOpen = String(menu !== null);
  touchControls.inert = menu !== null;
  pauseButton.hidden = menu !== null || game === null;

  for (const panel of menuPanels) {
    panel.hidden = panel.dataset.menuPanel !== menu;
  }

  if (menu === null) {
    resetClearConfirmation();
    gameRoot.focus({ preventScroll: true });
    return;
  }

  const panel = menuPanels.find((candidate) => candidate.dataset.menuPanel === menu);
  const firstButton = panel?.querySelector<HTMLButtonElement>('button:not([disabled])');
  window.queueMicrotask(() => firstButton?.focus({ preventScroll: true }));
}

function startGame(): void {
  inputController.actions.releaseAll();
  const completed = progressStore.snapshot.levels[LEVEL_ONE_ID]?.completed === true;
  if (completed) {
    progressStore.replace(restartLevel(progressStore.snapshot, LEVEL_ONE_ID));
  }

  if (game === null) {
    game = createGame({ inputController, progressStore });
    game.sound.mute = muted;
    gameShell.dataset.gameStarted = 'true';
  } else {
    game.scene.resume('VerticalSliceScene');
    if (completed) {
      game.scene.getScene('VerticalSliceScene').scene.restart();
    }
  }
  showMenu(null);
}

function pauseGame(): void {
  if (game === null || activeMenu !== null) {
    return;
  }
  inputController.actions.releaseAll();
  game.scene.pause('VerticalSliceScene');
  showMenu('pause');
}

function resumeGame(): void {
  if (game === null) {
    return;
  }
  inputController.actions.releaseAll();
  game.scene.resume('VerticalSliceScene');
  showMenu(null);
}

function restartGame(): void {
  if (game === null) {
    startGame();
    return;
  }
  inputController.actions.releaseAll();
  progressStore.replace(restartLevel(progressStore.snapshot, LEVEL_ONE_ID));
  game.scene.resume('VerticalSliceScene');
  game.scene.getScene('VerticalSliceScene').scene.restart();
  showMenu(null);
}

function returnToTitle(): void {
  if (game !== null) {
    inputController.actions.releaseAll();
    game.scene.pause('VerticalSliceScene');
  }
  updateProgressSummary();
  showMenu('title');
}

function toggleMuted(): void {
  muted = !muted;
  persistMutedPreference();
  updateMuteButton();
}

function requestClearProgress(): void {
  if (!clearArmed) {
    clearArmed = true;
    clearButton.textContent = '確認清除旅程？';
    clearArmTimer = window.setTimeout(resetClearConfirmation, 4_000);
    return;
  }

  resetClearConfirmation();
  progressStore.replace(createDefaultProgress());
  updateProgressSummary();
  gameStatus.textContent = '旅程紀錄已清除。王城決定當作第一次見面。';
  restartGame();
}

const unsubscribe = subscribeToGameStatus((detail) => {
  updateDeathBadge(detail.deaths);
  gameStatus.textContent = detail.message;
  if (detail.phase === 'completed') {
    const eggCount = progressStore.snapshot.discoveredEasterEggIds.length;
    completeSummary.textContent = `陣亡 ${detail.deaths} 次，發現 ${eggCount} 個特殊事件。王城沒有留下能力評級。`;
    inputController.actions.releaseAll();
    showMenu('complete');
  }
});

pauseButton.addEventListener('click', pauseGame);
startButton.addEventListener('click', startGame);
resumeButton.addEventListener('click', resumeGame);
restartButton.addEventListener('click', restartGame);
muteButton.addEventListener('click', toggleMuted);
clearButton.addEventListener('click', requestClearProgress);
replayButton.addEventListener('click', restartGame);
titleButton.addEventListener('click', returnToTitle);

window.addEventListener('keydown', (event) => {
  if (event.code !== 'Escape' || event.repeat || game === null) {
    return;
  }
  event.preventDefault();
  if (activeMenu === null) {
    pauseGame();
  } else if (activeMenu === 'pause') {
    resumeGame();
  }
});

updateProgressSummary();
updateMuteButton();
showMenu('title');

window.addEventListener(
  'beforeunload',
  () => {
    unsubscribe();
    touchCleanups.forEach((cleanup) => cleanup());
    inputController.destroy();
    game?.destroy(true);
  },
  { once: true },
);
