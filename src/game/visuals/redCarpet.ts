import type Phaser from 'phaser';
import { LEVEL_ONE_COLORS as C, LEVEL_ONE_TEXT_COLORS as T } from '../content/levelOneVisuals';
import { addGameText } from './addGameText';

export function drawRedCarpet(scene: Phaser.Scene): void {
  const road = scene.add.graphics().setDepth(2);
  road.fillStyle(C.outline).fillRect(0, 418, 3_000, 36);
  road.fillStyle(C.heroCape).fillRect(0, 418, 3_000, 22);
  road.fillStyle(C.royalGold).fillRect(0, 418, 3_000, 3).fillRect(0, 438, 3_000, 3);
  for (let x = 120; x < 3_000; x += 160) {
    road.fillTriangle(x, 424, x + 14, 430, x, 436);
  }
  for (const x of [280, 1_050, 1_850, 2_600]) {
    addGameText(scene, x, 466, '工務處接管 → 只要向右走', 16, T.ink)
      .setOrigin(0.5).setBackgroundColor(T.assist).setPadding(8, 5).setDepth(5);
  }
}
