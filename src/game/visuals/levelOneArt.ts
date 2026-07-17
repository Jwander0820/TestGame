import Phaser from 'phaser';
import { LEVEL_ONE_ART_ASSET_PATHS } from './levelOneArtManifest';

export { LEVEL_ONE_ART_ASSET_PATHS } from './levelOneArtManifest';

export const LEVEL_ONE_ART_KEYS = {
  heroIdle: 'level-one-hero-idle',
  slimeSpring: 'level-one-slime-spring',
  forestGround: 'level-one-forest-ground',
} as const;

export const LEVEL_ONE_ART_ANIMATIONS = {
  heroIdle: 'level-one-hero-idle-loop',
  slimeBounce: 'level-one-slime-bounce',
} as const;

const publicAssetUrl = (path: string): string => `${import.meta.env.BASE_URL}${path}`;

export function preloadLevelOneArt(scene: Phaser.Scene): void {
  scene.load.spritesheet(
    LEVEL_ONE_ART_KEYS.heroIdle,
    publicAssetUrl(LEVEL_ONE_ART_ASSET_PATHS.heroIdle),
    { frameWidth: 32, frameHeight: 48 },
  );
  scene.load.spritesheet(
    LEVEL_ONE_ART_KEYS.slimeSpring,
    publicAssetUrl(LEVEL_ONE_ART_ASSET_PATHS.slimeSpring),
    { frameWidth: 48, frameHeight: 32 },
  );
  scene.load.atlas(
    LEVEL_ONE_ART_KEYS.forestGround,
    publicAssetUrl(LEVEL_ONE_ART_ASSET_PATHS.forestGroundImage),
    publicAssetUrl(LEVEL_ONE_ART_ASSET_PATHS.forestGroundAtlas),
  );
}

export function prepareLevelOneArt(scene: Phaser.Scene): void {
  for (const key of Object.values(LEVEL_ONE_ART_KEYS)) {
    if (scene.textures.exists(key)) {
      scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
  }

  if (
    scene.textures.exists(LEVEL_ONE_ART_KEYS.heroIdle) &&
    !scene.anims.exists(LEVEL_ONE_ART_ANIMATIONS.heroIdle)
  ) {
    scene.anims.create({
      key: LEVEL_ONE_ART_ANIMATIONS.heroIdle,
      frames: scene.anims.generateFrameNumbers(LEVEL_ONE_ART_KEYS.heroIdle, { start: 0, end: 3 }),
      frameRate: 5,
      repeat: -1,
    });
  }

  if (
    scene.textures.exists(LEVEL_ONE_ART_KEYS.slimeSpring) &&
    !scene.anims.exists(LEVEL_ONE_ART_ANIMATIONS.slimeBounce)
  ) {
    scene.anims.create({
      key: LEVEL_ONE_ART_ANIMATIONS.slimeBounce,
      frames: scene.anims.generateFrameNumbers(LEVEL_ONE_ART_KEYS.slimeSpring, {
        frames: [1, 2, 3, 0],
      }),
      frameRate: 12,
      repeat: 0,
    });
  }
}

export function hasLevelOneArt(scene: Phaser.Scene, key: string): boolean {
  return scene.textures.exists(key);
}
