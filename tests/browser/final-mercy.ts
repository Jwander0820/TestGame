import Phaser from 'phaser';
import { createGame } from '../../src/game/config';
import { LEVEL_ONE_ID, LEVEL_ONE_REACTIONS } from '../../src/game/content/levelOne';
import { subscribeToGameStatus } from '../../src/game/events';
import { InputController } from '../../src/game/input/InputController';
import { ProgressStore, createDefaultProgress } from '../../src/game/state/progress';
import { hasFinalMercy } from '../../src/game/state/FinalMercy';
import { advanceProgress, recordDeath } from '../../src/game/sympathy/director';
import { ZeroAssistDriver } from './ZeroAssistDriver';
import { requireTestElement } from './dom';

const params = new URLSearchParams(location.search);
const mode = params.get('case') ?? 'fresh';
if (!['fresh', 'left', 'audit', 'reload'].includes(mode)) throw new Error('未知測試');
const result = requireTestElement<HTMLOutputElement>('#playtest-result');
const evidence = requireTestElement<HTMLPreElement>('#evidence');
const resume = requireTestElement<HTMLButtonElement>('#resume-review');
const key = 'test:final-mercy:reload';
const restored = mode === 'reload' ? sessionStorage.getItem(key) : null;
if (restored) sessionStorage.removeItem(key);
const store = new ProgressStore({ getItem: () => restored, setItem: () => undefined });
if (!restored && mode === 'audit') store.replace(advanceProgress(createDefaultProgress(), LEVEL_ONE_ID, 'after-first-gap', 1));
if (!restored && mode === 'reload') {
  let state = createDefaultProgress();
  for (let i = 1; i <= 20; i++) state = recordDeath(state, { id: `seed-${i}`, levelId: LEVEL_ONE_ID,
    causeId: 'backtrack-exit', blockerId: 'backtrack', x: -80, y: 580, progressMarkerId: 'start', attempt: i, occurredAt: i }, LEVEL_ONE_REACTIONS).state;
  store.replace(advanceProgress(state, LEVEL_ONE_ID, 'after-warning-strip', 2));
}
result.dataset.restored = String(!!restored);
const input = new InputController();
const learned = new ZeroAssistDriver();
let jumpCommands = 0, finalJumpCommands = 0, paused = false, reloading = false;
let retreatStarted = false;
const unsubscribe = subscribeToGameStatus(detail => {
  if (detail.phase === 'dying') { retreatStarted = false; input.actions.releaseAll(); }
  result.textContent = detail.message;
  result.dataset.deaths = String(detail.deaths);
  result.dataset.redCarpet = String(hasFinalMercy(store.snapshot));
  const causes = store.snapshot.levels[LEVEL_ONE_ID]?.deathsByCause ?? {};
  result.dataset.causes = JSON.stringify(causes);
  if (mode === 'reload' && !restored && !reloading && detail.deaths === 21) {
    reloading = true; sessionStorage.setItem(key, JSON.stringify(store.snapshot));
    setTimeout(() => location.reload(), 50);
  }
  if (detail.phase === 'completed') {
    const pass = mode === 'audit' ? detail.deaths === 5 && causes['backtrack-audit'] === 5 :
      detail.deaths === 21 && hasFinalMercy(store.snapshot) && finalJumpCommands === 0 &&
      (mode !== 'fresh' || jumpCommands === 0) && (mode !== 'reload' || !!restored) &&
      (mode !== 'left' || causes['backtrack-exit'] === 21);
    result.dataset.status = pass ? 'completed' : 'unexpected';
  }
});
const game = createGame({ inputController: input, progressStore: store, playtestDriver: {
  reset(actions) { actions.releaseAll(); learned.reset(actions); },
  update(frame, actions) {
    const final = hasFinalMercy(store.snapshot);
    const backtrack = (mode === 'left' || mode === 'reload') && !final || mode === 'audit' && store.snapshot.totalDeaths < 5;
    actions.releaseSource('test:mercy:left'); actions.releaseSource('test:mercy:right'); actions.releaseSource('test:mercy:jump');
    if (backtrack) {
      // 先讓 checkpoint 出生落地，否則尚未起跳就走出平台會只測到跌落。
      if (frame.grounded || retreatStarted) actions.press('left', 'test:mercy:left');
      if (frame.grounded) { retreatStarted = true; actions.press('jump', 'test:mercy:jump'); jumpCommands++; if (final) finalJumpCommands++; }
    } else if (mode === 'audit' && !final) learned.update(frame, actions);
    else actions.press('right', 'test:mercy:right');
    evidence.textContent = JSON.stringify({ mode, frame, jumpCommands, finalJumpCommands,
      progressOrder: store.snapshot.levels[LEVEL_ONE_ID]?.progressOrder, final }, null, 2);
    const seal = game.scene.getScene('VerticalSliceScene').children.list.find((child) =>
      child instanceof Phaser.GameObjects.Text && child.text === '退\n件' && child.visible && child.y > 240);
    if (params.get('review') === '1' && !paused && seal) {
      paused = true; game.scene.pause('VerticalSliceScene'); result.dataset.status = 'review-paused'; resume.hidden = false;
    }
  },
} });
resume.addEventListener('click', () => { resume.hidden = true; result.dataset.status = 'running'; game.scene.resume('VerticalSliceScene'); });
setTimeout(() => { if (result.dataset.status === 'running') result.dataset.status = 'timeout'; }, 150_000);
window.addEventListener('beforeunload', () => { unsubscribe(); input.destroy(); game.destroy(true); }, { once: true });
