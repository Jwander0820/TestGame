import type Phaser from 'phaser';
import type { SlimeDefinition } from '../content/levelOneSlimes';
import { LEVEL_ONE_COLORS as C, LEVEL_ONE_TEXT_COLORS as T } from '../content/levelOneVisuals';
import type { SlimeSample } from '../state/SlimeState';
import { addGameText } from './addGameText';

// 本輪經使用者指定的幾何佔位物，正式圖像可獨立替換。
export function createSlimePrototypeVisual(scene: Phaser.Scene, definition: SlimeDefinition) {
  const shape = scene.add.graphics().setDepth(4);
  const label = addGameText(scene, definition.x, definition.y - 38, definition.label, 12, T.ink)
    .setOrigin(0.5).setBackgroundColor(T.parchment).setPadding(3, 2).setDepth(4);
  let lastStyle = '';
  return {
    show(sample: SlimeSample): void {
      const harmless = !sample.dangerous;
      const style = `${sample.phase}:${sample.revealed}`;
      if (style !== lastStyle) {
        lastStyle = style;
        shape.clear().fillStyle(harmless ? C.assist : sample.phase === 'tell' ? C.royalGold : C.hazard)
          .lineStyle(2, C.outline);
        const w = definition.width, h = definition.height;
        if (harmless) {
          shape.fillRect(-w / 2, h / 2 - 8, w, 8).strokeRect(-w / 2, h / 2 - 8, w, 8);
        } else if (definition.id === 'jumper') {
          shape.fillCircle(0, 0, w / 2).strokeCircle(0, 0, w / 2);
        } else {
          shape.fillRect(-w / 2, -h / 2, w, h).strokeRect(-w / 2, -h / 2, w, h);
        }
        shape.fillStyle(C.outline);
        const eyeY = harmless ? h / 2 - 5 : -4;
        shape.fillRect(-9, eyeY, 4, harmless ? 2 : 5).fillRect(5, eyeY, 4, harmless ? 2 : 5);
        label.setText(sample.phase === 'retired' ? '奉命休息' : sample.phase === 'spent' ? '累了…' :
          sample.phase === 'tell' ? '！' : sample.revealed ? definition.hint : definition.label);
      }
      shape.setPosition(sample.x, sample.y);
      label.setPosition(sample.x, sample.y - 38);
    },
  };
}
