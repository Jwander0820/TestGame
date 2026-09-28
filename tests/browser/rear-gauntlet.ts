import { createGame } from '../../src/game/config';
import { LEVEL_ONE_ID } from '../../src/game/content/levelOne';
import { REAR_CAUSES } from '../../src/game/content/rearGauntlet';
import { subscribeToGameStatus } from '../../src/game/events';
import { InputController } from '../../src/game/input/InputController';
import { createDefaultProgress, ProgressStore } from '../../src/game/state/progress';
import { advanceProgress } from '../../src/game/sympathy/director';
import type { PlaytestFrame } from '../../src/game/testing/PlaytestDriver';
import { requireTestElement } from './dom';
import { ZeroAssistDriver } from './ZeroAssistDriver';

const testCase = new URLSearchParams(location.search).get('case') ?? 'step';
const holdForReview = new URLSearchParams(location.search).get('review') === '1';
const fault = testCase === 'pause' ? 'sweep' : testCase === 'reload' ? 'finish' :
  testCase === 'returnPause' ? 'returnSweep' : testCase === 'hammerReload' ? 'restHammer' :
    testCase === 'encoreReload' || testCase === 'encorePause' ? 'restEcho' : testCase;
if (!(fault in REAR_CAUSES)) throw new Error('Unknown rear gauntlet case');
const cause = REAR_CAUSES[fault as keyof typeof REAR_CAUSES];
const expectedDeaths = fault === 'step' ? 3 : ['sweep', 'returnSweep', 'restHammer', 'restEcho'].includes(fault) ? 5 : 7;
const isReloadCase = testCase === 'reload' || testCase === 'hammerReload' || testCase === 'encoreReload';
const isPauseCase = testCase === 'pause' || testCase === 'returnPause' || testCase === 'encorePause';
// An early final jump still lands on the last trap after ceiling assistance.
const expectedCauses: Readonly<Record<string, number>> = fault === 'ceiling'
  ? { [cause]: 5, [REAR_CAUSES.finish]: 2 } : { [cause]: expectedDeaths };
const result = requireTestElement<HTMLOutputElement>('#playtest-result');
const evidence = requireTestElement<HTMLPreElement>('#rear-evidence');
const resumeReview = requireTestElement<HTMLButtonElement>('#resume-review');
const namespace = `playtest:rear-reload:${testCase}:`;
const reloadPending = isReloadCase && sessionStorage.getItem(`${namespace}pending`) === 'yes';
const memory = new Map<string, string>();
const progressStore = new ProgressStore(isReloadCase ? {
  getItem: (key) => reloadPending ? sessionStorage.getItem(namespace + key) : null,
  setItem: (key, value) => sessionStorage.setItem(namespace + key, value),
} : {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => { memory.set(key, value); },
});
if (reloadPending) {
  sessionStorage.removeItem(`${namespace}pending`);
  result.dataset.restoredDeaths = String(progressStore.snapshot.totalDeaths);
} else {
  progressStore.replace(advanceProgress(createDefaultProgress(), LEVEL_ONE_ID, 'after-warning-strip', 2));
}
const inputController = new InputController();
const driver = new ZeroAssistDriver({ rearFault: fault === 'finish' || fault === 'restHammer' ? undefined : fault as 'step' | 'sweep' | 'exit' | 'ceiling' | 'returnSweep' | 'restEcho' });
let lastFrame: PlaytestFrame | null = null;
let paused = false;
let reloading = false;
let reviewHeld = false;
let hammerArrivalMs: number | null = null;
let deathMessage: string | null = null;
const unsubscribe = subscribeToGameStatus((detail) => {
  const level = progressStore.snapshot.levels[LEVEL_ONE_ID];
  result.textContent = detail.message;
  result.dataset.deaths = String(detail.deaths);
  if (detail.phase === 'dying') deathMessage = detail.message;
  if (detail.phase === 'playing' && deathMessage !== null) {
    result.dataset.dialogueSurvivedRespawn = String(detail.message === deathMessage);
    deathMessage = null;
  }
  evidence.textContent = JSON.stringify({ expectedDeaths, expectedCauses, causes: level?.deathsByCause, blockers: level?.blockers, lastFrame }, null, 2);
  if (isReloadCase && !reloadPending && !reloading && detail.deaths === expectedDeaths) {
    reloading = true;
    sessionStorage.setItem(`${namespace}pending`, 'yes');
    window.setTimeout(() => location.reload(), 50);
  }
  if (detail.phase === 'completed') {
    result.dataset.status = detail.deaths === expectedDeaths && Object.entries(expectedCauses).every(([id, count]) => level?.deathsByCause[id] === count) &&
      (!isPauseCase || result.dataset.pauseHeld === 'true' && result.dataset.dialoguePauseHeld === 'true') &&
      (fault !== 'restEcho' || reloadPending || result.dataset.dialogueSurvivedRespawn === 'true') &&
      (!isReloadCase || result.dataset.restoredDeaths === String(expectedDeaths)) ? 'completed' : 'unexpected-deaths';
  }
});
const game = createGame({ inputController, progressStore, playtestDriver: {
  reset: (actions) => driver.reset(actions),
  update: (frame, actions) => {
    lastFrame = frame;
    driver.update(frame, actions);
    if (fault === 'finish' && frame.x >= 2_780 && frame.x < 2_820 && progressStore.snapshot.totalDeaths < 7) {
      actions.releaseSource('playtest:zero-assist:right');
    }
    if (fault === 'restHammer' && frame.x >= 2_534 && frame.x < 2_558 && progressStore.snapshot.totalDeaths < 5) {
      actions.releaseSource('playtest:zero-assist:right');
      hammerArrivalMs ??= frame.timeMs ?? 0;
    }
    if (holdForReview && !reviewHeld &&
      ((fault === 'returnSweep' && frame.x >= 2_070) ||
        (fault === 'restEcho' && frame.x >= 2_626) ||
        (fault === 'restHammer' && hammerArrivalMs !== null && (frame.timeMs ?? 0) - hammerArrivalMs >= 150))) {
      reviewHeld = true;
      game.scene.pause('VerticalSliceScene');
      resumeReview.hidden = false;
      result.dataset.status = 'review-paused';
      result.textContent = '機關畫面已暫停，可檢查輪廓與落點後繼續驗證。';
      evidence.textContent = JSON.stringify({ testCase, reviewFrame: frame }, null, 2);
    }
    if (isPauseCase && !paused && frame.x >= (testCase === 'encorePause' ? 2_626 : testCase === 'returnPause' ? 2_070 : 1_830)) {
      paused = true;
      game.scene.pause('VerticalSliceScene');
      const pausedMessage = result.textContent;
      window.setTimeout(() => {
        result.dataset.pauseHeld = String(lastFrame === frame);
        result.dataset.dialoguePauseHeld = String(result.textContent === pausedMessage);
        game.scene.resume('VerticalSliceScene');
      }, 1_000);
    }
  },
} });
resumeReview.addEventListener('click', () => {
  resumeReview.hidden = true;
  result.dataset.status = 'running';
  game.scene.resume('VerticalSliceScene');
});
window.setTimeout(() => {
  if (result.dataset.status === 'running') {
    result.dataset.status = 'timeout';
    evidence.textContent += JSON.stringify({ lastFrame });
  }
}, 60_000);
window.addEventListener('beforeunload', () => {
  unsubscribe(); inputController.destroy(); game.destroy(true);
}, { once: true });
