import { PIXEL_PALETTE as C } from '../content/levelOneVisuals';
import { cluster, type PixelPainter } from './pixelPainter';

/** All landscape shapes use the same 2–4 px grid and upper-left light. */
export function paintSky(p: PixelPainter): void {
  p.rect(0, 0, 960, 540, C.sky300);
  p.rect(0, 0, 960, 110, C.sky200);
  // Broken color boundary reads as wisps, rather than a solid horizontal stripe.
  for (let x = 0; x < 960; x += 8) {
    const h = 22 + Math.round(Math.sin(x * 0.018) * 12 / 4) * 4;
    p.rect(x, 110, 8, h, C.sky200);
  }
  cluster(p, 720, 54, 64, 64, C.gold300);
  cluster(p, 728, 62, 48, 48, C.parchment100);
  for (const [x, y, w] of [[66, 64, 134], [378, 106, 114], [810, 134, 144]] as const) {
    cluster(p, x + 24, y - 14, w * 0.45, 32, C.sky200);
    cluster(p, x, y, w, 24, C.sky200);
    p.rect(x + 18, y + 22, w - 32, 4, C.mist300);
  }
  // Distant birds use a tiny stepped silhouette.
  for (const [x, y] of [[582, 86], [598, 78], [616, 88]] as const) {
    p.rect(x, y, 4, 2, C.stone600); p.rect(x + 4, y + 2, 4, 2, C.stone600);
    p.rect(x + 8, y, 4, 2, C.stone600);
  }
}

export function paintMountains(p: PixelPainter, includeCitadel = true): void {
  for (let x = -220; x < 1900; x += 4) {
    const height = Math.round((90 + Math.sin(x * 0.007) * 44 + Math.sin(x * 0.019) * 17) / 4) * 4;
    p.rect(x, 350 - height, 4, height + 100, C.mist300);
  }
  if (!includeCitadel) return;
  // Citadel set into the ridge for the title's distant destination.
  const x = 666;
  p.rect(x - 34, 230, 234, 102, C.mist500);
  for (const [offset, top, width] of [[0, 170, 34], [48, 130, 46], [118, 158, 34]] as const) {
    p.rect(x + offset, top, width, 128, C.stone600);
    p.rect(x + offset + 4, top, width - 12, 126, C.mist300);
    for (let row = 0; row < 32; row += 4) {
      p.rect(x + offset - 6 + row / 2, top - row, width + 12 - row, 4, C.mist500);
    }
    p.rect(x + offset + width / 2 - 2, top - 44, 2, 14, C.stone600);
    p.rect(x + offset + width / 2, top - 44, 16, 8, C.parchment100);
    for (let wy = top + 18; wy < top + 72; wy += 24) {
      p.rect(x + offset + 12, wy, 6, 12, C.stone600);
      p.rect(x + offset + 12, wy, 2, 8, C.sky200);
    }
  }
  p.rect(x - 22, 242, 190, 40, C.mist300);
  for (let bx = x - 22; bx < x + 168; bx += 18) p.rect(bx, 234, 10, 12, C.mist300);
  cluster(p, x + 61, 247, 28, 48, C.stone600);
  p.rect(x + 66, 266, 18, 29, C.mist500);
}

export function paintDistantWoods(p: PixelPainter): void {
  for (let x = -260, i = 0; x < 4000; x += 46, i++) {
    const y = 294 + Math.round(Math.sin(i * 0.76) * 24);
    cluster(p, x, y, 92, 112, C.mist500, 4);
    p.rect(x + 38, y + 62, 8, 164, C.mist500);
  }
  p.rect(-260, 392, 4300, 148, C.mist500);
  // A second rhythm of trunks and pine boughs gives the valley depth at play scale.
  for (let x = -160, i = 0; x < 4000; x += 82, i++) {
    const top = 332 + Math.round(Math.sin(i * 1.7) * 26);
    p.rect(x + 24, top + 12, 4, 540 - top, C.grass600);
    for (let tier = 0; tier < 5; tier++) {
      const width = 16 + tier * 10;
      const y = top + tier * 14;
      for (let row = 0; row < 16; row += 4) {
        p.rect(x + 26 - width / 2 + 8 - row / 2, y + row, width - 16 + row, 4, C.grass600);
      }
    }
  }
  // Fog cuts some trunks without touching gameplay objects.
  for (let x = -260; x < 4000; x += 4) {
    const y = 442 + Math.round(Math.sin(x * 0.011) * 12 / 4) * 4;
    p.rect(x, y, 4, 540 - y, C.mist500);
  }
}

export function paintTree(p: PixelPainter, x: number, bottom: number, variant: number): void {
  const height = 214 + variant % 3 * 22;
  const top = bottom - height;
  // Tapered trunk, branching roots, bark highlights.
  p.rect(x - 10, top + 48, 22, height - 48, C.stone800);
  p.rect(x - 6, top + 52, 12, height - 52, C.wood800);
  p.rect(x - 6, top + 88, 4, height - 94, C.wood600);
  for (let y = top + 114; y < bottom - 12; y += 24) p.rect(x + 2, y, 4, 12, C.stone800);
  p.rect(x - 18, bottom - 8, 40, 8, C.stone800);
  for (let n = 0; n < 7; n++) {
    p.rect(x - 8 - n * 4, top + 100 - n * 4, 8, 8, C.stone800);
    p.rect(x + 4 + n * 4, top + 78 - n * 4, 8, 8, C.stone800);
  }
  // Interlocking irregular crowns, with small clustered highlights instead of noise.
  for (const [dx, dy, w, h] of [[-74, 22, 98, 70], [-34, -10, 96, 90], [22, 26, 80, 66], [-40, 50, 114, 64]] as const) {
    cluster(p, x + dx, top + dy, w, h, C.grass800);
    cluster(p, x + dx + 4, top + dy, w - 12, h - 18, C.grass600);
    cluster(p, x + dx + 12, top + dy + 2, w - 32, 22, C.grass400);
    p.rect(x + dx + 18, top + dy + 4, 14, 4, C.grass200);
    p.rect(x + dx + 8, top + dy + 18, 8, 4, C.grass400);
    p.rect(x + dx + w - 24, top + dy + h - 14, 12, 6, C.grass800);
  }
  // Hanging vines tie the canopy to the ruins.
  for (let y = top + 86; y < top + 128; y += 8) {
    p.rect(x + 46, y, 2, 8, C.grass800);
    p.rect(x + 42 + (y % 16 === 0 ? 0 : 6), y + 4, 6, 4, C.grass600);
  }
}

export function paintRuin(p: PixelPainter, x: number, bottom: number): void {
  p.rect(x, bottom - 92, 22, 92, C.stone800);
  p.rect(x + 72, bottom - 88, 22, 88, C.stone800);
  p.rect(x + 12, bottom - 108, 70, 26, C.stone600);
  p.rect(x + 24, bottom - 116, 42, 14, C.stone400);
  for (let y = bottom - 86; y < bottom; y += 18) {
    p.rect(x + 2, y, 14, 16, C.stone600);
    p.rect(x + 2, y, 4, 14, C.stone400);
    p.rect(x + 74, y, 14, 16, C.stone600);
  }
  p.rect(x + 12, bottom - 110, 34, 6, C.grass800);
  p.rect(x + 20, bottom - 112, 18, 4, C.grass400);
  for (let y = bottom - 102; y < bottom - 34; y += 10) {
    p.rect(x + 14, y, 4, 14, C.grass800);
    p.rect(x + 10, y + 4, 6, 4, C.grass600);
  }
}

export function paintUndergrowth(p: PixelPainter, x: number, y: number): void {
  cluster(p, x, y - 18, 62, 28, C.grass800);
  cluster(p, x + 4, y - 20, 24, 16, C.grass600);
  cluster(p, x + 28, y - 10, 30, 12, C.grass600);
  for (let n = 0; n < 5; n++) {
    p.rect(x + n * 12, y - 4 - n % 2 * 6, 2, 14, C.grass800);
    p.rect(x + n * 12 - 4, y - 2 - n % 2 * 6, 6, 2, C.grass400);
  }
}

export function paintGroundTile(p: PixelPainter): void {
  p.rect(0, 0, 96, 54, C.ink950);
  p.rect(0, 4, 96, 48, C.wood800);
  p.rect(0, 6, 96, 6, C.grass800);
  p.rect(0, 2, 96, 4, C.grass400);
  p.rect(0, 0, 96, 2, C.grass200);
  for (let x = 0; x < 96; x += 8) {
    p.rect(x + 2, 4, 4, 4 + x % 3 * 2, C.grass600);
    p.rect(x, 12 + x % 5 * 2, 6, 4, C.wood600);
  }
  for (const [x, y, w] of [[4, 26, 18], [32, 16, 24], [64, 30, 20], [22, 40, 16], [80, 18, 14]] as const) {
    p.rect(x, y, w, 10, C.stone800);
    p.rect(x + 2, y, w - 4, 4, C.stone600);
    p.rect(x + 2, y, 4, 2, C.stone400);
  }
  p.rect(0, 50, 96, 4, C.ink950);
}
