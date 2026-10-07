import { LEVEL_TWO_CLOCKWORK as layout, LEVEL_TWO_EFFECT_IDS as effects } from '../content/levelTwo';

export type CarrierPhase = 'idle' | 'waiting' | 'moving' | 'arrived' | 'retired';
export type SteamPhase = 'idle' | 'tell' | 'active' | 'spent' | 'retired';
export type PressPhase = 'idle' | 'tell' | 'fall' | 'hold' | 'retract' | 'spent' | 'retired';

export interface CarrierSample {
  readonly x: number;
  readonly y: number;
  readonly phase: CarrierPhase;
}

/** 只消耗遊玩有效時間；場景在暫停、死亡與完成時不呼叫 advance。 */
export class ClockworkState {
  private carrierElapsed: number | null = null;
  private steamElapsed: number | null = null;
  private pressElapsed: number | null = null;
  private readonly assists = new Set<string>();
  private mercy = false;
  private steamTellDuration: number = layout.steam.tellMs;
  private pressTellDuration: number = layout.press.tellMs;

  get carrier(): CarrierSample {
    const carrier = layout.carrier;
    if (this.carrierRetired) return { x: carrier.startX, y: carrier.startY, phase: 'retired' };
    if (this.carrierElapsed === null) return { x: carrier.startX, y: carrier.startY, phase: 'idle' };
    if (this.carrierElapsed < carrier.waitMs) return { x: carrier.startX, y: carrier.startY, phase: 'waiting' };
    const progress = Math.min(1, (this.carrierElapsed - carrier.waitMs) / carrier.travelMs);
    return { x: carrier.startX + (carrier.endX - carrier.startX) * progress,
      y: carrier.startY + (carrier.endY - carrier.startY) * progress, phase: progress >= 1 ? 'arrived' : 'moving' };
  }

  get steamPhase(): SteamPhase {
    if (this.steamRetired) return 'retired';
    if (this.steamElapsed === null) return 'idle';
    if (this.steamElapsed < this.steamTellDuration) return 'tell';
    return this.steamElapsed < this.steamTellDuration + layout.steam.activeMs ? 'active' : 'spent';
  }

  get steamActive(): boolean { return this.steamPhase === 'active'; }

  get pressPhase(): PressPhase {
    if (this.pressRetired) return 'retired';
    if (this.pressElapsed === null) return 'idle';
    const age = this.pressElapsed - this.pressTellDuration;
    if (age < 0) return 'tell';
    if (age < layout.press.fallMs) return 'fall';
    if (age < layout.press.fallMs + layout.press.holdMs) return 'hold';
    if (age < layout.press.fallMs + layout.press.holdMs + layout.press.retractMs) return 'retract';
    return 'spent';
  }

  get pressY(): number {
    const press = layout.press;
    if (this.pressRetired || this.pressElapsed === null || this.pressElapsed < this.pressTellDuration) return press.hiddenY;
    const age = this.pressElapsed - this.pressTellDuration;
    if (age < press.fallMs) return press.hiddenY + (press.loweredY - press.hiddenY) * age / press.fallMs;
    if (age < press.fallMs + press.holdMs) return press.loweredY;
    const progress = Math.min(1, (age - press.fallMs - press.holdMs) / press.retractMs);
    return press.loweredY + (press.hiddenY - press.loweredY) * progress;
  }

  get pressActive(): boolean { return this.pressPhase === 'fall' || this.pressPhase === 'hold'; }
  get conveyorSpeed(): number {
    return this.mercy || this.assists.has(effects.stopConveyor) || this.assists.has(effects.retireSorter) ? 0 : layout.conveyor.speed;
  }

  triggerCarrier(): boolean {
    if (this.carrierRetired || this.carrierElapsed !== null) return false;
    this.carrierElapsed = 0;
    return true;
  }

  triggerSteam(): boolean {
    if (this.steamRetired || this.steamElapsed !== null) return false;
    this.steamTellDuration = this.assists.has(effects.steamWarning) ? layout.steam.assistedTellMs : layout.steam.tellMs;
    this.steamElapsed = 0;
    return true;
  }

  triggerPress(): boolean {
    if (this.pressRetired || this.pressElapsed !== null) return false;
    this.pressTellDuration = this.assists.has(effects.sorterWarning) ? layout.press.assistedTellMs : layout.press.tellMs;
    this.pressElapsed = 0;
    return true;
  }

  advance(deltaMs: number): void {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) return;
    if (this.carrierElapsed !== null && !this.carrierRetired) this.carrierElapsed += deltaMs;
    if (this.steamElapsed !== null && !this.steamRetired) this.steamElapsed += deltaMs;
    if (this.pressElapsed !== null && !this.pressRetired) this.pressElapsed += deltaMs;
  }

  resetAttempt(): void {
    this.carrierElapsed = null;
    this.steamElapsed = null;
    this.pressElapsed = null;
  }

  setAssists(effectIds: readonly string[], finalMercy: boolean): void {
    // 援助只前進；重生或重播較早快照不能重新啟用已退休機關。
    for (const effectId of effectIds) this.assists.add(effectId);
    this.mercy ||= finalMercy;
    if (this.steamPhase === 'tell' && this.assists.has(effects.steamWarning)) this.steamTellDuration = layout.steam.assistedTellMs;
    if (this.pressPhase === 'tell' && this.assists.has(effects.sorterWarning)) this.pressTellDuration = layout.press.assistedTellMs;
    if (this.carrierRetired) this.carrierElapsed = null;
    if (this.steamRetired) this.steamElapsed = null;
    if (this.pressRetired) this.pressElapsed = null;
  }

  private get carrierRetired(): boolean { return this.mercy || this.assists.has(effects.retireCarrier); }
  private get steamRetired(): boolean {
    return this.mercy || this.assists.has(effects.closeSteamValve) || this.assists.has(effects.retireSteam);
  }
  private get pressRetired(): boolean { return this.mercy || this.assists.has(effects.retireSorter); }
}
