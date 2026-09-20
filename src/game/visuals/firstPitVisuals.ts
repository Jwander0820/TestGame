import type Phaser from 'phaser';
import { FIRST_PIT_AMBUSH as layout } from '../content/firstPitAmbush';
import { LEVEL_ONE_COLORS as C } from '../content/levelOneVisuals';
import type { CoinPhase } from '../state/FirstPitState';

export function createFirstPitVisuals(scene: Phaser.Scene) {
  const brick = scene.add.rectangle(layout.brick.x, layout.brick.y, layout.brick.width,
    layout.brick.height, C.royalGold).setStrokeStyle(3, C.outline).setDepth(2);
  const riser = scene.add.graphics().setDepth(3);
  riser.fillStyle(C.hazard);
  riser.fillRect(-12, -12, 24, 30);
  riser.fillTriangle(-16, -12, 16, -12, 0, -20);
  riser.lineStyle(2, C.outline);
  riser.strokeRect(-12, -12, 24, 30);
  riser.fillStyle(C.royalGold);
  riser.fillRect(-4, -8, 8, 20);
  return {
    showBrick: (revealed: boolean, enabled: boolean): void => {
      brick.setAlpha(revealed ? (enabled ? 1 : 0.18) : 0);
    },
    showRiser: (y: number | null): void => {
      riser.setVisible(y !== null);
      if (y !== null) riser.setPosition(layout.riser.x, y);
    },
  };
}

/** No physics bodies here: coin art can be replaced without changing gameplay. */
export function createBaitCoinVisual(scene: Phaser.Scene, x: number, y: number) {
  const gold = scene.add.circle(x, y, 9, C.royalGold).setStrokeStyle(3, C.outline).setDepth(3);
  const value = scene.add.text(x, y, '0', { color: '#14232b', fontSize: '11px', fontStyle: 'bold' })
    .setOrigin(0.5).setDepth(4);
  const burst = scene.add.graphics().setPosition(x, y).setDepth(4);
  burst.fillStyle(C.hazard, 0.7);
  burst.fillRect(-24, -24, 48, 48);
  burst.lineStyle(2, C.outline);
  burst.strokeRect(-24, -24, 48, 48);
  burst.fillStyle(C.royalGold);
  for (const offset of [-16, 0, 16]) {
    burst.fillTriangle(offset - 6, -12, offset + 6, -12, offset, -22);
    burst.fillTriangle(offset - 6, 12, offset + 6, 12, offset, 22);
  }
  return {
    show(phase: CoinPhase, revealed: boolean): void {
      gold.setVisible(phase !== 'burst' && phase !== 'spent');
      value.setVisible(phase === 'bait' || phase === 'safe');
      gold.setFillStyle(phase === 'fuse' ? C.hazard : C.royalGold);
      gold.setStrokeStyle(3, revealed && phase !== 'safe' ? C.hazardDark : C.outline);
      gold.setAlpha(phase === 'safe' ? 0.35 : 1);
      burst.setVisible(phase === 'burst');
    },
  };
}
