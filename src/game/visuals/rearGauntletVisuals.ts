import type Phaser from 'phaser';
import type { RearHazardDefinition } from '../content/rearGauntlet';
import { LEVEL_ONE_COLORS as C } from '../content/levelOneVisuals';
import type { RearGauntletState } from '../state/RearGauntletState';

export function createRearHazardVisual(scene: Phaser.Scene, definition: RearHazardDefinition) {
  const drawing = scene.add.graphics().setDepth(3);
  const w = definition.width / 2;
  const h = definition.height / 2;
  drawing.fillStyle(C.hazardDark, 0.7);
  drawing.fillRect(-w, -h, w * 2, h * 2);
  drawing.lineStyle(2, C.outline);
  drawing.strokeRect(-w, -h, w * 2, h * 2);
  drawing.fillStyle(C.royalGold);
  if (definition.id === 'sweep' || definition.id === 'returnSweep') {
    const direction = definition.velocityX > 0 ? 1 : -1;
    drawing.fillTriangle(direction * w, 0, direction * (w - 18), -h, direction * (w - 18), h);
    drawing.fillRect(-w + (direction < 0 ? 18 : 0), -4, w * 2 - 18, 8);
  } else if (definition.id === 'restHammer') {
    drawing.fillRect(-6, -h - 18, 12, 18);
    drawing.fillRect(-w + 4, -h + 4, w * 2 - 8, h * 2 - 8);
    drawing.fillStyle(C.hazardDark);
    drawing.fillRect(-w + 8, h - 12, w * 2 - 16, 6);
  } else {
    for (let x = -w + 2; x < w - 8; x += 12) {
      drawing.fillTriangle(x, definition.id === 'ceiling' ? -h : h,
        x + 10, definition.id === 'ceiling' ? -h : h,
        x + 5, definition.id === 'ceiling' ? h : -h);
    }
  }
  const impact = definition.id === 'restHammer' ? scene.add.graphics().setDepth(3) : null;
  impact?.lineStyle(2, C.hazardDark, 0.9).strokeRect(definition.x - w, 366, w * 2, 4);
  return {
    show(sample: ReturnType<RearGauntletState['sample']>): void {
      const { x, y, visible, active, retired, pending } = sample;
      drawing.setPosition(x, y).setVisible(visible).setAlpha(retired ? 0.16 : active ? 1 : 0.4);
      impact?.setVisible(visible && !retired && (pending || active));
    },
  };
}
