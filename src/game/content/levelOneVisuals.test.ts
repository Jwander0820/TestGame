import { describe, expect, it } from 'vitest';
import {
  LEVEL_ONE_COLORS,
  LEVEL_ONE_COMPONENT_COLORS,
  LEVEL_ONE_TEXT_COLORS,
  PIXEL_PALETTE,
} from './levelOneVisuals';

describe('level one visual tokens', () => {
  it('keeps the opaque gameplay palette within the approved 28-color budget', () => {
    const uniqueColors = new Set(Object.values(PIXEL_PALETTE));
    expect(uniqueColors.size).toBeLessThanOrEqual(28);
  });

  it('builds semantic and component colors only from primitive values', () => {
    const primitives = new Set<number>(Object.values(PIXEL_PALETTE));
    expect(Object.values(LEVEL_ONE_COLORS).every((color) => primitives.has(color))).toBe(true);

    const componentColors = Object.values(LEVEL_ONE_COMPONENT_COLORS).flatMap((component) =>
      Object.values(component),
    );
    expect(componentColors.every((color) => primitives.has(color))).toBe(true);
  });

  it('keeps Phaser text colors on the same primitive palette', () => {
    const primitives = new Set<number>(Object.values(PIXEL_PALETTE));
    const textColors = Object.values(LEVEL_ONE_TEXT_COLORS).map((color) =>
      Number.parseInt(color.slice(1), 16),
    );
    expect(textColors.every((color) => primitives.has(color))).toBe(true);
  });
});
