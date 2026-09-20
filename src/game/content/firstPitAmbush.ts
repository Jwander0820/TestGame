export const FIRST_PIT_AMBUSH = {
  brick: { x: 482, y: 308, width: 64, height: 24 },
  trigger: { x: 400, y: 360, width: 40, height: 180 },
  riser: { x: 490, startY: 568, endY: 130, width: 32, height: 40, speed: 650 },
  coins: [
    ...[6, 20, 34, 48, 62, 76, 90, 104].map((x, index) => ({ id: `reverse-${index}`, x, y: 225 })),
    { id: 'pit-bait', x: 492, y: 300 },
  ],
  coinPickupSize: 20,
  coinBurstSize: 48,
  coinFuseMs: 300,
  coinActiveMs: 480,
} as const;

export const FIRST_PIT_CAUSES = {
  brick: 'first-pit-air-brick',
  riser: 'first-pit-riser',
  coin: 'bait-coin-burst',
} as const;

export type FirstPitCause = (typeof FIRST_PIT_CAUSES)[keyof typeof FIRST_PIT_CAUSES];
