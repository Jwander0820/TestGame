import Phaser from 'phaser';
import { LEVEL_ONE_ART_ASSET_PATHS } from './levelOneArtManifest';

export { LEVEL_ONE_ART_ASSET_PATHS } from './levelOneArtManifest';

export const LEVEL_ONE_ART_KEYS = {
  forestGround: 'level-one-forest-ground',
} as const;

const publicAssetUrl = (path: string): string => `${import.meta.env.BASE_URL}${path}`;

export function preloadLevelOneArt(scene: Phaser.Scene): void {
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

}

export function hasLevelOneArt(scene: Phaser.Scene, key: string): boolean {
  return scene.textures.exists(key);
}
