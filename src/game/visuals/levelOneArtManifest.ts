/** User-provided third-batch art and transparent derivatives; procedural art remains the load fallback. */
export const LEVEL_ONE_ART_ASSET_PATHS = {
  'forest-backdrop': new URL('./assets/level-one-forest-no-castle.png', import.meta.url).href,
  'hero-source': new URL('./assets/hero-poses-third-batch.png', import.meta.url).href,
  'ground-source': new URL('./assets/forest-ground-third-batch.png', import.meta.url).href,
  'slime-square-source': new URL('./assets/slime-square-third-batch.png', import.meta.url).href,
  'slime-round-source': new URL('./assets/slime-round-third-batch.png', import.meta.url).href,
  'coin-source': new URL('./assets/crown-coin-third-batch.png', import.meta.url).href,
  'goal-gate-source': new URL('./assets/castle-goal-muted-third-batch.png', import.meta.url).href,
} as const satisfies Readonly<Record<string, string>>;
