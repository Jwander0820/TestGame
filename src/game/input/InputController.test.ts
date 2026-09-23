import { afterEach, describe, expect, it, vi } from 'vitest';
import { InputController } from './InputController';

afterEach(() => vi.unstubAllGlobals());
describe('選單與遊戲鍵盤分離', () => {
  it('選單中的空白鍵保留原生行為，繼續遊戲後才用來跳躍', () => {
    const target = new EventTarget();
    vi.stubGlobal('window', target);
    const controller = new InputController();
    controller.attach();
    const space = () => Object.assign(new Event('keydown', { cancelable: true }), { code: 'Space', repeat: false });
    controller.setEnabled(false);
    const menuEvent = space(); target.dispatchEvent(menuEvent);
    expect(menuEvent.defaultPrevented).toBe(false);
    expect(controller.actions.consumeJumpPressed()).toBe(false);
    controller.setEnabled(true);
    const gameEvent = space(); target.dispatchEvent(gameEvent);
    expect(gameEvent.defaultPrevented).toBe(true);
    expect(controller.actions.consumeJumpPressed()).toBe(true);
    controller.setEnabled(false);
    expect(controller.actions.isAnyDown()).toBe(false);
    controller.destroy();
  });
});
