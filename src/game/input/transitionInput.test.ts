import { describe, expect, it } from 'vitest';
import { InputController } from './InputController';

describe('轉場輸入', () => {
  it('同步清除多指觸控、鍵盤、跳躍邊緣及按壓外觀', () => {
    class Button extends EventTarget {
      dataset: Record<string, string> = {};
      pointers = new Set<number>();
      setPointerCapture(id: number): void { this.pointers.add(id); }
      hasPointerCapture(id: number): boolean { return this.pointers.has(id); }
      releasePointerCapture(id: number): void { this.pointers.delete(id); }
    }
    const controller = new InputController(); const button = new Button();
    const cleanup = controller.bindTouchButton(button as unknown as HTMLButtonElement, 'left');
    for (const pointerId of [2, 3]) button.dispatchEvent(Object.assign(new Event('pointerdown'), { pointerId }));
    controller.actions.press('jump', 'keyboard:Space');
    expect(controller.actions.isDown('left')).toBe(true);
    controller.clear();
    expect(controller.actions.isAnyDown()).toBe(false);
    expect(controller.actions.consumeJumpPressed()).toBe(false);
    expect(button.dataset.pressed).toBe('false'); expect(button.pointers.size).toBe(0);
    button.dispatchEvent(Object.assign(new Event('pointerdown'), { pointerId: 4 }));
    expect(controller.actions.isDown('left')).toBe(true);
    cleanup(); expect(controller.actions.isAnyDown()).toBe(false);
  });
});
