import type Phaser from 'phaser';
import { PIXEL_PALETTE as p, LEVEL_ONE_TEXT_COLORS as text } from '../content/levelOneVisuals';
import { addGameText } from './addGameText';

/** 鐘塔使用既有色盤的石、木與黃銅語意，不載入森林素材。 */
const material = {
  outline: p.ink950,
  wall: p.stone400,
  wallShadow: p.stone600,
  farWall: p.mist300,
  stone: p.stone600,
  stoneLight: p.stone400,
  stoneShadow: p.stone800,
  copper: p.wood400,
  copperMid: p.wood600,
  copperShadow: p.wood800,
  steam: p.assist500,
  steamShadow: p.mist700,
  hazard: p.danger500,
  hazardShadow: p.danger700,
  royal: p.gold500,
  royalLight: p.gold300,
} as const;

export interface ClockworkArt {
  readonly carrier: Phaser.GameObjects.Container;
  readonly steam: Phaser.GameObjects.Container;
  readonly steamWarning: Phaser.GameObjects.Text;
  readonly press: Phaser.GameObjects.Container;
  readonly pressWarning: Phaser.GameObjects.Text;
  readonly belt: Phaser.GameObjects.Graphics;
  readonly bell: Phaser.GameObjects.Container;
  readonly gears: readonly Phaser.GameObjects.Container[];
}

export interface ClockworkArtState {
  readonly carrierX?: number;
  readonly carrierTopY?: number;
  readonly steamActive?: boolean;
  readonly steamWarning?: boolean;
  readonly pressTopY?: number;
  readonly pressWarning?: boolean;
  readonly beltStopped?: boolean;
  readonly beltReversed?: boolean;
  readonly beltOffset?: number;
  readonly bellRung?: boolean;
}

type Rect = (x: number, y: number, width: number, height: number, color: number) => void;

function rectangles(graphics: Phaser.GameObjects.Graphics): Rect {
  return (x, y, width, height, color): void => {
    graphics.fillStyle(color).fillRect(x, y, width, height);
  };
}

/** 純視覺；機關的時間、碰撞、援助與裝飾動畫由 Scene 決定。 */
export function drawClockwork(scene: Phaser.Scene): ClockworkArt {
  drawWindowScenery(scene);
  drawClockworkArchitecture(scene);
  drawWorkshopFurniture(scene);

  const gears = [
    drawGear(scene, 448, 184, 32),
    drawGear(scene, 501, 216, 24),
    drawGear(scene, 1_300, 174, 42),
    drawGear(scene, 1_368, 207, 30),
    drawGear(scene, 2_167, 176, 44),
    drawGear(scene, 2_232, 213, 26),
  ];

  const carrier = scene.add.container(484, 430).setDepth(3);
  const carrierArt = scene.add.graphics();
  const c = rectangles(carrierArt);
  // 實體頂面就是局部 y=0，兩側欄杆不進入站立區。
  c(-72, 0, 144, 24, material.outline);
  c(-70, 2, 140, 5, material.copper);
  c(-70, 7, 140, 12, material.copperMid);
  c(-70, 19, 140, 3, material.copperShadow);
  for (let x = -68; x < 70; x += 24) {
    c(x, 8, 2, 10, material.copperShadow);
    c(x + 5, 10, 12, 2, material.copper);
    c(x + 4, 3, 2, 2, material.outline);
  }
  c(-54, 24, 16, 8, material.stoneShadow);
  c(38, 24, 16, 8, material.stoneShadow);
  c(-51, 25, 10, 4, material.stoneLight);
  c(41, 25, 10, 4, material.stoneLight);
  carrier.add(carrierArt);

  const steam = scene.add.container(1_060, 346).setVisible(false).setDepth(5);
  const steamArt = scene.add.graphics();
  const s = rectangles(steamArt);
  // 整個傷害柱限制在寬 44、高 84 的可讀輪廓內。
  s(-10, 0, 20, 4, material.steamShadow);
  s(-18, 4, 36, 8, material.steamShadow);
  s(-22, 12, 44, 60, material.steamShadow);
  s(-18, 72, 36, 12, material.steamShadow);
  s(-8, 2, 16, 7, p.sky200);
  s(-16, 9, 32, 11, material.steam);
  s(-19, 20, 38, 14, material.steam);
  s(-16, 34, 32, 14, material.steam);
  s(-19, 48, 38, 14, material.steam);
  s(-15, 62, 30, 22, material.steam);
  for (const [x, y, w, h] of [[-12, 14, 6, 14], [2, 31, 7, 13], [-9, 47, 6, 17], [5, 67, 5, 15]] as const) {
    s(x, y, w, h, p.sky200);
  }
  s(-22, 27, 3, 9, material.hazard);
  s(19, 51, 3, 9, material.hazard);
  steam.add(steamArt);
  const steamWarning = addGameText(scene, 1_060, 315, '↑ 即將洩壓', 16, text.danger)
    .setOrigin(0.5).setBackgroundColor(text.parchment).setPadding(6, 3).setDepth(7).setVisible(false);

  const press = scene.add.container(1_860, 150).setDepth(5);
  const pressArt = scene.add.graphics();
  const q = rectangles(pressArt);
  q(-9, 0, 18, 12, material.outline);
  q(-6, 0, 12, 12, material.stoneLight);
  q(-32, 10, 64, 58, material.outline);
  q(-30, 12, 60, 7, material.copper);
  q(-30, 19, 60, 33, material.copperMid);
  q(-30, 52, 60, 14, material.stoneShadow);
  q(-28, 20, 8, 28, material.copper);
  q(20, 21, 8, 29, material.copperShadow);
  q(-14, 25, 28, 21, material.copperShadow);
  q(-12, 27, 24, 17, material.stoneLight);
  q(-8, 31, 16, 3, material.stoneShadow);
  q(-2, 31, 4, 10, material.stoneShadow);
  for (let x = -27; x < 28; x += 14) {
    q(x, 54, 8, 6, material.hazard);
    q(x + 4, 60, 8, 4, material.hazardShadow);
  }
  for (const x of [-25, 23]) for (const y of [15, 45]) {
    q(x, y, 3, 3, material.outline);
    q(x, y, 2, 1, material.stoneLight);
  }
  press.add(pressArt);
  const pressWarning = addGameText(scene, 1_860, 310, '▼ 貨物分揀', 16, text.danger)
    .setOrigin(0.5).setBackgroundColor(text.parchment).setPadding(6, 3).setDepth(7).setVisible(false);

  const belt = scene.add.graphics().setDepth(3);
  drawBelt(belt, false, 0);
  const bell = drawTerminalBell(scene);
  return { carrier, steam, steamWarning, press, pressWarning, belt, bell, gears };
}

/** x 是平台左緣；Container 的局部 y=0 對齊碰撞頂面。 */
export function drawClockworkPlatform(
  scene: Phaser.Scene,
  x: number,
  topY: number,
  width: number,
  kind: 'stone' | 'repair' | 'suspended' = 'stone',
): Phaser.GameObjects.Container {
  const platform = scene.add.container(x, topY).setDepth(2);
  const graphics = scene.add.graphics();
  const r = rectangles(graphics);
  if (kind === 'suspended') {
    // 薄台下方可以走穿；向上掛鏈不能冒充向下的實體柱。
    r(0, 0, width, 24, material.outline);
    r(2, 2, width - 4, 4, material.stoneLight);
    r(2, 6, width - 4, 12, material.stone);
    r(2, 18, width - 4, 4, material.stoneShadow);
    for (let tileX = 4; tileX < width - 4; tileX += 24) {
      r(tileX, 8, 2, 8, material.stoneShadow);
      r(tileX + 4, 8, Math.min(12, width - tileX - 6), 2, material.stoneLight);
    }
    for (const chainX of [4, width - 9]) {
      for (let chainY = 54 - topY; chainY < -2; chainY += 12) {
        r(chainX, chainY, 5, Math.min(10, -chainY), material.stoneShadow);
        r(chainX + 1, chainY + 1, 2, Math.min(7, -chainY - 1), material.stoneLight);
      }
    }
    platform.add(graphics);
    return platform;
  }
  const height = Math.max(28, 540 - topY);
  r(0, 0, width, height, material.outline);
  r(2, 2, width - 4, 5, kind === 'repair' ? material.copper : material.stoneLight);
  r(2, 7, width - 4, 21, kind === 'repair' ? material.copperMid : material.stone);
  r(2, 28, width - 4, height - 28, material.stoneShadow);
  if (kind === 'stone') {
    for (let tileX = 4; tileX < width - 4; tileX += 48) {
      const tileWidth = Math.min(44, width - tileX - 2);
      r(tileX, 9, tileWidth, 2, material.stoneLight);
      r(tileX + tileWidth - 2, 12, 2, 12, material.stoneShadow);
    }
    for (let row = 33; row < height; row += 24) {
      r(2, row, width - 4, 2, p.ink800);
      for (let seam = row % 48 === 33 ? 32 : 8; seam < width - 3; seam += 48) {
        r(seam, row + 2, 2, Math.min(22, height - row - 2), p.ink800);
        r(seam + 4, row + 5, Math.min(12, width - seam - 5), 2, material.stone);
      }
    }
  } else {
    for (let plankX = 4; plankX < width - 4; plankX += 24) {
      r(plankX, 8, 2, 17, material.copperShadow);
      r(plankX + 5, 12, Math.min(10, width - plankX - 6), 2, material.copper);
      r(plankX + 3, 3, 2, 2, material.outline);
    }
    for (let supportX = 12; supportX < width - 12; supportX += 64) {
      r(supportX, 28, 10, height - 28, material.copperShadow);
      r(supportX + 2, 28, 3, height - 28, material.copperMid);
    }
  }
  platform.add(graphics);
  return platform;
}

export function drawClockworkMercy(scene: Phaser.Scene): Phaser.GameObjects.Container {
  const road = scene.add.container(0, 430).setDepth(4);
  const graphics = scene.add.graphics();
  const r = rectangles(graphics);
  r(0, 0, 3_000, 34, material.outline);
  r(0, 2, 3_000, 4, material.royalLight);
  r(0, 6, 3_000, 21, material.copperMid);
  r(0, 27, 3_000, 4, material.royal);
  for (let x = 0; x < 3_000; x += 24) {
    r(x, 7, 2, 19, material.copperShadow);
    r(x + 4, 10, 12, 2, material.copper);
  }
  for (let x = 18; x < 3_000; x += 180) {
    r(x, 34, 16, 76, material.copperShadow);
    r(x + 2, 34, 5, 76, material.copperMid);
    // 同向運送箭頭與皇家封條提示只向右即可通行。
    r(x + 41, 12, 17, 4, material.royalLight);
    r(x + 53, 8, 4, 12, material.royalLight);
    r(x + 57, 10, 4, 8, material.royalLight);
    r(x + 61, 12, 3, 4, material.royalLight);
  }
  road.add(graphics);
  for (const x of [230, 1_070, 1_850, 2_600]) {
    road.add(addGameText(scene, x, 55, '工務處王命：乘客優先 →', 16, text.ink)
      .setOrigin(0.5).setBackgroundColor(text.parchment).setPadding(8, 4));
  }
  return road;
}

export function updateClockworkArt(art: ClockworkArt, state: ClockworkArtState): void {
  if (state.carrierX !== undefined) art.carrier.setX(Math.round(state.carrierX));
  if (state.carrierTopY !== undefined) art.carrier.setY(Math.round(state.carrierTopY));
  if (state.steamActive !== undefined) art.steam.setVisible(state.steamActive);
  if (state.steamWarning !== undefined) art.steamWarning.setVisible(state.steamWarning);
  if (state.pressTopY !== undefined) art.press.setY(Math.round(state.pressTopY));
  if (state.pressWarning !== undefined) art.pressWarning.setVisible(state.pressWarning);
  if (state.beltStopped !== undefined || state.beltOffset !== undefined || state.beltReversed !== undefined) {
    drawBelt(art.belt, state.beltStopped ?? false, state.beltOffset ?? 0, state.beltReversed ?? false);
  }
  if (state.bellRung !== undefined) art.bell.setAlpha(state.bellRung ? 0.85 : 1);
}

function drawWindowScenery(scene: Phaser.Scene): void {
  const sky = scene.add.graphics().setScrollFactor(0.25).setDepth(-30);
  const r = rectangles(sky);
  r(0, 0, 3_000, 540, p.sky200);
  for (let x = 36; x < 3_000; x += 290) {
    r(x, 115, 76, 10, p.sky100);
    r(x + 18, 108, 42, 7, p.sky100);
    r(x + 76, 184, 100, 8, p.sky100);
    r(x + 102, 177, 48, 7, p.sky100);
  }
  // 透過高窗看見的王城屋頂；霧色降低對比，沒有森林剪影。
  for (let x = 8; x < 3_000; x += 132) {
    const height = 90 + ((x / 4) % 44);
    r(x, 350 - height, 74, height + 190, p.mist300);
    r(x + 10, 338 - height, 54, 12, p.mist300);
    r(x + 24, 324 - height, 26, 14, p.mist300);
    r(x + 32, 305 - height, 10, 19, p.mist300);
    r(x + 25, 371 - height, 12, 24, p.sky300);
    r(x + 49, 371 - height, 12, 24, p.sky300);
  }
}

function drawClockworkArchitecture(scene: Phaser.Scene): void {
  const architecture = scene.add.container(0, 0).setScrollFactor(0.6).setDepth(-20);
  const graphics = scene.add.graphics();
  const r = rectangles(graphics);
  // 窗洞之間保留石柱，天空層從洞中透出。
  r(0, 0, 3_000, 70, material.wall);
  r(0, 310, 3_000, 230, material.wall);
  for (let x = -42; x < 3_000; x += 280) {
    r(x, 70, 102, 240, material.wall);
    r(x + 96, 70, 184, 18, material.wall);
    r(x + 96, 88, 50, 16, material.wall);
    r(x + 230, 88, 50, 16, material.wall);
    r(x + 96, 104, 30, 16, material.wall);
    r(x + 250, 104, 30, 16, material.wall);
    r(x + 96, 120, 18, 16, material.wall);
    r(x + 262, 120, 18, 16, material.wall);
    r(x + 96, 70, 8, 240, material.wallShadow);
    r(x + 272, 70, 8, 240, material.wallShadow);
    r(x + 96, 302, 184, 10, material.wallShadow);
    r(x + 96, 300, 184, 3, p.sky200);
    // 石拱採階梯像素輪廓，窗格維持背景對比。
    r(x + 128, 82, 120, 4, material.wallShadow);
    r(x + 130, 100, 14, 4, material.wallShadow);
    r(x + 232, 100, 14, 4, material.wallShadow);
    r(x + 115, 116, 11, 4, material.wallShadow);
    r(x + 250, 116, 11, 4, material.wallShadow);
    r(x + 180, 85, 6, 216, material.wallShadow);
    r(x + 104, 194, 168, 5, material.wallShadow);
    r(x + 8, 86, 10, 224, p.sky200);
    for (let y = 72; y < 306; y += 28) {
      r(x + 20, y, 72, 2, material.wallShadow);
      r(x + 45 + ((y / 4) % 2) * 20, y + 2, 2, 26, material.wallShadow);
    }
  }
  for (let y = 335; y < 540; y += 32) {
    r(0, y, 3_000, 2, material.wallShadow);
    for (let x = y % 64 === 15 ? 0 : 42; x < 3_000; x += 84) {
      r(x, y + 2, 2, 30, material.wallShadow);
    }
  }
  r(0, 52, 3_000, 8, material.wallShadow);
  r(0, 52, 3_000, 2, p.sky200);
  architecture.add(graphics);
}

function drawWorkshopFurniture(scene: Phaser.Scene): void {
  const graphics = scene.add.graphics().setDepth(-10);
  const r = rectangles(graphics);
  // 黃銅管路避開必要落腳頂面，管箍維持金屬輪廓。
  for (const [x, width] of [[62, 568], [865, 500], [1_543, 433], [2_340, 443]] as const) {
    r(x, 260, width, 12, material.copperShadow);
    r(x + 2, 262, width - 4, 4, material.copper);
    r(x + 2, 266, width - 4, 4, material.copperMid);
    for (let clamp = x + 25; clamp < x + width - 10; clamp += 86) {
      r(clamp, 258, 7, 16, material.stoneShadow);
      r(clamp + 1, 258, 3, 14, material.stoneLight);
    }
  }
  r(1_052, 272, 16, 157, material.copperShadow);
  r(1_054, 272, 5, 151, material.copper);
  r(1_059, 272, 7, 151, material.copperMid);
  r(1_041, 416, 38, 14, material.outline);
  r(1_044, 419, 32, 8, material.stoneLight);
  for (let x = 1_048; x < 1_074; x += 7) r(x, 419, 3, 8, material.stoneShadow);
  // 壓力表的針與閥輪是圖形，危險倒數由獨立文字呈現。
  r(995, 234, 34, 32, material.copperShadow);
  r(998, 237, 28, 26, material.copper);
  r(1_001, 240, 22, 20, p.parchment100);
  r(1_011, 242, 2, 12, material.hazardShadow);
  r(1_011, 252, 9, 2, material.hazardShadow);
  r(1_035, 292, 18, 5, material.copperShadow);
  r(1_020, 287, 17, 17, material.outline);
  r(1_023, 290, 11, 11, material.hazardShadow);
  r(1_027, 292, 3, 7, material.copper);

  // 載台導軌、分揀吊架與鏈條都在角色後方。
  for (let i = 0; i < 20; i++) {
    r(435 + i * 12, 449 - i * 3, 18, 5, material.stoneShadow);
    r(436 + i * 12, 449 - i * 3, 17, 2, material.stoneLight);
  }
  for (const x of [452, 690, 1_806, 1_902]) {
    r(x, 74, 7, 202, material.copperShadow);
    for (let y = 76; y < 270; y += 12) {
      r(x + 1, y, 5, 8, material.stoneShadow);
      r(x + 2, y + 1, 2, 5, material.stoneLight);
    }
  }
  r(1_778, 124, 164, 18, material.copperShadow);
  r(1_780, 126, 160, 5, material.copper);
  r(1_853, 140, 14, 176, material.stoneShadow);
  r(1_856, 142, 4, 172, material.stoneLight);
  // 貨箱在地板下方或牆面架上，沒有假的可站立輪廓。
  for (const [x, y, w, h] of [[178, 466, 56, 53], [238, 484, 38, 35], [1_413, 475, 58, 44], [2_040, 464, 46, 54], [2_089, 483, 38, 35]] as const) {
    drawCrate(r, x, y, w, h);
  }
  drawCrate(r, 116, 221, 34, 37);
  drawCrate(r, 157, 231, 28, 27);
  r(107, 258, 91, 5, material.copperShadow);
  addWallSign(scene, 230, 180, '王城鐘塔・運送線', 18);
  addWallSign(scene, 547, 326, '貨物優先', 15);
  addWallSign(scene, 1_244, 190, '蒸汽動力室', 16);
  addWallSign(scene, 1_679, 316, '皇家貨物分揀', 16);
  addWallSign(scene, 2_438, 275, '通行鐘 →', 17);
}

function drawCrate(r: Rect, x: number, y: number, width: number, height: number): void {
  r(x, y, width, height, material.copperShadow);
  r(x + 2, y + 2, width - 4, height - 4, material.copperMid);
  for (let plank = 4; plank < width - 4; plank += 12) {
    r(x + plank, y + 3, 2, height - 6, material.copperShadow);
    r(x + plank + 2, y + 4, 2, height - 8, material.copper);
  }
  r(x + 2, y + 2, width - 4, 4, material.copper);
  r(x + 2, y + height - 6, width - 4, 4, material.copper);
  for (let step = 0; step < Math.floor(Math.min(width, height) / 5); step++) {
    r(x + 3 + step * 5, y + height - 10 - step * 5, 7, 6, material.copper);
  }
  for (const dx of [4, width - 6]) for (const dy of [3, height - 5]) r(x + dx, y + dy, 2, 2, material.outline);
}

function addWallSign(scene: Phaser.Scene, x: number, y: number, label: string, size: number): void {
  const sign = addGameText(scene, x, y, label, size, text.ink).setOrigin(0.5).setDepth(-8);
  sign.setBackgroundColor(text.parchment).setPadding(8, 4);
  const g = scene.add.graphics().setDepth(-9);
  g.fillStyle(material.copperShadow).fillRect(Math.round(x - sign.width / 2 - 3), Math.round(y - sign.height / 2 - 3), sign.width + 6, sign.height + 6);
}

function drawGear(scene: Phaser.Scene, x: number, y: number, radius: number): Phaser.GameObjects.Container {
  const gear = scene.add.container(x, y).setDepth(-12);
  const graphics = scene.add.graphics();
  const r = rectangles(graphics);
  // 2px 格點光柵輪廓避免平滑圓形，齒圈與中空輪軸可辨識。
  for (let gy = -radius; gy < radius; gy += 2) {
    for (let gx = -radius; gx < radius; gx += 2) {
      const distance = gx * gx + gy * gy;
      if (distance > radius * radius || distance < 10 * 10) continue;
      const rim = distance > (radius - 4) * (radius - 4);
      r(gx, gy, 2, 2, rim ? material.copperShadow : gx + gy < -6 ? material.copper : material.copperMid);
    }
  }
  for (const [tx, ty, w, h] of [[-6, -radius - 6, 12, 9], [-6, radius - 3, 12, 9], [-radius - 6, -6, 9, 12], [radius - 3, -6, 9, 12]] as const) {
    r(tx, ty, w, h, material.copperShadow);
    r(tx + 2, ty + 2, w - 4, h - 4, material.copper);
  }
  const diagonal = Math.round(radius * 0.7 / 2) * 2;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    r(sx * diagonal - 5, sy * diagonal - 5, 10, 10, material.copperShadow);
    r(sx * diagonal - 3, sy * diagonal - 3, 6, 6, material.copperMid);
  }
  r(-4, -radius + 6, 8, radius * 2 - 12, material.copperMid);
  r(-radius + 6, -4, radius * 2 - 12, 8, material.copperMid);
  r(-7, -7, 14, 14, material.copperShadow);
  r(-4, -4, 8, 8, material.stoneLight);
  r(-1, -1, 3, 3, material.stoneShadow);
  gear.add(graphics);
  return gear;
}

function drawBelt(graphics: Phaser.GameObjects.Graphics, stopped: boolean, offset: number, reversed = false): void {
  graphics.clear();
  const r = rectangles(graphics);
  r(1_540, 430, 420, 24, material.outline);
  r(1_542, 432, 416, 4, material.stoneLight);
  r(1_542, 436, 416, 14, material.stoneShadow);
  r(1_542, 450, 416, 2, material.copperShadow);
  for (let x = 1_548; x < 1_953; x += 24) {
    r(x, 446, 11, 3, material.stone);
    r(x + 2, 447, 3, 1, material.stoneLight);
  }
  const shift = stopped ? 0 : ((Math.round(offset) % 48) + 48) % 48;
  for (let x = 1_555 + shift - 48; x < 1_941; x += 48) {
    if (x < 1_544) continue;
    const color = stopped ? material.stone : material.copper;
    // 箭頭跟隨實際帶向，停帶後以兩直槓替代，不只依賴顏色。
    if (stopped) {
      r(x, 438, 3, 6, color);
      r(x + 7, 438, 3, 6, color);
    } else {
      r(x, 440, 15, 3, color);
      r(x + (reversed ? 9 : 2), 438, 4, 7, color);
      r(x + (reversed ? 13 : -2), 440, 4, 3, color);
    }
  }
}

function drawTerminalBell(scene: Phaser.Scene): Phaser.GameObjects.Container {
  const tower = scene.add.graphics().setDepth(-9);
  const t = rectangles(tower);
  for (const x of [2_690, 2_870]) {
    t(x, 131, 28, 299, material.stoneShadow);
    t(x + 2, 133, 24, 297, material.stone);
    t(x + 2, 133, 5, 297, material.stoneLight);
    for (let y = 161; y < 430; y += 28) t(x + 7, y, 19, 2, material.stoneShadow);
  }
  t(2_682, 123, 224, 16, material.stoneShadow);
  t(2_684, 125, 220, 5, material.stoneLight);
  t(2_778, 135, 24, 102, material.copperShadow);
  t(2_781, 137, 5, 98, material.copper);
  t(2_720, 64, 148, 57, material.stoneShadow);
  t(2_724, 68, 140, 49, material.stoneLight);
  t(2_734, 75, 118, 34, p.parchment100);
  t(2_790, 78, 3, 19, material.copperShadow);
  t(2_790, 94, 26, 3, material.copperShadow);
  for (const x of [2_741, 2_840]) t(x, 89, 5, 5, material.copperMid);
  addWallSign(scene, 2_790, 189, '敲鐘通行', 16);

  const bell = scene.add.container(2_790, 235).setDepth(3);
  const graphics = scene.add.graphics();
  const r = rectangles(graphics);
  r(-12, 0, 24, 10, material.outline);
  r(-10, 2, 20, 8, material.royal);
  r(-27, 9, 54, 11, material.outline);
  r(-39, 20, 78, 22, material.outline);
  r(-45, 42, 90, 32, material.outline);
  r(-53, 74, 106, 17, material.outline);
  r(-60, 91, 120, 12, material.outline);
  r(-25, 11, 50, 11, material.copper);
  r(-37, 22, 74, 21, material.copper);
  r(-43, 43, 86, 32, material.copperMid);
  r(-51, 75, 102, 16, material.copperMid);
  r(-58, 93, 116, 7, material.copperShadow);
  r(-34, 25, 9, 53, material.copper);
  r(-45, 80, 13, 8, material.copper);
  r(25, 26, 10, 46, material.copperShadow);
  r(35, 72, 14, 18, material.copperShadow);
  r(-40, 58, 78, 4, material.royal);
  r(-49, 86, 98, 4, material.royalLight);
  r(-7, 103, 14, 8, material.copperShadow);
  r(-4, 103, 8, 5, material.copper);
  // 小皇冠嵌飾，避免把文字烘焙到像素資產。
  r(-12, 32, 24, 12, material.copperShadow);
  r(-10, 33, 4, 6, material.royal);
  r(-2, 30, 4, 9, material.royal);
  r(6, 33, 4, 6, material.royal);
  r(-10, 40, 20, 3, material.royalLight);
  bell.add(graphics);
  return bell;
}
