import type Phaser from 'phaser';

/** Small shared drawing surface: Phaser graphics and the title canvas use the same art. */
export interface PixelPainter {
  rect(x: number, y: number, width: number, height: number, color: number): void;
}

export function graphicsPainter(graphics: Phaser.GameObjects.Graphics): PixelPainter {
  return { rect(x, y, width, height, color) {
    graphics.fillStyle(color, 1);
    graphics.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  } };
}

export function canvasPainter(context: CanvasRenderingContext2D): PixelPainter {
  return {
    rect(x, y, width, height, color) {
      context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
      context.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
    },
  };
}

/** A stepped ellipse made only of integer pixel runs, never antialiased curves. */
export function cluster(p: PixelPainter, x: number, y: number, width: number, height: number, color: number, step = 4): void {
  for (let row = 0; row < height; row += step) {
    const normalized = (row + step / 2 - height / 2) / (height / 2);
    const inset = Math.round((1 - Math.sqrt(Math.max(0, 1 - normalized * normalized))) * width / 2 / step) * step;
    p.rect(x + inset, y + row, width - inset * 2, Math.min(step, height - row), color);
  }
}
