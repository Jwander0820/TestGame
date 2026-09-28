import type Phaser from 'phaser';
import type { RearHazardDefinition } from '../content/rearGauntlet';
import { PIXEL_PALETTE as P } from '../content/levelOneVisuals';
import type { RearGauntletState } from '../state/RearGauntletState';
import { paintFlyingDart, paintHammer, paintSpikeRack, paintTrapPlate } from './trapPixelArt';

export function createRearHazardVisual(scene: Phaser.Scene, definition: RearHazardDefinition) {
  const drawing = scene.add.graphics().setDepth(3);
  const spikes = definition.id === 'exit' || definition.id === 'finish' || definition.id === 'ceiling';
  if (spikes) {
    paintSpikeRack(drawing, definition.width, definition.height, definition.id === 'ceiling' ? 'down' : 'up');
  } else if (definition.id === 'restHammer' || definition.id === 'restEcho') {
    paintHammer(drawing, definition.width, definition.height);
  } else {
    paintFlyingDart(drawing, definition.width, definition.height, definition.velocityX > 0 ? 1 : -1);
  }
  const socket = spikes ? scene.add.graphics().setDepth(3) : null;
  if (socket !== null) paintTrapPlate(socket, definition.width, Math.min(definition.height, 12));
  const impact = definition.id === 'restHammer' || definition.id === 'restEcho' ? scene.add.graphics().setDepth(3) : null;
  if (impact !== null) {
    impact.fillStyle(P.danger700).fillRect(definition.x - 20, 366, 40, 3);
    impact.fillStyle(P.stone400).fillRect(definition.x - 12, 369, 6, 2).fillRect(definition.x + 6, 369, 6, 2);
  }
  return {
    show(sample: ReturnType<RearGauntletState['sample']>): void {
      const { x, y, visible, active, retired, pending } = sample;
      drawing.setPosition(x, y).setVisible(visible && (!spikes || active))
        .setAlpha(retired ? 0.18 : active ? 1 : 0.55);
      socket?.setPosition(x, y + (definition.id === 'ceiling' ? -definition.height / 2 + 6 : definition.height / 2 - 6))
        .setVisible(visible && !active).setAlpha(retired ? 0.25 : 0.8);
      impact?.setVisible(visible && !retired && (pending || active));
    },
  };
}
