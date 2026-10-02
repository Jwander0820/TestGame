import type Phaser from 'phaser';
import { BACKSTAGE } from '../content/backstage';
import { PIXEL_PALETTE as p, LEVEL_ONE_TEXT_COLORS as text } from '../content/levelOneVisuals';
import { addGameText } from './addGameText';

/** Original workshop props, using the shared pixel palette and top-left lighting. */
export function drawBackstageWorkshop(scene: Phaser.Scene) {
  const pad = scene.add.graphics().setPosition(BACKSTAGE.spring.x, BACKSTAGE.floorY).setDepth(2);
  pad.fillStyle(p.ink950).fillRect(-27, -4, 54, 12);
  pad.fillStyle(p.stone800).fillRect(-24, 0, 48, 6);
  pad.fillStyle(p.stone400).fillRect(-25, -3, 50, 3);
  for (let x = -20; x < 20; x += 8) pad.fillStyle(p.gold700).fillRect(x, 1, 4, 4);
  const compression = scene.add.graphics().setPosition(BACKSTAGE.spring.x, BACKSTAGE.floorY + 1).setDepth(3);
  compression.fillStyle(p.gold500).fillRect(-22, -3, 44, 3);
  const charge = scene.add.graphics().setDepth(3);
  const bell = scene.add.container(BACKSTAGE.bell.x, BACKSTAGE.bell.y);
  const g = scene.add.graphics();
  g.fillStyle(p.wood800).fillRect(-23, -43, 46, 7);
  g.fillStyle(p.wood400).fillRect(-23, -43, 46, 2);
  g.fillStyle(p.ink950).fillRect(-2, -36, 4, 18).fillRect(-8, -19, 16, 6)
    .fillRect(-13, -14, 26, 19).fillRect(-18, 5, 36, 7).fillRect(-3, 12, 6, 6);
  g.fillStyle(p.gold700).fillRect(-11, -12, 22, 18).fillRect(-16, 7, 32, 3);
  g.fillStyle(p.gold500).fillRect(-10, -12, 17, 16).fillRect(-16, 6, 29, 2);
  g.fillStyle(p.gold300).fillRect(-8, -11, 4, 12).fillRect(-13, 6, 8, 2);
  bell.add(g);
  addGameText(scene, 390, 239, '驗收鈴', 16, text.parchment).setOrigin(0.5);
  const result = addGameText(scene, 390, 266, '尚未送驗', 16, text.assist).setOrigin(0.5);
  const hint = addGameText(scene, 390, 478, '站定試彈 ↑', 17, text.parchment).setOrigin(0.5);
  return { pad, compression, charge, bell, result, hint };
}
