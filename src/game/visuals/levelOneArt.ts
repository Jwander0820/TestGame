import Phaser from 'phaser';
export { LEVEL_ONE_ART_ASSET_PATHS } from './levelOneArtManifest';

export function prepareLevelOneArt(scene: Phaser.Scene): void {
  for (const key of ['player', 'player-stride', 'player-pass', 'player-jump', 'forest-ground', 'platform', 'spring', 'mercy-platform']) {
    if (scene.textures.exists(key)) scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
}
