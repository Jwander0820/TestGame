export const CLOCKWORK_MALICE = {
  dock: { x: 790, width: 52, height: 152, hiddenY: 78, loweredY: 230,
    tellMs: 250, assistedTellMs: 1_100, fallMs: 180, holdMs: 650, retractMs: 500 },
  backwash: { triggerX: 1_100, x: 1_190, topY: 330, width: 180, height: 100,
    tellMs: 300, assistedTellMs: 1_000, activeMs: 1_100 },
  recall: { triggerX: 1_900, x: 1_995, topY: 310, width: 90, height: 120,
    tellMs: 350, assistedTellMs: 1_100, activeMs: 800, conveyorSpeed: 300 },
  bell: { triggerX: 2_570, x: 2_730, width: 100, height: 70, hiddenY: 100, loweredY: 280,
    tellMs: 400, assistedTellMs: 1_100, fallMs: 160, holdMs: 550, retractMs: 400 },
} as const;

export const CLOCKWORK_MALICE_DEATHS = {
  dock: { causeId: 'arrival-guillotine', blockerId: 'clockwork-carrier' },
  backwash: { causeId: 'steam-backwash', blockerId: 'clockwork-steam' },
  recall: { causeId: 'sorting-recall', blockerId: 'clockwork-sorter' },
  bell: { causeId: 'bell-counterweight', blockerId: 'clockwork-sorter' },
} as const;

export type ClockworkMalicePhase = 'idle' | 'tell' | 'fall' | 'hold' | 'retract' | 'active' | 'spent' | 'retired';

export interface ClockworkMaliceSample {
  readonly dockPhase: ClockworkMalicePhase;
  readonly dockY: number;
  readonly dockActive: boolean;
  readonly backwashPhase: ClockworkMalicePhase;
  readonly backwashActive: boolean;
  readonly recallPhase: ClockworkMalicePhase;
  readonly recallActive: boolean;
  readonly bellPhase: ClockworkMalicePhase;
  readonly bellY: number;
  readonly bellActive: boolean;
  readonly conveyorOverride: number | null;
  readonly revealed: { readonly dock: boolean; readonly backwash: boolean; readonly sorter: boolean };
}
