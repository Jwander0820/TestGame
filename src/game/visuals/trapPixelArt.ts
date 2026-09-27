import type Phaser from 'phaser';
import { PIXEL_PALETTE as P } from '../content/levelOneVisuals';

type Graphics = Phaser.GameObjects.Graphics;

/** Decorative pixels only. Gameplay bodies stay in their existing owners. */
export function paintTrapPlate(g: Graphics, width: number, height: number): void {
  const left = -Math.round(width / 2);
  const top = -Math.round(height / 2);
  g.fillStyle(P.ink950).fillRect(left, top, width, height);
  g.fillStyle(P.stone800).fillRect(left + 2, top + 2, width - 4, height - 4);
  if (height >= 20) {
    g.fillStyle(P.stone600).fillRect(left + 4, top + 6, width - 8, height - 11);
    g.fillStyle(P.stone800).fillRect(left + 4, top + Math.floor(height / 2), width - 8, 2);
    for (let x = left + 25; x < left + width - 6; x += 28) {
      g.fillRect(x, top + 7, 2, Math.max(3, Math.floor(height / 2) - 8));
      g.fillRect(x - 12, top + Math.floor(height / 2) + 2, 2, Math.max(3, Math.floor(height / 2) - 7));
    }
  }
  g.fillStyle(P.stone600).fillRect(left + 3, top + 2, width - 6, 3);
  g.fillStyle(P.stone400).fillRect(left + 5, top + 2, Math.min(12, width - 10), 2);
  g.fillStyle(P.ink800);
  for (let x = left + 9; x < left + width - 5; x += 16) g.fillRect(x, top + 6, 6, 2);
  g.fillStyle(P.stone600).fillRect(left + 4, top + height - 4, width - 8, 2);
}

/** Stepped iron teeth set into a stone socket; direction follows the collision zone. */
export function paintSpikeRack(g: Graphics, width: number, height: number, direction: 'up' | 'down'): void {
  const left = -Math.round(width / 2);
  const top = -Math.round(height / 2);
  const socketY = direction === 'up' ? top + height - 6 : top;
  g.fillStyle(P.ink950).fillRect(left, socketY, width, 6);
  g.fillStyle(P.stone800).fillRect(left + 2, socketY + 1, width - 4, 4);
  g.fillStyle(P.danger700).fillRect(left + 4, direction === 'up' ? socketY + 1 : socketY + 3, width - 8, 2);

  const bladeHeight = height - 6;
  const count = Math.max(1, Math.floor(width / 15));
  const step = width / count;
  for (let index = 0; index < count; index++) {
    const center = Math.round(left + (index + 0.5) * step);
    const baseWidth = Math.min(13, Math.floor(step) - 2);
    for (let row = 0; row < bladeHeight; row += 2) {
      const spread = Math.max(1, Math.ceil((bladeHeight - row) * baseWidth / bladeHeight / 2));
      const y = direction === 'up' ? socketY - row - 2 : socketY + 6 + row;
      g.fillStyle(P.ink950).fillRect(center - spread, y, spread * 2, 2);
      if (spread > 2) g.fillStyle(P.stone600).fillRect(center - spread + 2, y, spread * 2 - 3, 2);
      if (spread > 3) g.fillStyle(P.stone400).fillRect(center - spread + 2, y, 2, 2);
    }
    g.fillStyle(P.stone400).fillRect(center - 1, direction === 'up' ? socketY - bladeHeight : socketY + 6 + bladeHeight - 2, 2, 2);
  }
}

export function paintFlyingDart(g: Graphics, width: number, height: number, direction: -1 | 1): void {
  const left = -Math.round(width / 2);
  const top = -Math.round(height / 2);
  g.fillStyle(P.ink950).fillRect(left + 10, top + 6, width - 22, height - 12);
  g.fillStyle(P.stone800).fillRect(left + 12, top + 8, width - 26, height - 16);
  g.fillStyle(P.stone400).fillRect(left + 15, top + 8, width - 30, 3);
  g.fillStyle(P.danger700).fillRect(left + Math.round(width / 2) - 3, top + 6, 6, height - 12);
  const noseX = direction > 0 ? left + width - 12 : left + 2;
  for (let row = 0; row < 5; row++) {
    const x = direction > 0 ? noseX + row * 2 : noseX + (4 - row) * 2;
    g.fillStyle(P.ink950).fillRect(x, top + row * 2, 4, height - row * 4);
    g.fillStyle(P.stone400).fillRect(x + 1, top + row * 2 + 2, 2, Math.max(2, height - row * 4 - 4));
  }
  const tailX = direction > 0 ? left + 2 : left + width - 8;
  g.fillStyle(P.ink950).fillRect(tailX, top + 1, 6, 7).fillRect(tailX, top + height - 8, 6, 7);
  g.fillStyle(P.stone600).fillRect(tailX + 2, top + 3, 3, 3).fillRect(tailX + 2, top + height - 6, 3, 3);
}

export function paintHammer(g: Graphics, width: number, height: number): void {
  const left = -Math.round(width / 2);
  const top = -Math.round(height / 2);
  g.fillStyle(P.wood800).fillRect(-5, top - 17, 10, 19);
  g.fillStyle(P.wood400).fillRect(-3, top - 15, 3, 16);
  g.fillStyle(P.ink950).fillRect(left, top, width, height);
  g.fillStyle(P.stone800).fillRect(left + 3, top + 3, width - 6, height - 6);
  g.fillStyle(P.stone600).fillRect(left + 5, top + 5, width - 10, height - 12);
  g.fillStyle(P.stone400).fillRect(left + 6, top + 5, width - 17, 5);
  g.fillStyle(P.ink800).fillRect(left + 7, top + height - 10, width - 14, 4);
  g.fillStyle(P.danger700).fillRect(-5, top + 5, 10, 3);
  g.fillStyle(P.gold500).fillRect(-2, top + 8, 4, 5);
  for (const x of [left + 4, left + width - 7]) g.fillStyle(P.stone400).fillRect(x, top + 13, 3, 3);
}

export function paintRoyalSeal(g: Graphics, width: number, height: number): void {
  const left = -Math.round(width / 2);
  const top = -Math.round(height / 2);
  g.fillStyle(P.ink950).fillRect(left, top, width, height);
  g.fillStyle(P.wood800).fillRect(left + 3, top + 3, width - 6, height - 6);
  g.fillStyle(P.wood600).fillRect(left + 6, top + 4, width - 12, height - 10);
  g.fillStyle(P.gold700).fillRect(left + 5, top + 5, width - 10, 4);
  g.fillStyle(P.danger700).fillRect(left + 9, top + 11, width - 18, height - 22);
  g.fillStyle(P.cape500).fillRect(left + 12, top + 14, width - 24, height - 28);
  g.fillStyle(P.gold500).fillRect(left + 10, top + 10, width - 20, 2);
  g.fillStyle(P.ink950).fillRect(left + 5, top + height - 6, width - 10, 3);
  for (const x of [left + 7, left + width - 10]) g.fillStyle(P.stone400).fillRect(x, top + 5, 3, 3);
}
