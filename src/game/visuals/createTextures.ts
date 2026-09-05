import Phaser from 'phaser';
import {
  LEVEL_ONE_COLORS,
  LEVEL_ONE_COMPONENT_COLORS,
  PIXEL_PALETTE,
} from '../content/levelOneVisuals';

export const PLATFORM_TEXTURE_WIDTH = 96;

function createPlayerTexture(scene: Phaser.Scene): void {
  const hero = LEVEL_ONE_COMPONENT_COLORS.hero;
  const player = scene.make.graphics({ x: 0, y: 0 });

  // Cape and shield sit behind the body and preserve a clear side-view silhouette.
  player.fillStyle(hero.outline, 1);
  player.fillRect(4, 20, 22, 24);
  player.fillRect(0, 25, 10, 15);
  player.fillStyle(hero.capeShadow, 1);
  player.fillRect(6, 22, 18, 21);
  player.fillStyle(hero.cape, 1);
  player.fillRect(8, 22, 15, 17);
  player.fillStyle(hero.shield, 1);
  player.fillRect(2, 27, 6, 11);
  player.fillStyle(PIXEL_PALETTE.gold700, 1);
  player.fillRect(4, 29, 2, 7);

  // Boots and compact armor keep the fallback inside the 32×48 contract.
  player.fillStyle(hero.outline, 1);
  player.fillRect(9, 38, 7, 10);
  player.fillRect(19, 38, 7, 10);
  player.fillRect(8, 20, 19, 21);
  player.fillStyle(PIXEL_PALETTE.wood800, 1);
  player.fillRect(11, 41, 5, 6);
  player.fillRect(20, 41, 5, 6);
  player.fillStyle(hero.helmet, 1);
  player.fillRect(10, 22, 15, 15);
  player.fillStyle(hero.helmetLight, 1);
  player.fillRect(12, 23, 10, 5);
  player.fillStyle(hero.outline, 1);
  player.fillRect(9, 31, 17, 3);
  player.fillStyle(PIXEL_PALETTE.gold700, 1);
  player.fillRect(17, 31, 3, 3);

  // Oversized round helmet built from hard-edged steps, with no weapon silhouette.
  player.fillStyle(hero.outline, 1);
  player.fillRect(9, 1, 15, 2);
  player.fillRect(6, 3, 21, 4);
  player.fillRect(4, 7, 25, 11);
  player.fillRect(7, 18, 21, 7);
  player.fillStyle(hero.helmet, 1);
  player.fillRect(10, 3, 13, 2);
  player.fillRect(7, 5, 19, 4);
  player.fillRect(6, 9, 21, 8);
  player.fillRect(9, 17, 17, 5);
  player.fillStyle(hero.helmetLight, 1);
  player.fillRect(11, 4, 9, 2);
  player.fillRect(8, 7, 6, 3);
  player.fillRect(7, 10, 4, 4);
  player.fillStyle(hero.outline, 1);
  player.fillRect(18, 9, 3, 12);
  player.fillStyle(hero.skin, 1);
  player.fillRect(19, 12, 7, 8);
  player.fillStyle(hero.outline, 1);
  player.fillRect(23, 14, 2, 2);
  player.fillRect(25, 19, 2, 2);
  player.fillStyle(hero.cape, 1);
  player.fillRect(8, 20, 18, 3);

  player.generateTexture('player', 32, 48);
  player.destroy();
}

function createPlatformTexture(scene: Phaser.Scene): void {
  const platformColors = LEVEL_ONE_COMPONENT_COLORS.platform;
  const platform = scene.make.graphics({ x: 0, y: 0 });
  platform.fillStyle(platformColors.outline, 1);
  platform.fillRect(0, 0, PLATFORM_TEXTURE_WIDTH, 24);
  platform.fillStyle(platformColors.face, 1);
  platform.fillRect(2, 9, PLATFORM_TEXTURE_WIDTH - 4, 13);
  platform.fillStyle(platformColors.shadow, 1);
  platform.fillRect(2, 18, PLATFORM_TEXTURE_WIDTH - 4, 4);
  platform.fillStyle(platformColors.top, 1);
  platform.fillRect(2, 3, PLATFORM_TEXTURE_WIDTH - 4, 8);
  platform.fillStyle(PIXEL_PALETTE.grass200, 1);
  for (const x of [4, 18, 36, 58, 78, 88]) {
    platform.fillRect(x, 1, 4, 5);
  }
  platform.fillStyle(PIXEL_PALETTE.stone800, 1);
  for (const x of [31, 63]) {
    platform.fillRect(x, 12, 2, 10);
  }
  platform.generateTexture('platform', PLATFORM_TEXTURE_WIDTH, 24);
  platform.destroy();
}

function createSlimeSpringTexture(scene: Phaser.Scene): void {
  const spring = scene.make.graphics({ x: 0, y: 0 });
  spring.fillStyle(LEVEL_ONE_COLORS.outline, 1);
  spring.fillRect(12, 5, 30, 3);
  spring.fillRect(8, 8, 38, 4);
  spring.fillRect(5, 12, 44, 12);
  spring.fillRect(9, 24, 36, 4);
  spring.fillStyle(LEVEL_ONE_COLORS.assist, 1);
  spring.fillRect(13, 8, 28, 3);
  spring.fillRect(9, 11, 36, 12);
  spring.fillRect(13, 23, 28, 3);
  spring.fillStyle(LEVEL_ONE_COLORS.assistHighlight, 1);
  spring.fillRect(13, 11, 12, 4);
  spring.fillStyle(LEVEL_ONE_COLORS.outline, 1);
  spring.fillRect(16, 15, 3, 4);
  spring.fillRect(34, 15, 3, 4);
  spring.fillRect(24, 21, 7, 2);
  spring.generateTexture('spring', 54, 30);
  spring.destroy();
}

function createMercyPlatformTexture(scene: Phaser.Scene): void {
  const bridge = LEVEL_ONE_COMPONENT_COLORS.mercyBridge;
  const platform = scene.make.graphics({ x: 0, y: 0 });
  platform.fillStyle(bridge.outline, 1);
  platform.fillRect(0, 0, PLATFORM_TEXTURE_WIDTH, 20);
  platform.fillStyle(bridge.plankShadow, 1);
  platform.fillRect(2, 4, PLATFORM_TEXTURE_WIDTH - 4, 14);
  platform.fillStyle(bridge.plank, 1);
  platform.fillRect(3, 3, 28, 11);
  platform.fillRect(34, 3, 28, 11);
  platform.fillRect(65, 3, 28, 11);
  platform.fillStyle(bridge.rope, 1);
  platform.fillRect(8, 1, 4, 18);
  platform.fillRect(84, 1, 4, 18);
  platform.generateTexture('mercy-platform', PLATFORM_TEXTURE_WIDTH, 20);
  platform.destroy();
}

export function createGameTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists('player')) {
    createPlayerTexture(scene);
  }
  if (!scene.textures.exists('platform')) {
    createPlatformTexture(scene);
  }
  if (!scene.textures.exists('spring')) {
    createSlimeSpringTexture(scene);
  }
  if (!scene.textures.exists('mercy-platform')) {
    createMercyPlatformTexture(scene);
  }
}
