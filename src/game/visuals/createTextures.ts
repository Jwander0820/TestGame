import Phaser from 'phaser';
import { LEVEL_ONE_COLORS } from '../content/levelOneVisuals';

export const PLATFORM_TEXTURE_WIDTH = 96;

export function createGameTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists('player')) {
    const player = scene.make.graphics({ x: 0, y: 0 });
    player.fillStyle(LEVEL_ONE_COLORS.documentYellow, 1);
    player.fillRoundedRect(0, 0, 34, 42, 10);
    player.lineStyle(4, LEVEL_ONE_COLORS.ink, 1);
    player.strokeRoundedRect(2, 2, 30, 38, 8);
    player.fillStyle(LEVEL_ONE_COLORS.paper, 1);
    player.fillRoundedRect(6, 5, 22, 8, 3);
    player.lineStyle(2, LEVEL_ONE_COLORS.warningRed, 0.9);
    player.lineBetween(8, 9, 26, 9);
    player.fillStyle(LEVEL_ONE_COLORS.ink, 1);
    player.fillCircle(11, 17, 2.5);
    player.fillCircle(23, 17, 2.5);
    player.lineStyle(2, LEVEL_ONE_COLORS.ink, 1);
    player.beginPath();
    player.arc(17, 24, 6, 0.2, Math.PI - 0.2, false);
    player.strokePath();
    player.fillStyle(LEVEL_ONE_COLORS.warningRed, 1);
    player.fillRoundedRect(8, 34, 18, 4, 2);
    player.generateTexture('player', 34, 42);
    player.destroy();
  }

  if (!scene.textures.exists('platform')) {
    const platform = scene.make.graphics({ x: 0, y: 0 });
    platform.fillStyle(LEVEL_ONE_COLORS.royalGreenDark, 1);
    platform.fillRoundedRect(0, 2, PLATFORM_TEXTURE_WIDTH, 22, 4);
    platform.fillStyle(LEVEL_ONE_COLORS.royalGreen, 1);
    platform.fillRoundedRect(0, 0, PLATFORM_TEXTURE_WIDTH, 16, 4);
    platform.fillStyle(LEVEL_ONE_COLORS.paper, 0.52);
    platform.fillRect(5, 4, PLATFORM_TEXTURE_WIDTH - 10, 3);
    platform.lineStyle(3, LEVEL_ONE_COLORS.ink, 1);
    platform.strokeRoundedRect(1.5, 1.5, 93, 21, 3);
    platform.lineStyle(2, LEVEL_ONE_COLORS.ink, 0.35);
    platform.lineBetween(31, 16, 31, 22);
    platform.lineBetween(64, 16, 64, 22);
    platform.fillStyle(LEVEL_ONE_COLORS.documentYellow, 1);
    platform.fillCircle(10, 18, 2);
    platform.fillCircle(86, 18, 2);
    platform.generateTexture('platform', PLATFORM_TEXTURE_WIDTH, 24);
    platform.destroy();
  }

  if (!scene.textures.exists('spring')) {
    const spring = scene.make.graphics({ x: 0, y: 0 });
    spring.fillStyle(LEVEL_ONE_COLORS.documentYellow, 1);
    spring.fillRoundedRect(0, 0, 54, 14, 5);
    spring.lineStyle(3, LEVEL_ONE_COLORS.ink, 1);
    spring.strokeRoundedRect(1.5, 1.5, 51, 11, 4);
    spring.lineStyle(4, LEVEL_ONE_COLORS.warningRed, 1);
    spring.lineBetween(10, 14, 18, 28);
    spring.lineBetween(18, 28, 27, 14);
    spring.lineBetween(27, 14, 36, 28);
    spring.lineBetween(36, 28, 44, 14);
    spring.generateTexture('spring', 54, 30);
    spring.destroy();
  }

  if (!scene.textures.exists('tape-platform')) {
    const tape = scene.make.graphics({ x: 0, y: 0 });
    tape.fillStyle(LEVEL_ONE_COLORS.paper, 1);
    tape.fillRoundedRect(0, 0, PLATFORM_TEXTURE_WIDTH, 20, 4);
    tape.lineStyle(3, LEVEL_ONE_COLORS.warningRed, 1);
    tape.strokeRoundedRect(1.5, 1.5, 93, 17, 3);
    tape.lineStyle(2, LEVEL_ONE_COLORS.warningRed, 0.55);
    tape.lineBetween(12, 4, 26, 16);
    tape.lineBetween(48, 4, 62, 16);
    tape.lineBetween(78, 4, 90, 15);
    tape.generateTexture('tape-platform', PLATFORM_TEXTURE_WIDTH, 20);
    tape.destroy();
  }
}
