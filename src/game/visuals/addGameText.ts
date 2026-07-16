import Phaser from 'phaser';

export function addGameText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  fontSize: number,
  color: string,
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, {
    color,
    fontFamily: 'Fredoka, Nunito, Noto Sans TC, sans-serif',
    fontSize: `${fontSize}px`,
    fontStyle: 'bold',
    lineSpacing: 5,
  });
}
