import Phaser from 'phaser';
import { REAR_CAUSES, REAR_HAZARDS, type RearCause, type RearHazardDefinition } from '../../content/rearGauntlet';
import type { LevelOneEffectId } from '../../content/levelOne';
import { RearGauntletState } from '../../state/RearGauntletState';
import { createRearHazardVisual } from '../../visuals/rearGauntletVisuals';

export class RearGauntlet {
  private elapsedMs = 0;
  private collapsed = false;
  private readonly hazards: {
    definition: RearHazardDefinition;
    zone: Phaser.GameObjects.Zone;
    body: Phaser.Physics.Arcade.StaticBody;
    visual: ReturnType<typeof createRearHazardVisual>;
  }[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    player: Phaser.Physics.Arcade.Sprite,
    private readonly state: RearGauntletState,
    isDying: () => boolean,
    onDeath: (cause: RearCause) => void,
    private readonly setStepCollapsed: (collapsed: boolean) => void,
  ) {
    for (const definition of REAR_HAZARDS) {
      const zone = this.zone(definition.x, definition.y, definition.width, definition.height);
      const body = zone.body as Phaser.Physics.Arcade.StaticBody;
      body.enable = false;
      this.hazards.push({ definition, zone, body, visual: createRearHazardVisual(scene, definition) });
      scene.physics.add.overlap(player, zone, () => {
        if (isDying()) return;
        state.reveal(definition.id);
        this.update();
        onDeath(REAR_CAUSES[definition.id]);
      });
      if (definition.triggerX !== null) {
        const trigger = this.zone(definition.triggerX, 360, 24, 200);
        scene.physics.add.overlap(player, trigger, () => {
          if (!isDying()) state.arm(definition.id, this.elapsedMs);
        });
      }
    }
    this.update();
  }

  landOnStep(): void { this.state.landOnStep(this.elapsedMs); }
  get stepCollapsed(): boolean { return this.collapsed; }

  update(deltaMs = 0): void {
    this.elapsedMs += deltaMs;
    const collapsed = this.state.stepCollapsed(this.elapsedMs);
    if (collapsed !== this.collapsed) {
      this.collapsed = collapsed;
      this.setStepCollapsed(collapsed);
    }
    for (const hazard of this.hazards) {
      const sample = this.state.sample(hazard.definition, this.elapsedMs);
      hazard.body.enable = sample.active;
      hazard.zone.setPosition(sample.x, sample.y);
      hazard.body.updateFromGameObject();
      hazard.visual.show(sample);
    }
  }

  applyEffect(effect: LevelOneEffectId): void { this.state.applyEffect(effect); this.update(); }
  resetAttempt(): void { this.state.resetAttempt(); this.update(); }

  private zone(x: number, y: number, width: number, height: number): Phaser.GameObjects.Zone {
    const zone = this.scene.add.zone(x, y, width, height);
    this.scene.physics.add.existing(zone, true);
    return zone;
  }
}
