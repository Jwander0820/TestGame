import Phaser from 'phaser';
import { createGame } from '../../src/game/config';
import { LEVEL_ONE_ID } from '../../src/game/content/levelOne';
import { FEINT_DEATH, FEINT_PLATFORM as floor } from '../../src/game/content/feintPlatform';
import { subscribeToGameStatus } from '../../src/game/events';
import { InputController } from '../../src/game/input/InputController';
import { createDefaultProgress, ProgressStore } from '../../src/game/state/progress';
import { advanceProgress } from '../../src/game/sympathy/director';
import type { PlaytestFrame } from '../../src/game/testing/PlaytestDriver';
import { requireTestElement } from './dom';
import { ZeroAssistDriver } from './ZeroAssistDriver';

const params = new URLSearchParams(location.search);
const testCase = params.get('case') ?? 'learned';
if (!['learned', 'rush', 'pause', 'reload'].includes(testCase)) throw new Error('未知地板驗證案例');
const review = params.get('review') === '1';
const result = requireTestElement<HTMLOutputElement>('#playtest-result');
const evidence = requireTestElement<HTMLPreElement>('#feint-evidence');
const resume = requireTestElement<HTMLButtonElement>('#resume-review');
const namespace = 'playtest:feint:';
const reload = testCase === 'reload';
const restored = reload && sessionStorage.getItem(namespace + 'pending') === 'yes';
const memory = new Map<string, string>();
const store = new ProgressStore(reload ? {
  getItem: key => restored ? sessionStorage.getItem(namespace + key) : null,
  setItem: (key, value) => sessionStorage.setItem(namespace + key, value),
} : { getItem: key => memory.get(key) ?? null, setItem: (key, value) => { memory.set(key, value); } });
if (!restored) store.replace(advanceProgress(createDefaultProgress(), LEVEL_ONE_ID, 'after-warning-strip', 2));
else { sessionStorage.removeItem(namespace + 'pending'); result.dataset.restoredDeaths = String(store.snapshot.totalDeaths); }
const input = new InputController();
const driver = new ZeroAssistDriver({ rushFeint: testCase === 'rush' || reload });
let lastFrame: PlaytestFrame | null = null;
let pauseDone = false;
let reloading = false;
const expectedDeaths = testCase === 'rush' || reload ? 3 : 0;
let sawDodge = false;
let sawReturn = false;
let sawSpent = false;
let sawRetired = false;
let recordedAt = 0;
let geometryHeld = true;
const inspect = () => {
  const platform = game.scene.getScene('VerticalSliceScene').children.list.find(child =>
    child instanceof Phaser.Physics.Arcade.Sprite && child.y === floor.y && Math.abs(child.displayWidth - floor.width) < 0.1);
  if (!(platform instanceof Phaser.Physics.Arcade.Sprite) || !(platform.body instanceof Phaser.Physics.Arcade.StaticBody)) return null;
  return { x: platform.x, colliderX: platform.body.center.x, enabled: platform.body.enable };
};
const record = () => {
  evidence.textContent = JSON.stringify({ testCase, expectedDeaths, sawDodge, sawReturn, sawSpent, sawRetired,
    geometryHeld, inspection: inspect(), pauseHeld: result.dataset.pauseHeld, lastFrame,
    causes: store.snapshot.levels[LEVEL_ONE_ID]?.deathsByCause }, null, 2);
};
const unsubscribe = subscribeToGameStatus(detail => {
  result.textContent = detail.message;
  result.dataset.deaths = String(detail.deaths);
  if (reload && !restored && !reloading && detail.deaths === 3) {
    reloading = true; sessionStorage.setItem(namespace + 'pending', 'yes');
    window.setTimeout(() => location.reload(), 50);
  }
  if (detail.phase === 'completed') {
    const causeCount = store.snapshot.levels[LEVEL_ONE_ID]?.deathsByCause[FEINT_DEATH.causeId] ?? 0;
    result.dataset.status = geometryHeld && detail.deaths === expectedDeaths && causeCount === expectedDeaths &&
      (expectedDeaths === 0 ? sawSpent : sawRetired) &&
      (testCase !== 'pause' || result.dataset.pauseHeld === 'true') ? 'completed' : 'unexpected-result';
    record();
  }
});
const game = createGame({ inputController: input, progressStore: store, playtestDriver: {
  reset: actions => driver.reset(actions),
  update: (frame, actions) => {
    lastFrame = frame;
    const geometry = inspect();
    geometryHeld &&= geometry !== null && geometry.x === Math.round(frame.feint?.x ?? NaN) &&
      Math.abs(geometry.colliderX - geometry.x) < 0.01;
    sawDodge ||= frame.feint?.phase === 'dodging';
    sawReturn ||= frame.feint?.phase === 'returning';
    sawSpent ||= frame.feint?.phase === 'spent';
    sawRetired ||= frame.feint?.phase === 'retired';
    if ((frame.timeMs ?? 0) - recordedAt >= 250) { recordedAt = frame.timeMs ?? 0; record(); }
    driver.update(frame, actions);
    if ((testCase === 'pause' || review) && !pauseDone && frame.feint?.phase === 'holding') {
      pauseDone = true;
      game.scene.pause('VerticalSliceScene');
      const frozen = JSON.stringify(inspect());
      record();
      if (review) {
        resume.hidden = false; result.dataset.status = 'review-paused';
        result.textContent = '地板剛剛閃開；原落點與滑軌可在此檢視。';
      } else window.setTimeout(() => {
        result.dataset.pauseHeld = String(lastFrame === frame && JSON.stringify(inspect()) === frozen);
        game.scene.resume('VerticalSliceScene');
      }, 1_000);
    }
  },
} });
resume.addEventListener('click', () => {
  resume.hidden = true; result.dataset.status = 'running';
  const frame = lastFrame;
  const frozen = JSON.stringify(inspect());
  window.setTimeout(() => { result.dataset.pauseHeld = String(lastFrame === frame && JSON.stringify(inspect()) === frozen); game.scene.resume('VerticalSliceScene'); }, 1_000);
});
window.setTimeout(() => {
  if (result.dataset.status === 'running') { result.dataset.status = 'timeout'; record(); }
}, 60_000);
window.addEventListener('beforeunload', () => { unsubscribe(); input.destroy(); game.destroy(true); }, { once: true });
