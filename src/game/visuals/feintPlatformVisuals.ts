import type Phaser from 'phaser';
import { FEINT_PLATFORM as floor, type FeintSample } from '../content/feintPlatform';
import { PIXEL_PALETTE as color } from '../content/levelOneVisuals';

export function createFeintPlatformVisual(scene: Phaser.Scene) {
  const track = scene.add.graphics().setDepth(-1).setVisible(false);
  const pins = scene.add.graphics().setDepth(1).setVisible(false);
  const left = Math.round(floor.x - floor.width / 2);
  track.fillStyle(color.stone800).fillRect(left, floor.y + 28, floor.width + floor.distance, 6);
  track.fillStyle(color.stone400).fillRect(left, floor.y + 28, floor.width + floor.distance, 2);
  for (let x = left + 8; x < left + floor.width + floor.distance; x += 24) {
    track.fillStyle(color.wood800).fillRect(x, floor.y + 32, 6, 8);
  }
  for (const x of [left + 12, left + floor.width - 18]) {
    pins.fillStyle(color.wood800).fillRect(x, floor.y + 10, 6, 26);
    pins.fillStyle(color.wood400).fillRect(x, floor.y + 10, 2, 24);
    pins.fillStyle(color.gold500).fillRect(x - 2, floor.y + 16, 10, 4);
  }
  return {
    show(sample: FeintSample, collapsed: boolean): void {
      track.setVisible(sample.phase !== 'idle' && sample.phase !== 'retired' && !collapsed);
      pins.setVisible(sample.phase === 'retired');
    },
    hide(): void { track.setVisible(false); pins.setVisible(false); },
  };
}
