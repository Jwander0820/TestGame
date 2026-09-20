import type Phaser from 'phaser';
import type { RearHazardDefinition } from '../content/rearGauntlet';
import { LEVEL_ONE_COLORS as C } from '../content/levelOneVisuals';

export function createRearHazardVisual(scene: Phaser.Scene, definition: RearHazardDefinition) {
  const drawing = scene.add.graphics().setDepth(3);
  const w = definition.width / 2;
  const h = definition.height / 2;
  drawing.fillStyle(C.hazardDark, 0.7);
  drawing.fillRect(-w, -h, w * 2, h * 2);
  drawing.lineStyle(2, C.outline);
  drawing.strokeRect(-w, -h, w * 2, h * 2);
  drawing.fillStyle(C.royalGold);
  if (definition.id === 'sweep') {
    drawing.fillTriangle(-w, 0, -w + 18, -h, -w + 18, h);
    drawing.fillRect(-w + 18, -4, w * 2 - 18, 8);
  } else {
    for (let x = -w + 2; x < w - 8; x += 12) {
      drawing.fillTriangle(x, definition.id === 'ceiling' ? -h : h,
        x + 10, definition.id === 'ceiling' ? -h : h,
        x + 5, definition.id === 'ceiling' ? h : -h);
    }
  }
  return {
    show(x: number, visible: boolean, active: boolean, retired: boolean): void {
      drawing.setPosition(x, definition.y).setVisible(visible).setAlpha(retired ? 0.16 : active ? 1 : 0.4);
    },
  };
}
