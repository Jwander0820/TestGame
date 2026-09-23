import { describe, expect, it } from 'vitest';
import { SlimeState } from './SlimeState';
import { LEVEL_ONE_SLIMES } from '../content/levelOneSlimes';
import { LEVEL_ONE_EFFECT_IDS as effects } from '../content/levelOne';

const [charger, jumper] = LEVEL_ONE_SLIMES;
describe('幾何史萊姆', () => {
  it('靠近才蓄力，衝完攤平假睡，第二次起身前不傷害', () => {
    const state = new SlimeState();
    state.observePlayer({ x: 110, y: 398, velocityY: 0 }, 0);
    expect(state.sample(charger, 100).phase).toBe('idle');
    state.observePlayer({ x: 180, y: 398, velocityY: 0 }, 100);
    state.observePlayer({ x: 200, y: 398, velocityY: 0 }, 200);
    expect(state.sample(charger, 279)).toMatchObject({ phase: 'tell', x: 300 });
    expect(state.sample(charger, 480)).toMatchObject({ phase: 'attack', x: 240 });
    expect(state.sample(charger, 680)).toMatchObject({ phase: 'fake-rest', dangerous: false, x: 180 });
    state.observePlayer({ x: 200, y: 398, velocityY: 0 }, 800);
    expect(state.sample(charger, 800).phase).toBe('fake-rest');
  });

  it('圓形只模仿範圍內的上升跳躍，不追蹤落地、遠處或高空玩家', () => {
    const state = new SlimeState();
    for (const player of [
      { x: 850, y: 398, velocityY: 0 }, { x: 850, y: 330, velocityY: 100 },
      { x: 800, y: 350, velocityY: -400 }, { x: 850, y: 200, velocityY: -400 },
    ]) state.observePlayer(player, 0);
    expect(state.sample(jumper, 1_000).phase).toBe('idle');
    state.observePlayer({ x: 850, y: 390, velocityY: -400 }, 1_000);
    expect(state.sample(jumper, 1_059).phase).toBe('tell');
    expect(state.sample(jumper, 1_460)).toMatchObject({ phase: 'attack', x: 930, y: 294 });
    expect(state.sample(jumper, 1_860)).toMatchObject({ phase: 'fake-rest', dangerous: false, y: 402 });
  });

  it('暫停同時間取樣不移動，重生回原位並保留發現線索', () => {
    const state = new SlimeState();
    state.observePlayer({ x: 180, y: 398, velocityY: 0 }, 0);
    const moving = state.sample(charger, 300);
    expect(state.sample(charger, 300)).toEqual(moving);
    state.reveal('charger'); state.resetAttempt();
    expect(state.sample(charger, 10_000)).toMatchObject({ phase: 'idle', x: 300, revealed: true });
    expect(new SlimeState(['charger']).sample(charger, 0).revealed).toBe(true);
  });

  it.each(LEVEL_ONE_SLIMES)('$id 的三次援助揭露，五次援助立即停止攻擊，重生不復活', (definition) => {
    const state = new SlimeState();
    state.observePlayer({ x: definition.triggerMinX, y: 390, velocityY: -400 }, 0);
    state.applyEffect(definition.revealEffect);
    const now = definition.tellMs + 100;
    expect(state.sample(definition, now)).toMatchObject({ phase: 'attack', revealed: true, dangerous: true });
    state.applyEffect(definition.retireEffects[0]);
    expect(state.sample(definition, now)).toMatchObject({ phase: 'retired', dangerous: false });
    state.resetAttempt(); state.applyEffect(definition.revealEffect);
    state.observePlayer({ x: definition.triggerMinX, y: 390, velocityY: -400 }, 0);
    expect(state.sample(definition, 100)).toMatchObject({ phase: 'retired', dangerous: false });
  });

  it('最高援助亂序載入仍安全，兩條援助階梯互不誤用', () => {
    const state = new SlimeState();
    state.applyEffect(effects.deployGapBridge);
    expect(state.sample(charger, 0).dangerous).toBe(false);
    expect(state.sample(jumper, 0).dangerous).toBe(true);
    state.applyEffect(effects.retireWarningStrip);
    state.applyEffect(effects.moveFirstLanding);
    state.applyEffect(effects.shrinkWarningStrip);
    for (const definition of LEVEL_ONE_SLIMES) expect(state.sample(definition, 0).dangerous).toBe(false);
  });

  it.each(LEVEL_ONE_SLIMES)('$id 假睡後僅反擊一次，起終點連續且能撤除', definition => {
    const state = new SlimeState();
    state.observePlayer({ x: definition.triggerMinX, y: 390, velocityY: -400 }, 0);
    const rest = definition.tellMs + definition.actionMs;
    const wake = rest + definition.fakeRestMs;
    const attack = wake + definition.wakeMs;
    const end = attack + definition.revengeMs;
    const startX = definition.x + definition.travelX;
    expect(state.sample(definition, wake - 1)).toMatchObject({ phase: 'fake-rest', dangerous: false, x: startX });
    expect(state.sample(definition, wake)).toMatchObject({ phase: 'wake', dangerous: false, x: startX });
    expect(state.sample(definition, attack)).toMatchObject({ phase: 'revenge', dangerous: true, x: startX });
    expect(state.sample(definition, attack + definition.revengeMs / 2)).toMatchObject({
      phase: 'revenge', x: startX + definition.revengeTravelX / 2, y: definition.y - definition.revengeJumpHeight,
    });
    expect(state.sample(definition, end)).toMatchObject({ phase: 'spent', dangerous: false,
      x: startX + definition.revengeTravelX, y: definition.y });
    state.observePlayer({ x: definition.triggerMinX, y: 390, velocityY: -400 }, end + 1_000);
    expect(state.sample(definition, end + 10_000).phase).toBe('spent');
    state.resetAttempt();
    expect(state.sample(definition, end)).toMatchObject({ phase: 'idle', x: definition.x });
    state.observePlayer({ x: definition.triggerMinX, y: 390, velocityY: -400 }, 0);
    state.applyEffect(definition.retireEffects[0]);
    expect(state.sample(definition, attack + 100)).toMatchObject({ phase: 'retired', dangerous: false });
  });
});
