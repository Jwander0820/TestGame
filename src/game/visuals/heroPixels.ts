import { PIXEL_PALETTE as C } from '../content/levelOneVisuals';
import type { PixelPainter } from './pixelPainter';

// Original 16×24 pixel drawings, displayed at exactly 2×. No external sheet.
export const HERO_COLORS: Readonly<Record<string, number>> = {
  o: C.ink950, d: C.armor700, m: C.armor400, l: C.armor200,
  w: C.sky100, s: C.skin400, r: C.cape500, c: C.cape700,
  g: C.gold500, b: C.wood800, t: C.wood400,
};

export const HERO_IDLE = [
  '................',
  '.......rr.......',
  '......rrcr......',
  '.....oooooo.....',
  '....olllllmo....',
  '...olwwlllmmo...',
  '...owlmmmmdmo...',
  '..olllmmmmmddo..',
  '..olmmmooooooo..',
  '..ommdosssosso..',
  '...odmosssosso..',
  '...odmossstso...',
  '....oodssssdo...',
  '...orrrroooo....',
  '..orrrcrrmmdo...',
  '.orrcocrlmmdso..',
  '.orcootolmmoso..',
  '.orcoogtommdso..',
  '.occootobbgbbo..',
  '..ocootoommdo...',
  '...oooobomdo....',
  '.....obboobo....',
  '.....obboobbo...',
  '.....ooooooo....',
] as const;

export function heroFrame(pose: 'idle' | 'stride' | 'pass' | 'jump'): readonly string[] {
  const rows: string[] = [...HERO_IDLE];
  if (pose === 'stride') {
    rows.splice(20, 4, '...oooobomdo....', '....obb...obo...', '...obbo....obbo.', '...oooo....oooo.');
  } else if (pose === 'pass') {
    rows.splice(20, 4, '...oooommdo.....', '......obbbo.....', '......obbbo.....', '......ooooo.....');
  } else if (pose === 'jump') {
    rows.splice(20, 4, '...oooobomddo...', '....obbo.obbo...', '....oooo.oooo...', '................');
  }
  return rows;
}

export function drawHero(p: PixelPainter, x: number, y: number, scale = 2, pose: Parameters<typeof heroFrame>[0] = 'idle'): void {
  heroFrame(pose).forEach((row, rowIndex) => {
    [...row].forEach((pixel, column) => {
      const color = HERO_COLORS[pixel];
      if (color !== undefined) p.rect(x + column * scale, y + rowIndex * scale, scale, scale, color);
    });
  });
}
