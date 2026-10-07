import { describe, expect, it } from 'vitest';
import { LEVEL_ONE_PLAYER_PHYSICS as physics } from './levelOneLayout';
import { LEVEL_TWO_CHECKPOINTS, LEVEL_TWO_CLOCKWORK as layout, LEVEL_TWO_EFFECT_IDS, LEVEL_TWO_ID,
  LEVEL_TWO_PLATFORMS, LEVEL_TWO_REACTIONS, LEVEL_TWO_SPAWNS, LEVEL_TWO_WORLD, isLevelTwoEffectId } from './levelTwo';

describe('第二關內容與可達幾何', () => {
  it('載台銜接入口及較高對岸；餘下階梯不超過既有跳躍能力', () => {
    const entrance = LEVEL_TWO_PLATFORMS[0]!;
    const shore = LEVEL_TWO_PLATFORMS[1]!;
    expect(layout.carrier.startX - layout.carrier.width / 2).toBeLessThanOrEqual(entrance.x + entrance.width / 2);
    expect(layout.carrier.endX + layout.carrier.width / 2).toBeGreaterThanOrEqual(shore.x - shore.width / 2);
    expect(layout.carrier.startY).toBe(entrance.y);
    expect(layout.carrier.endY).toBe(shore.y);
    const maxJumpHeight = physics.jumpSpeed ** 2 / (2 * physics.gravityY);
    const maxJumpDistance = 2 * physics.moveSpeed * physics.jumpSpeed / physics.gravityY;
    for (let index = 2; index < LEVEL_TWO_PLATFORMS.length; index++) {
      const previous = LEVEL_TWO_PLATFORMS[index - 1]!;
      const next = LEVEL_TWO_PLATFORMS[index]!;
      const rise = previous.y - next.y;
      const gap = next.x - next.width / 2 - (previous.x + previous.width / 2);
      expect(rise).toBeLessThan(maxJumpHeight);
      expect(gap).toBeLessThan(maxJumpDistance);
    }
    const walkway = layout.assistance.finalWalkway;
    expect(walkway.x - walkway.width / 2).toBe(0);
    expect(walkway.x + walkway.width / 2).toBe(LEVEL_TWO_WORLD.width);
    expect(walkway.y).toBe(LEVEL_TWO_SPAWNS.start.y + 40);
  });

  it('據點出生在自己的安全落腳平台，落點不與機關重疊', () => {
    const safePoints = [
      [LEVEL_TWO_SPAWNS.start, LEVEL_TWO_PLATFORMS[0]!],
      [LEVEL_TWO_SPAWNS.afterCarrier, LEVEL_TWO_PLATFORMS[1]!],
      [LEVEL_TWO_SPAWNS.afterSteam, LEVEL_TWO_PLATFORMS[3]!],
      [LEVEL_TWO_SPAWNS.afterPress, LEVEL_TWO_PLATFORMS[4]!],
    ] as const;
    for (const [spawn, platform] of safePoints) {
      expect(spawn.x - physics.bodyWidth / 2).toBeGreaterThanOrEqual(platform.x - platform.width / 2);
      expect(spawn.x + physics.bodyWidth / 2).toBeLessThanOrEqual(platform.x + platform.width / 2);
      expect(spawn.y + physics.bodyHeight / 2).toBeLessThanOrEqual(platform.y);
      expect(Math.abs(spawn.x - layout.steam.x)).toBeGreaterThan(layout.steam.width / 2 + physics.bodyWidth / 2);
      expect(Math.abs(spawn.x - layout.press.x)).toBeGreaterThan(layout.press.width / 2 + physics.bodyWidth / 2);
    }
    expect(LEVEL_TWO_CHECKPOINTS.map(marker => marker.order)).toEqual([1, 2, 3]);
  });

  it('三段均維持 2／3／5／7 世界援助，識別碼只屬於第二關', () => {
    for (const blocker of ['clockwork-carrier', 'clockwork-steam', 'clockwork-sorter']) {
      const rules = LEVEL_TWO_REACTIONS.filter(rule => rule.blockerId === blocker);
      expect(rules.map(rule => rule.threshold)).toEqual([2, 3, 5, 7]);
      expect(rules.every(rule => rule.levelId === LEVEL_TWO_ID)).toBe(true);
      expect(rules.filter(rule => 'effectId' in rule)).toHaveLength(3);
    }
    expect(new Set(LEVEL_TWO_REACTIONS.map(rule => rule.id)).size).toBe(LEVEL_TWO_REACTIONS.length);
    for (const effectId of Object.values(LEVEL_TWO_EFFECT_IDS)) expect(isLevelTwoEffectId(effectId)).toBe(true);
    expect(isLevelTwoEffectId('deploy-gap-bridge')).toBe(false);
  });
});
