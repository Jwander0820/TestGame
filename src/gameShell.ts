import type { PlaytestDriver } from './game/testing/PlaytestDriver';
import { paintTitle } from './game/visuals/titlePainting';
import { createGame } from './game/config';
import { LEVEL_ONE_ID } from './game/content/levelOne';
import { LEVEL_TWO_ID } from './game/content/levelTwo';
import { subscribeToGameStatus } from './game/events';
import { InputController } from './game/input/InputController';
import type { GameAction } from './game/input/ActionState';
import { ProgressStore, createDefaultProgress } from './game/state/progress';
import { restartLevel } from './game/sympathy/director';

export function mountGameShell(storage: Pick<Storage, 'getItem' | 'setItem'>, playtestDriver?: PlaytestDriver): void {
  type MenuName = 'title' | 'pause' | 'complete';
  type LevelId = typeof LEVEL_ONE_ID | typeof LEVEL_TWO_ID;

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
  const nextLevelButton = requireElement<HTMLButtonElement>('#next-level-button');
  const titleButton = requireElement<HTMLButtonElement>('#title-button');
  const continueSummary = requireElement<HTMLElement>('#continue-summary');
  const completeSummary = requireElement<HTMLElement>('#complete-summary');
  const chapterLabel = requireElement<HTMLElement>('#chapter-label');
  const titleKicker = requireElement<HTMLElement>('#title-kicker');
  const titleHeading = requireElement<HTMLElement>('#title-panel-heading');
  const pauseHeading = requireElement<HTMLElement>('#pause-panel-heading');
  const completeKicker = requireElement<HTMLElement>('#complete-kicker');
  const journeyBar = requireElement<HTMLElement>('.journey-bar');
  const checkpointLabel = requireElement<HTMLElement>('#checkpoint-label');
  const checkpoints = Array.from(document.querySelectorAll<HTMLElement>('.checkpoint-track li'));
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

  const progressStore = new ProgressStore(storage);
  let game: ReturnType<typeof createGame> | null = null;
  let activeMenu: MenuName | null = 'title';
  let clearArmed = false;
  let clearArmTimer: number | null = null;
  let muted = loadMutedPreference();
  let currentLevelId: LevelId = continueLevelId();
  const playableScene = (): string => game?.scene.isActive('BackstageScene') || game?.scene.isPaused('BackstageScene')
    ? 'BackstageScene' : levelSceneKey(currentLevelId);

  function continueLevelId(): LevelId {
    return progressStore.snapshot.levels[LEVEL_ONE_ID]?.completed === true ? LEVEL_TWO_ID : LEVEL_ONE_ID;
  }

  function levelSceneKey(levelId: LevelId): string {
    return levelId === LEVEL_TWO_ID ? 'LevelTwoScene' : 'VerticalSliceScene';
  }

  function updateChapter(levelId: LevelId): void {
    gameShell.dataset.levelId = levelId;
    chapterLabel.textContent = levelId === LEVEL_TWO_ID ? '王城鐘塔　／　第二章' : '王城外圍　／　第一章';
    pauseHeading.textContent = levelId === LEVEL_TWO_ID ? '鐘塔機器暫時停工了' : '森林暫時安靜下來了';
  }

  function updateJourney(levelId: LevelId, backstage = false): void {
    const order = Math.min(3, progressStore.snapshot.levels[levelId]?.progressOrder ?? 0);
    const labels = levelId === LEVEL_TWO_ID ? ['工坊入口', '運送站', '蒸汽閘', '鐘塔'] : ['入口', '林間', '古橋', '城門'];
    checkpointLabel.textContent = backstage ? '工務處後台 · 右側返回' :
      `${order === 0 ? '' : '據點已保存 · '}${labels[order] ?? labels[0]}`;
    if (levelId === LEVEL_ONE_ID && order === 0 && !backstage) checkpointLabel.textContent = '森林入口';
    checkpoints.forEach((checkpoint, index) => {
      checkpoint.textContent = labels[index] ?? '';
      checkpoint.dataset.reached = String(index <= order);
      if (index === order) checkpoint.setAttribute('aria-current', 'step');
      else checkpoint.removeAttribute('aria-current');
    });
  }

  function updateDeathBadge(deaths: number): void {
    deathCount.textContent = String(deaths);
    gameShell.dataset.visualStage = deaths === 0 ? 'royal-trial' : deaths < 3 ? 'observed' : 'assisted';
  }

  function loadMutedPreference(): boolean {
    try {
      return storage.getItem(AUDIO_MUTED_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  function persistMutedPreference(): void {
    try {
      storage.setItem(AUDIO_MUTED_STORAGE_KEY, String(muted));
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
    const levelId = continueLevelId();
    const level = snapshot.levels[levelId];
    updateDeathBadge(snapshot.totalDeaths);
    updateChapter(levelId);
    titleKicker.textContent = levelId === LEVEL_TWO_ID ? '王城鐘塔的運送試煉' : '見習勇者的第一場試煉';
    titleHeading.replaceChildren(
      document.createTextNode(levelId === LEVEL_TWO_ID ? '往鐘塔裡面，' : '往森林深處，'),
      document.createElement('br'),
      document.createTextNode(levelId === LEVEL_TWO_ID ? '搭下一班。' : '再走一步。'),
    );

    if (levelId === LEVEL_TWO_ID) {
      startButton.textContent = level?.completed === true ? '再闖第二關' : level === undefined ? '前往第二關' : '繼續第二關';
      continueSummary.textContent = level?.completed === true ?
        `鐘塔通行鐘已敲響，累積陣亡 ${snapshot.totalDeaths} 次。重走第二關會保留援助。` :
        `森林試煉已完成。${level === undefined ? '接著進入王城鐘塔工坊' : '從鐘塔上次的安全據點繼續'}，累積陣亡 ${snapshot.totalDeaths} 次。`;
      return;
    }

    if (level === undefined) {
      startButton.textContent = '踏上旅程';
      continueSummary.textContent = '從王城外圍的新手森林出發。';
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
    gameRoot.inert = menu !== null;
    inputController.setEnabled(menu === null);
    journeyBar.hidden = game === null;
    gameMenu.setAttribute('role', 'dialog');
    gameMenu.setAttribute('aria-modal', 'true');
    if (menu !== null) gameMenu.setAttribute('aria-labelledby', `${menu === 'complete' ? 'complete' : menu}-panel-heading`);
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
    const firstButton = panel?.querySelector<HTMLButtonElement>('button:not([disabled]):not([hidden])');
    window.queueMicrotask(() => firstButton?.focus({ preventScroll: true }));
  }

  function startGame(): void {
    launchLevel(continueLevelId());
  }

  function launchLevel(levelId: LevelId, restart = false): void {
    inputController.actions.releaseAll();
    const completed = progressStore.snapshot.levels[levelId]?.completed === true;
    const recreateScene = restart || completed || currentLevelId !== levelId;
    if (restart || completed) {
      progressStore.replace(restartLevel(progressStore.snapshot, levelId));
    }

    if (game === null) {
      currentLevelId = levelId;
      game = createGame({ inputController, progressStore, initialLevelId: levelId, ...(playtestDriver === undefined ? {} : { playtestDriver }) });
      game.sound.mute = muted;
      gameShell.dataset.gameStarted = 'true';
    } else if (recreateScene) {
      game.scene.stop('BackstageScene');
      game.scene.stop('VerticalSliceScene');
      game.scene.stop('LevelTwoScene');
      currentLevelId = levelId;
      game.scene.start(levelSceneKey(levelId));
    } else {
      game.scene.resume(playableScene());
    }
    updateChapter(levelId);
    updateJourney(levelId, playableScene() === 'BackstageScene');
    gameShell.dataset.phase = 'playing';
    showMenu(null);
  }

  function nextLevel(): void {
    if (currentLevelId !== LEVEL_ONE_ID || progressStore.snapshot.levels[LEVEL_ONE_ID]?.completed !== true) return;
    launchLevel(LEVEL_TWO_ID);
  }

  function pauseGame(): void {
    if (game === null || activeMenu !== null) {
      return;
    }
    inputController.actions.releaseAll();
    game.scene.pause(playableScene());
    showMenu('pause');
  }

  function resumeGame(): void {
    if (game === null) {
      return;
    }
    inputController.actions.releaseAll();
    game.scene.resume(playableScene());
    showMenu(null);
  }

  function restartGame(): void {
    launchLevel(currentLevelId, true);
  }

  function returnToTitle(): void {
    if (game !== null) {
      inputController.actions.releaseAll();
      game.scene.pause(playableScene());
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
    launchLevel(LEVEL_ONE_ID, true);
  }

  const unsubscribe = subscribeToGameStatus((detail) => {
    currentLevelId = detail.levelId ?? LEVEL_ONE_ID;
    updateChapter(currentLevelId);
    updateDeathBadge(detail.deaths);
    gameStatus.textContent = detail.message;
    gameShell.dataset.phase = detail.phase ?? 'playing';
    updateJourney(currentLevelId, detail.area === 'backstage');
    if (detail.phase === 'completed') {
      const eggCount = progressStore.snapshot.discoveredEasterEggIds.length;
      const isLevelTwo = currentLevelId === LEVEL_TWO_ID;
      completeKicker.textContent = isLevelTwo ? '鐘塔運送線完成' : '森林試煉完成';
      nextLevelButton.hidden = isLevelTwo;
      replayButton.classList.toggle('primary-action', isLevelTwo);
      completeSummary.textContent = `${isLevelTwo ? '通行鐘已敲響，兩關旅程完成。' : '王城大門已打開，鐘塔運送線正在等你。'}陣亡 ${detail.deaths} 次，發現 ${eggCount} 個特殊事件。王城沒有留下能力評級。`;
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
  nextLevelButton.addEventListener('click', nextLevel);
  titleButton.addEventListener('click', returnToTitle);
  window.addEventListener('blur', pauseGame);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseGame();
  });

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

}
