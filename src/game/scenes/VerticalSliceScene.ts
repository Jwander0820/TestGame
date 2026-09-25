import Phaser from 'phaser';
import { FIRST_PIT_DEATHS, LEVEL_ONE_DEATHS, LEVEL_ONE_TRAP_DEATHS, REAR_DEATHS, type DeathContext } from '../content/levelOneDeaths';
import { REAR_CAUSES, REAR_HAZARDS, REAR_STEP } from '../content/rearGauntlet';
import { FIRST_PIT_CAUSES } from '../content/firstPitAmbush';
import { LEVEL_ONE_SLIMES } from '../content/levelOneSlimes';
import { SLIME_DEATHS, SLIME_REVENGE_DEATHS } from '../content/levelOneDeaths';
import { LEVEL_ONE_TRAP_CAUSES } from '../content/levelOneTraps';
import { RETURN_AUDIT, RETURN_DEATHS, isBacktrackFall } from '../content/returnAudit';
import { FINAL_MERCY_EFFECTS, FINAL_MERCY_MESSAGE } from '../state/FinalMercy';
import { ReturnAudit } from './levelOne/ReturnAudit';
import { LEVEL_ONE_COPY as copy } from '../content/levelOneCopy';
import {
  LEVEL_ONE_ID,
  LEVEL_ONE_ROUTE_BANTER,
  getLevelOneCompletionCopy,
  isLevelOneEffectId,
} from '../content/levelOne';
import {
  LEVEL_ONE_BLOCKER_ZONES,
  LEVEL_ONE_GOAL,
  LEVEL_ONE_PLAYER_PHYSICS,
  LEVEL_ONE_SPAWNS,
  LEVEL_ONE_WORLD,
} from '../content/levelOneLayout';
import {
  LEVEL_ONE_COLORS,
  LEVEL_ONE_INSPECTION_ROWS,
  LEVEL_ONE_TEXT_COLORS,
} from '../content/levelOneVisuals';
import { publishGameStatus } from '../events';
import type { InputController } from '../input/InputController';
import { LevelOneWorld } from './levelOne/LevelOneWorld';
import { LevelOneSession } from '../session/LevelOneSession';
import type { ProgressStore } from '../state/progress';
import { IdleTrigger } from '../state/IdleTrigger';
import { SceneLifecycle } from '../state/SceneLifecycle';
import type { ReactionDefinition } from '../sympathy/types';
import type { PlaytestDriver } from '../testing/PlaytestDriver';
import { addGameText } from '../visuals/addGameText';
import { createGameTextures } from '../visuals/createTextures';
import { drawLevelOneScenery } from '../visuals/LevelOneScenery';
import {
  prepareLevelOneArt,
} from '../visuals/levelOneArt';

interface VerticalSliceSceneDependencies {
  readonly inputController: InputController;
  readonly progressStore: ProgressStore;
  readonly playtestDriver?: PlaytestDriver;
}

export class VerticalSliceScene extends Phaser.Scene {
  private readonly session: LevelOneSession;
  private readonly moveSpeed = LEVEL_ONE_PLAYER_PHYSICS.moveSpeed;
  private readonly jumpSpeed = LEVEL_ONE_PLAYER_PHYSICS.jumpSpeed;
  private spawn = new Phaser.Math.Vector2(LEVEL_ONE_SPAWNS.start.x, LEVEL_ONE_SPAWNS.start.y);

  private player!: Phaser.Physics.Arcade.Sprite;
  private world!: LevelOneWorld;
  private playTimeMs = 0;
  private returnAudit: ReturnAudit | null = null;
  private reverseCoinLabel: Phaser.GameObjects.Text | null = null;
  private inspectionDossier: Phaser.GameObjects.Container | null = null;
  private inspectionDossierRevealed = false;
  private inspectionRows = new Map<string, Phaser.GameObjects.Text>();
  private inspectionStamp: Phaser.GameObjects.Text | null = null;
  private goalPole: Phaser.GameObjects.Rectangle | null = null;
  private goalFlag: Phaser.GameObjects.Triangle | null = null;
  private goalZone: Phaser.GameObjects.Zone | null = null;
  private goalMercyLabel: Phaser.GameObjects.Text | null = null;
  private goalShifted = false;
  private goalRelocationPending = false;
  private appliedEffectIds = new Set<string>();
  private seenRouteBanterIds = new Set<string>();
  private readonly lifecycle = new SceneLifecycle();
  private readonly idleTrigger = new IdleTrigger(8_000);

  private readonly resetIdleClock = (): void => {
    this.idleTrigger.reset();
  };

  constructor(private readonly dependencies: VerticalSliceSceneDependencies) {
    super('VerticalSliceScene');
    this.session = new LevelOneSession(dependencies.progressStore);
  }

  create(): void {
    this.resetRuntimeState();
    createGameTextures(this);
    prepareLevelOneArt(this);
    this.physics.world.setBounds(0, 0, LEVEL_ONE_WORLD.width, LEVEL_ONE_WORLD.height + 180);
    this.drawWorld();
    this.world.createPlatforms();
    this.createPlayer();
    this.returnAudit = new ReturnAudit(this, this.player, this.session.blockerDeaths('backtrack') >= RETURN_AUDIT.retireDeaths,
      () => this.beginDeath(RETURN_DEATHS.audit));
    this.createReverseEasterEgg();
    this.world.createWarningHazard();
    this.createGoal();
    this.createInspectionDossier();
    this.restorePersistedAssists();
    this.syncFinalMercy();

    this.cameras.main.setBounds(0, 0, LEVEL_ONE_WORLD.width, LEVEL_ONE_WORLD.height);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09, -130, 30);
    this.cameras.main.setDeadzone(280, 180);

    document.addEventListener('visibilitychange', this.resetIdleClock);
    window.addEventListener('focus', this.resetIdleClock);
    window.addEventListener('blur', this.resetIdleClock);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.removeEventListener('visibilitychange', this.resetIdleClock);
      window.removeEventListener('focus', this.resetIdleClock);
      window.removeEventListener('blur', this.resetIdleClock);
    });

    const deaths = this.session.totalDeaths;
    publishGameStatus({
      deaths,
      message: this.world.finalMercyActive ? FINAL_MERCY_MESSAGE : deaths === 0 ? copy.controls : copy.resume,
    });
  }

  private resetRuntimeState(): void {
    this.dependencies.playtestDriver?.reset(this.dependencies.inputController.actions);
    this.spawn.set(LEVEL_ONE_SPAWNS.start.x, LEVEL_ONE_SPAWNS.start.y);
    this.world = new LevelOneWorld(this, {
      onWarningHazard: () => {
        this.world.revealWarningHazard();
        this.beginDeath(LEVEL_ONE_DEATHS.warning);
      },
      onLandingAmbush: () => {
        this.beginDeath(this.world.hitCeilingThisAttempt ? LEVEL_ONE_TRAP_DEATHS.ceiling : LEVEL_ONE_DEATHS.landing);
      },
      onGoalAmbush: () => {
        this.goalRelocationPending = true;
        this.beginDeath(LEVEL_ONE_DEATHS.goal);
      },
      onAirAmbush: () => this.beginDeath(LEVEL_ONE_TRAP_DEATHS.airAmbush),
      onFirstPitDeath: (cause) => this.beginDeath(FIRST_PIT_DEATHS[cause]),
      onRearDeath: (cause) => this.beginDeath(REAR_DEATHS[cause]),
      onSlimeDeath: (id, revenge) => this.beginDeath((revenge ? SLIME_REVENGE_DEATHS : SLIME_DEATHS)[id]),
      isPlayerDying: () => this.lifecycle.isDying,
    }, {
      warningHazardRevealed: this.session.causeDeaths('trusted-warning-strip') > 0,
      landingAmbushRevealed: this.session.causeDeaths('landing-stamp-ambush') > 0 ||
        this.session.causeDeaths(LEVEL_ONE_TRAP_CAUSES.ceiling) > 0,
      ceilingRevealed: this.session.causeDeaths(LEVEL_ONE_TRAP_CAUSES.ceiling) > 0,
      airAmbushRevealed: this.session.causeDeaths(LEVEL_ONE_TRAP_CAUSES.airAmbush) > 0,
      pitBrickRevealed: this.session.causeDeaths(FIRST_PIT_CAUSES.brick) > 0,
      coinsRevealed: this.session.causeDeaths(FIRST_PIT_CAUSES.coin) > 0,
      rearRevealed: REAR_HAZARDS.filter((hazard) => this.session.causeDeaths(REAR_CAUSES[hazard.id]) > 0).map((hazard) => hazard.id),
      slimesRevealed: LEVEL_ONE_SLIMES.filter((slime) => this.session.causeDeaths(slime.causeId) > 0 ||
        this.session.causeDeaths(slime.revengeCauseId) > 0).map((slime) => slime.id),
      bridgeWeaknessRevealed: this.session.blockerDeaths('intern-bridge') > 0,
      goalAmbushSpent: this.session.causeDeaths('goal-approval-stamp') > 0,
    });
    this.playTimeMs = 0;
    this.returnAudit = null;
    this.reverseCoinLabel = null;
    this.inspectionDossier = null;
    this.inspectionDossierRevealed = false;
    this.inspectionRows.clear();
    this.inspectionStamp = null;
    this.goalPole = null;
    this.goalFlag = null;
    this.goalZone = null;
    this.goalMercyLabel = null;
    this.goalShifted = false;
    this.goalRelocationPending = false;
    this.appliedEffectIds.clear();
    this.seenRouteBanterIds.clear();
    this.lifecycle.reset();
    this.idleTrigger.resetAll();
  }

  override update(_time: number, delta: number): void {
    if (!this.lifecycle.isPlaying) {
      return;
    }

    this.playTimeMs += delta;
    this.world.update(delta);
    if (!this.lifecycle.isPlaying) return;
    this.returnAudit?.update(delta);
    if (!this.lifecycle.isPlaying) return;

    const actions = this.dependencies.inputController.actions;
    this.dependencies.playtestDriver?.update(
      {
        x: this.player.x,
        y: this.player.y,
        grounded: this.player.body?.blocked.down === true,
        timeMs: this.playTimeMs,
      },
      actions,
    );
    const horizontal = Number(actions.isDown('right')) - Number(actions.isDown('left'));
    this.player.setVelocityX(horizontal * this.moveSpeed);

    if (actions.isAnyDown()) {
      this.resetIdleClock();
    }
    if (horizontal !== 0) {
      this.player.setFlipX(horizontal < 0);
    }

    const body = this.player.body;
    if (actions.consumeJumpPressed() && body?.blocked.down === true) {
      this.player.setVelocityY(-this.jumpSpeed);
    }

    // Texture-only animation: body dimensions and movement remain unchanged.
    if (body?.blocked.down !== true) {
      this.player.anims.stop();
      this.player.setTexture('player-jump');
    } else if (horizontal !== 0) {
      this.player.play('hero-run', true);
    } else {
      this.player.anims.stop();
      this.player.setTexture('player');
    }

    if (this.player.y > LEVEL_ONE_WORLD.height + 30) {
      if (this.world.finalMercyActive) {
        this.player.setPosition(this.spawn.x, this.spawn.y).setVelocity(0, 0);
        return;
      }
      this.beginDeath(this.resolveFallDeathContext());
      return;
    }

    this.updateProgressMarkers();
    this.updateRouteBanter();
    this.updateIdleEgg();
  }

  private drawWorld(): void {
    drawLevelOneScenery(this);
  }

  private createPlayer(): void {
    const initialSpawn = this.session.initialSpawn;
    this.spawn = new Phaser.Math.Vector2(initialSpawn.x, initialSpawn.y);

    this.player = this.physics.add.sprite(this.spawn.x, this.spawn.y, 'player');
    this.player.setCollideWorldBounds(false);
    this.player.setMaxVelocity(this.moveSpeed, 780);
    const body = this.player.body;
    body?.setSize(LEVEL_ONE_PLAYER_PHYSICS.bodyWidth, LEVEL_ONE_PLAYER_PHYSICS.bodyHeight, true);
    this.world.attachPlayer(this.player);
  }

  private createReverseEasterEgg(): void {
    const discovered = this.session.hasDiscoveredEasterEgg('reverse-zero-coins');

    this.reverseCoinLabel = addGameText(
      this,
      8,
      289,
      discovered ? copy.reverseCollected : copy.reverseLabel,
      14,
      LEVEL_ONE_TEXT_COLORS.ink,
    )
      .setBackgroundColor(LEVEL_ONE_TEXT_COLORS.parchment)
      .setPadding(5, 3)
      .setDepth(3);

    const trigger = this.add.zone(55, 205, 150, 130);
    this.physics.add.existing(trigger, true);
    this.physics.add.overlap(this.player, trigger, () => this.triggerReverseEasterEgg());
  }

  private triggerReverseEasterEgg(): void {
    const eggId = 'reverse-zero-coins';
    const next = this.session.discoverEasterEgg(eggId);
    if (next === null) {
      return;
    }

    this.reverseCoinLabel?.setText(copy.reverseCollected);
    const message = copy.reverseDiscovery;
    publishGameStatus({ deaths: next.totalDeaths, message });

    const annotation = addGameText(
      this,
      165,
      120,
      copy.reverseBanner,
      21,
      LEVEL_ONE_TEXT_COLORS.ink,
    )
      .setOrigin(0.5)
      .setAlign('center')
      .setBackgroundColor(LEVEL_ONE_TEXT_COLORS.parchment)
      .setPadding(8, 5)
      .setDepth(10);
    this.time.delayedCall(3_000, () => annotation.destroy());
  }

  private createGoal(): void {
    this.goalShifted = this.session.causeDeaths('goal-approval-stamp') > 0;
    const shiftX = this.goalShifted ? LEVEL_ONE_GOAL.mercyShiftX : 0;
    this.goalPole = this.add.rectangle(
      LEVEL_ONE_GOAL.x + shiftX,
      LEVEL_ONE_GOAL.poleY,
      12,
      190,
      LEVEL_ONE_COLORS.ink,
      1,
    );
    this.goalFlag = this.add.triangle(
      LEVEL_ONE_GOAL.flagX + shiftX,
      LEVEL_ONE_GOAL.flagY,
      0,
      0,
      0,
      70,
      92,
      35,
      LEVEL_ONE_COLORS.documentYellow,
      1,
    );
    this.goalFlag.setStrokeStyle(4, LEVEL_ONE_COLORS.ink, 1);
    this.goalZone = this.add.zone(LEVEL_ONE_GOAL.x - 10 + shiftX, LEVEL_ONE_GOAL.triggerY, 100, 150);
    this.physics.add.existing(this.goalZone, true);
    this.physics.add.overlap(this.player, this.goalZone, () => this.finishLevel());
    this.goalPole.setDepth(1);
    this.goalFlag.setDepth(1);

    if (this.goalShifted) {
      this.goalMercyLabel = addGameText(
        this,
        LEVEL_ONE_GOAL.x + shiftX - 8,
        198,
        copy.goalMovedLabel,
        15,
        LEVEL_ONE_TEXT_COLORS.danger,
      )
        .setOrigin(0.5)
        .setAlign('center')
        .setBackgroundColor(LEVEL_ONE_TEXT_COLORS.parchment)
        .setPadding(8, 5)
        .setDepth(3);
    }
  }

  private createInspectionDossier(): void {
    const dossierX = 700;
    const hasRecordedAccident = this.session.totalDeaths > 0;
    const panel = this.add
      .container(0, hasRecordedAccident ? 0 : -12)
      .setAlpha(hasRecordedAccident ? 1 : 0)
      .setScrollFactor(0)
      .setDepth(40);
    const shadow = this.add
      .rectangle(dossierX + 6, 69, 196, 96, LEVEL_ONE_COLORS.outline, 0.34)
      .setScrollFactor(0);
    const parchment = this.add
      .rectangle(dossierX, 63, 196, 96, LEVEL_ONE_COLORS.parchment, 1)
      .setStrokeStyle(3, LEVEL_ONE_COLORS.outline, 1)
      .setScrollFactor(0);
    const tab = this.add
      .rectangle(dossierX - 70, 14, 52, 14, LEVEL_ONE_COLORS.royalGold, 1)
      .setStrokeStyle(2, LEVEL_ONE_COLORS.outline, 1)
      .setScrollFactor(0);
    panel.add([shadow, parchment, tab]);

    panel.add(
      addGameText(
        this,
        dossierX - 84,
        24,
        copy.ledgerTitle,
        12,
        LEVEL_ONE_TEXT_COLORS.danger,
      )
        .setScrollFactor(0)
        .setDepth(41),
    );
    for (const [index, row] of LEVEL_ONE_INSPECTION_ROWS.entries()) {
      const text = addGameText(
        this,
        dossierX - 82,
        45 + index * 18,
        row.label,
        12,
        LEVEL_ONE_TEXT_COLORS.ink,
      )
        .setScrollFactor(0)
        .setDepth(41);
      this.inspectionRows.set(row.blockerId, text);
      panel.add(text);
    }
    this.inspectionStamp = addGameText(
      this,
      dossierX + 20,
      82,
      copy.ledgerStamp,
      19,
      LEVEL_ONE_TEXT_COLORS.danger,
    )
      .setOrigin(0.5)
      .setRotation(-0.08)
      .setStroke(LEVEL_ONE_TEXT_COLORS.parchment, 4)
      .setAlpha(0)
      .setScrollFactor(0)
      .setDepth(42);
    panel.add(this.inspectionStamp);
    this.inspectionDossier = panel;
    this.inspectionDossierRevealed = hasRecordedAccident;
    this.refreshInspectionDossier();
  }

  private refreshInspectionDossier(): void {
    if (this.session.totalDeaths > 0) {
      this.revealInspectionDossier();
    }
    for (const row of LEVEL_ONE_INSPECTION_ROWS) {
      const deaths = this.session.blockerDeaths(row.blockerId);
      const status = copy.ledgerStatus(deaths);
      this.inspectionRows.get(row.blockerId)
        ?.setText(`${row.label}　${status}`)
        .setColor(deaths === 0 ? LEVEL_ONE_TEXT_COLORS.ink : LEVEL_ONE_TEXT_COLORS.danger);
    }
  }

  private revealInspectionDossier(): void {
    if (this.inspectionDossier === null || this.inspectionDossierRevealed) {
      return;
    }
    this.inspectionDossierRevealed = true;
    this.tweens.add({
      targets: this.inspectionDossier,
      alpha: 1,
      y: 0,
      duration: 260,
      ease: 'Quad.Out',
    });
  }

  private updateProgressMarkers(): void {
    const currentOrder = this.session.progressOrder;

    if (currentOrder < 1 && this.player.x >= 790) {
      this.advanceMarker(
        'after-first-gap',
        1,
        new Phaser.Math.Vector2(LEVEL_ONE_SPAWNS.afterFirstGap.x, LEVEL_ONE_SPAWNS.afterFirstGap.y),
        copy.firstCheckpoint,
      );
    } else if (currentOrder < 2 && this.player.x >= 1_300) {
      this.advanceMarker(
        'after-warning-strip',
        2,
        new Phaser.Math.Vector2(
          LEVEL_ONE_SPAWNS.afterWarningStrip.x,
          LEVEL_ONE_SPAWNS.afterWarningStrip.y,
        ),
        copy.secondCheckpoint,
      );
    } else if (currentOrder < 3 && this.player.x >= 2_230) {
      this.advanceMarker(
        'after-intern-bridge',
        3,
        new Phaser.Math.Vector2(
          LEVEL_ONE_SPAWNS.afterInternBridge.x,
          LEVEL_ONE_SPAWNS.afterInternBridge.y,
        ),
        copy.thirdCheckpoint,
      );
    }
  }

  private updateRouteBanter(): void {
    if (this.world.finalMercyActive) return;
    const banter = LEVEL_ONE_ROUTE_BANTER.find(
      (entry) => this.player.x >= entry.triggerX && !this.seenRouteBanterIds.has(entry.id),
    );
    if (banter === undefined) {
      return;
    }
    this.seenRouteBanterIds.add(banter.id);
    publishGameStatus({ deaths: this.session.totalDeaths, message: banter.message });
    const annotation = addGameText(
      this,
      this.player.x + 90,
      130,
      banter.message,
      18,
      LEVEL_ONE_TEXT_COLORS.ink,
    )
      .setOrigin(0.5)
      .setAlign('center')
      .setWordWrapWidth(430)
      .setBackgroundColor(LEVEL_ONE_TEXT_COLORS.parchment)
      .setPadding(8, 5)
      .setDepth(10);
    this.time.delayedCall(2_300, () => annotation.destroy());
  }

  private advanceMarker(markerId: string, order: number, spawn: Phaser.Math.Vector2, message: string): void {
    const next = this.session.advanceMarker(markerId, order);
    if (next === null) {
      return;
    }
    this.spawn = spawn;
    publishGameStatus({ deaths: next.totalDeaths, message: this.world.finalMercyActive ? FINAL_MERCY_MESSAGE : message });
  }

  private beginDeath(context: DeathContext): void {
    if (this.world.finalMercyActive) return;
    if (!this.lifecycle.beginDeath()) {
      return;
    }

    this.resetIdleClock();
    this.player.setTint(LEVEL_ONE_COLORS.hazardDark);
    this.player.setVelocity(0, -180);
    if (this.player.body !== null) {
      this.player.body.enable = false;
    }

    const result = this.session.recordDeath(
      {
        causeId: context.causeId,
        blockerId: context.blockerId,
        x: Math.round(this.player.x),
        y: Math.round(this.player.y),
      },
      (effectId) => this.applyEffectSafely(effectId),
    );
    this.refreshInspectionDossier();
    const redCarpetDeployed = this.syncFinalMercy();
    if (this.session.blockerDeaths('backtrack') >= RETURN_AUDIT.retireDeaths) this.returnAudit?.retire();

    const causeDeaths = result.state.levels[LEVEL_ONE_ID]?.deathsByCause[context.causeId] ?? 1;
    const fallbackMessage = context.messages[(causeDeaths - 1) % context.messages.length] ?? context.messages[0];
    const message = redCarpetDeployed ? FINAL_MERCY_MESSAGE :
      this.session.blockerDeaths('backtrack') === RETURN_AUDIT.retireDeaths && context.blockerId === 'backtrack' ?
        '退件章被投訴到下班。工務處仍在累積鋪路預算。' : result.reaction?.message ?? fallbackMessage ?? copy.fallbackDeath;
    publishGameStatus({ deaths: result.state.totalDeaths, message, phase: 'dying' });
    const annotation = this.createMercyAnnotation(message, result.reaction);

    this.time.delayedCall(900, () => {
      annotation.destroy();
      this.respawn();
    });
  }

  private createMercyAnnotation(message: string, reaction: ReactionDefinition | null): Phaser.GameObjects.Text {
    const prefix = copy.accidentPrefix(reaction?.tier ?? null);
    return addGameText(
      this,
      this.player.x,
      Math.max(80, this.player.y - 72),
      `${prefix}　${message}`,
      20,
      LEVEL_ONE_TEXT_COLORS.ink,
    )
      .setOrigin(0.5)
      .setBackgroundColor(
        reaction === null ? LEVEL_ONE_TEXT_COLORS.parchment : LEVEL_ONE_TEXT_COLORS.assist,
      )
      .setPadding(8, 5)
      .setStroke(LEVEL_ONE_TEXT_COLORS.parchment, 3)
      .setDepth(10)
      .setScrollFactor(1);
  }

  private respawn(): void {
    if (!this.lifecycle.isDying) {
      return;
    }
    this.player.clearTint();
    this.world.resetTransientHazards();
    this.returnAudit?.resetAttempt();
    this.player.setPosition(this.spawn.x, this.spawn.y);
    this.player.setVelocity(0, 0);
    if (this.player.body !== null) {
      this.player.body.enable = true;
    }
    this.lifecycle.respawn();
    this.resetIdleClock();
    const goalRelocated = this.goalRelocationPending && this.relocateGoalAfterAudit();
    this.goalRelocationPending = false;
    publishGameStatus({
      deaths: this.session.totalDeaths,
      message: this.world.finalMercyActive ? FINAL_MERCY_MESSAGE : goalRelocated
        ? copy.goalMoved
        : copy.respawn,
    });
  }

  private relocateGoalAfterAudit(): boolean {
    if (this.goalShifted || this.goalPole === null || this.goalFlag === null || this.goalZone === null) {
      return false;
    }

    this.goalShifted = true;
    const shiftX = LEVEL_ONE_GOAL.mercyShiftX;
    const poleTargetX = this.goalPole.x + shiftX;
    const flagTargetX = this.goalFlag.x + shiftX;
    this.goalZone.setX(this.goalZone.x + shiftX);
    const goalBody = this.goalZone.body as Phaser.Physics.Arcade.StaticBody | null;
    goalBody?.updateFromGameObject();

    this.tweens.add({
      targets: this.goalPole,
      x: poleTargetX,
      duration: 620,
      ease: 'Back.Out',
    });
    this.tweens.add({
      targets: this.goalFlag,
      x: flagTargetX,
      duration: 620,
      ease: 'Back.Out',
    });
    this.goalMercyLabel = addGameText(
      this,
      poleTargetX - 8,
      198,
      copy.goalMovedLabel,
      15,
      LEVEL_ONE_TEXT_COLORS.danger,
    )
      .setOrigin(0.5)
      .setAlign('center')
      .setBackgroundColor(LEVEL_ONE_TEXT_COLORS.parchment)
      .setPadding(8, 5)
      .setAlpha(0)
      .setDepth(3);
    this.tweens.add({
      targets: this.goalMercyLabel,
      alpha: 1,
      y: 188,
      duration: 520,
      delay: 160,
      ease: 'Quad.Out',
    });
    const correction = addGameText(
      this,
      LEVEL_ONE_GOAL.x + 18,
      246,
      copy.movingGoal,
      15,
      LEVEL_ONE_TEXT_COLORS.ink,
    )
      .setOrigin(0.5)
      .setBackgroundColor(LEVEL_ONE_TEXT_COLORS.assist)
      .setPadding(6, 3)
      .setDepth(3);
    this.tweens.add({
      targets: correction,
      alpha: 0,
      duration: 700,
      delay: 1_800,
      onComplete: () => correction.destroy(),
    });
    return true;
  }

  private restorePersistedAssists(): void {
    for (const effectId of this.session.activeAssistIds) {
      this.applyEffectSafely(effectId);
    }
  }

  private syncFinalMercy(): boolean {
    if (!this.session.finalMercy || this.world.finalMercyActive) return false;
    for (const effect of FINAL_MERCY_EFFECTS) {
      if (!this.applyEffectSafely(effect)) return false;
    }
    this.returnAudit?.retire();
    this.world.deployRedCarpet();
    return true;
  }

  private applyEffectSafely(effectId: string): boolean {
    if (this.appliedEffectIds.has(effectId)) {
      return true;
    }

    try {
      if (!isLevelOneEffectId(effectId)) {
        throw new Error(`Unknown sympathy effect: ${effectId}`);
      }
      this.world.applyAssistEffect(effectId);
      this.appliedEffectIds.add(effectId);
      return true;
    } catch (error) {
      console.error('[sympathy-effect]', effectId, error);
      return false;
    }
  }

  private updateIdleEgg(): void {
    const eligible =
      document.visibilityState === 'visible' &&
      document.hasFocus() &&
      this.player.body?.blocked.down === true &&
      !this.dependencies.inputController.actions.isAnyDown();

    if (!this.idleTrigger.update(performance.now(), eligible)) {
      return;
    }

    const eggId = 'idle-apology';
    const next = this.session.discoverEasterEgg(eggId);
    if (next === null) {
      return;
    }
    const message = this.world.finalMercyActive ? '工務處已經把整關改成走廊了。只要向右走。' : copy.idle;
    publishGameStatus({ deaths: next.totalDeaths, message });
    const annotation = addGameText(
      this,
      this.player.x + 20,
      this.player.y - 76,
      message,
      20,
      LEVEL_ONE_TEXT_COLORS.ink,
    )
      .setOrigin(0.5)
      .setBackgroundColor(LEVEL_ONE_TEXT_COLORS.parchment)
      .setPadding(8, 5)
      .setDepth(10);
    this.time.delayedCall(2_400, () => annotation.destroy());
  }

  private finishLevel(): void {
    if (!this.lifecycle.complete()) {
      return;
    }
    this.player.setVelocity(0, 0);
    if (this.player.body !== null) {
      this.player.body.enable = false;
    }
    const next = this.session.complete();
    const copy = getLevelOneCompletionCopy(
      next.totalDeaths,
      this.session.activeAssistCount,
      this.session.causeDeaths('goal-approval-stamp') > 0,
      this.world.finalMercyActive,
    );
    publishGameStatus({
      deaths: next.totalDeaths,
      message: copy.status,
      phase: 'completed',
    });
    this.playCompletionSetpiece();
    addGameText(
      this,
      this.cameras.main.scrollX + 360,
      150,
      copy.banner,
      28,
      LEVEL_ONE_TEXT_COLORS.danger,
    )
      .setAlign('center')
      .setOrigin(0.5)
      .setBackgroundColor(LEVEL_ONE_TEXT_COLORS.parchment)
      .setPadding(14, 9)
      .setStroke(LEVEL_ONE_TEXT_COLORS.parchment, 8)
      .setDepth(20);
  }

  private playCompletionSetpiece(): void {
    this.revealInspectionDossier();
    if (this.goalMercyLabel !== null) {
      this.tweens.add({
        targets: this.goalMercyLabel,
        alpha: 0,
        duration: 280,
      });
    }
    this.inspectionStamp?.setAlpha(1).setScale(0.64);
    if (this.inspectionStamp !== null) {
      this.tweens.add({
        targets: this.inspectionStamp,
        scaleX: 1,
        scaleY: 1,
        duration: 360,
        ease: 'Back.Out',
      });
    }
    if (this.goalFlag !== null) {
      this.tweens.add({
        targets: this.goalFlag,
        y: this.goalFlag.y + 58,
        angle: 8,
        duration: 620,
        ease: 'Bounce.Out',
      });
    }

    const ribbonOffsets = [-112, -82, -48, -18, 18, 46, 78, 108];
    ribbonOffsets.forEach((offset, index) => {
      const ribbon = this.add
        .rectangle(
          this.player.x + offset * 0.2,
          232 - (index % 3) * 12,
          18,
          12,
          index % 2 === 0 ? LEVEL_ONE_COLORS.royalGold : LEVEL_ONE_COLORS.heroCape,
          1,
        )
        .setStrokeStyle(2, LEVEL_ONE_COLORS.outline, 1)
        .setDepth(18);
      this.tweens.add({
        targets: ribbon,
        x: this.player.x + offset,
        y: 365 + (index % 2) * 34,
        angle: offset > 0 ? 105 : -105,
        alpha: 0.18,
        duration: 780 + index * 45,
        ease: 'Quad.In',
      });
    });
  }

  private resolveFallDeathContext(): DeathContext {
    if (isBacktrackFall(this.player.x, this.spawn.x, this.session.progressOrder)) return RETURN_DEATHS.exit;
    if (this.world.raisedStepCollapsed && this.player.x >= REAR_STEP.minFallX && this.player.x <= REAR_STEP.maxFallX) {
      return REAR_DEATHS[REAR_CAUSES.step];
    }
    const { firstGap, internBridge } = LEVEL_ONE_BLOCKER_ZONES;
    if (this.player.x >= firstGap.minX && this.player.x < firstGap.maxX) {
      if (this.world.hitPitBrickThisAttempt) return FIRST_PIT_DEATHS[FIRST_PIT_CAUSES.brick];
      return this.world.hitCeilingThisAttempt ? LEVEL_ONE_TRAP_DEATHS.ceiling : LEVEL_ONE_DEATHS.firstGap;
    }
    if (this.player.x >= internBridge.minX && this.player.x < internBridge.maxX) {
      return LEVEL_ONE_DEATHS.bridge;
    }
    return LEVEL_ONE_DEATHS.void;
  }

}
