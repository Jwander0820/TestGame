import { LEVEL_ONE_EFFECT_IDS as effects, type LevelOneEffectId } from '../content/levelOne';
import { FIRST_PIT_AMBUSH as layout } from '../content/firstPitAmbush';

export type CoinPhase = 'bait' | 'fuse' | 'burst' | 'spent' | 'safe';

export class FirstPitState {
  brickEnabled = true;
  attacksEnabled = true;
  brickRevealed: boolean;
  coinsRevealed: boolean;
  hitBrickThisAttempt = false;
  private launchedAt: number | null = null;
  private readonly coinArmedAt = new Map<string, number>();

  constructor(brickRevealed = false, coinsRevealed = false) {
    this.brickRevealed = brickRevealed;
    this.coinsRevealed = coinsRevealed;
  }

  hitBrick(): void {
    if (!this.brickEnabled) return;
    this.brickRevealed = true;
    this.hitBrickThisAttempt = true;
  }

  launch(now: number): void {
    if (this.attacksEnabled && this.launchedAt === null) this.launchedAt = now;
  }

  riserY(now: number): number | null {
    if (!this.attacksEnabled || this.launchedAt === null) return null;
    const y = layout.riser.startY - Math.max(0, now - this.launchedAt) * layout.riser.speed / 1_000;
    return y < layout.riser.endY ? null : y;
  }

  armCoin(id: string, now: number): void {
    if (this.attacksEnabled && !this.coinArmedAt.has(id)) this.coinArmedAt.set(id, now);
  }

  coinPhase(id: string, now: number): CoinPhase {
    if (!this.attacksEnabled) return 'safe';
    const armedAt = this.coinArmedAt.get(id);
    if (armedAt === undefined) return 'bait';
    const elapsed = now - armedAt;
    if (elapsed < layout.coinFuseMs) return 'fuse';
    if (elapsed < layout.coinFuseMs + layout.coinActiveMs) return 'burst';
    return 'spent';
  }

  resetAttempt(): void {
    this.hitBrickThisAttempt = false;
    this.launchedAt = null;
    this.coinArmedAt.clear();
  }

  applyEffect(effect: LevelOneEffectId): void {
    if (effect === effects.moveFirstLanding || effect === effects.deployGapSpring || effect === effects.deployGapBridge) {
      this.brickEnabled = false;
      this.coinsRevealed = true;
    }
    if (effect === effects.deployGapSpring || effect === effects.deployGapBridge) {
      this.attacksEnabled = false;
    }
  }
}
