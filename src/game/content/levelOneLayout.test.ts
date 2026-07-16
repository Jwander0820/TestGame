import { describe, expect, it } from 'vitest';
import {
  LEVEL_ONE_PLATFORM_LAYOUT,
  LEVEL_ONE_PLAYER_PHYSICS,
  LEVEL_ONE_SECRET_PLATFORM_LAYOUT,
  LEVEL_ONE_WARNING_HAZARD,
  type PlatformDefinition,
} from './levelOneLayout';

function descendingFlightTime(source: PlatformDefinition, target: PlatformDefinition): number {
  const { gravityY, jumpSpeed } = LEVEL_ONE_PLAYER_PHYSICS;
  const verticalDisplacement = target.y - source.y;
  const discriminant = jumpSpeed ** 2 + 2 * gravityY * verticalDisplacement;
  if (discriminant < 0) {
    return 0;
  }
  return (jumpSpeed + Math.sqrt(discriminant)) / gravityY;
}

function horizontalGap(source: PlatformDefinition, target: PlatformDefinition): number {
  return target.x - target.width / 2 - (source.x + source.width / 2);
}

function intervalGap(source: PlatformDefinition, target: PlatformDefinition): number {
  const sourceLeft = source.x - source.width / 2;
  const sourceRight = source.x + source.width / 2;
  const targetLeft = target.x - target.width / 2;
  const targetRight = target.x + target.width / 2;
  return Math.max(0, sourceLeft - targetRight, targetLeft - sourceRight);
}

describe('level one zero-assist route', () => {
  it('keeps every required platform transition inside the configured jump range', () => {
    const { moveSpeed } = LEVEL_ONE_PLAYER_PHYSICS;

    for (let index = 0; index < LEVEL_ONE_PLATFORM_LAYOUT.length - 1; index += 1) {
      const source = LEVEL_ONE_PLATFORM_LAYOUT[index];
      const target = LEVEL_ONE_PLATFORM_LAYOUT[index + 1];
      if (source === undefined || target === undefined) {
        throw new Error('Level platform route is incomplete.');
      }

      const availableRange = descendingFlightTime(source, target) * moveSpeed;
      const requiredRange = Math.max(0, horizontalGap(source, target));
      expect(availableRange - requiredRange, `${source.id} → ${target.id}`).toBeGreaterThanOrEqual(20);
    }
  });

  it('places the warning hazard across the jumpable gap instead of creating an impossible void', () => {
    const source = LEVEL_ONE_PLATFORM_LAYOUT.find((platform) => platform.id === 'after-first-gap');
    const target = LEVEL_ONE_PLATFORM_LAYOUT.find((platform) => platform.id === 'after-warning-strip');
    if (source === undefined || target === undefined) {
      throw new Error('Warning-strip platforms are missing.');
    }

    const sourceRight = source.x + source.width / 2;
    const targetLeft = target.x - target.width / 2;
    const hazardLeft = LEVEL_ONE_WARNING_HAZARD.x - LEVEL_ONE_WARNING_HAZARD.width / 2;
    const hazardRight = LEVEL_ONE_WARNING_HAZARD.x + LEVEL_ONE_WARNING_HAZARD.width / 2;

    expect(hazardLeft).toBeLessThanOrEqual(sourceRight + 4);
    expect(hazardRight).toBeGreaterThanOrEqual(targetLeft);
  });

  it('keeps the reverse exploration shelves reachable without affecting the main route', () => {
    const start = LEVEL_ONE_PLATFORM_LAYOUT.find((platform) => platform.id === 'start');
    if (start === undefined) {
      throw new Error('Start platform is missing.');
    }

    const secretRoute = [start, ...LEVEL_ONE_SECRET_PLATFORM_LAYOUT];
    const { gravityY, jumpSpeed, moveSpeed } = LEVEL_ONE_PLAYER_PHYSICS;
    const maximumJumpHeight = jumpSpeed ** 2 / (2 * gravityY);

    for (let index = 0; index < secretRoute.length - 1; index += 1) {
      const source = secretRoute[index];
      const target = secretRoute[index + 1];
      if (source === undefined || target === undefined) {
        throw new Error('Secret platform route is incomplete.');
      }

      const requiredHeight = Math.max(0, source.y - target.y);
      const availableRange = descendingFlightTime(source, target) * moveSpeed;
      expect(maximumJumpHeight - requiredHeight, `${source.id} → ${target.id} vertical`).toBeGreaterThanOrEqual(12);
      expect(availableRange - intervalGap(source, target), `${source.id} → ${target.id} horizontal`).toBeGreaterThanOrEqual(20);
    }
  });
});
