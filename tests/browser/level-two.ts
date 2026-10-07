import Phaser from 'phaser';
import { createGame } from '../../src/game/config';
import { LEVEL_TWO_ID, LEVEL_TWO_EFFECT_IDS } from '../../src/game/content/levelTwo';
import { CLOCKWORK_MALICE_DEATHS } from '../../src/game/content/clockworkMalice';
import { subscribeToGameStatus } from '../../src/game/events';
import { InputController } from '../../src/game/input/InputController';
import type { GameAction } from '../../src/game/input/ActionState';
import { LevelTwoSession } from '../../src/game/session/LevelTwoSession';
import { createDefaultProgress, ProgressStore } from '../../src/game/state/progress';
import { advanceProgress } from '../../src/game/sympathy/director';
import type { PlaytestFrame } from '../../src/game/testing/PlaytestDriver';
import { ClockworkDriver, type ClockworkDriverOptions, type ClockworkNaive } from './ClockworkDriver';
import { requireTestElement } from './dom';

const params = new URLSearchParams(location.search);
const testCase = params.get('case') ?? 'learned';
if (!['learned', 'right', 'pause', 'reload', 'assistReload', 'steam', 'press', 'dock', 'backwash', 'recall', 'bell',
  'naive', 'naiveDock', 'naiveBackwash', 'naiveRecall', 'naiveBell'].includes(testCase)) throw new Error('未知鐘塔驗證案例');
const pauseCase = params.get('pause') ?? 'dock-tell';
const naiveModes: Readonly<Record<string, ClockworkNaive>> = {
  naive: 'dock', naiveDock: 'dock', naiveBackwash: 'backwash', naiveRecall: 'recall', naiveBell: 'bell',
};
const naive = naiveModes[testCase];
const review = params.get('review') === '1';
const result = requireTestElement<HTMLOutputElement>('#playtest-result');
const evidence = requireTestElement<HTMLPreElement>('#clockwork-evidence');
const resume = requireTestElement<HTMLButtonElement>('#resume-review');
const controls = requireTestElement<HTMLElement>('#manual-controls');
const namespace = testCase === 'assistReload' ? 'playtest:clockwork:assistReload:' : 'playtest:clockwork:reload:';
const reload = testCase === 'reload' || testCase === 'assistReload';
const restored = reload && sessionStorage.getItem(namespace + 'pending') === 'yes';
const memory = new Map<string, string>();
const store = new ProgressStore(reload ? {
  getItem: key => restored ? sessionStorage.getItem(namespace + key) : null,
  setItem: (key, value) => sessionStorage.setItem(namespace + key, value),
} : { getItem: key => memory.get(key) ?? null, setItem: (key, value) => { memory.set(key, value); } });
const initialOrder = testCase === 'steam' || testCase === 'backwash' || naive === 'backwash' ? 1 :
  testCase === 'press' || testCase === 'recall' || naive === 'recall' ? 2 : testCase === 'bell' || naive === 'bell' ? 3 : 0;
if (!restored) store.replace(initialOrder === 0 ? createDefaultProgress() :
  advanceProgress(createDefaultProgress(), LEVEL_TWO_ID, `clockwork-station-${initialOrder}`, initialOrder));
else {
  sessionStorage.removeItem(namespace + 'pending');
  result.dataset.restoredOrder = String(store.snapshot.levels[LEVEL_TWO_ID]?.progressOrder ?? 0);
}
result.dataset.restored = String(restored);
const session = new LevelTwoSession(store);
result.dataset.restoredAssistIds = JSON.stringify(session.activeAssistIds);
const input = new InputController(); input.attach();
const touchCleanups = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-action]')).map(button =>
  input.bindTouchButton(button, button.dataset.action as GameAction));
const driverOptions: Readonly<Record<string, ClockworkDriverOptions>> = {
  right: { rightOnly: true }, steam: { fault: 'steam' }, press: { fault: 'press' }, dock: { fault: 'dock' },
  backwash: { fault: 'backwash' }, recall: { fault: 'recall' }, bell: { fault: 'bell' },
};
const driver = new ClockworkDriver(naive === undefined ? testCase === 'assistReload' && !restored ?
  { fault: 'dock' } : driverOptions[testCase] ?? {} : { naive });
const expectedDeaths = naive !== undefined ? 1 : testCase === 'right' ? 21 :
  ['steam', 'dock', 'backwash', 'assistReload'].includes(testCase) ? 5 : ['press', 'recall', 'bell'].includes(testCase) ? 7 : 0;
let lastFrame: PlaytestFrame | null = null;
let pauseDone = false; let reviewDone = false; let manual = false; let reloading = false;
let sawMoving = false; let sawArrived = false; let sawSteamActive = false; let sawSteamSpent = false;
let sawPressFall = false; let sawPressSpent = false; let sawFinalMercy = false;
let recordedAt = 0;
const carrierTraces: Array<{ readonly attempt: number; readonly samples: unknown[] }> = [];
const deathSnapshots: unknown[] = [];
let lastCarrierTraceAt = -Infinity;
let lastCarrierPhase = '';
let lastCarrierGrounded = false;
let geometryHeld = !restored || sessionStorage.getItem(namespace + 'geometryHeld') !== 'false';
const geometryFailures: unknown[] = [];
const sawMalice = { dock: false, backwash: false, recall: false, bell: false };
const sawMaliceSpent = { dock: false, backwash: false, recall: false, bell: false };

function traceCarrier(frame: PlaytestFrame): void {
  if (frame.x < 380 || frame.x >= 960 || frame.clockwork === undefined) return;
  const phase = frame.clockwork.carrierPhase;
  const time = frame.timeMs ?? 0;
  if (time - lastCarrierTraceAt < 75 && phase === lastCarrierPhase && frame.grounded === lastCarrierGrounded) return;
  lastCarrierTraceAt = time; lastCarrierPhase = phase; lastCarrierGrounded = frame.grounded;
  const attempt = store.snapshot.levels[LEVEL_TWO_ID]?.attempt ?? 1;
  let trace = carrierTraces.at(-1);
  if (trace?.attempt !== attempt) { trace = { attempt, samples: [] }; carrierTraces.push(trace); }
  const player = game.scene.getScene('LevelTwoScene').children.list.find(child => child instanceof Phaser.Physics.Arcade.Sprite);
  const body = player instanceof Phaser.Physics.Arcade.Sprite ? player.body : null;
  trace.samples.push({ time, x: frame.x, y: frame.y, grounded: frame.grounded, phase,
    carrierX: frame.clockwork.carrierX, carrierY: frame.clockwork.carrierY,
    bodyBottom: body?.bottom, velocityY: body?.velocity.y,
    blockedDown: body?.blocked.down, touchingDown: body?.touching.down,
    right: input.actions.isDown('right'), jump: input.actions.isDown('jump'), geometry: geometry(),
  });
  if (trace.samples.length > 50) trace.samples.shift();
}

function geometry() {
  const scene = game.scene.getScene('LevelTwoScene');
  const carrier = scene.children.getByName('clockwork-carrier');
  const press = scene.children.list.find(child => child instanceof Phaser.GameObjects.Container && child.x === 1860 && child.depth === 5);
  const player = scene.children.list.find(child => child instanceof Phaser.Physics.Arcade.Sprite);
  const body = player instanceof Phaser.Physics.Arcade.Sprite && player.body instanceof Phaser.Physics.Arcade.Body ? player.body : null;
  const maliceGeometry = ['dock', 'backwash', 'recall', 'bell'].map(id => {
    const object = scene.children.getByName(`clockwork-${id}-trap`);
    return object instanceof Phaser.GameObjects.Container || object instanceof Phaser.GameObjects.Graphics ?
      { id, x: object.x, y: object.y, visible: object.visible } : { id, missing: true };
  });
  return {
    maliceGeometry,
    carrier: carrier instanceof Phaser.GameObjects.Zone ? { x: carrier.x, y: carrier.y,
      width: carrier.width,
      colliderX: carrier.body instanceof Phaser.Physics.Arcade.StaticBody ? carrier.body.center.x : null,
      colliderY: carrier.body instanceof Phaser.Physics.Arcade.StaticBody ? carrier.body.center.y : null,
      colliderTop: carrier.body instanceof Phaser.Physics.Arcade.StaticBody ? carrier.body.top : null } : null,
    press: press instanceof Phaser.GameObjects.Container ? { x: press.x, y: press.y } : null,
    player: player instanceof Phaser.Physics.Arcade.Sprite && body !== null ? {
      x: player.x, y: player.y, bodyX: body.x, bodyY: body.y, bodyWidth: body.width, bodyBottom: body.bottom,
      // callback 早於 Arcade postUpdate；pending delta 尚未反映回 sprite。
      expectedBodyX: player.x + body.position.x - body.prevFrame.x + player.scaleX * (body.offset.x - player.displayOriginX),
      expectedBodyY: player.y + body.position.y - body.prevFrame.y + player.scaleY * (body.offset.y - player.displayOriginY),
    } : null,
  };
}

function checkGeometry(frame: PlaytestFrame): void {
  const sample = geometry();
  const carrier = sample.carrier, player = sample.player, machine = frame.clockwork;
  const collisionAligned = machine !== undefined && carrier !== null && carrier.colliderX !== null && carrier.colliderTop !== null &&
    Math.abs(carrier.x - Math.round(machine.carrierX)) < 0.01 && Math.abs(carrier.colliderX - carrier.x) < 0.01 &&
    Math.abs(carrier.colliderTop - Math.round(machine.carrierY)) < 0.01;
  const offsetAligned = player !== null && Math.abs(player.bodyX - player.expectedBodyX) < 0.01 &&
    Math.abs(player.bodyY - player.expectedBodyY) < 0.01;
  // 只檢查在載台面上的乘客；援助踏板上的玩家可能與運行載台水平重疊。
  const carrying = carrier !== null && carrier.colliderTop !== null && player !== null && frame.grounded &&
    ['waiting', 'moving'].includes(machine?.carrierPhase ?? '') &&
    frame.x >= carrier.x - carrier.width / 2 + player.bodyWidth / 2 &&
    frame.x <= carrier.x + carrier.width / 2 - player.bodyWidth / 2 &&
    Math.abs(player.bodyBottom - carrier.colliderTop) < 5;
  const feetAligned = !carrying || carrier !== null && carrier.colliderTop !== null && player !== null &&
    Math.abs(player.bodyBottom - carrier.colliderTop) <= 1;
  const dockArt = sample.maliceGeometry.find(object => object.id === 'dock');
  const bellArt = sample.maliceGeometry.find(object => object.id === 'bell');
  const maliceArtAligned = machine?.malice === undefined || dockArt !== undefined && 'y' in dockArt &&
    dockArt.y === Math.round(machine.malice.dockY) && bellArt !== undefined && 'y' in bellArt &&
    bellArt.y === Math.round(machine.malice.bellY);
  const passed = collisionAligned && offsetAligned && feetAligned && maliceArtAligned;
  geometryHeld &&= passed;
  result.dataset.geometryHeld = String(geometryHeld);
  if (!passed && geometryFailures.length < 10) geometryFailures.push({ frame, sample, collisionAligned, offsetAligned, feetAligned, maliceArtAligned, carrying });
}

function record(): void {
  evidence.textContent = JSON.stringify({ testCase, expectedDeaths, restored, manual,
    levelDeaths: session.levelDeaths, progressOrder: session.progressOrder, finalMercy: session.finalMercy,
    jumpCommands: driver.jumpCommands, finalJumpCommands: driver.finalJumpCommands,
    sawMoving, sawArrived, sawSteamActive, sawSteamSpent, sawPressFall, sawPressSpent, sawFinalMercy,
    pauseCase, pauseHeld: result.dataset.pauseHeld, geometryHeld, geometryFailures, sawMalice, sawMaliceSpent,
    geometry: geometry(), lastFrame,
    level: store.snapshot.levels[LEVEL_TWO_ID], carrierTraces, deathSnapshots,
  }, null, 2);
}

const unsubscribe = subscribeToGameStatus(detail => {
  if (detail.levelId !== LEVEL_TWO_ID) return;
  result.textContent = detail.message;
  result.dataset.deaths = String(session.levelDeaths);
  result.dataset.causes = JSON.stringify(store.snapshot.levels[LEVEL_TWO_ID]?.deathsByCause ?? {});
  result.dataset.finalMercy = String(session.finalMercy);
  if (detail.phase === 'dying') {
    deathSnapshots.push({ death: session.levelDeaths, message: detail.message, lastFrame, geometry: geometry() });
    record();
    if (naive !== undefined) {
      const cause = CLOCKWORK_MALICE_DEATHS[naive].causeId;
      result.dataset.status = geometryHeld && session.levelDeaths === 1 && session.causeDeaths(cause) === 1 ? 'completed' : 'unexpected-result';
      game.scene.pause('LevelTwoScene'); record();
    }
  }
  const reloadReady = testCase === 'assistReload' ? session.causeDeaths('arrival-guillotine') === 5 : session.progressOrder >= 2;
  if (reload && !restored && !reloading && reloadReady) {
    reloading = true; sessionStorage.setItem(namespace + 'pending', 'yes');
    sessionStorage.setItem(namespace + 'geometryHeld', String(geometryHeld));
    window.setTimeout(() => location.reload(), 50);
  }
  if (detail.phase === 'completed') {
    const newCause: Readonly<Record<string, string>> = {
      dock: 'arrival-guillotine', backwash: 'steam-backwash', recall: 'sorting-recall', bell: 'bell-counterweight', assistReload: 'arrival-guillotine',
    };
    const cause = testCase === 'steam' ? 'steam-burst' : testCase === 'press' ? 'sorting-press' : newCause[testCase] ?? null;
    const causeCount = cause === null ? expectedDeaths : session.causeDeaths(cause);
    const passed = geometryHeld && session.levelDeaths === expectedDeaths && causeCount === expectedDeaths &&
      (testCase !== 'right' || session.finalMercy && driver.jumpCommands === 0 && driver.finalJumpCommands === 0) &&
      (testCase !== 'pause' || result.dataset.pauseHeld === 'true') &&
      (testCase !== 'reload' || restored && Number(result.dataset.restoredOrder) >= 2) &&
      (testCase !== 'assistReload' || restored && session.activeAssistIds.includes(LEVEL_TWO_EFFECT_IDS.carrierBridge)) &&
      (testCase !== 'learned' || sawMoving && sawArrived && sawSteamSpent && sawPressSpent &&
        Object.values(sawMalice).every(Boolean) && Object.values(sawMaliceSpent).every(Boolean));
    result.dataset.status = manual ? 'manual-completed' : passed ? 'completed' : 'unexpected-result';
    record();
  }
});

const game = createGame({ initialLevelId: LEVEL_TWO_ID, inputController: input, progressStore: store, playtestDriver: {
  reset: actions => driver.reset(actions),
  update: (frame, actions) => {
    lastFrame = frame;
    const machine = frame.clockwork;
    sawMoving ||= machine?.carrierPhase === 'moving'; sawArrived ||= machine?.carrierPhase === 'arrived';
    sawSteamActive ||= machine?.steamPhase === 'active'; sawSteamSpent ||= machine?.steamPhase === 'spent';
    sawPressFall ||= machine?.pressPhase === 'fall'; sawPressSpent ||= machine?.pressPhase === 'spent';
    sawFinalMercy ||= machine?.finalMercy === true;
    const malice = machine?.malice;
    if (malice !== undefined) {
      for (const id of ['dock', 'backwash', 'recall', 'bell'] as const) {
        const phase = malice[`${id}Phase`];
        sawMalice[id] ||= !['idle', 'spent', 'retired'].includes(phase);
        sawMaliceSpent[id] ||= phase === 'spent';
      }
    }
    if (!manual) driver.update(frame, actions);
    checkGeometry(frame);
    traceCarrier(frame);
    if ((frame.timeMs ?? 0) - recordedAt >= 250) { recordedAt = frame.timeMs ?? 0; record(); }
    const pauseTargets: Readonly<Record<string, boolean>> = {
      carrier: machine?.carrierPhase === 'moving', 'dock-tell': malice?.dockPhase === 'tell', 'dock-active': malice?.dockActive === true,
      'backwash-tell': malice?.backwashPhase === 'tell', 'backwash-active': malice?.backwashActive === true,
      'recall-tell': malice?.recallPhase === 'tell', 'recall-active': malice?.recallActive === true,
      'bell-tell': malice?.bellPhase === 'tell', 'bell-active': malice?.bellActive === true,
    };
    if (review && !reviewDone && pauseTargets[pauseCase]) {
      reviewDone = true; actions.releaseAll(); game.scene.pause('LevelTwoScene');
      result.dataset.status = 'review-paused'; result.textContent = '鐘塔機關畫面已暫停。可接手鍵盤或觸控試玩。';
      resume.hidden = false; record();
    } else if (testCase === 'pause' && !pauseDone && pauseTargets[pauseCase]) {
      pauseDone = true; game.scene.pause('LevelTwoScene');
      window.setTimeout(() => {
        // 等本幀 postUpdate 同步 sprite 後再取樣，驗證整秒的角色及機關位置凍結。
        const frozen = JSON.stringify(geometry());
        window.setTimeout(() => {
          result.dataset.pauseHeld = String(lastFrame === frame && JSON.stringify(geometry()) === frozen);
          game.scene.resume('LevelTwoScene'); record();
        }, 1000);
      }, 0);
    }
  },
} });

resume.addEventListener('click', () => {
  manual = true; input.actions.releaseAll(); resume.hidden = true; controls.hidden = false;
  result.dataset.status = 'playing-manually';
  game.scene.resume('LevelTwoScene'); requireTestElement<HTMLElement>('#game-root').focus();
});
window.setTimeout(() => {
  if (result.dataset.status === 'running') { result.dataset.status = 'timeout'; record(); }
}, 180_000);
window.addEventListener('beforeunload', () => {
  unsubscribe(); touchCleanups.forEach(cleanup => cleanup()); input.destroy(); game.destroy(true);
}, { once: true });
