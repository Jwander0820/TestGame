import { ActionState, type GameAction } from './ActionState';

const KEY_ACTIONS: Readonly<Partial<Record<string, GameAction>>> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'jump',
  KeyW: 'jump',
  Space: 'jump',
};

export class InputController {
  readonly actions = new ActionState();
  private enabled = true;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.actions.releaseAll();
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (typeof Element !== 'undefined' && event.target instanceof Element &&
      event.target.closest('button, input, textarea, select, [contenteditable="true"]')) return;
    const action = KEY_ACTIONS[event.code];
    if (!this.enabled || action === undefined || event.repeat) {
      return;
    }

    event.preventDefault();
    this.actions.press(action, `keyboard:${event.code}`);
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    const action = KEY_ACTIONS[event.code];
    if (!this.enabled || action === undefined) {
      return;
    }

    this.actions.release(action, `keyboard:${event.code}`);
    if (typeof Element === 'undefined' || !(event.target instanceof Element) ||
      !event.target.closest('button, input, textarea, select, [contenteditable="true"]')) event.preventDefault();
  };

  private readonly onBlur = (): void => {
    this.actions.releaseAll();
  };

  attach(): void {
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('keyup', this.onKeyUp, { passive: false });
    window.addEventListener('blur', this.onBlur);
  }

  bindTouchButton(button: HTMLButtonElement, action: GameAction): () => void {
    const activePointers = new Set<number>();

    const press = (event: PointerEvent): void => {
      if (!this.enabled) return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      activePointers.add(event.pointerId);
      button.dataset.pressed = 'true';
      this.actions.press(action, `pointer:${action}:${event.pointerId}`);
    };

    const release = (event: PointerEvent): void => {
      event.preventDefault();
      activePointers.delete(event.pointerId);
      button.dataset.pressed = String(activePointers.size > 0);
      this.actions.release(action, `pointer:${action}:${event.pointerId}`);
    };

    button.addEventListener('pointerdown', press);
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);

    return () => {
      button.removeEventListener('pointerdown', press);
      button.removeEventListener('pointerup', release);
      button.removeEventListener('pointercancel', release);
      button.removeEventListener('lostpointercapture', release);
      for (const pointerId of activePointers) {
        this.actions.releaseSource(`pointer:${action}:${pointerId}`);
      }
      activePointers.clear();
    };
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.actions.releaseAll();
  }
}
