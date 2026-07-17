import { createGame } from '../../src/game/config';
import { LEVEL_ONE_ID } from '../../src/game/content/levelOne';
import { subscribeToGameStatus } from '../../src/game/events';
import { InputController } from '../../src/game/input/InputController';
import { ProgressStore } from '../../src/game/state/progress';
import { ZeroAssistDriver } from './ZeroAssistDriver';

const result = document.querySelector<HTMLOutputElement>('#playtest-result');
if (result === null) {
  throw new Error('Playtest result output is missing.');
}

const memory = new Map<string, string>();
const progressStore = new ProgressStore({
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => {
    memory.set(key, value);
  },
});
const inputController = new InputController();
const playtestDriver = new ZeroAssistDriver({ allowFirstGoalAmbush: true });
let sawRelocationMessage = false;
const unsubscribe = subscribeToGameStatus((detail) => {
  result.textContent = detail.message;
  result.dataset.deaths = String(detail.deaths);
  if (detail.message.includes('客服把終點搬近了')) {
    sawRelocationMessage = true;
    result.dataset.sawRelocation = 'true';
  }
  if (detail.phase !== 'completed') {
    return;
  }

  const level = progressStore.snapshot.levels[LEVEL_ONE_ID];
  const goalDeaths = level?.deathsByCause['goal-approval-stamp'] ?? 0;
  const passed = detail.deaths === 1 && goalDeaths === 1 && sawRelocationMessage;
  result.dataset.goalDeaths = String(goalDeaths);
  result.dataset.status = passed ? 'completed' : 'completed-with-invalid-mercy';
});

const game = createGame({ inputController, progressStore, playtestDriver });
window.setTimeout(() => {
  if (result.dataset.status === 'running') {
    result.dataset.status = 'timeout';
    result.textContent = '終點公開放水路線未在 24 秒內完成。';
  }
}, 24_000);

window.addEventListener(
  'beforeunload',
  () => {
    unsubscribe();
    inputController.destroy();
    game.destroy(true);
  },
  { once: true },
);
