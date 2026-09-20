import { PIXEL_PALETTE as C } from '../content/levelOneVisuals';
import { paintSky, paintMountains, paintDistantWoods, paintTree, paintRuin, paintUndergrowth, paintGroundTile } from './forestPainting';
import { drawHero } from './heroPixels';
import { canvasPainter, type PixelPainter } from './pixelPainter';

/** Static title vignette. No game instance, input or save mutations before Start. */
export function paintTitle(canvas: HTMLCanvasElement): void {
  const context = canvas.getContext('2d');
  if (!context) return;
  const p = canvasPainter(context);
  paintSky(p);
  paintMountains(p);
  paintDistantWoods(p);
  paintTree(p, 34, 476, 1);
  paintTree(p, 934, 474, 2);
  paintRuin(p, 570, 482);
  paintUndergrowth(p, 636, 478);
  paintUndergrowth(p, 822, 482);
  const offsetPainter = (dx: number, dy: number): PixelPainter => ({
    rect: (x, y, w, h, color) => p.rect(x + dx, y + dy, w, h, color),
  });
  for (let x = 0; x < 960; x += 96) paintGroundTile(offsetPainter(x, 486));
  p.rect(704, 482, 72, 4, C.grass800);
  drawHero(p, 702, 390, 4);
  // Quiet trail flowers; no assistance props before the first death.
  for (const x of [550, 804, 822]) {
    p.rect(x, 472, 2, 14, C.grass800);
    p.rect(x - 2, 468, 6, 6, C.parchment100);
    p.rect(x, 470, 2, 2, C.gold500);
  }
}
