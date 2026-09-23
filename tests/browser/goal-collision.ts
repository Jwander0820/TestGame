import Phaser from 'phaser';
import { createGame } from '../../src/game/config';
import { LEVEL_ONE_ID } from '../../src/game/content/levelOne';
import { InputController } from '../../src/game/input/InputController';
import { ProgressStore, createDefaultProgress } from '../../src/game/state/progress';
import { advanceProgress } from '../../src/game/sympathy/director';
import { subscribeToGameStatus } from '../../src/game/events';
import { ZeroAssistDriver } from './ZeroAssistDriver';
import { requireTestElement } from './dom';

const result = requireTestElement<HTMLOutputElement>('#result');
const evidence = requireTestElement<HTMLElement>('#evidence');
const mode = new URLSearchParams(location.search).get('case') ?? 'rush';
const reloadKey = 'test:goal-collision:reload';
const restored = mode === 'reload' ? sessionStorage.getItem(reloadKey) : null;
const store = new ProgressStore({ getItem: () => restored, setItem: () => undefined });
if (!restored) store.replace(advanceProgress(createDefaultProgress(), LEVEL_ONE_ID, 'after-intern-bridge', 3));
if (restored) sessionStorage.removeItem(reloadKey);
result.dataset.restored = String(restored !== null);
let paused = false;
let lastTime = 0;
let reloading = false;
let lastFrame: unknown = null;
const input = new InputController();
const driver = new ZeroAssistDriver({ rushGoalStamp: mode === 'rush' || mode === 'reload', goalWaitMs: mode === 'second' ? 900 : undefined });
let overlaps = 0;
let firstOverlap: unknown = null;
const unsubscribe = subscribeToGameStatus(detail => {
  result.dataset.deaths = String(detail.deaths);
  if (detail.phase === 'dying') result.dataset.deathFrame = JSON.stringify(lastFrame);
  result.textContent = detail.message;
  const causes = store.snapshot.levels[LEVEL_ONE_ID]?.deathsByCause;
  result.dataset.causes = JSON.stringify(causes);
  if (mode === 'reload' && !restored && !reloading && detail.deaths === 1) {
    reloading = true;
    sessionStorage.setItem(reloadKey, JSON.stringify(store.snapshot));
    window.setTimeout(() => location.reload(), 40);
  }
  if (detail.phase === 'completed') {
    const expected = ['rush', 'second', 'reload'].includes(mode) ? 1 : 0;
    result.dataset.status = detail.deaths === expected && (expected === 0 || causes?.['goal-approval-stamp'] === 1) &&
      (mode !== 'pause' || result.dataset.pauseHeld === 'true') && (mode !== 'reload' || restored !== null) ? 'completed' : 'unexpected';
  }
});
const game = createGame({ inputController: input, progressStore: store, playtestDriver: {
  reset: actions => driver.reset(actions),
  update: (frame, actions) => {
    driver.update(frame, actions);
    lastFrame = frame;
    lastTime = frame.timeMs ?? 0;
    if (mode === 'pause' && !paused && frame.x >= 2626) {
      paused = true;
      const before = lastTime;
      game.scene.pause('VerticalSliceScene');
      window.setTimeout(() => { result.dataset.pauseHeld = String(lastTime === before); game.scene.resume('VerticalSliceScene'); }, 700);
    }
    const scene = game.scene.getScene('VerticalSliceScene');
    const seal = scene.children.list.find((child): child is Phaser.GameObjects.Rectangle =>
      child instanceof Phaser.GameObjects.Rectangle && child.width === 76 && child.height === 84);
    const player = scene.children.list.find((child): child is Phaser.Physics.Arcade.Sprite =>
      child instanceof Phaser.Physics.Arcade.Sprite && child.body?.width === 28);
    if (seal && player?.body && seal.y > 125 && seal.y < 350 &&
      Phaser.Geom.Intersects.RectangleToRectangle(seal.getBounds(), new Phaser.Geom.Rectangle(player.body.x, player.body.y, player.body.width, player.body.height))) {
      overlaps++;
      firstOverlap ??= { frame, seal: { x: seal.x, y: seal.y }, deaths: store.snapshot.totalDeaths };
    }
    evidence.textContent = JSON.stringify({ overlaps, firstOverlap, causes: store.snapshot.levels[LEVEL_ONE_ID]?.deathsByCause, frame }, null, 2);
  },
} });
window.addEventListener('beforeunload', () => { unsubscribe(); input.destroy(); game.destroy(true); }, { once: true });
