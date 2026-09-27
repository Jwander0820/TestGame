import { PIXEL_PALETTE as C } from '../content/levelOneVisuals';
import { paintSky, paintMountains, paintDistantWoods, paintTree, paintRuin, paintUndergrowth, paintGroundTile } from './forestPainting';
import { drawHero } from './heroPixels';
import { canvasPainter, type PixelPainter } from './pixelPainter';

/** Static title vignette with a procedural fallback. No save or game mutations before Start. */
export function paintTitle(canvas: HTMLCanvasElement): void {
  const context = canvas.getContext('2d');
  if (!context) return;
  const p = canvasPainter(context);
  const titleArt = new Image();
  const heroArt = new Image();
  let backgroundReady = false;
  let heroReady = false;

  const render = (): void => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (backgroundReady) {
      context.save();
      context.imageSmoothingEnabled = false;
      // Crop the sample's white footer; its grass line meets the hero's feet.
      context.drawImage(titleArt, 96, 0, 1184, 665, 0, 0, canvas.width, canvas.height);
      context.restore();
    } else {
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
      // Quiet trail flowers; no assistance props before the first death.
      for (const x of [550, 804, 822]) {
        p.rect(x, 472, 2, 14, C.grass800);
        p.rect(x - 2, 468, 6, 6, C.parchment100);
        p.rect(x, 470, 2, 2, C.gold500);
      }
    }
    if (heroReady) {
      context.save();
      context.imageSmoothingEnabled = false;
      context.drawImage(heroArt, 0, 15, 543, 640, 702, 390, 64, 96);
      context.restore();
    } else {
      drawHero(p, 702, 390, 4);
    }
  };

  render();
  titleArt.fetchPriority = 'high';
  titleArt.onload = () => {
    backgroundReady = true;
    render();
  };
  heroArt.onload = () => {
    heroReady = true;
    render();
  };
  titleArt.src = new URL('./assets/title-forest-background.jpg', import.meta.url).href;
  heroArt.src = new URL('./assets/hero-poses-third-batch.png', import.meta.url).href;
}
