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
import { checkpointDialogue, deathDialogue, DIALOGUE_PRIORITY as priority, INTRO_DIALOGUE, ROUTE_DIALOGUE } from '../content/levelOneDialogue';
import { DialogueQueue } from '../state/DialogueQueue';
import {
  LEVEL_ONE_ID,
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
  PIXEL_PALETTE,
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
  loadLevelOneArt,
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
  private goalArt: Phaser.GameObjects.Image | null = null;
  private goalThreshold: Phaser.GameObjects.Graphics | null = null;
  private goalZone: Phaser.GameObjects.Zone | null = null;
  private goalMercyLabel: Phaser.GameObjects.Text | null = null;
  private goalShifted = false;
  private goalRelocationPending = false;
  private appliedEffectIds = new Set<string>();
  private seenRouteBanterIds = new Set<string>();
  private readonly lifecycle = new SceneLifecycle();
  private readonly idleTrigger = new IdleTrigger(8_000);
  private readonly dialogue = new DialogueQueue();

  private readonly resetIdleClock = (): void => {
    this.idleTrigger.reset();
  };

  constructor(private readonly dependencies: VerticalSliceSceneDependencies) {
    super('VerticalSliceScene');
    this.session = new LevelOneSession(dependencies.progressStore);
  }

  preload(): void {
    loadLevelOneArt(this);
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
    this.speak(this.world.finalMercyActive ? [FINAL_MERCY_MESSAGE] : deaths === 0 && this.session.progressOrder === 0 ? INTRO_DIALOGUE :
      [`工務處｜${copy.resume}`, '關卡｜你竟然回來了。\n工務處｜已經撤掉的陷阱，誰都不准裝回去。'],
      this.world.finalMercyActive ? priority.mercy : priority.ambient);
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
    this.goalArt = null;
    this.goalThreshold = null;
    this.goalZone = null;
    this.goalMercyLabel = null;
    this.goalShifted = false;
    this.goalRelocationPending = false;
    this.appliedEffectIds.clear();
    this.seenRouteBanterIds.clear();
    for (const entry of ROUTE_DIALOGUE) {
      if (entry.triggerX < this.session.initialSpawn.x) this.seenRouteBanterIds.add(entry.id);
    }
    this.dialogue.reset();
    this.lifecycle.reset();
    this.idleTrigger.resetAll();
  }

  override update(_time: number, delta: number): void {
    const line = this.dialogue.advance(delta);
    if (line !== null) publishGameStatus({ deaths: this.session.totalDeaths, message: line });
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
    this.speak([`工務處｜${message}`, '勇者｜那為什麼還會咬人？\n關卡｜沒有面值，不代表沒有脾氣。'], priority.checkpoint);

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
    const gateX = LEVEL_ONE_GOAL.x + LEVEL_ONE_GOAL.gateOffsetX + shiftX;
    this.goalThreshold = this.add.graphics({ x: gateX, y: 0 }).setDepth(-1);
    this.goalThreshold.fillStyle(PIXEL_PALETTE.stone800, 1);
    this.goalThreshold.fillRect(-60, LEVEL_ONE_GOAL.platformTopY - 6, 120, 6);
    this.goalThreshold.fillStyle(PIXEL_PALETTE.stone400, 1);
    for (let x = -54; x <= 42; x += 24) this.goalThreshold.fillRect(x, LEVEL_ONE_GOAL.platformTopY - 6, 19, 2);
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
    if (this.textures.exists('goal-gate-source')) {
      this.goalArt = this.add.image(gateX, LEVEL_ONE_GOAL.gateCenterY, 'goal-gate-source')
        .setDisplaySize(230, 160).setDepth(-2);
      this.goalPole.setVisible(false);
      this.goalFlag.setVisible(false);
    }
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
    const banter = ROUTE_DIALOGUE.find(
      (entry) => this.player.x >= entry.triggerX && !this.seenRouteBanterIds.has(entry.id),
    );
    if (banter === undefined) {
      return;
    }
    this.seenRouteBanterIds.add(banter.id);
    this.speak(banter.lines, priority.ambient);
  }

  private speak(lines: readonly string[], importance: number, phase?: 'playing' | 'dying' | 'completed'): void {
    const accepted = this.dialogue.offer(lines, importance, phase === 'dying' || phase === 'completed');
    if (accepted || phase !== undefined) {
      publishGameStatus({ deaths: this.session.totalDeaths, message: this.dialogue.current, ...(phase === undefined ? {} : { phase }) });
    }
  }

  private advanceMarker(markerId: string, order: number, spawn: Phaser.Math.Vector2, message: string): void {
    const next = this.session.advanceMarker(markerId, order);
    if (next === null) {
      return;
    }
    this.spawn = spawn;
    this.speak(this.world.finalMercyActive ? [FINAL_MERCY_MESSAGE] : checkpointDialogue(message, this.session.activeAssistCount > 0),
      this.world.finalMercyActive ? priority.mercy : priority.checkpoint, 'playing');
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
    const lines = redCarpetDeployed ? [FINAL_MERCY_MESSAGE, '關卡｜這不就是一條走廊？\n工務處｜對。現在請你也靠邊站。'] :
      this.session.blockerDeaths('backtrack') === RETURN_AUDIT.retireDeaths && context.blockerId === 'backtrack' ?
        ['工務處｜退件章被投訴到下班。鋪路預算還在累積。'] : deathDialogue(context, causeDeaths, result.reaction);
    this.speak(lines, redCarpetDeployed || result.reaction?.effectId !== undefined ? priority.mercy : priority.death, 'dying');
    const annotation = this.createMercyAnnotation(lines[0] ?? copy.fallbackDeath, result.reaction);

    this.time.delayedCall(900, () => {
      annotation.destroy();
      this.respawn();
    });
  }

  private createMercyAnnotation(message: string, reaction: ReactionDefinition | null): Phaser.GameObjects.Text {
    const prefix = copy.accidentPrefix(reaction?.tier ?? null);
    return addGameText(
      this,
      400,
      160,
      `${prefix}　${message}`,
      20,
      LEVEL_ONE_TEXT_COLORS.ink,
    )
      .setOrigin(0.5)
      .setWordWrapWidth(380)
      .setBackgroundColor(
        reaction === null ? LEVEL_ONE_TEXT_COLORS.parchment : LEVEL_ONE_TEXT_COLORS.assist,
      )
      .setPadding(8, 5)
      .setStroke(LEVEL_ONE_TEXT_COLORS.parchment, 3)
      .setDepth(10)
      .setScrollFactor(0);
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
    if (this.goalRelocationPending) this.relocateGoalAfterAudit();
    this.goalRelocationPending = false;
    publishGameStatus({ deaths: this.session.totalDeaths, message: this.dialogue.current, phase: 'playing' });
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
    if (this.goalArt !== null) {
      this.tweens.add({ targets: this.goalArt, x: this.goalArt.x + shiftX, duration: 620, ease: 'Back.Out' });
    }
    if (this.goalThreshold !== null) {
      this.tweens.add({ targets: this.goalThreshold, x: this.goalThreshold.x + shiftX, duration: 620, ease: 'Back.Out' });
    }
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
    this.speak([`關卡｜${message}`, '勇者｜我在等道歉。\n工務處｜他不會。我先幫你把表格填了。'], priority.ambient);
  }

  private finishLevel(): void {
    if (!this.lifecycle.complete()) {
      return;
    }
    this.player.setVelocity(0, 0);
    this.player.anims.stop();
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
    this.speak([copy.status], priority.complete, 'completed');
    this.playGoalEntrance(() => {
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
    });
  }

  private playGoalEntrance(onEntered: () => void): void {
    const doorX = this.goalArt?.x ?? this.goalPole?.x ?? LEVEL_ONE_GOAL.x;
    const groundY = LEVEL_ONE_GOAL.platformTopY - LEVEL_ONE_PLAYER_PHYSICS.bodyHeight / 2;
    const openAndEnter = (): void => {
      this.openGoalDoor(doorX);
      this.player.setFlipX(false);
      this.player.play('hero-run', true);
      this.tweens.add({
        targets: this.player,
        x: doorX,
        alpha: 0,
        duration: 280,
        ease: 'Quad.InOut',
        onComplete: () => {
          this.player.anims.stop();
          onEntered();
        },
      });
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.player.setPosition(doorX, groundY).setAlpha(0);
      this.openGoalDoor(doorX);
      onEntered();
      return;
    }
    if (Math.abs(this.player.y - groundY) <= 2) {
      openAndEnter();
      return;
    }
    this.tweens.add({
      targets: this.player,
      y: groundY,
      duration: 220,
      ease: 'Quad.In',
      onComplete: openAndEnter,
    });
  }

  private openGoalDoor(doorX: number): void {
    if (this.goalArt === null) return;
    const floorY = LEVEL_ONE_GOAL.platformTopY;
    const door = this.add.graphics().setDepth(-1);
    door.fillStyle(PIXEL_PALETTE.stone800, 1);
    door.fillRect(doorX - 20, floorY - 63, 40, 62);
    door.fillRect(doorX - 16, floorY - 69, 32, 8);
    door.fillStyle(PIXEL_PALETTE.ink950, 1);
    door.fillRect(doorX - 17, floorY - 61, 34, 60);
    door.fillRect(doorX - 13, floorY - 66, 26, 8);
    door.fillStyle(PIXEL_PALETTE.wood800, 1);
    door.fillRect(doorX - 21, floorY - 55, 5, 52);
    door.fillRect(doorX + 16, floorY - 55, 5, 52);
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
