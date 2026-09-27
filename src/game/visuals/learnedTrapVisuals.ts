import type Phaser from 'phaser';
import { LEVEL_ONE_TRAPS } from '../content/levelOneTraps';
import { PIXEL_PALETTE as P } from '../content/levelOneVisuals';
import { paintSpikeRack, paintTrapPlate } from './trapPixelArt';

export interface LearnedTrapVisuals {
  showCeiling(revealed: boolean, enabled: boolean): void;
  showFloor(revealed: boolean): void;
  showAirAmbush(revealed: boolean, enabled: boolean): void;
}

/** Replace this factory to change the art. None of these objects has a body. */
export function createLearnedTrapVisuals(scene: Phaser.Scene): LearnedTrapVisuals {
  const { ceiling, falseFloor, airAmbush } = LEVEL_ONE_TRAPS;
  const roof = scene.add.graphics().setPosition(ceiling.x, ceiling.y).setDepth(2);
  paintTrapPlate(roof, ceiling.width, ceiling.height);
  roof.fillStyle(P.gold700).fillRect(-7, 3, 14, 3);
  const floor = scene.add.tileSprite(falseFloor.x, falseFloor.y, falseFloor.width,
    falseFloor.height, 'mercy-platform').setDepth(1);
  const teeth = scene.add.graphics().setPosition(airAmbush.x, airAmbush.y).setDepth(2);
  // The revealed rack rests on two narrow stone uprights at the gap edges.
  for (const x of [-airAmbush.width / 2, airAmbush.width / 2 - 8]) {
    teeth.fillStyle(P.ink950).fillRect(x, -airAmbush.height / 2, 8, 125);
    teeth.fillStyle(P.stone600).fillRect(x + 2, -airAmbush.height / 2 + 4, 4, 117);
    teeth.fillStyle(P.stone400).fillRect(x + 2, -airAmbush.height / 2 + 6, 2, 8);
    teeth.fillStyle(P.stone800).fillRect(x - 4, 96, 16, 6);
  }
  paintSpikeRack(teeth, airAmbush.width, airAmbush.height, 'down');
  return {
    showCeiling: (revealed, enabled) => roof.setAlpha(revealed ? (enabled ? 1 : 0.2) : 0),
    showFloor: (revealed) => floor.setAlpha(revealed ? 0.8 : 0),
    showAirAmbush: (revealed, enabled) => teeth.setAlpha(revealed ? (enabled ? 1 : 0.15) : 0),
  };
}
