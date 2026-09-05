/**
 * Primitive palette for the first-world look-development baseline.
 *
 * These colors deliberately stay small and opaque so programmatic fallback art,
 * future pixel assets, and the DOM shell can share one visual language.
 */
export const PIXEL_PALETTE = {
  ink950: 0x14232b,
  ink800: 0x2d4650,
  mist700: 0x218b93,
  mist500: 0x83c8a8,
  mist300: 0xbfdde0,
  sky300: 0x9fd9e8,
  sky200: 0xddf4ff,
  sky100: 0xffffff,
  stone800: 0x465b59,
  stone600: 0x8d9a90,
  stone400: 0xc9c9b6,
  stone200: 0xffffff,
  grass800: 0x25634e,
  grass600: 0x429b73,
  grass400: 0x62b44b,
  grass200: 0xa6d968,
  wood800: 0x583d2e,
  wood600: 0x8d603c,
  wood400: 0xc99459,
  armor700: 0x465b59,
  armor400: 0x8d9a90,
  armor200: 0xc9c9b6,
  cape700: 0x9d342f,
  cape500: 0xc84c42,
  skin400: 0xfff3d6,
  gold700: 0x86613e,
  gold500: 0xf3c743,
  gold300: 0xffe48a,
  danger700: 0x9d342f,
  danger500: 0xe76546,
  assist500: 0x62d4d6,
  parchment100: 0xfff3d6,
  focus500: 0x2f78d8,
} as const;

/** Purpose-based aliases used by the level rather than raw palette values. */
export const LEVEL_ONE_COLORS = {
  outline: PIXEL_PALETTE.ink950,
  ink: PIXEL_PALETTE.ink950,
  sky: PIXEL_PALETTE.sky300,
  skyLight: PIXEL_PALETTE.sky200,
  farSilhouette: PIXEL_PALETTE.mist300,
  farHill: PIXEL_PALETTE.mist300,
  midSilhouette: PIXEL_PALETTE.mist500,
  nearHill: PIXEL_PALETTE.mist500,
  safeTop: PIXEL_PALETTE.grass400,
  safeBody: PIXEL_PALETTE.grass600,
  safeShadow: PIXEL_PALETTE.grass800,
  royalGreen: PIXEL_PALETTE.grass600,
  royalGreenDark: PIXEL_PALETTE.grass800,
  hazard: PIXEL_PALETTE.danger500,
  hazardDark: PIXEL_PALETTE.danger700,
  warningRed: PIXEL_PALETTE.danger700,
  warningLight: PIXEL_PALETTE.danger500,
  assist: PIXEL_PALETTE.assist500,
  assistHighlight: PIXEL_PALETTE.gold300,
  parchment: PIXEL_PALETTE.parchment100,
  parchmentShadow: PIXEL_PALETTE.wood400,
  paper: PIXEL_PALETTE.parchment100,
  paperShadow: PIXEL_PALETTE.wood400,
  royalGold: PIXEL_PALETTE.gold500,
  royalGoldDark: PIXEL_PALETTE.gold700,
  documentYellow: PIXEL_PALETTE.gold500,
  wood: PIXEL_PALETTE.wood600,
  woodDark: PIXEL_PALETTE.wood800,
  stone: PIXEL_PALETTE.stone600,
  stoneLight: PIXEL_PALETTE.stone400,
  castle: PIXEL_PALETTE.stone600,
  heroCape: PIXEL_PALETTE.cape500,
  heroCapeShadow: PIXEL_PALETTE.cape700,
  armor: PIXEL_PALETTE.armor400,
  armorLight: PIXEL_PALETTE.armor200,
  skin: PIXEL_PALETTE.skin400,
  focus: PIXEL_PALETTE.focus500,
} as const;

/** Component-level aliases keep repeated scenery and HUD decisions in one place. */
export const LEVEL_ONE_COMPONENT_COLORS = {
  platform: {
    outline: LEVEL_ONE_COLORS.outline,
    top: LEVEL_ONE_COLORS.safeTop,
    face: LEVEL_ONE_COLORS.stone,
    shadow: LEVEL_ONE_COLORS.safeShadow,
  },
  mercyBridge: {
    outline: LEVEL_ONE_COLORS.outline,
    plank: PIXEL_PALETTE.wood400,
    plankShadow: LEVEL_ONE_COLORS.woodDark,
    rope: LEVEL_ONE_COLORS.assistHighlight,
  },
  accidentLedger: {
    outline: LEVEL_ONE_COLORS.outline,
    surface: LEVEL_ONE_COLORS.parchment,
    shadow: LEVEL_ONE_COLORS.parchmentShadow,
    seal: LEVEL_ONE_COLORS.hazardDark,
    tab: LEVEL_ONE_COLORS.royalGold,
  },
  hero: {
    outline: LEVEL_ONE_COLORS.outline,
    helmet: LEVEL_ONE_COLORS.armor,
    helmetLight: LEVEL_ONE_COLORS.armorLight,
    cape: LEVEL_ONE_COLORS.heroCape,
    capeShadow: LEVEL_ONE_COLORS.heroCapeShadow,
    skin: LEVEL_ONE_COLORS.skin,
    shield: LEVEL_ONE_COLORS.wood,
  },
} as const;

/** String forms for Phaser text and DOM-facing status overlays. */
export const LEVEL_ONE_TEXT_COLORS = {
  ink: '#14232b',
  inkMuted: '#2d4650',
  parchment: '#fff3d6',
  danger: '#9d342f',
  assist: '#62d4d6',
  royalGold: '#f3c743',
} as const;

export const LEVEL_ONE_SCENERY_REGIONS = [
  {
    id: 'training-yard',
    startX: 0,
    endX: 950,
    labelX: 290,
    label: '見習者林道',
    note: '通往王城的第一段古道',
  },
  {
    id: 'certified-worksite',
    startX: 950,
    endX: 2_250,
    labelX: 1_160,
    label: '巡禮者斷橋',
    note: '王室守衛堅稱仍可通行',
  },
  {
    id: 'castle-audit',
    startX: 2_250,
    endX: 3_000,
    labelX: 2_350,
    label: '外城門前',
    note: '鐘樓已經看得見了',
  },
] as const;

export const LEVEL_ONE_INSPECTION_ROWS = [
  { blockerId: 'first-gap', label: '新手坑' },
  { blockerId: 'warning-strip', label: '古道機關' },
  { blockerId: 'intern-bridge', label: '王家木橋' },
] as const;
