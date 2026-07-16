import { createGame } from '../../src/game/config';
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
const playtestDriver = new ZeroAssistDriver();
const unsubscribe = subscribeToGameStatus((detail) => {
  result.textContent = detail.message;
  result.dataset.deaths = String(detail.deaths);
  if (detail.phase === 'completed') {
    result.dataset.status = detail.deaths === 0 ? 'completed' : 'completed-with-deaths';
  }
});

const game = createGame({ inputController, progressStore, playtestDriver });
window.setTimeout(() => {
  if (result.dataset.status === 'running') {
    result.dataset.status = 'timeout';
    result.textContent = '零援助自動路線未在 20 秒內完成。';
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
