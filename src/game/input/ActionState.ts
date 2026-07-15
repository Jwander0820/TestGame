export type GameAction = 'left' | 'right' | 'jump';

export class ActionState {
  private readonly sources: Record<GameAction, Set<string>> = {
    left: new Set<string>(),
    right: new Set<string>(),
    jump: new Set<string>(),
  };

  private jumpPressed = false;

  press(action: GameAction, source: string): void {
    const wasActive = this.sources[action].size > 0;
    this.sources[action].add(source);

    if (action === 'jump' && !wasActive) {
      this.jumpPressed = true;
    }
  }

  release(action: GameAction, source: string): void {
    this.sources[action].delete(source);
  }

  releaseSource(source: string): void {
    for (const actionSources of Object.values(this.sources)) {
      actionSources.delete(source);
    }
  }

  releaseAll(): void {
    for (const actionSources of Object.values(this.sources)) {
      actionSources.clear();
    }
    this.jumpPressed = false;
  }

  isDown(action: GameAction): boolean {
    return this.sources[action].size > 0;
  }

  isAnyDown(): boolean {
    return Object.values(this.sources).some((actionSources) => actionSources.size > 0);
  }

  consumeJumpPressed(): boolean {
    const result = this.jumpPressed;
    this.jumpPressed = false;
    return result;
  }
}
