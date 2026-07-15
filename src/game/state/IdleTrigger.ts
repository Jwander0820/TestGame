export class IdleTrigger {
  private eligibleSince: number | null = null;
  private triggered = false;

  constructor(private readonly thresholdMs: number) {
    if (!Number.isFinite(thresholdMs) || thresholdMs <= 0) {
      throw new Error('Idle threshold must be a positive duration.');
    }
  }

  update(now: number, eligible: boolean): boolean {
    if (this.triggered) {
      return false;
    }

    if (!eligible) {
      this.eligibleSince = null;
      return false;
    }

    if (this.eligibleSince === null) {
      this.eligibleSince = now;
      return false;
    }

    if (now - this.eligibleSince < this.thresholdMs) {
      return false;
    }

    this.triggered = true;
    return true;
  }

  reset(): void {
    this.eligibleSince = null;
  }
}
