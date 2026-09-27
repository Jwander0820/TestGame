import type Phaser from 'phaser';
import type { SlimeDefinition } from '../content/levelOneSlimes';
import { LEVEL_ONE_COLORS as C, LEVEL_ONE_TEXT_COLORS as T } from '../content/levelOneVisuals';
import type { SlimeSample } from '../state/SlimeState';
import { addGameText } from './addGameText';

// The zone and state stay independent from the optional third-batch sprite.
export function createSlimePrototypeVisual(scene: Phaser.Scene, definition: SlimeDefinition) {
  const shape = scene.add.graphics().setDepth(4);
  const textureKey = definition.id === 'charger' ? 'slime-charger' : 'slime-jumper';
  const art = scene.textures.exists(textureKey) ? scene.add.image(definition.x, definition.y, textureKey).setDepth(4) : null;
  const label = addGameText(scene, definition.x, definition.y - 68, definition.label, 12, T.ink)
    .setOrigin(0.5).setBackgroundColor(T.parchment).setPadding(3, 2).setDepth(4);
  let lastStyle = '';
  return {
    show(sample: SlimeSample): void {
      const harmless = !sample.dangerous;
      const sleeping = sample.phase === 'fake-rest';
      const warning = sample.phase === 'tell' || sample.phase === 'wake';
      const flat = sleeping || sample.phase === 'spent' || sample.phase === 'retired';
      const style = `${sample.phase}:${sample.revealed}`;
      if (style !== lastStyle) {
        lastStyle = style;
        label.setVisible(sample.revealed || sample.phase !== 'idle');
        const w = definition.width, h = definition.height;
        if (art !== null) {
          art.setDisplaySize(w, flat ? 8 : h)
            .setTint(warning ? C.royalGold : sleeping ? C.nearHill : sample.revealed ? C.hazard : 0xffffff)
            .setAlpha(harmless ? 0.86 : 1);
        } else {
          shape.clear().fillStyle(sleeping ? C.nearHill : warning ? C.royalGold : harmless ? C.assist : C.hazard)
            .lineStyle(2, C.outline);
          if (flat) {
            shape.fillRect(-w / 2, h / 2 - 8, w, 8).strokeRect(-w / 2, h / 2 - 8, w, 8);
          } else if (definition.id === 'jumper') {
            shape.fillCircle(0, 0, w / 2).strokeCircle(0, 0, w / 2);
          } else {
            shape.fillRect(-w / 2, -h / 2, w, h).strokeRect(-w / 2, -h / 2, w, h);
          }
          shape.fillStyle(C.outline);
          const eyeY = flat ? h / 2 - 5 : -4;
          shape.fillRect(-9, eyeY, 4, flat ? 2 : 5).fillRect(5, sleeping ? eyeY - 3 : eyeY, 4, sleeping ? 5 : flat ? 2 : 5);
          if (sample.phase === 'revenge') {
            shape.fillTriangle(12, -h / 2 - 7, 20, -h / 2 - 3, 12, -h / 2 + 1);
          }
        }
        label.setText(sample.phase === 'retired' ? '奉命休息' : sample.phase === 'spent' ? '這次真的累了' :
          sleeping ? '睡著了？' : sample.phase === 'wake' ? '！還沒完' : sample.phase === 'revenge' ?
            definition.id === 'charger' ? '回頭追撞' : '再跳一次' :
            sample.phase === 'tell' ? '！' : sample.revealed ? definition.hint : definition.label);
      }
      shape.setPosition(sample.x, sample.y);
      art?.setPosition(sample.x, sample.y + (flat ? definition.height / 2 - 4 : 0));
      label.setPosition(sample.x, sample.y - 68);
    },
  };
}
