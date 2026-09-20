import { createGame } from '../../src/game/config';
import { LEVEL_ONE_ID } from '../../src/game/content/levelOne';
import { LEVEL_ONE_TRAP_CAUSES } from '../../src/game/content/levelOneTraps';
import { subscribeToGameStatus } from '../../src/game/events';
import { InputController } from '../../src/game/input/InputController';
import { ProgressStore } from '../../src/game/state/progress';
import { requireTestElement } from './dom';
import { ZeroAssistDriver } from './ZeroAssistDriver';

const result = requireTestElement<HTMLOutputElement>('#playtest-result');
const evidence = requireTestElement<HTMLPreElement>('#trap-evidence');
const memory = new Map<string, string>();
const progressStore = new ProgressStore({
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => { memory.set(key, value); },
});
const inputController = new InputController();
const driver = new ZeroAssistDriver({ earlyLandingJump: true, jumpAtFalseGap: true });
const unsubscribe = subscribeToGameStatus((detail) => {
  const level = progressStore.snapshot.levels[LEVEL_ONE_ID];
  result.textContent = detail.message;
  result.dataset.deaths = String(detail.deaths);
  evidence.textContent = JSON.stringify({ deaths: detail.deaths,
    causes: level?.deathsByCause, blockers: level?.blockers }, null, 2);
  if (detail.phase !== 'completed') return;
  const causes = level?.deathsByCause ?? {};
  result.dataset.status = detail.deaths === 8 && causes[LEVEL_ONE_TRAP_CAUSES.ceiling] === 3 &&
    causes[LEVEL_ONE_TRAP_CAUSES.airAmbush] === 5 ? 'completed' : 'unexpected-deaths';
});
const game = createGame({ inputController, progressStore, playtestDriver: driver });
window.setTimeout(() => {
  if (result.dataset.status === 'running') result.dataset.status = 'timeout';
}, 60_000);
window.addEventListener('beforeunload', () => {
  unsubscribe();
  inputController.destroy();
  game.destroy(true);
}, { once: true });
