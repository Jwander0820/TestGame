import Phaser from 'phaser';
import {
  LEVEL_ONE_COLORS,
  LEVEL_ONE_SCENERY_REGIONS,
  LEVEL_ONE_TEXT_COLORS,
  PIXEL_PALETTE,
} from '../content/levelOneVisuals';
import { addGameText } from './addGameText';

const VIEW_WIDTH = 960;

function drawPixelCloud(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
): void {
  const unit = Math.max(8, Math.round(width / 10));
  graphics.fillRect(x + unit, y, width - unit * 2, unit * 2);
  graphics.fillRect(x, y + unit, width, unit);
  graphics.fillRect(x + unit * 3, y - unit, unit * 3, unit);
}

function drawPixelTree(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  groundY: number,
  variant: number,
): void {
  const crownWidth = variant % 2 === 0 ? 64 : 72;
  const crownHeight = variant % 3 === 0 ? 54 : 62;
  const trunkHeight = variant % 2 === 0 ? 70 : 82;

  graphics.fillStyle(LEVEL_ONE_COLORS.woodDark, 1);
  graphics.fillRect(x - 9, groundY - trunkHeight, 18, trunkHeight);
  graphics.fillStyle(LEVEL_ONE_COLORS.wood, 1);
  graphics.fillRect(x - 4, groundY - trunkHeight, 8, trunkHeight);

  graphics.fillStyle(LEVEL_ONE_COLORS.safeShadow, 1);
  graphics.fillRect(x - crownWidth / 2, groundY - trunkHeight - crownHeight + 12, crownWidth, crownHeight - 12);
  graphics.fillRect(x - crownWidth / 2 + 8, groundY - trunkHeight - crownHeight, crownWidth - 16, crownHeight);
  graphics.fillStyle(LEVEL_ONE_COLORS.safeBody, 1);
  graphics.fillRect(x - crownWidth / 2 + 8, groundY - trunkHeight - crownHeight + 6, crownWidth - 24, 18);
  graphics.fillRect(x - crownWidth / 2 + 2, groundY - trunkHeight - crownHeight + 20, 16, 18);
  graphics.fillStyle(LEVEL_ONE_COLORS.safeTop, 1);
  graphics.fillRect(x - crownWidth / 2 + 14, groundY - trunkHeight - crownHeight + 8, 18, 8);
}

function drawDistantCastle(graphics: Phaser.GameObjects.Graphics): void {
  const x = 710;
  const baseY = 330;
  const color = LEVEL_ONE_COLORS.farSilhouette;

  graphics.fillStyle(color, 1);
  graphics.fillRect(x, baseY - 96, 186, 96);
  graphics.fillRect(x + 22, baseY - 146, 38, 146);
  graphics.fillRect(x + 126, baseY - 166, 42, 166);
  graphics.fillRect(x + 75, baseY - 126, 42, 126);
  graphics.fillTriangle(x + 18, baseY - 146, x + 64, baseY - 146, x + 41, baseY - 184);
  graphics.fillTriangle(x + 122, baseY - 166, x + 172, baseY - 166, x + 147, baseY - 210);
  graphics.fillTriangle(x + 70, baseY - 126, x + 122, baseY - 126, x + 96, baseY - 166);

  graphics.fillStyle(LEVEL_ONE_COLORS.skyLight, 1);
  graphics.fillRect(x + 36, baseY - 120, 10, 18);
  graphics.fillRect(x + 91, baseY - 99, 10, 18);
  graphics.fillRect(x + 142, baseY - 137, 10, 18);
  graphics.fillRect(x + 79, baseY - 42, 38, 42);
}

function drawRuin(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  baseY: number,
  mirrored = false,
): void {
  const left = mirrored ? x - 80 : x;
  graphics.fillStyle(PIXEL_PALETTE.stone800, 1);
  graphics.fillRect(left, baseY - 88, 20, 88);
  graphics.fillRect(left, baseY - 88, 80, 18);
  graphics.fillRect(left + 62, baseY - 88, 18, 88);
  graphics.fillStyle(LEVEL_ONE_COLORS.stone, 1);
  graphics.fillRect(left + 4, baseY - 82, 12, 70);
  graphics.fillRect(left + 64, baseY - 82, 10, 70);
  graphics.fillRect(left + 8, baseY - 82, 56, 10);
  graphics.fillStyle(LEVEL_ONE_COLORS.safeBody, 1);
  graphics.fillRect(left + (mirrored ? 36 : 8), baseY - 94, 36, 8);
}

function addTrailMarker(scene: Phaser.Scene, x: number, label: string): void {
  const marker = scene.add.graphics().setDepth(-1);
  marker.fillStyle(LEVEL_ONE_COLORS.woodDark, 1);
  marker.fillRect(x - 5, 366, 10, 70);
  marker.fillStyle(LEVEL_ONE_COLORS.wood, 1);
  marker.fillRect(x - 62, 338, 124, 42);
  marker.fillStyle(LEVEL_ONE_COLORS.royalGoldDark, 1);
  marker.fillRect(x - 56, 344, 112, 30);
  marker.lineStyle(3, LEVEL_ONE_COLORS.outline, 1);
  marker.strokeRect(x - 62, 338, 124, 42);

  addGameText(scene, x, 358, label, 14, LEVEL_ONE_TEXT_COLORS.parchment)
    .setOrigin(0.5)
    .setDepth(0);
}

/**
 * Builds a restrained five-layer fantasy backdrop. It deliberately avoids
 * worksheet grids and construction props before the sympathy system intervenes.
 */
export function drawLevelOneScenery(scene: Phaser.Scene): void {
  scene.cameras.main.setBackgroundColor(LEVEL_ONE_COLORS.sky);

  const sky = scene.add.graphics().setDepth(-30).setScrollFactor(0);
  sky.fillStyle(LEVEL_ONE_COLORS.sky, 1);
  sky.fillRect(0, 0, VIEW_WIDTH, 540);
  sky.fillStyle(LEVEL_ONE_COLORS.skyLight, 1);
  sky.fillRect(0, 0, VIEW_WIDTH, 128);
  sky.fillStyle(LEVEL_ONE_COLORS.assistHighlight, 1);
  sky.fillRect(790, 74, 56, 56);
  sky.fillStyle(LEVEL_ONE_COLORS.skyLight, 1);
  sky.fillRect(798, 66, 40, 72);
  sky.fillRect(790, 82, 56, 40);
  sky.fillStyle(LEVEL_ONE_COLORS.parchment, 1);
  for (const [x, y, width] of [
    [88, 86, 150],
    [382, 122, 112],
    [648, 62, 126],
  ] as const) {
    drawPixelCloud(sky, x, y, width);
  }

  const far = scene.add.graphics().setDepth(-24).setScrollFactor(0.12, 1);
  far.fillStyle(LEVEL_ONE_COLORS.farSilhouette, 1);
  for (let x = -220; x <= 1_760; x += 260) {
    const peak = 210 + ((x / 260) % 3) * 34;
    far.fillTriangle(x, 390, x + 170, peak, x + 350, 390);
  }
  drawDistantCastle(far);

  const mid = scene.add.graphics().setDepth(-18).setScrollFactor(0.34, 1);
  mid.fillStyle(LEVEL_ONE_COLORS.midSilhouette, 1);
  for (let x = -320; x <= 3_900; x += 360) {
    mid.fillTriangle(x, 430, x + 230, 294 + ((x / 360) % 2) * 36, x + 510, 430);
  }
  mid.fillRect(-320, 386, 4_600, 120);

  const forest = scene.add.graphics().setDepth(-10).setScrollFactor(0.62, 1);
  for (let x = -20, index = 0; x <= 4_150; x += 220, index += 1) {
    drawPixelTree(forest, x, 438, index);
  }
  drawRuin(forest, 820, 430);
  drawRuin(forest, 1_760, 430, true);
  drawRuin(forest, 2_760, 430);

  const near = scene.add.graphics().setDepth(-4);
  near.fillStyle(LEVEL_ONE_COLORS.safeShadow, 1);
  for (let x = 22; x < 3_000; x += 96) {
    const height = x % 192 === 0 ? 18 : 12;
    near.fillRect(x, 424 - height, 5, height);
    near.fillRect(x + 7, 428 - height, 5, height);
    near.fillRect(x + 14, 423 - height, 5, height);
  }

  addGameText(
    scene,
    40,
    36,
    '王城外圍 · 見習勇者巡禮',
    23,
    LEVEL_ONE_TEXT_COLORS.ink,
  )
    .setStroke(LEVEL_ONE_TEXT_COLORS.parchment, 5)
    .setDepth(-1);
  addGameText(
    scene,
    42,
    72,
    '沿古道抵達外城門，領取第一枚通行徽章。',
    15,
    LEVEL_ONE_TEXT_COLORS.inkMuted,
  )
    .setStroke(LEVEL_ONE_TEXT_COLORS.parchment, 4)
    .setDepth(-1);

  for (const region of LEVEL_ONE_SCENERY_REGIONS) {
    addTrailMarker(scene, region.labelX, region.label);
  }
}
