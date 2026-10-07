import { CLOCKWORK_MALICE as layout, type ClockworkMalicePhase, type ClockworkMaliceSample } from '../content/clockworkMalice';
import { LEVEL_TWO_EFFECT_IDS as effects } from '../content/levelTwo';

export type { ClockworkMalicePhase, ClockworkMaliceSample } from '../content/clockworkMalice';

/** 每個後手獨立使用本命有效時間，警示與退休跨重生保留。 */
class TrapClock {
  private elapsed: number | null = null;
  private retired = false;
  private warning = false;
  private tellDuration: number;

  constructor(private readonly tellMs: number, private readonly assistedTellMs: number) {
    this.tellDuration = tellMs;
  }

  get leadingPhase(): 'idle' | 'tell' | 'retired' | null {
    if (this.retired) return 'retired';
    if (this.elapsed === null) return 'idle';
    return this.elapsed < this.tellDuration ? 'tell' : null;
  }
  get attackAge(): number { return Math.max(0, (this.elapsed ?? 0) - this.tellDuration); }
  get revealed(): boolean { return this.warning || this.retired; }

  trigger(): boolean {
    if (this.retired || this.elapsed !== null) return false;
    this.tellDuration = this.warning ? this.assistedTellMs : this.tellMs;
    this.elapsed = 0;
    return true;
  }
  advance(deltaMs: number): void { if (!this.retired && this.elapsed !== null) this.elapsed += deltaMs; }
  resetAttempt(): void { this.elapsed = null; }
  reveal(): void {
    this.warning = true;
    // 已出招只在下命延長，不讓當前傷害突然倒帶成安全預告。
    if (this.leadingPhase === 'tell') this.tellDuration = this.assistedTellMs;
  }
  retire(): void { this.retired = true; this.elapsed = null; }
}

interface DropDefinition {
  readonly hiddenY: number;
  readonly loweredY: number;
  readonly fallMs: number;
  readonly holdMs: number;
  readonly retractMs: number;
}

function dropSample(clock: TrapClock, drop: DropDefinition): { readonly phase: ClockworkMalicePhase; readonly y: number; readonly active: boolean } {
  const leading = clock.leadingPhase;
  if (leading !== null) return { phase: leading, y: drop.hiddenY, active: false };
  const age = clock.attackAge;
  if (age < drop.fallMs) return { phase: 'fall', y: drop.hiddenY + (drop.loweredY - drop.hiddenY) * age / drop.fallMs, active: true };
  if (age < drop.fallMs + drop.holdMs) return { phase: 'hold', y: drop.loweredY, active: true };
  const retractAge = age - drop.fallMs - drop.holdMs;
  if (retractAge < drop.retractMs) return { phase: 'retract', y: drop.loweredY + (drop.hiddenY - drop.loweredY) * retractAge / drop.retractMs, active: true };
  return { phase: 'spent', y: drop.hiddenY, active: false };
}

function fixedSample(clock: TrapClock, activeMs: number): { readonly phase: ClockworkMalicePhase; readonly active: boolean } {
  const leading = clock.leadingPhase;
  if (leading !== null) return { phase: leading, active: false };
  return clock.attackAge < activeMs ? { phase: 'active', active: true } : { phase: 'spent', active: false };
}

export class ClockworkMaliceState {
  private readonly dock = new TrapClock(layout.dock.tellMs, layout.dock.assistedTellMs);
  private readonly backwash = new TrapClock(layout.backwash.tellMs, layout.backwash.assistedTellMs);
  private readonly recall = new TrapClock(layout.recall.tellMs, layout.recall.assistedTellMs);
  private readonly bell = new TrapClock(layout.bell.tellMs, layout.bell.assistedTellMs);
  private conveyorStopped = false;

  get sample(): ClockworkMaliceSample {
    const dock = dropSample(this.dock, layout.dock);
    const backwash = fixedSample(this.backwash, layout.backwash.activeMs);
    const recall = fixedSample(this.recall, layout.recall.activeMs);
    const bell = dropSample(this.bell, layout.bell);
    return { dockPhase: dock.phase, dockY: dock.y, dockActive: dock.active,
      backwashPhase: backwash.phase, backwashActive: backwash.active,
      recallPhase: recall.phase, recallActive: recall.active,
      bellPhase: bell.phase, bellY: bell.y, bellActive: bell.active,
      conveyorOverride: recall.active ? this.conveyorStopped ? 0 : layout.recall.conveyorSpeed : null,
      revealed: { dock: this.dock.revealed, backwash: this.backwash.revealed, sorter: this.recall.revealed || this.bell.revealed } };
  }

  triggerDock(): boolean { return this.dock.trigger(); }
  triggerBackwash(): boolean { return this.backwash.trigger(); }
  triggerRecall(): boolean { return this.recall.trigger(); }
  triggerBell(): boolean { return this.bell.trigger(); }

  advance(deltaMs: number): void {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) return;
    for (const clock of [this.dock, this.backwash, this.recall, this.bell]) clock.advance(deltaMs);
  }
  resetAttempt(): void {
    for (const clock of [this.dock, this.backwash, this.recall, this.bell]) clock.resetAttempt();
  }
  setAssists(effectIds: readonly string[], finalMercy = false): void {
    if (effectIds.includes(effects.carrierRail)) this.dock.reveal();
    if (effectIds.includes(effects.steamWarning)) this.backwash.reveal();
    if (effectIds.includes(effects.sorterWarning)) { this.recall.reveal(); this.bell.reveal(); }
    if (effectIds.includes(effects.stopConveyor) || effectIds.includes(effects.retireSorter) || finalMercy) this.conveyorStopped = true;
    if (finalMercy || effectIds.includes(effects.carrierBridge) || effectIds.includes(effects.retireCarrier)) this.dock.retire();
    if (finalMercy || effectIds.includes(effects.closeSteamValve) || effectIds.includes(effects.retireSteam)) this.backwash.retire();
    if (finalMercy || effectIds.includes(effects.retireSorter)) { this.recall.retire(); this.bell.retire(); }
  }
}
