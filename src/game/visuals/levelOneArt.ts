import Phaser from 'phaser';
export { LEVEL_ONE_ART_ASSET_PATHS } from './levelOneArtManifest';
import { LEVEL_ONE_ART_ASSET_PATHS } from './levelOneArtManifest';

export function loadLevelOneArt(scene: Phaser.Scene): void {
  for (const [key, path] of Object.entries(LEVEL_ONE_ART_ASSET_PATHS)) {
    if (!scene.textures.exists(key)) scene.load.image(key, path);
  }
}

export function prepareLevelOneArt(scene: Phaser.Scene): void {
  for (const key of ['player', 'player-stride', 'player-pass', 'player-jump', 'forest-ground', 'platform', 'spring', 'mercy-platform', 'slime-charger', 'slime-jumper', 'crown-coin']) {
    if (scene.textures.exists(key)) scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
}
