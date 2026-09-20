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
const fault = testCase === 'pause' ? 'sweep' : testCase === 'reload' ? 'finish' : testCase;
if (!(fault in REAR_CAUSES)) throw new Error('Unknown rear gauntlet case');
const cause = REAR_CAUSES[fault as keyof typeof REAR_CAUSES];
const expectedDeaths = fault === 'step' ? 3 : fault === 'sweep' ? 5 : 7;
// An early final jump still lands on the last trap after ceiling assistance.
const expectedCauses: Readonly<Record<string, number>> = fault === 'ceiling'
  ? { [cause]: 5, [REAR_CAUSES.finish]: 2 } : { [cause]: expectedDeaths };
const result = requireTestElement<HTMLOutputElement>('#playtest-result');
const evidence = requireTestElement<HTMLPreElement>('#rear-evidence');
const namespace = 'playtest:rear-reload:';
const reloadPending = testCase === 'reload' && sessionStorage.getItem(`${namespace}pending`) === 'yes';
const memory = new Map<string, string>();
const progressStore = new ProgressStore(testCase === 'reload' ? {
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
const driver = new ZeroAssistDriver({ rearFault: fault === 'finish' ? undefined : fault as 'step' | 'sweep' | 'exit' | 'ceiling' });
let lastFrame: PlaytestFrame | null = null;
let paused = false;
let reloading = false;
const unsubscribe = subscribeToGameStatus((detail) => {
  const level = progressStore.snapshot.levels[LEVEL_ONE_ID];
  result.textContent = detail.message;
  result.dataset.deaths = String(detail.deaths);
  evidence.textContent = JSON.stringify({ expectedDeaths, expectedCauses, causes: level?.deathsByCause, blockers: level?.blockers, lastFrame }, null, 2);
  if (testCase === 'reload' && !reloadPending && !reloading && detail.deaths === 7) {
    reloading = true;
    sessionStorage.setItem(`${namespace}pending`, 'yes');
    window.setTimeout(() => location.reload(), 50);
  }
  if (detail.phase === 'completed') {
    result.dataset.status = detail.deaths === expectedDeaths && Object.entries(expectedCauses).every(([id, count]) => level?.deathsByCause[id] === count) &&
      (testCase !== 'pause' || result.dataset.pauseHeld === 'true') &&
      (testCase !== 'reload' || result.dataset.restoredDeaths === '7') ? 'completed' : 'unexpected-deaths';
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
    if (testCase === 'pause' && !paused && frame.x >= 1_830) {
      paused = true;
      game.scene.pause('VerticalSliceScene');
      window.setTimeout(() => {
        result.dataset.pauseHeld = String(lastFrame === frame);
        game.scene.resume('VerticalSliceScene');
      }, 1_000);
    }
  },
} });
window.setTimeout(() => {
  if (result.dataset.status === 'running') {
    result.dataset.status = 'timeout';
    evidence.textContent += JSON.stringify({ lastFrame });
  }
}, 60_000);
window.addEventListener('beforeunload', () => {
  unsubscribe(); inputController.destroy(); game.destroy(true);
}, { once: true });
