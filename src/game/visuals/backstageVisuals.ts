import type Phaser from 'phaser';
import { BACKSTAGE } from '../content/backstage';
import { PIXEL_PALETTE as p, LEVEL_ONE_TEXT_COLORS as text } from '../content/levelOneVisuals';
import { addGameText } from './addGameText';
import { drawBackstageWorkshop } from './backstageWorkshopVisuals';

export function drawBackstage(scene: Phaser.Scene) {
  const art = scene.add.graphics();
  const rect = (x: number, y: number, w: number, h: number, color: number): void => { art.fillStyle(color).fillRect(x, y, w, h); };
  rect(0, 0, 960, 540, p.ink950);
  rect(28, 72, 904, 350, p.ink800);
  // Exposed timber ribs and an unfinished forest backdrop.
  for (let x = 40; x < 940; x += 112) {
    rect(x, 80, 96, 324, p.ink800);
    for (let y = 90; y < 400; y += 28) {
      rect(x + 4, y, 88, 2, p.ink950);
      rect(x + 12 + (y % 3) * 8, y + 12, 24, 1, p.stone800);
    }
    rect(x - 8, 66, 12, 352, p.wood600);
    rect(x - 8, 66, 3, 352, p.wood400);
    rect(x - 10, 102, 16, 8, p.ink950);
    rect(x - 6, 104, 3, 3, p.stone600);
    rect(x - 10, 344, 16, 10, p.ink950);
    rect(x - 6, 347, 3, 3, p.stone600);
  }
  // A painted stage flat: layered crowns, bare canvas edge and exposed stretcher.
  rect(52, 100, 332, 204, p.wood800);
  rect(60, 106, 316, 190, p.mist500);
  rect(60, 106, 316, 42, p.mist300);
  for (let x = 62; x < 356; x += 48) {
    const top = 139 + ((x / 2) % 17);
    rect(x + 12, top, 8, 148, p.grass600);
    rect(x, top + 13, 36, 48, p.grass600);
    rect(x + 4, top + 5, 28, 17, p.grass600);
    rect(x + 8, top, 20, 8, p.grass600);
    rect(x + 4, top + 19, 8, 14, p.mist500);
  }
  for (const x of [92, 224]) {
    rect(x, 174, 10, 120, p.grass800);
    rect(x - 25, 180, 62, 38, p.grass800);
    rect(x - 15, 163, 44, 22, p.grass800);
    rect(x - 5, 155, 25, 14, p.grass800);
    rect(x - 18, 183, 16, 4, p.grass600);
  }
  rect(60, 282, 316, 14, p.grass600);
  rect(318, 106, 58, 190, p.wood600);
  rect(322, 110, 50, 180, p.wood800);
  for (let y = 108; y < 280; y += 32) rect(308 + (y % 3) * 4, y, 16, 32, p.parchment100);
  rect(60, 99, 320, 7, p.wood400);
  rect(54, 296, 330, 7, p.wood600);
  rect(76, 303, 8, 56, p.wood600); rect(350, 303, 8, 56, p.wood600);
  rect(50, 358, 45, 5, p.wood800); rect(338, 358, 34, 5, p.wood800);
  // Horizontal beams anchor the workshop instead of reading as a flat grid.
  rect(28, 72, 904, 12, p.wood800); rect(28, 72, 904, 3, p.wood400);
  rect(28, 316, 904, 8, p.wood800);
  for (const x of [38, 370, 818]) {
    for (let step = 0; step < 8; step++) rect(x + step * 5, 84 + step * 5, 9, 9, p.wood600);
  }
  // Floor meets the collision surface exactly.
  rect(28, BACKSTAGE.floorY, 904, 78, p.wood800);
  for (let x = 28; x < 930; x += 48) {
    rect(x, BACKSTAGE.floorY, 46, 8, p.wood400);
    rect(x + 2, 428, 42, 40, p.wood600);
    rect(x + 6, 432, 26, 2, p.wood400);
    rect(x + 10, 447, 24, 2, p.wood800);
    rect(x + 28, 442, 7, 3, p.wood800);
    rect(x + 6, 461, 16, 1, p.wood400);
    rect(x + 4, 422, 3, 3, p.ink950);
  }
  // Workbench: a physical level plan, wooden blocks and a cloth over spare spikes.
  rect(430, 388, 166, 12, p.ink950);
  rect(434, 386, 158, 8, p.wood400);
  rect(442, 400, 12, 18, p.wood600); rect(574, 400, 12, 18, p.wood600);
  rect(446, 411, 137, 5, p.wood800);
  rect(456, 361, 85, 24, p.parchment100);
  for (let x = 462; x < 526; x += 16) rect(x, 376 - (x % 3) * 4, 12, 7, p.grass600);
  rect(544, 366, 40, 20, p.mist700); rect(549, 362, 27, 4, p.assist500);
  // Small pinned job sheet leaves space for the actual physical level model.
  rect(428, 140, 170, 94, p.ink950); rect(432, 144, 162, 86, p.wood400);
  rect(437, 149, 152, 75, p.parchment100);
  rect(507, 147, 8, 5, p.gold700);
  addGameText(scene, 448, 159, '今日工程：金幣', 17, text.ink);
  addGameText(scene, 448, 187, '用途：讓關卡開心', 15, text.ink);
  const cloth = scene.add.rectangle(565, 372, 40, 23, p.mist700).setOrigin(0.5);
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    cloth.setX(594);
    scene.tweens.add({ targets: cloth, x: 565, duration: 220 });
  }
  // Retired spike props hang from the same wooden rail, outside the walking route.
  rect(801, 190, 84, 6, p.wood400);
  for (let x = 809; x < 880; x += 24) {
    rect(x, 196, 2, 24, p.gold700);
    art.fillStyle(p.stone600).fillTriangle(x - 7, 220, x + 1, 242, x + 9, 220);
  }
  drawWorkshopDetails(scene);
  // Same pixel density and approximately the hero's height; boots sit on the floor.
  const worker = scene.add.container(612, BACKSTAGE.floorY);
  const workerArt = scene.add.graphics();
  workerArt.fillStyle(p.ink950).fillRect(-11, -40, 23, 32).fillRect(-10, -11, 10, 11).fillRect(3, -11, 11, 11);
  workerArt.fillStyle(p.wood600).fillRect(-9, -5, 8, 4).fillRect(5, -5, 8, 4);
  workerArt.fillStyle(p.ink800).fillRect(-8, -17, 7, 13).fillRect(4, -17, 7, 13);
  workerArt.fillStyle(p.mist500).fillRect(-9, -27, 20, 13);
  workerArt.fillStyle(p.wood400).fillRect(-5, -26, 12, 18);
  workerArt.fillStyle(p.wood800).fillRect(-5, -12, 14, 4).fillRect(5, -21, 3, 9);
  workerArt.fillStyle(p.gold500).fillRect(0, -12, 3, 3);
  workerArt.fillStyle(p.skin400).fillRect(-7, -38, 17, 12).fillRect(-11, -24, 4, 11);
  workerArt.fillStyle(p.wood400).fillRect(6, -37, 4, 9);
  workerArt.fillStyle(p.ink950).fillRect(-5, -34, 2, 2).fillRect(3, -34, 2, 2);
  workerArt.fillStyle(p.stone600).fillRect(-4, -29, 11, 4);
  workerArt.fillStyle(p.gold700).fillRect(-13, -41, 27, 4).fillRect(-8, -48, 18, 7);
  workerArt.fillStyle(p.gold500).fillRect(-11, -42, 24, 3).fillRect(-7, -47, 16, 6);
  workerArt.fillStyle(p.gold300).fillRect(-5, -46, 4, 4);
  workerArt.fillStyle(p.stone400).fillRect(9, -17, 3, 7);
  worker.add(workerArt);
  const workerHand = scene.add.container(-10, -25);
  const handArt = scene.add.graphics();
  handArt.fillStyle(p.ink950).fillRect(0, -1, 7, 14);
  handArt.fillStyle(p.mist500).fillRect(1, 0, 5, 5);
  handArt.fillStyle(p.skin400).fillRect(1, 5, 4, 7);
  handArt.fillStyle(p.wood600).fillRect(5, 5, 3, 13);
  handArt.fillStyle(p.ink950).fillRect(1, 1, 13, 7);
  handArt.fillStyle(p.stone600).fillRect(2, 2, 11, 5);
  handArt.fillStyle(p.stone400).fillRect(2, 2, 8, 2);
  handArt.setScale(-1, 1);
  workerHand.add(handArt);
  worker.add(workerHand);
  // Test spikes are behind a barred screen, never a player collider.
  const spikes = scene.add.graphics().setPosition(295, 410);
  for (let x = -30; x < 35; x += 20) {
    for (let row = 0; row < 6; row++) {
      spikes.fillStyle(p.ink950).fillRect(x + 7 - row, -24 + row * 4, 3 + row * 2, 4);
      spikes.fillStyle(p.stone400).fillRect(x + 8 - row, -22 + row * 4, 1 + row, 3);
      spikes.fillStyle(p.stone800).fillRect(x + 9, -20 + row * 4, row, 4);
    }
  }
  rect(248, 385, 96, 14, p.stone600);
  for (let x = 248; x <= 340; x += 23) rect(x, 322, 3, 77, p.wood400);
  rect(244, 321, 104, 5, p.wood600);
  rect(240, 300, 110, 22, p.wood800);
  const testLabel = addGameText(scene, 295, 310, '驗收樣品', 16, text.parchment).setOrigin(0.5);
  // Slime and its crate share the existing pixel palette.
  const slime = scene.add.container(133, 402);
  const slimeArt = scene.add.graphics();
  slimeArt.fillStyle(p.ink950).fillRect(-20, -11, 40, 25).fillRect(-24, -3, 48, 13);
  slimeArt.fillStyle(p.grass800).fillRect(-21, 1, 42, 10).fillRect(-18, 10, 36, 2);
  slimeArt.fillStyle(p.grass400).fillRect(-18, -9, 36, 16).fillRect(-21, -2, 42, 8);
  slimeArt.fillStyle(p.grass200).fillRect(-15, -7, 9, 3).fillRect(-18, -3, 3, 4);
  slimeArt.fillStyle(p.ink950).fillRect(-12, -1, 7, 2).fillRect(5, -1, 7, 2).fillRect(-2, 5, 4, 2);
  slimeArt.fillStyle(p.gold700).fillRect(-21, -15, 42, 5).fillRect(-14, -24, 28, 10);
  slimeArt.fillStyle(p.gold500).fillRect(-20, -15, 38, 3).fillRect(-12, -23, 24, 9);
  slimeArt.fillStyle(p.gold300).fillRect(-8, -22, 6, 5);
  slime.add(slimeArt);
  const slimeCrate = scene.add.graphics().setPosition(190, 418);
  slimeCrate.fillStyle(p.wood800).fillRect(-17, -35, 34, 35);
  slimeCrate.fillStyle(p.wood400).fillRect(-14, -32, 28, 28);
  slimeCrate.fillStyle(p.wood600).fillRect(-4, -32, 5, 28).fillRect(-14, -21, 28, 5);
  rect(69, 329, 132, 24, p.wood800);
  const slimeLabel = addGameText(scene, 135, 340, '搬運中（休息）', 16, text.parchment).setOrigin(0.5);
  // Sign and net remain separate so their animation cannot alter floor geometry.
  rect(671, 141, 68, 6, p.wood400);
  rect(679, 147, 3, 51, p.gold700); rect(728, 147, 3, 51, p.gold700);
  const sign = scene.add.container(BACKSTAGE.sign.x, BACKSTAGE.sign.startY);
  sign.add(scene.add.rectangle(0, 0, 76, 42, p.gold500).setStrokeStyle(3, p.ink950));
  const signArt = scene.add.graphics();
  signArt.fillStyle(p.gold300).fillRect(-35, -18, 70, 3);
  signArt.fillStyle(p.gold700).fillRect(-35, 15, 70, 3);
  for (const x of [-31, 29]) signArt.fillStyle(p.ink950).fillRect(x, -14, 3, 3).fillRect(x, 11, 3, 3);
  sign.add(signArt);
  sign.add(addGameText(scene, 0, 0, '安全施工', 15, text.ink).setOrigin(0.5));
  const warning = scene.add.graphics().setVisible(false);
  warning.lineStyle(3, p.gold500).strokeRect(665, 413, 80, 5);
  for (let x = 670; x < 745; x += 15) warning.lineBetween(x, 435, x + 7, 422);
  warning.lineBetween(696, 372, 705, 383).lineBetween(705, 383, 714, 372);
  const signCountdown = addGameText(scene, 705, 350, '', 17, text.parchment).setOrigin(0.5).setVisible(false);
  const net = scene.add.graphics().setVisible(false);
  net.lineStyle(2, p.assist500);
  for (let x = 656; x <= 756; x += 10) net.lineBetween(x, 438, x + 8, 458);
  net.lineBetween(656, 438, 756, 438).lineBetween(664, 449, 760, 449).lineBetween(664, 458, 764, 458);
  addGameText(scene, 702, 171, '此區尚未實裝', 17, text.parchment).setOrigin(0.5);
  rect(854, 310, 70, 108, p.ink950);
  // The doorway reveals a sliver of the finished forest, a clear route back.
  rect(862, 313, 53, 96, p.grass800);
  rect(865, 316, 47, 48, p.mist500);
  rect(899, 316, 7, 89, p.wood800);
  rect(883, 322, 29, 18, p.grass600);
  rect(862, 399, 53, 10, p.grass400);
  rect(857, 410, 65, 8, p.wood600);
  rect(849, 305, 8, 113, p.wood400); rect(920, 305, 8, 113, p.wood400);
  rect(849, 302, 79, 8, p.wood400);
  rect(852, 308, 3, 107, p.gold700); rect(923, 308, 3, 107, p.wood800);
  rect(826, 264, 112, 32, p.wood800); rect(826, 264, 112, 2, p.wood400);
  addGameText(scene, 890, 284, '返回關卡 →', 19, text.parchment).setOrigin(0.5);
  addGameText(scene, 48, 24, '工務處後台', 27, text.parchment);
  addGameText(scene, 48, 53, '尚未開放・右側隨時可返回 →', 16, text.assist);
  addGameText(scene, 480, 511, '施工進度：差一點就好了。（昨日亦同）', 17, text.parchment).setOrigin(0.5);
  const workshop = drawBackstageWorkshop(scene);
  return { sign, warning, signCountdown, net, worker, workerHand, slime, slimeCrate, slimeLabel, spikes, testLabel, workshop };
}

/** Static scenic props; none of these surfaces create collision or hide the walking lane. */
function drawWorkshopDetails(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  const r = (x: number, y: number, w: number, h: number, c: number): void => { g.fillStyle(c).fillRect(x, y, w, h); };
  const crate = (x: number, y: number, w: number, h: number): void => {
    r(x, y, w, h, p.ink950); r(x + 2, y + 2, w - 4, h - 4, p.wood800);
    for (let i = 4; i < w - 4; i += 10) {
      r(x + i, y + 3, 8, h - 6, p.wood600); r(x + i, y + 4, 1, h - 8, p.wood400);
    }
    r(x + 2, y + 2, w - 4, 4, p.wood400); r(x + 2, y + h - 6, w - 4, 4, p.wood400);
    for (const dx of [4, w - 6]) for (const dy of [3, h - 5]) r(x + dx, y + dy, 2, 2, p.ink950);
  };
  const lantern = (x: number, y: number): void => {
    r(x - 1, y - 24, 2, 24, p.wood400); r(x - 6, y, 12, 3, p.ink950);
    r(x - 9, y + 3, 18, 23, p.ink950); r(x - 6, y + 6, 12, 17, p.gold700);
    r(x - 4, y + 7, 8, 13, p.gold500); r(x - 3, y + 8, 3, 9, p.gold300);
    r(x - 10, y + 25, 20, 4, p.wood800);
  };
  lantern(399, 115); lantern(808, 115);
  // A tool rack: saw teeth, mallet and square, with each tool hanging on a peg.
  r(431, 252, 168, 7, p.wood600); r(431, 252, 168, 2, p.wood400);
  for (const x of [443, 477, 512, 550, 582]) r(x, 251, 3, 6, p.stone400);
  r(439, 263, 7, 28, p.wood400); r(431, 260, 23, 9, p.stone800);
  r(432, 260, 21, 3, p.stone400);
  r(472, 260, 10, 9, p.wood400); r(475, 262, 4, 4, p.ink950);
  r(473, 269, 8, 22, p.stone600);
  for (let y = 270; y < 290; y += 5) r(480, y, 3, 2, p.stone400);
  r(509, 260, 5, 29, p.stone400); r(509, 285, 24, 4, p.stone400);
  r(546, 260, 10, 4, p.wood400); r(549, 264, 4, 19, p.wood600);
  r(547, 283, 8, 8, p.grass600);
  r(579, 260, 8, 16, p.wood600); r(581, 276, 4, 14, p.stone600);
  const b = (x: number, y: number, w: number, h: number, c: number): void => r(x, y + 28, w, h, c);
  // Level miniature: grassy blocks, two rope-bridge planks, castle and real coin props.
  b(448, 354, 91, 3, p.wood800);
  for (const [x, y, h] of [[454, 343, 11], [478, 337, 17], [511, 341, 13]] as const) {
    b(x, y, 18, h, p.stone800); b(x, y, 18, 3, p.grass400);
    b(x + 2, y + 5, 6, 3, p.stone600);
  }
  b(495, 343, 17, 3, p.wood600); b(499, 337, 2, 9, p.wood400); b(507, 337, 2, 9, p.wood400);
  b(520, 321, 14, 21, p.stone600); b(519, 318, 4, 6, p.stone400); b(531, 318, 4, 6, p.stone400);
  b(524, 334, 6, 8, p.ink950);
  for (const x of [459, 480, 489]) { b(x, 329, 5, 6, p.gold700); b(x, 329, 3, 4, p.gold500); }
  // Drawing roll, inkwell, mug, and the workbench's dovetails and lower shelf.
  b(435, 339, 12, 15, p.wood800); b(437, 340, 8, 12, p.parchment100); b(438, 342, 5, 2, p.wood400);
  b(594, 344, 9, 10, p.ink950); b(596, 346, 5, 7, p.mist700); b(598, 331, 2, 14, p.wood400);
  b(578, 350, 8, 7, p.parchment100); b(586, 351, 3, 4, p.stone400);
  for (const x of [442, 574]) r(x + 2, 400, 2, 15, p.wood400);
  r(468, 402, 72, 7, p.wood800); r(468, 402, 72, 2, p.wood400);
  // Paint tins beside the unfinished canvas, plus a brush leaning against its frame.
  for (const [x, y, color] of [[768, 384, p.grass600], [793, 392, p.mist500]] as const) {
    r(x, y, 19, 24, p.ink950); r(x + 2, y + 3, 15, 18, p.stone600);
    r(x + 3, y + 4, 6, 15, p.stone400); r(x + 2, y + 2, 15, 3, color);
    r(x + 10, y + 4, 3, 7, color); r(x + 6, y + 13, 7, 6, p.parchment100);
  }
  for (let i = 0; i < 8; i++) r(817 + i, 349 + i * 6, 3, 7, p.wood400);
  r(814, 345, 9, 13, p.grass600); r(814, 345, 9, 4, p.mist500);
  r(783, 410, 15, 2, p.grass600); r(803, 413, 8, 2, p.mist500);
  // Spare materials never cross the entrance hazard's 667..743 landing span.
  crate(60, 373, 34, 43); crate(63, 352, 28, 21);
  r(181, 369, 22, 12, p.parchment100); r(185, 372, 13, 2, p.wood600);
  for (let i = 0; i < 4; i++) {
    r(766 + i * 12, 239 - i * 6, 9, 64 + i * 6, p.wood800);
    r(767 + i * 12, 240 - i * 6, 5, 60 + i * 6, p.wood600);
    r(767 + i * 12, 240 - i * 6, 2, 56 + i * 6, p.wood400);
  }
  r(762, 283, 57, 5, p.ink950); r(766, 284, 49, 2, p.stone600);
  // Metal feet and two guide rails make the spike test station read as a machine.
  r(244, 395, 105, 19, p.ink950); r(247, 399, 99, 12, p.stone800);
  for (let x = 251; x < 341; x += 18) { r(x, 401, 8, 4, p.stone600); r(x + 1, 402, 2, 2, p.stone400); }
  r(236, 356, 7, 39, p.wood600); r(233, 353, 14, 7, p.gold700);
  r(228, 343, 6, 17, p.wood400); r(225, 341, 12, 5, p.danger700);
  // A pulley and winch explain where the unsafe "safe" sign came from.
  r(700, 103, 9, 38, p.wood800); r(694, 115, 21, 18, p.ink950);
  r(697, 118, 15, 12, p.wood400); r(701, 121, 7, 6, p.wood800);
  r(693, 130, 2, 15, p.gold700); r(714, 130, 2, 16, p.gold700);
  // Small fasteners are restrained to seams; the floor stays a clean walking silhouette.
  for (const x of [51, 367, 603, 835, 918]) { r(x, 422, 4, 3, p.ink950); r(x, 422, 2, 1, p.stone600); }
}
