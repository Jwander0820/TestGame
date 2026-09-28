import type Phaser from 'phaser';
import { BACKSTAGE } from '../content/backstage';
import { PIXEL_PALETTE as p, LEVEL_ONE_TEXT_COLORS as text } from '../content/levelOneVisuals';
import { addGameText } from './addGameText';

export function drawBackstage(scene: Phaser.Scene) {
  const art = scene.add.graphics();
  const rect = (x: number, y: number, w: number, h: number, color: number): void => { art.fillStyle(color).fillRect(x, y, w, h); };
  rect(0, 0, 960, 540, p.ink950);
  rect(28, 72, 904, 350, p.wood800);
  // Exposed timber ribs and an unfinished forest backdrop.
  for (let x = 40; x < 940; x += 112) {
    rect(x, 80, 96, 324, p.stone800);
    for (let y = 90; y < 400; y += 28) rect(x + 6, y, 80, 2, p.stone600);
    rect(x - 8, 66, 12, 352, p.wood600);
    rect(x - 8, 66, 3, 352, p.wood400);
    rect(x - 10, 102, 16, 8, p.ink950);
  }
  rect(44, 86, 544, 206, p.mist300);
  rect(44, 236, 544, 56, p.mist500);
  for (let x = 58; x < 570; x += 70) {
    rect(x + 20, 133, 12, 155, p.grass600);
    rect(x, 145, 54, 37, p.grass600);
    rect(x + 8, 120, 38, 32, p.mist500);
  }
  // Missing scenic panels reveal the workshop wall.
  rect(410, 86, 178, 58, p.wood800);
  rect(508, 144, 80, 148, p.wood800);
  for (let x = 50; x < 595; x += 108) {
    rect(x, 78, 6, 226, p.wood400);
    rect(x - 4, 286, 16, 8, p.gold700);
  }
  rect(40, 302, 548, 10, p.wood600);
  rect(40, 302, 548, 3, p.wood400);
  // Floor meets the collision surface exactly.
  rect(28, BACKSTAGE.floorY, 904, 78, p.wood800);
  for (let x = 28; x < 930; x += 48) {
    rect(x, BACKSTAGE.floorY, 46, 8, p.wood400);
    rect(x + 2, 428, 42, 40, p.wood600);
    rect(x + 6, 432, 26, 2, p.wood400);
    rect(x + 4, 422, 3, 3, p.ink950);
  }
  // Workbench: a physical level plan, wooden blocks and a cloth over spare spikes.
  rect(430, 360, 166, 12, p.ink950);
  rect(434, 358, 158, 8, p.wood400);
  rect(442, 372, 12, 46, p.wood600); rect(574, 372, 12, 46, p.wood600);
  rect(446, 384, 137, 6, p.wood800);
  rect(456, 333, 85, 24, p.parchment100);
  for (let x = 462; x < 526; x += 16) rect(x, 348 - (x % 3) * 4, 12, 7, p.grass600);
  rect(544, 338, 40, 20, p.mist700); rect(549, 334, 27, 4, p.assist500);
  // Plan pinned above the bench; editable labels are real text.
  rect(424, 172, 200, 138, p.ink950); rect(428, 176, 192, 130, p.parchment100);
  addGameText(scene, 440, 186, '關卡施工單', 20, text.ink);
  addGameText(scene, 440, 222, '金幣：讓玩家開心', 16, text.ink);
  rect(440, 234, 154, 2, p.danger700);
  addGameText(scene, 440, 255, '改：讓關卡開心', 18, text.danger);
  const cloth = scene.add.rectangle(565, 344, 40, 23, p.mist700).setOrigin(0.5);
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
  // Worker silhouette, helmet, beard, vest and hammer.
  const worker = scene.add.container(612, 380);
  const workerArt = scene.add.graphics();
  workerArt.fillStyle(p.ink950).fillRect(-14, -27, 28, 64);
  workerArt.fillStyle(p.skin400).fillRect(-10, -24, 20, 20);
  workerArt.fillStyle(p.gold500).fillRect(-15, -29, 30, 7).fillRect(-10, -38, 21, 13);
  workerArt.fillStyle(p.gold300).fillRect(-8, -36, 6, 6);
  workerArt.fillStyle(p.wood400).fillRect(-10, -1, 20, 26);
  workerArt.fillStyle(p.parchment100).fillRect(-9, -12, 18, 12);
  workerArt.fillStyle(p.ink950).fillRect(-7, -20, 3, 3).fillRect(5, -20, 3, 3);
  workerArt.fillStyle(p.stone400).fillRect(19, -7, 17, 9);
  workerArt.fillStyle(p.wood600).fillRect(24, 2, 5, 22);
  worker.add(workerArt);
  const workerHand = scene.add.rectangle(15, 4, 8, 20, p.skin400).setOrigin(0.5, 0);
  worker.add(workerHand);
  // Test spikes are behind a barred screen, never a player collider.
  const spikes = scene.add.graphics().setPosition(295, 410);
  for (let x = -30; x < 35; x += 20) {
    spikes.fillStyle(p.stone400).fillTriangle(x, 0, x + 8, -24, x + 16, 0);
    spikes.fillStyle(p.stone800).fillTriangle(x + 8, -24, x + 8, 0, x + 16, 0);
  }
  rect(248, 385, 96, 14, p.stone600);
  for (let x = 248; x <= 340; x += 23) rect(x, 322, 3, 77, p.wood400);
  rect(244, 321, 104, 5, p.wood600);
  const testLabel = addGameText(scene, 295, 292, '驗收樣品', 18, text.parchment).setOrigin(0.5);
  // Slime and its crate share the existing pixel palette.
  const slime = scene.add.container(133, 402);
  const slimeArt = scene.add.graphics();
  slimeArt.fillStyle(p.ink950).fillRect(-24, -14, 48, 28);
  slimeArt.fillStyle(p.grass400).fillRect(-21, -11, 42, 22);
  slimeArt.fillStyle(p.grass200).fillRect(-17, -10, 14, 4);
  slimeArt.fillStyle(p.ink950).fillRect(-12, -2, 8, 2).fillRect(6, -2, 8, 2);
  slimeArt.fillStyle(p.gold500).fillRect(-24, -18, 48, 6).fillRect(-15, -26, 30, 10);
  slime.add(slimeArt);
  rect(173, 383, 34, 35, p.wood800); rect(176, 386, 28, 28, p.wood400);
  rect(186, 386, 5, 28, p.wood600); rect(176, 397, 28, 5, p.wood600);
  addGameText(scene, 135, 340, '搬運中（休息）', 17, text.parchment).setOrigin(0.5);
  // Sign and net remain separate so their animation cannot alter floor geometry.
  rect(671, 141, 68, 6, p.wood400);
  rect(679, 147, 3, 51, p.gold700); rect(728, 147, 3, 51, p.gold700);
  const sign = scene.add.container(BACKSTAGE.sign.x, BACKSTAGE.sign.startY);
  sign.add(scene.add.rectangle(0, 0, 76, 42, p.gold500).setStrokeStyle(3, p.ink950));
  sign.add(addGameText(scene, 0, 0, '安全施工', 16, text.ink).setOrigin(0.5));
  const warning = scene.add.graphics().setVisible(false);
  warning.lineStyle(3, p.gold500).strokeRect(665, 413, 80, 5);
  for (let x = 670; x < 745; x += 15) warning.lineBetween(x, 435, x + 7, 422);
  const net = scene.add.graphics().setVisible(false);
  net.lineStyle(2, p.assist500);
  for (let x = 656; x <= 756; x += 10) net.lineBetween(x, 438, x + 8, 458);
  net.lineBetween(656, 438, 756, 438).lineBetween(664, 449, 760, 449).lineBetween(664, 458, 764, 458);
  addGameText(scene, 702, 171, '此區尚未實裝', 17, text.parchment).setOrigin(0.5);
  rect(854, 310, 70, 108, p.ink950);
  rect(849, 305, 8, 113, p.wood400); rect(920, 305, 8, 113, p.wood400);
  rect(849, 302, 79, 8, p.wood400);
  addGameText(scene, 890, 284, '返回關卡 →', 19, text.parchment).setOrigin(0.5);
  addGameText(scene, 48, 24, '工務處後台', 27, text.parchment);
  addGameText(scene, 48, 57, '尚未開放・右側隨時可返回 →', 18, text.assist);
  addGameText(scene, 480, 484, '施工進度：差一點就好了。（昨日亦同）', 18, text.parchment).setOrigin(0.5);
  return { sign, warning, net, worker, workerHand, slime, spikes, testLabel };
}

export function drawBackstageEntrance(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(4);
  g.fillStyle(p.wood800).fillRect(2, 186, 6, 66);
  g.fillStyle(p.gold500).fillRect(0, 185, 31, 10);
  g.fillStyle(p.ink950).fillRect(4, 185, 5, 10).fillRect(20, 185, 5, 10);
  addGameText(scene, 8, 158, '←', 22, text.ink).setDepth(4);
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    scene.time.addEvent({ delay: 2_400, loop: true, callback: () => {
      const chip = scene.add.rectangle(1, 202, 4, 3, p.wood400).setDepth(4);
      scene.tweens.add({ targets: chip, x: 24, y: 241, alpha: 0, duration: 800, onComplete: () => chip.destroy() });
    } });
  }
}
