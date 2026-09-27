import type Phaser from 'phaser';
import { FIRST_PIT_AMBUSH as layout } from '../content/firstPitAmbush';
import { LEVEL_ONE_COLORS as C, PIXEL_PALETTE as P } from '../content/levelOneVisuals';
import type { CoinPhase } from '../state/FirstPitState';
import { paintSpikeRack, paintTrapPlate } from './trapPixelArt';

export function createFirstPitVisuals(scene: Phaser.Scene) {
  const brick = scene.add.graphics().setPosition(layout.brick.x, layout.brick.y).setDepth(2);
  paintTrapPlate(brick, layout.brick.width, layout.brick.height);
  brick.fillStyle(P.gold700).fillRect(-10, -4, 20, 4);
  brick.fillStyle(P.danger700).fillRect(-3, 1, 6, 3);
  const riser = scene.add.graphics().setDepth(3);
  paintSpikeRack(riser, layout.riser.width, layout.riser.height, 'up');
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
  const coin = scene.textures.exists('crown-coin') ? scene.add.image(x, y, 'crown-coin').setDepth(4) : null;
  if (coin !== null) {
    gold.setVisible(false);
    value.setVisible(false);
  }
  const burst = scene.add.graphics().setPosition(x, y).setDepth(4);
  burst.fillStyle(P.ink950).fillRect(-18, -18, 36, 36);
  burst.fillStyle(P.danger700).fillRect(-15, -15, 30, 30);
  burst.fillStyle(P.cape500).fillRect(-11, -11, 22, 22);
  burst.fillStyle(P.gold500).fillRect(-3, -3, 6, 6);
  for (const offset of [-12, 4]) {
    burst.fillStyle(P.ink950).fillRect(offset, -24, 8, 7).fillRect(offset, 17, 8, 7);
    burst.fillRect(-24, offset, 7, 8).fillRect(17, offset, 7, 8);
    burst.fillStyle(P.stone400).fillRect(offset + 2, -22, 4, 5).fillRect(offset + 2, 17, 4, 5);
    burst.fillRect(-22, offset + 2, 5, 4).fillRect(17, offset + 2, 5, 4);
  }
  return {
    show(phase: CoinPhase, revealed: boolean): void {
      gold.setVisible(coin === null && phase !== 'burst' && phase !== 'spent');
      value.setVisible(coin === null && (phase === 'bait' || phase === 'safe'));
      coin?.setVisible(phase !== 'burst' && phase !== 'spent')
        .setTint(phase === 'fuse' || (revealed && phase !== 'safe') ? C.hazard : 0xffffff)
        .setAlpha(phase === 'safe' ? 0.35 : 1);
      gold.setFillStyle(phase === 'fuse' ? C.hazard : C.royalGold);
      gold.setStrokeStyle(3, revealed && phase !== 'safe' ? C.hazardDark : C.outline);
      gold.setAlpha(phase === 'safe' ? 0.35 : 1);
      burst.setVisible(phase === 'burst');
    },
  };
}
