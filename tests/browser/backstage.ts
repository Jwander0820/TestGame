import { createGame } from '../../src/game/config';
import { LEVEL_ONE_ID } from '../../src/game/content/levelOne';
import { LevelOneSession } from '../../src/game/session/LevelOneSession';
import { advanceProgress } from '../../src/game/sympathy/director';
import { BACKSTAGE } from '../../src/game/content/backstage';
import { subscribeToGameStatus } from '../../src/game/events';
import { InputController } from '../../src/game/input/InputController';
import type { GameAction } from '../../src/game/input/ActionState';
import { ProgressStore, PROGRESS_STORAGE_KEY, createDefaultProgress } from '../../src/game/state/progress';
import { createMaxAssistanceProgress } from './maxAssistanceState';
import { BackstageDriver } from './BackstageDriver';
import { requireTestElement } from './dom';

const style = document.createElement('style');
style.textContent = 'body{margin:0;background:#14232b;color:#fff3d6;font-family:system-ui}main{max-width:960px;margin:auto}h1{font-size:20px;margin:8px}#game-root{width:100%;aspect-ratio:16/9}output{display:block;min-height:3em;padding:8px;white-space:pre-line}button{min-height:56px;margin:6px;padding:8px 16px;background:#fff3d6;color:#14232b;border:3px solid #86613e;font:inherit;touch-action:none}button:focus-visible{outline:3px solid #62d4d6}nav{display:flex;justify-content:space-between}';
document.head.append(style);
const params = new URLSearchParams(location.search);
const mode = params.get('case') ?? 'dodge';
const output = requireTestElement<HTMLOutputElement>('#playtest-result');
const prefix = `playtest:backstage:${mode}:`;
const storage = { getItem: (key: string) => sessionStorage.getItem(prefix + key), setItem: (key: string, value: string) => sessionStorage.setItem(prefix + key, value) };
const isReload = performance.getEntriesByType('navigation').some(entry => entry instanceof PerformanceNavigationTiming && entry.type === 'reload');
if (mode !== 'reload' || !isReload || sessionStorage.getItem(prefix + 'reloaded') !== 'true') {
  sessionStorage.removeItem(prefix + 'reloaded');
  const initial = mode === 'max' || mode === 'checkpoint' ? createMaxAssistanceProgress() : createDefaultProgress();
  storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(mode === 'checkpoint' ? advanceProgress(initial, LEVEL_ONE_ID, 'after-first-gap', 1) : initial));
}
const store = new ProgressStore(storage);
if (mode === 'five' && store.snapshot.totalDeaths === 0) {
  const session = new LevelOneSession(store);
  for (let i = 0; i < 5; i++) session.recordDeath({ causeId: 'bait-coin-burst', blockerId: 'first-gap', x: 45, y: 225 }, () => true);
}
const before = store.snapshot;
const input = new InputController(); input.attach();
const route = new BackstageDriver(mode);
let manual = false;
let roomSnapshot = '';
let reviewPaused = false;
let pauseVerified = false;
let mainTimeAtEntry = 0;
let recovered = false;
let previousRoomX = 790;
let springs = 0;
let bells = 0;
let catches = 0;
let workerChanges = 0;
const workshopMode = mode === 'workshop' || mode === 'springPause';
const observed = new Set<string>();
let firstMessages = 0;
let repeatMessages = 0;
const unsubscribe = subscribeToGameStatus(detail => {
  output.textContent = detail.message;
  output.dataset.deaths = String(detail.deaths);
  if (detail.message.includes('你不該在這裡')) firstMessages++;
  if (detail.message.includes('又是你')) repeatMessages++;
  if (detail.message.includes('報不同的表') || detail.message.includes('招牌還沒固定')) observed.add('sign');
  if (detail.message.includes('美術交的是金幣')) observed.add('desk');
  if (detail.message.includes('拿來過驗收')) observed.add('spikes');
  if (detail.message.includes('領時薪')) observed.add('slime');
  if (detail.phase === 'completed') {
    output.dataset.visits = String(route.visits);
    output.dataset.eggCount = String(store.snapshot.discoveredEasterEggIds.filter(id => id === BACKSTAGE.egg).length);
    output.dataset.observed = [...observed].join(',');
    output.dataset.recovered = String(recovered);
    output.dataset.firstMessages = String(firstMessages); output.dataset.repeatMessages = String(repeatMessages);
    output.dataset.springs = String(springs); output.dataset.bells = String(bells);
    output.dataset.catches = String(catches); output.dataset.workerChanges = String(workerChanges);
    const roomExpected = mode === 'immediate' ? route.visits === 1 : mode === 'repeat' ? route.visits === 2 : route.visits === 1;
    const contentExpected = mode === 'immediate' || ['desk', 'spikes', 'slime'].every(key => observed.has(key));
    output.dataset.status = detail.deaths === before.totalDeaths && roomExpected && contentExpected &&
      output.dataset.isolated === 'true' && output.dataset.mainFrozen === 'true' && output.dataset.eggCount === '1' &&
      (mode !== 'hit' || recovered) && (mode !== 'pause' && mode !== 'springPause' || pauseVerified) &&
      (!workshopMode || (springs === 3 && bells === 3 && catches >= 3 && workerChanges >= 4)) &&
      (mode !== 'reload' || (firstMessages === 0 && repeatMessages === 1 && sessionStorage.getItem(prefix + 'reloaded') === 'true')) ? 'completed' : 'failed';
  }
});
const game = createGame({ inputController: input, progressStore: store, playtestDriver: {
  reset: actions => route.reset(actions),
  update: (frame, actions) => {
    output.dataset.area = frame.area ?? 'main'; output.dataset.frame = JSON.stringify(frame); output.dataset.driver = route.phase;
    if (frame.area === 'main') mainTimeAtEntry = frame.timeMs ?? 0;
    if (!manual) route.update(frame, actions);
    if (frame.area === 'backstage') {
      if (mode === 'reload' && !sessionStorage.getItem(prefix + 'reloaded') && frame.x < 540) {
        sessionStorage.setItem(prefix + 'reloaded', 'true'); location.reload(); return;
      }
      if (frame.x - previousRoomX > 60 && mode === 'hit') recovered = true;
      previousRoomX = frame.x;
      if ((params.has('review') || mode === 'pause' || mode === 'springPause') && !reviewPaused &&
        (mode === 'springPause' ? frame.x < 400 && frame.y < 280 : frame.x < 754)) {
        reviewPaused = true; game.scene.pause(BACKSTAGE.scene); output.dataset.status = 'review-paused';
        if (mode === 'pause' || mode === 'springPause') {
          const frozen = output.dataset.frame;
          const frozenCounts = `${springs}:${bells}:${catches}`;
          window.setTimeout(() => {
            pauseVerified = frozen === output.dataset.frame && game.scene.isSleeping('VerticalSliceScene') && frozenCounts === `${springs}:${bells}:${catches}`;
            output.dataset.pauseHeld = String(pauseVerified); game.scene.resume(BACKSTAGE.scene); output.dataset.status = 'running';
          }, 750);
        }
      }
    }
  },
} });
game.events.on('backstage-spring', () => { springs++; output.dataset.springs = String(springs); });
game.events.on('backstage-bell', (count: number) => { bells = count; output.dataset.bells = String(bells); });
game.events.on('backstage-worker', (_working: boolean, count: number) => {
  catches = count; workerChanges++; output.dataset.catches = String(catches); output.dataset.workerChanges = String(workerChanges);
});
game.events.on('backstage-discovered', () => {
  roomSnapshot = JSON.stringify(store.snapshot.levels);
  output.dataset.mainTimeAtEntry = String(mainTimeAtEntry);
});
game.events.on('backstage-return', () => {
  output.dataset.isolated = String(JSON.stringify(store.snapshot.levels) === roomSnapshot && store.snapshot.totalDeaths === before.totalDeaths);
  output.dataset.mainFrozen = String(mainTimeAtEntry === Number(output.dataset.mainTimeAtEntry));
  if (mode === 'five') {
    manual = true; input.clear(); output.dataset.status = output.dataset.isolated === 'true' && route.visits === 1 ? 'completed' : 'failed';
    output.dataset.visits = String(route.visits);
  }
});
const active = (): string => game.scene.isActive(BACKSTAGE.scene) || game.scene.isPaused(BACKSTAGE.scene) ? BACKSTAGE.scene : 'VerticalSliceScene';
requireTestElement<HTMLButtonElement>('#pause').onclick = () => {
  input.clear(); const key = active();
  if (game.scene.isPaused(key)) { game.scene.resume(key); output.dataset.status = 'running'; }
  else { game.scene.pause(key); output.dataset.status = 'review-paused'; }
};
requireTestElement<HTMLButtonElement>('#manual').onclick = () => { manual = true; input.clear(); game.scene.resume(active()); output.dataset.status = 'manual'; };
requireTestElement<HTMLButtonElement>('#reload').onclick = () => location.reload();
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-action]')) input.bindTouchButton(button, button.dataset.action as GameAction);
window.addEventListener('beforeunload', () => { unsubscribe(); input.destroy(); game.destroy(true); }, { once: true });
