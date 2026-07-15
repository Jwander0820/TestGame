import './styles.css';
import { createGame } from './game/config';
import { subscribeToGameStatus } from './game/events';
import { InputController } from './game/input/InputController';
import type { GameAction } from './game/input/ActionState';
import { ProgressStore } from './game/state/progress';

const deathCount = document.querySelector<HTMLElement>('#death-count');
const gameStatus = document.querySelector<HTMLElement>('#game-status');
const gameRoot = document.querySelector<HTMLElement>('#game-root');

if (deathCount === null || gameStatus === null || gameRoot === null) {
  throw new Error('必要的遊戲介面不存在。');
}

const inputController = new InputController();
inputController.attach();

const touchCleanups = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-action]')).map((button) => {
  const action = button.dataset.action as GameAction | undefined;
  if (action === undefined) {
    return () => undefined;
  }
  return inputController.bindTouchButton(button, action);
});

const unsubscribe = subscribeToGameStatus((detail) => {
  deathCount.textContent = String(detail.deaths);
  gameStatus.textContent = detail.message;
});

const progressStore = new ProgressStore(window.localStorage);
deathCount.textContent = String(progressStore.snapshot.totalDeaths);

const game = createGame({ inputController, progressStore });
gameRoot.focus({ preventScroll: true });

window.addEventListener(
  'beforeunload',
  () => {
    unsubscribe();
    touchCleanups.forEach((cleanup) => cleanup());
    inputController.destroy();
    game.destroy(true);
  },
  { once: true },
);
