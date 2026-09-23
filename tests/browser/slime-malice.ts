import { createGame } from '../../src/game/config';
import { LEVEL_ONE_ID } from '../../src/game/content/levelOne';
import { LEVEL_ONE_SLIMES } from '../../src/game/content/levelOneSlimes';
import { subscribeToGameStatus } from '../../src/game/events';
import { InputController } from '../../src/game/input/InputController';
import { createDefaultProgress, ProgressStore } from '../../src/game/state/progress';
import { advanceProgress } from '../../src/game/sympathy/director';
import type { PlaytestFrame } from '../../src/game/testing/PlaytestDriver';
import { requireTestElement } from './dom';
import { ZeroAssistDriver } from './ZeroAssistDriver';

const params = new URLSearchParams(location.search);
const testCase = params.get('case') ?? 'charger';
if (!['charger', 'jumper', 'pause', 'reload', 'revengeCharger', 'revengeJumper', 'revengePause', 'revengeReload'].includes(testCase)) throw new Error('未知的史萊姆測試');
const revenge = testCase.startsWith('revenge');
const pauseCase = testCase === 'pause' || testCase === 'revengePause';
const reloadCase = testCase === 'reload' || testCase === 'revengeReload';
const fault = pauseCase || testCase === 'charger' || testCase === 'revengeCharger' ? 'charger' : 'jumper';
const definition = LEVEL_ONE_SLIMES.find((entry) => entry.id === fault);
if (!definition) throw new Error('缺少小怪定義');
const result = requireTestElement<HTMLOutputElement>('#playtest-result');
const evidence = requireTestElement<HTMLPreElement>('#slime-evidence');
const resume = requireTestElement<HTMLButtonElement>('#resume-review');
const expectedCause = revenge ? definition.revengeCauseId : definition.causeId;
const namespace = `playtest:slime-${testCase}:`;
const reloadPending = reloadCase && sessionStorage.getItem(`${namespace}pending`) === 'yes';
const memory = new Map<string, string>();
const progressStore = new ProgressStore(reloadCase ? {
  getItem: (key) => reloadPending ? sessionStorage.getItem(namespace + key) : null,
  setItem: (key, value) => sessionStorage.setItem(namespace + key, value),
} : {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => { memory.set(key, value); },
});
if (reloadPending) {
  sessionStorage.removeItem(`${namespace}pending`);
  result.dataset.restoredDeaths = String(progressStore.snapshot.totalDeaths);
} else if (fault === 'jumper') {
  progressStore.replace(advanceProgress(createDefaultProgress(), LEVEL_ONE_ID, 'after-first-gap', 1));
}
const inputController = new InputController();
const driver = new ZeroAssistDriver(revenge ? params.get('review') === '1' ? {} :
  { slimeRevengeFault: definition.id } : { slimeFault: definition.id });
let lastFrame: PlaytestFrame | null = null;
let paused = false;
let reloading = false;
const unsubscribe = subscribeToGameStatus((detail) => {
  const level = progressStore.snapshot.levels[LEVEL_ONE_ID];
  result.textContent = detail.message;
  result.dataset.deaths = String(detail.deaths);
  evidence.textContent = JSON.stringify({ expectedCause, expectedDeaths: 5,
    causes: level?.deathsByCause, blockers: level?.blockers, lastFrame }, null, 2);
  if (reloadCase && !reloadPending && !reloading && detail.deaths === 5) {
    reloading = true;
    sessionStorage.setItem(`${namespace}pending`, 'yes');
    window.setTimeout(() => location.reload(), 50);
  }
  if (detail.phase === 'completed') {
    result.dataset.status = detail.deaths === 5 && level?.deathsByCause[expectedCause] === 5 &&
      (!pauseCase || result.dataset.pauseHeld === 'true') &&
      (!reloadCase || result.dataset.restoredDeaths === '5') ? 'completed' : 'unexpected-deaths';
  }
});
const game = createGame({ inputController, progressStore, playtestDriver: {
  reset: (actions) => driver.reset(actions),
  update: (frame, actions) => {
    lastFrame = frame;
    driver.update(frame, actions);
    const scene = game.scene.getScene('VerticalSliceScene');
    const reviewPhase = params.get('view') === 'sleep' ? '睡著了？' : fault === 'charger' ? '回頭追撞' : '再跳一次';
    const reachedPhase = revenge ? scene.children.list.some((child) => child instanceof Phaser.GameObjects.Text && child.text === reviewPhase &&
      (params.get('review') !== '1' || params.get('view') === 'sleep' ||
        child.x >= definition.x + definition.travelX + definition.revengeTravelX / 3)) : frame.x >= (fault === 'charger' ? 230 : 910);
    if (!paused && (pauseCase || params.get('review') === '1') && reachedPhase) {
      paused = true;
      game.scene.pause('VerticalSliceScene');
      if (params.get('review') === '1') {
        result.dataset.status = 'review-paused';
        result.textContent = '小怪出招畫面已暫停。';
        evidence.textContent = JSON.stringify({ fault, reviewPhase, reviewFrame: frame }, null, 2);
        resume.hidden = false;
      } else {
        window.setTimeout(() => {
          result.dataset.pauseHeld = String(lastFrame === frame);
          game.scene.resume('VerticalSliceScene');
        }, 1_000);
      }
    }
  },
} });
resume.addEventListener('click', () => {
  resume.hidden = true;
  result.dataset.status = 'running';
  game.scene.resume('VerticalSliceScene');
});
window.setTimeout(() => {
  if (result.dataset.status === 'running') result.dataset.status = 'timeout';
}, 60_000);
window.addEventListener('beforeunload', () => {
  unsubscribe(); inputController.destroy(); game.destroy(true);
}, { once: true });
import Phaser from 'phaser';
