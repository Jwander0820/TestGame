import { createGame } from '../../src/game/config';
import { LEVEL_ONE_ID, LEVEL_ONE_REACTIONS } from '../../src/game/content/levelOne';
import { InputController } from '../../src/game/input/InputController';
import { ProgressStore, createDefaultProgress } from '../../src/game/state/progress';
import { advanceProgress, recordDeath } from '../../src/game/sympathy/director';
import { createMaxAssistanceProgress } from './maxAssistanceState';
import { subscribeToGameStatus } from '../../src/game/events';
import { requireTestElement } from './dom';

const inputController = new InputController();
inputController.attach();
const progressStore = new ProgressStore({ getItem: () => null, setItem: () => undefined });
const game = createGame({ inputController, progressStore });
const buttons = document.querySelectorAll<HTMLButtonElement>('[data-state]');
const label = document.querySelector<HTMLElement>('#art-state');
const unsubscribe = subscribeToGameStatus((detail) => {
  if (label) label.textContent = `陣亡 ${detail.deaths} 次 · ${detail.message}`;
});
const releaseTouch = (['left', 'right', 'jump'] as const).map((action) =>
  inputController.bindTouchButton(requireTestElement<HTMLButtonElement>(`[data-action="${action}"]`), action));

for (const button of buttons) {
  button.addEventListener('click', () => {
    inputController.actions.releaseAll();
    let state = createDefaultProgress();
    if (button.dataset.state === 'max') state = createMaxAssistanceProgress();
    if (button.dataset.state === 'rear') state = advanceProgress(state, LEVEL_ONE_ID, 'after-warning-strip', 2);
    if (button.dataset.state === 'slimes') state = advanceProgress(state, LEVEL_ONE_ID, 'after-first-gap', 1);
    if (button.dataset.state === 'first') {
      state = recordDeath(state, {
        id: 'art-review-first-death', levelId: LEVEL_ONE_ID,
        blockerId: 'first-gap', causeId: 'fell-out-of-world',
        x: 500, y: 560, progressMarkerId: 'start', attempt: 1, occurredAt: 1000,
      }, LEVEL_ONE_REACTIONS).state;
    }
    progressStore.replace(state);
    game.scene.getScene('VerticalSliceScene').scene.restart();
    for (const item of buttons) item.setAttribute('aria-pressed', String(item === button));
    if (label) label.textContent = `${button.textContent} · 陣亡 ${state.totalDeaths} 次`;
  });
}

window.addEventListener('beforeunload', () => {
  unsubscribe();
  releaseTouch.forEach((release) => release());
  inputController.destroy();
  game.destroy(true);
}, { once: true });
