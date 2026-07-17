export const LEVEL_ONE_COLORS = {
  ink: 0x1d2a33,
  sky: 0xddf4ff,
  skyLight: 0xf5fbf2,
  farHill: 0xb9e6d3,
  nearHill: 0x77c6a5,
  royalGreen: 0x1faf9d,
  royalGreenDark: 0x147b70,
  warningRed: 0xb9382c,
  warningLight: 0xe95d5d,
  paper: 0xfff9e8,
  paperShadow: 0xe4dcc5,
  documentYellow: 0xffd447,
  wood: 0x8b6d4d,
  castle: 0x8797a3,
} as const;

export const LEVEL_ONE_SCENERY_REGIONS = [
  {
    id: 'training-yard',
    startX: 0,
    endX: 950,
    labelX: 290,
    label: '訓練區 01',
    note: '無事故紀錄（開場前）',
  },
  {
    id: 'certified-worksite',
    startX: 950,
    endX: 2_250,
    labelX: 1_160,
    label: '認證施工區 02',
    note: '所有文件均比設施新',
  },
  {
    id: 'castle-audit',
    startX: 2_250,
    endX: 3_000,
    labelX: 2_350,
    label: '王城驗收區 03',
    note: '事故後可申請免複驗',
  },
] as const;

export const LEVEL_ONE_INSPECTION_ROWS = [
  { blockerId: 'first-gap', label: '新手坑' },
  { blockerId: 'warning-strip', label: '認證路' },
  { blockerId: 'intern-bridge', label: '模範橋' },
] as const;
