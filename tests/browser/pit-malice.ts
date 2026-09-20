import { createGame } from '../../src/game/config';
import { LEVEL_ONE_ID } from '../../src/game/content/levelOne';
import { FIRST_PIT_CAUSES } from '../../src/game/content/firstPitAmbush';
import { subscribeToGameStatus } from '../../src/game/events';
import { InputController } from '../../src/game/input/InputController';
import { ProgressStore } from '../../src/game/state/progress';
import { requireTestElement } from './dom';
import { ZeroAssistDriver } from './ZeroAssistDriver';
import { ReverseEasterEggDriver } from './ReverseEasterEggDriver';
import type { PlaytestFrame } from '../../src/game/testing/PlaytestDriver';

const testCase = new URLSearchParams(location.search).get('case') ?? 'riser';
const expected = testCase === 'coin' ? { cause: FIRST_PIT_CAUSES.coin, deaths: 1 } :
  testCase === 'brick' ? { cause: FIRST_PIT_CAUSES.brick, deaths: 3 } : { cause: FIRST_PIT_CAUSES.riser, deaths: 5 };
const result = requireTestElement<HTMLOutputElement>('#playtest-result');
const evidence = requireTestElement<HTMLPreElement>('#pit-evidence');
const memory = new Map<string, string>();
const progressStore = new ProgressStore({
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => { memory.set(key, value); },
});
const inputController = new InputController();
const driver = testCase === 'coin' ? new ReverseEasterEggDriver(true) :
  new ZeroAssistDriver({ rushFirstPit: testCase !== 'brick', lateFirstPitJump: testCase === 'brick' });
let pausedOnce = false;
let lastFrame: PlaytestFrame | null = null;
const unsubscribe = subscribeToGameStatus((detail) => {
  const level = progressStore.snapshot.levels[LEVEL_ONE_ID];
  result.textContent = detail.message;
  result.dataset.deaths = String(detail.deaths);
  result.dataset.expectedCause = expected.cause;
  evidence.textContent = JSON.stringify({ expected, causes: level?.deathsByCause, blockers: level?.blockers }, null, 2);
  if (detail.phase === 'completed') {
    result.dataset.status = detail.deaths === expected.deaths && level?.deathsByCause[expected.cause] === expected.deaths &&
      (testCase !== 'pause' || result.dataset.pauseHeld === 'true')
      ? 'completed' : 'unexpected-deaths';
  }
});
const game = createGame({ inputController, progressStore, playtestDriver: {
  reset: (actions) => driver.reset(actions),
  update: (frame, actions) => {
    lastFrame = frame;
    driver.update(frame, actions);
    if (testCase === 'pause' && !pausedOnce && frame.x >= 420) {
      pausedOnce = true;
      game.scene.pause('VerticalSliceScene');
      result.dataset.pauseState = 'paused';
      window.setTimeout(() => {
        result.dataset.pauseHeld = String(lastFrame === frame);
        result.dataset.pauseState = 'resumed';
        game.scene.resume('VerticalSliceScene');
      }, 1_000);
    }
  },
} });
window.setTimeout(() => {
  if (result.dataset.status === 'running') result.dataset.status = 'timeout';
}, 60_000);
window.addEventListener('beforeunload', () => {
  unsubscribe(); inputController.destroy(); game.destroy(true);
}, { once: true });
