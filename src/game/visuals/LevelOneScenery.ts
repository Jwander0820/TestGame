import Phaser from 'phaser';
import { LEVEL_ONE_SCENERY_REGIONS, LEVEL_ONE_TEXT_COLORS, PIXEL_PALETTE as C } from '../content/levelOneVisuals';
import { addGameText } from './addGameText';
import { paintSky, paintMountains, paintDistantWoods, paintTree, paintRuin, paintUndergrowth } from './forestPainting';
import { graphicsPainter, type PixelPainter } from './pixelPainter';

export function drawLevelOneScenery(scene: Phaser.Scene): void {
  scene.cameras.main.setBackgroundColor(C.sky300);
  const layer = (depth: number, scroll: number): PixelPainter =>
    graphicsPainter(scene.add.graphics().setDepth(depth).setScrollFactor(scroll, 1));
  const sky = graphicsPainter(scene.add.graphics().setDepth(-30).setScrollFactor(0));
  paintSky(sky);
  paintMountains(layer(-24, 0.12));
  paintDistantWoods(layer(-18, 0.34));
  const forest = layer(-10, 0.62);
  for (let x = -70, n = 0; x < 3900; x += 286, n++) paintTree(forest, x, 454, n);
  for (const x of [798, 1740, 2680]) paintRuin(forest, x, 444);
  const near = layer(-4, 1);
  // Plants stay behind the solid platform top, never disguise gaps as safe ground.
  for (const x of [22, 264, 754, 1050, 1390, 2290, 2810]) paintUndergrowth(near, x, 438);
  for (const region of LEVEL_ONE_SCENERY_REGIONS) {
    const p = layer(-1, 1);
    const x = region.labelX;
    p.rect(x - 3, 384, 6, 46, C.wood800);
    p.rect(x - 49, 364, 98, 28, C.wood800);
    p.rect(x - 47, 366, 94, 23, C.wood600);
    p.rect(x - 45, 366, 90, 2, C.wood400);
    p.rect(x - 42, 378, 3, 3, C.gold300);
    addGameText(scene, x + 3, 378, region.label, 12, LEVEL_ONE_TEXT_COLORS.parchment)
      .setOrigin(0.5).setDepth(0);
  }
}
