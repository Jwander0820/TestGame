import { createGame } from '../../src/game/config';
import { LEVEL_ONE_ID } from '../../src/game/content/levelOne';
import { subscribeToGameStatus } from '../../src/game/events';
import { InputController } from '../../src/game/input/InputController';
import { ProgressStore } from '../../src/game/state/progress';
import { RightOnlyDriver } from './RightOnlyDriver';
import { createMaxAssistanceProgress } from './maxAssistanceState';

const EXPECTED_DEATHS = 21;
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
progressStore.replace(createMaxAssistanceProgress());

const inputController = new InputController();
const playtestDriver = new RightOnlyDriver();
let lastSeenDeaths = EXPECTED_DEATHS;
const unsubscribe = subscribeToGameStatus((detail) => {
  result.textContent = detail.message;
  result.dataset.deaths = String(detail.deaths);
  if (detail.deaths > lastSeenDeaths) {
    result.dataset.lastDeathMessage = detail.message;
    result.dataset.lastDeathX = String(Math.round(playtestDriver.lastFrame?.x ?? -1));
    result.dataset.lastDeathY = String(Math.round(playtestDriver.lastFrame?.y ?? -1));
    lastSeenDeaths = detail.deaths;
  }
  if (detail.phase === 'completed') {
    result.dataset.deathCauses = JSON.stringify(progressStore.snapshot.levels[LEVEL_ONE_ID]?.deathsByCause ?? {});
    result.dataset.status = detail.deaths === EXPECTED_DEATHS ? 'completed' : 'completed-with-extra-deaths';
  }
});

const game = createGame({ inputController, progressStore, playtestDriver });
window.setTimeout(() => {
  if (result.dataset.status === 'running') {
    result.dataset.status = 'timeout';
    result.dataset.lastX = String(Math.round(playtestDriver.lastFrame?.x ?? -1));
    result.dataset.lastY = String(Math.round(playtestDriver.lastFrame?.y ?? -1));
    result.dataset.lastGrounded = String(playtestDriver.lastFrame?.grounded ?? false);
    result.textContent = '最高援助自動路線未在 25 秒內完成。';
  }
}, 25_000);

window.addEventListener(
  'beforeunload',
  () => {
    unsubscribe();
    inputController.destroy();
    game.destroy(true);
  },
  { once: true },
);
