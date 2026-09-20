import type Phaser from 'phaser';
import { LEVEL_ONE_COLORS } from '../content/levelOneVisuals';
import { LEVEL_ONE_TRAPS } from '../content/levelOneTraps';

export interface LearnedTrapVisuals {
  showCeiling(revealed: boolean, enabled: boolean): void;
  showFloor(revealed: boolean): void;
  showAirAmbush(revealed: boolean, enabled: boolean): void;
}

/** Replace this factory to change the art. None of these objects has a body. */
export function createLearnedTrapVisuals(scene: Phaser.Scene): LearnedTrapVisuals {
  const { ceiling, falseFloor, airAmbush } = LEVEL_ONE_TRAPS;
  const roof = scene.add.rectangle(ceiling.x, ceiling.y, ceiling.width, ceiling.height,
    LEVEL_ONE_COLORS.royalGold).setStrokeStyle(3, LEVEL_ONE_COLORS.outline).setDepth(2);
  const floor = scene.add.tileSprite(falseFloor.x, falseFloor.y, falseFloor.width,
    falseFloor.height, 'mercy-platform').setDepth(1);
  const teeth = scene.add.graphics().setDepth(2);
  teeth.fillStyle(LEVEL_ONE_COLORS.hazard);
  teeth.lineStyle(2, LEVEL_ONE_COLORS.outline);
  const left = airAmbush.x - airAmbush.width / 2;
  const top = airAmbush.y - airAmbush.height / 2;
  for (let x = left; x < left + airAmbush.width; x += 16) {
    teeth.fillTriangle(x, top, x + 16, top, x + 8, top + airAmbush.height);
    teeth.strokeTriangle(x, top, x + 16, top, x + 8, top + airAmbush.height);
  }
  return {
    showCeiling: (revealed, enabled) => roof.setAlpha(revealed ? (enabled ? 1 : 0.2) : 0),
    showFloor: (revealed) => floor.setAlpha(revealed ? 0.8 : 0),
    showAirAmbush: (revealed, enabled) => teeth.setAlpha(revealed ? (enabled ? 1 : 0.15) : 0),
  };
}
