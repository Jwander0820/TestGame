import type Phaser from 'phaser';
import { LEVEL_ONE_AMBUSH_LAYOUT } from '../../content/levelOneLayout';
import { LEVEL_ONE_COLORS as C, LEVEL_ONE_TEXT_COLORS as T } from '../../content/levelOneVisuals';
import { GOAL_STRIKES } from '../../content/goalStamp';
import { GoalStampState, type CollisionRect } from '../../state/GoalStampState';
import { addGameText } from '../../visuals/addGameText';
import { paintRoyalSeal } from '../../visuals/trapPixelArt';

export class GoalStamp {
  private readonly state: GoalStampState;
  private previous: CollisionRect | null = null;
  private readonly visuals;

  constructor(scene: Phaser.Scene, private readonly player: Phaser.Physics.Arcade.Sprite,
    retired: boolean, private readonly onDeath: () => void) {
    this.state = new GoalStampState(retired);
    const d = LEVEL_ONE_AMBUSH_LAYOUT.goalStamp;
    this.visuals = GOAL_STRIKES.map((strike, index) => ({
      // Keep a transparent geometry marker for the collision review route.
      seal: scene.add.rectangle(strike.x, d.hiddenY, d.width, d.height, C.royalGold, 0).setDepth(3),
      art: scene.add.graphics().setDepth(3),
      label: addGameText(scene, strike.x, d.hiddenY, index === 0 ? '王\n令' : '補\n蓋', 19, T.parchment)
        .setOrigin(0.5).setDepth(4),
      warning: addGameText(scene, strike.x, 435, index === 0 ? '▼ 落印' : '▼ 再一次', 14, T.danger)
        .setOrigin(0.5).setBackgroundColor(T.parchment).setPadding(3, 2).setDepth(4),
      shadow: scene.add.rectangle(strike.x, 416, d.width, 4, C.hazardDark).setDepth(3),
    }));
    this.visuals.forEach((visual) => paintRoyalSeal(visual.art, d.width, d.height));
    this.render();
  }

  update(delta: number): void {
    const body = this.player.body;
    if (!body?.enable) return;
    const player = { x: body.x, y: body.y, width: body.width, height: body.height };
    const d = LEVEL_ONE_AMBUSH_LAYOUT.goalStamp;
    if (body.right >= d.triggerX - d.triggerWidth / 2 && body.left <= d.triggerX + d.triggerWidth / 2 && body.bottom >= 265) this.state.arm();
    const hit = this.state.advance(delta, this.previous ?? player, player);
    this.previous = player;
    this.render();
    if (hit) {
      this.state.retire();
      this.onDeath();
      this.render();
    }
  }

  retire(): void { this.state.retire(); this.render(); }
  resetAttempt(): void { this.previous = null; this.state.resetAttempt(); this.render(); }

  private render(): void {
    this.visuals.forEach((visual, index) => {
      const sample = this.state.sample(index);
      const visible = sample.phase === 'tell' || sample.active;
      visual.seal.setPosition(sample.x, sample.y).setVisible(visible).setAlpha(sample.active ? 1 : 0.4);
      visual.art.setPosition(sample.x, sample.y).setVisible(visible).setAlpha(sample.active ? 1 : 0.4);
      visual.label.setPosition(sample.x, sample.y).setVisible(visible);
      visual.warning.setVisible(visible);
      visual.shadow.setVisible(visible);
    });
  }
}
