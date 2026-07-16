export type ScenePhase = 'playing' | 'dying' | 'completed';

export class SceneLifecycle {
  private currentPhase: ScenePhase = 'playing';

  get phase(): ScenePhase {
    return this.currentPhase;
  }

  get isPlaying(): boolean {
    return this.currentPhase === 'playing';
  }

  get isDying(): boolean {
    return this.currentPhase === 'dying';
  }

  reset(): void {
    this.currentPhase = 'playing';
  }

  beginDeath(): boolean {
    if (this.currentPhase !== 'playing') {
      return false;
    }
    this.currentPhase = 'dying';
    return true;
  }

  respawn(): boolean {
    if (this.currentPhase !== 'dying') {
      return false;
    }
    this.currentPhase = 'playing';
    return true;
  }

  complete(): boolean {
    if (this.currentPhase !== 'playing') {
      return false;
    }
    this.currentPhase = 'completed';
    return true;
  }
}
