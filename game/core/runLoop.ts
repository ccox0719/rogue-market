import { createInitialState, type CarryOption, type GameState } from "./state.js";
import { createSeededRng, type RNG } from "./rng.js";
import { runDailyEvents } from "../systems/eventSystem.js";
import { updatePrices } from "../systems/priceSystem.js";
import { checkUnlocks } from "../systems/progression.js";
import { advanceEraProgress, EraTransitionResult, getCurrentEra } from "../systems/eraSystem.js";
import { portfolioValue } from "../systems/portfolioSystem.js";
import { saveRun } from "../saves/saveManager.js";
import { saveMeta } from "../saves/metaSave.js";
import type { MetaProfile } from "./metaState.js";
import {
  awardXp,
  defaultMetaState,
  getDifficultyRating,
  recordRunOutcome,
  setActiveCampaign,
  setActiveChallenge,
  addLegacyBuff,
  unlockCampaign,
  recordCampaignRun,
  recordChallengeScore,
  setDifficulty,
  resetXp,
} from "./metaState.js";
import { progressArtifact } from "../systems/metaProgress.js";
import { aggregateArtifactEffects, type ArtifactEffects } from "./artifactEffects.js";
import { applyArtifactsToState } from "../systems/artifactSystem.js";
import {
  artifactLibrary,
  findArtifactDefinition,
  type ArtifactEffectDescriptor,
} from "../generators/artifactGen.js";
import { CONFIG, getDifficultyMode, type DifficultyMode } from "./config.js";
import { createEraFromTemplate, findEraTemplate } from "../generators/eraGen.js";
import type { GameEvent } from "../generators/eventGen.js";
import { processWatchOrdersForDay } from "../systems/watchOrders.js";
import {
  initializeWhales,
  updateWhaleInfluence,
} from "../systems/whaleSystem.js";
import {
  initializeBondMarket,
  processBondsForDay,
  refreshBondMarket,
} from "../systems/bondSystem.js";
import { processLocalIncomeStreams } from "../systems/localIncomeSystem.js";
import {
  bankruptCompany,
  processStockLifecycle,
  recordLifecycleEvent,
  spawnIPO,
  splitCompany,
} from "../systems/lifecycleSystem.js";
import { aggregateLegacyBuffEffects, mergeEffectDescriptors, pickLegacyBuff } from "../systems/legacyBuffSystem.js";
import { campaignLibrary, findCampaign } from "../content/campaigns.js";
import { findChallengeMode } from "../content/challengeModes.js";
import {
  createStoryRunnerState,
  triggerStoryScenes,
  buildSceneEvents,
  createStoryContextSnapshot,
  type StoryRunnerState,
  type StorySceneEvent,
} from "../../story/story-runner.js";
import { StoryTrigger } from "../../story/story-flow.js";
import { updateWhaleCapital } from "../systems/whaleCapitalSystem.js";
import { emitMarketNews as enqueueMarketNews } from "../news/news-runner.js";
import type { MarketNewsItem } from "../core/state.js";
import {
  applyWhaleBuyout,
  applyWhaleCollapseIfNeeded,
} from "../whales/whale-defeat.js";
import { applyStorySceneEffects } from "../../story/story-effects.js";
import { pickRandomMiniGameEvent } from "../minigames/eventLibrary.js";

const ARTIFACT_UNLOCK_TIERS = [
  { value: 5_000, artifactId: "neon_compass" },
  { value: 15_000, artifactId: "rumor_network" },
  { value: 40_000, artifactId: "solar_mirrors" },
];

const ARTIFACT_REWARD_DAYS = [5, 10, 20];

const ERA_MUTATIONS: Record<string, string[]> = {
  "tech-boom": ["regulatory-crackdown", "inflation-scare"],
  "bubble-euphoria": ["volatility-storm", "earnings-season"],
  "energy-crisis": ["liquidity-crunch", "housing-bust"],
  "recovery": ["optimism-cycle", "regulatory-crackdown"],
  "optimism-cycle": ["bubble-euphoria"],
  "fear-cycle": ["liquidity-crunch"],
};

const MINI_GAME_BASE_CHANCE = 0.08;
const MINI_GAME_MAX_CHANCE = 0.18;
const MINI_GAME_LEVEL_BONUS = 0.005;

export interface GameRunnerOptions {
  seed?: number;
  metaState?: MetaProfile;
  difficultyOverride?: DifficultyMode["id"];
  campaignId?: string;
  challengeId?: string;
  onMetaUpdate?: (meta: MetaProfile) => void;
  onSave?: (state: GameState) => void;
}

export class GameRunner {
  readonly state: GameState;
  private readonly rng: RNG;
  private difficulty: DifficultyMode;
  private finalised = false;
  private readonly onMetaUpdate?: (meta: MetaProfile) => void;
  metaState: MetaProfile;
  private readonly onSave?: (state: GameState) => void;
  private readonly campaignId: string | null;
  private readonly challengeId: string | null;
  private readonly artifactRewardMilestones = new Set<number>();
  private readonly rewardChoiceCount = 3;
  private startingArtifactGranted = false;
  private storyRunner: StoryRunnerState;

  constructor(options: GameRunnerOptions = {}) {
    this.metaState = options.metaState ?? defaultMetaState;
    const fallbackCampaignId =
      this.metaState.activeCampaignId ?? campaignLibrary[0]?.id ?? null;
    const desiredCampaignId = options.campaignId ?? fallbackCampaignId;
    const campaignDef = desiredCampaignId ? findCampaign(desiredCampaignId) : undefined;
    this.campaignId = campaignDef?.id ?? null;
    this.metaState = setActiveCampaign(this.metaState, this.campaignId);

    const fallbackChallengeId = this.metaState.activeChallengeId ?? null;
    const desiredChallengeId = options.challengeId ?? fallbackChallengeId;
    const challengeDef = desiredChallengeId ? findChallengeMode(desiredChallengeId) : undefined;
    this.challengeId = challengeDef?.id ?? null;
    this.metaState = setActiveChallenge(this.metaState, this.challengeId);

    const runSeed = options.seed ?? challengeDef?.seed ?? Date.now();
    this.rng = createSeededRng(runSeed);
    if (options.difficultyOverride) {
      this.metaState = setDifficulty(this.metaState, options.difficultyOverride);
    }
    this.difficulty = getDifficultyMode(this.metaState.difficulty);
    this.onMetaUpdate = options.onMetaUpdate;
    this.onSave = options.onSave;
    this.state = createInitialState(runSeed, this.rng, {
      difficulty: this.difficulty,
    });

    initializeWhales(this.state, this.rng);
    this.storyRunner = createStoryRunnerState(this.state);
    initializeBondMarket(this.state, this.rng);

    this.applyCampaignModifiers();
    this.applyChallengeModifiers();

    this.grantStartingLevelArtifact();
    const initialEffects = this.refreshArtifactEffects();
    this.applyStartingCashBonus(initialEffects);

    if (this.state.eras.length > 0) {
      this.state.eras[0].revealed = true;
    }

    this.updateNextEraPrediction();
    this.emitStoryCutscenes("start");

    saveRun(this.state);
    saveMeta(this.metaState);
  }

  step(days = 1): void {
    for (let i = 0; i < days; i += 1) {
      if (this.state.runOver && this.finalised) break;

      this.runDay();

      if (this.state.pendingChoice) {
        break;
      }

      if (this.state.pendingArtifactReward) {
        break;
      }

      if (this.state.runOver) {
        break;
      }
    }
  }

  private runDay(): void {
    if (this.state.runOver) return;
    this.state.whaleDefeatedThisTick = false;

    this.maybeMutateCurrentEra();
    updateWhaleInfluence(this.state, this.rng, this.metaState);
    this.emitStoryCutscenes("whale");

    const era = this.state.eras[this.state.currentEraIndex];
    const eventMultiplier = era?.effects?.eventFrequencyMultiplier ?? 1;
    const weightedChance = this.state.eventChance * eventMultiplier;
    const events = runDailyEvents(
      this.state,
      this.rng,
      weightedChance,
      era?.eventWeights
    );

    if (this.state.pendingChoice) {
      return;
    }

    this.completeDay(events);
  }

  resolveChoice(accept: boolean): void {
    if (!this.state.pendingChoice) return;
    this.state.pendingChoice.choiceAccepted = accept;
    this.state.pendingChoice = null;
    this.completeDay(this.state.eventsToday);
  }

  private completeDay(events: GameEvent[]): void {
    updatePrices(this.state, events, this.rng);
    updateWhaleCapital(this.state);
    processStockLifecycle(this.state, this.rng);
    processWatchOrdersForDay(this.state);
    processBondsForDay(this.state, this.rng);
    processLocalIncomeStreams(this.state, this.rng);
    applyWhaleCollapseIfNeeded(this.state);
    if (this.state.whaleCollapsedThisTick) {
      this.emitStoryCutscenes("whale");
      this.state.whaleCollapsedThisTick = false;
    }
    const eraTransition = advanceEraProgress(this.state, this.rng, this.difficulty);
    if (eraTransition.eraChanged) {
      this.handleEraTransition(eraTransition.deckReset);
      this.emitStoryCutscenes("era");
    }
    this.recordDailyStats();
    this.emitStoryCutscenes("portfolio");
    this.emitMarketNews();
    this.emitStoryCutscenes("day");
    this.state.day += 1;
    this.checkArtifactUnlocks();
    this.maybeOfferArtifactReward();
    this.maybeSpawnMiniGameEvent();
    saveRun(this.state);
    this.onSave?.(this.state);
    this.state.whaleDefeatMode = null;
    this.state.whaleCollapseReason = null;

    if (this.state.runOver) {
      this.emitStoryCutscenes("final");
    }

    if (this.state.runOver && !this.finalised) {
      this.finalizeRun();
    }
  }

  public triggerWhalePulse(): void {
    if (this.state.runOver) return;
    updateWhaleInfluence(this.state, this.rng, this.metaState);
    this.emitStoryCutscenes("whale");
    saveRun(this.state);
    this.onSave?.(this.state);
  }

  public attemptWhaleBuyout(): boolean {
    if (this.state.runOver) return false;
    const success = applyWhaleBuyout(this.state);
    if (!success) {
      return false;
    }
    this.emitStoryCutscenes("whale");
    saveRun(this.state);
    this.onSave?.(this.state);
    return true;
  }

  public forceEraMutation(): void {
    if (this.state.runOver) return;
    const mutated = this.mutateCurrentEra();
    if (!mutated) return;
    this.updateNextEraPrediction();
    saveRun(this.state);
    this.onSave?.(this.state);
  }

  public revealAllWhales(): void {
    if (this.state.runOver) return;
    let message = "Analyst reveals hidden whales.";
    for (const whale of this.state.activeWhales) {
      whale.visible = true;
    }
    this.state.whaleActionLog.push(message);
    if (this.state.whaleActionLog.length > CONFIG.WHALE_LOG_LIMIT) {
      this.state.whaleActionLog.splice(
        0,
        this.state.whaleActionLog.length - CONFIG.WHALE_LOG_LIMIT
      );
    }
    saveRun(this.state);
    this.onSave?.(this.state);
  }

  public triggerLifecycleIPO(): void {
    if (this.state.runOver) return;
    spawnIPO(this.state, this.rng, "developer trigger");
    this.logDevAction("Dev forced an IPO listing.");
    saveRun(this.state);
    this.onSave?.(this.state);
  }

  public triggerLifecycleSplit(): void {
    if (this.state.runOver) return;
    const activeCompanies = this.state.companies.filter((company) => company.isActive);
    if (activeCompanies.length === 0) {
      this.logDevAction("No active companies to split.");
      return;
    }
    activeCompanies.sort((a, b) => b.price - a.price);
    const target = activeCompanies[0];
    const ratios = CONFIG.SPLIT_RATIO_OPTIONS;
    const ratio =
      ratios[Math.floor(this.rng.next() * ratios.length)] ?? ratios[0] ?? 2;
    const success = splitCompany(this.state, target, ratio, { force: true });
    this.logDevAction(
      success
        ? `Dev forced a ${ratio}-for-1 split for ${target.ticker}.`
        : `Split not applied for ${target.ticker}.`
    );
    saveRun(this.state);
    this.onSave?.(this.state);
  }

  public triggerLifecycleBankruptcy(): void {
    if (this.state.runOver) return;
    const activeCompanies = this.state.companies.filter((company) => company.isActive);
    if (activeCompanies.length === 0) {
      this.logDevAction("No active companies to bankrupt.");
      return;
    }
    const target = activeCompanies.reduce((previous, current) =>
      current.price < previous.price ? current : previous
    );
    const success = bankruptCompany(this.state, target, "developer trigger");
    this.logDevAction(
      success
        ? `Dev triggered bankruptcy for ${target.ticker}.`
        : `Bankruptcy not applied for ${target.ticker}.`
    );
    saveRun(this.state);
    this.onSave?.(this.state);
  }

  public awardMetaXp(amount: number): void {
    if (this.state.runOver) return;
    this.metaState = awardXp(this.metaState, amount);
    saveMeta(this.metaState);
    this.notifyMetaChange();
    this.logDevAction(`Injected ${amount} XP.`);
  }

  public resetMetaXp(): void {
    if (this.state.runOver) return;
    this.metaState = resetXp(this.metaState);
    this.refreshArtifactEffects();
    saveMeta(this.metaState);
    this.notifyMetaChange();
    this.logDevAction("Meta XP reset to 0.");
  }

  public grantRandomArtifact(): void {
    if (this.state.runOver) return;
    const options = this.selectArtifactRewardOptions(1);
    if (options.length === 0) {
      this.logDevAction("No artifacts left to grant.");
      return;
    }
    this.addArtifactToRun(options[0]);
    this.logDevAction(`Granted artifact ${options[0]}.`);
  }

  public triggerArtifactRewardNow(): void {
    if (this.state.runOver) return;
    this.maybeOfferArtifactReward();
    saveRun(this.state);
    this.onSave?.(this.state);
    if (this.state.pendingArtifactReward) {
      this.logDevAction("Artifact reward offered.");
    } else {
      this.logDevAction("No artifact reward slots remaining.");
    }
  }

  private recordDailyStats(): void {
    const stats = this.state.runStats;
    const currentValue = this.getPortfolioValue();
    const dailyGain = currentValue - stats.previousPortfolioValue;
    this.state.runStats = {
      ...stats,
      peakPortfolioValue: Math.max(stats.peakPortfolioValue, currentValue),
      bestSingleDayGain: Math.max(stats.bestSingleDayGain, dailyGain),
      previousPortfolioValue: currentValue,
    };
  }

  private checkArtifactUnlocks(): void {
    const value = this.getPortfolioValue();

    for (const tier of ARTIFACT_UNLOCK_TIERS) {
      if (value < tier.value) continue;
      const alreadyUnlocked = this.metaState.artifacts.some(
        (artifact) => artifact.id === tier.artifactId && artifact.unlocked
      );
      if (alreadyUnlocked) continue;

      this.metaState = progressArtifact(this.metaState, tier.artifactId);
      saveMeta(this.metaState);
      this.notifyMetaChange();
    }
  }

  private finalizeRun(): void {
    this.finalised = true;
    const value = this.getPortfolioValue();
    const xpGain = Math.floor(value / 100);
    const runStats = {
      finalPortfolioValue: value,
      peakPortfolioValue: this.state.runStats.peakPortfolioValue,
      bestSingleDayGain: this.state.runStats.bestSingleDayGain,
      difficultyRating: getDifficultyRating(this.difficulty.id),
    };
    this.metaState = recordRunOutcome(this.metaState, xpGain, runStats);
    if (this.state.campaignId) {
      this.metaState = recordCampaignRun(
        this.metaState,
        this.state.campaignId,
        value
      );
    }
    if (this.state.challengeId) {
      this.metaState = recordChallengeScore(
        this.metaState,
        this.state.challengeId,
        value
      );
    }
    saveMeta(this.metaState);
    this.notifyMetaChange();
    this.prepareCarryChoices();
  }

  private notifyMetaChange(): void {
    if (this.onMetaUpdate) {
      this.onMetaUpdate(this.metaState);
    }
  }

  private logDevAction(message: string): void {
    this.state.devActionLog.push(message);
    if (this.state.devActionLog.length > 12) {
      this.state.devActionLog.shift();
    }
  }

  public consumeStoryScenes(): StorySceneEvent[] {
    const scenes = [...this.state.storySceneQueue];
    this.state.storySceneQueue = [];
    return scenes;
  }

  public consumeMarketNews(): MarketNewsItem[] {
    const items = [...this.state.newsQueue];
    this.state.newsQueue = [];
    return items;
  }

  private emitStoryCutscenes(trigger: StoryTrigger): void {
    const extras = {
      level: this.metaState.level,
      xp: this.metaState.xp,
    };
    const scenes = triggerStoryScenes(
      this.storyRunner,
      this.state,
      trigger,
      extras
    );
    if (scenes.length === 0) return;

    applyStorySceneEffects(this.state, scenes);

    const contextSnapshot = createStoryContextSnapshot(this.storyRunner);
    const events = buildSceneEvents(scenes, this.state.day, contextSnapshot);
    this.state.storySceneQueue.push(...events);

    for (const scene of scenes) {
      this.state.storyEventLog.push(`${scene.actId}:${scene.id}`);
      if (this.state.storyEventLog.length > CONFIG.STORY_LOG_LIMIT) {
        this.state.storyEventLog.shift();
      }
    }
  }

  private emitMarketNews(): MarketNewsItem[] {
    const items = enqueueMarketNews(this.state);
    this.state.recentNews = items;
    this.state.newsDecisionUsed = false;
    return items;
  }

  private getLevelArtifactDescriptor(): ArtifactEffectDescriptor {
    const { level } = this.metaState;
    const descriptor: ArtifactEffectDescriptor = {};
    if (level >= 1) {
      descriptor.startingCashBonus = 0.05;
    }
    if (level >= 2) {
      descriptor.triggerSlotBonus = 1;
    }
    if (level >= 4) {
      descriptor.predictionBonus = 0.1;
    }
    return descriptor;
  }

  private refreshArtifactEffects(): ArtifactEffects {
    const levelExtras = this.getLevelArtifactDescriptor();
    const legacyExtras = aggregateLegacyBuffEffects(this.metaState.legacyBuffs);
    const combinedExtras = { ...levelExtras };
    mergeEffectDescriptors(combinedExtras, legacyExtras);
    const effects = aggregateArtifactEffects(
      this.state.activeArtifacts,
      combinedExtras
    );
    applyArtifactsToState(this.state, effects);
    return effects;
  }

  private applyStartingCashBonus(effects: ArtifactEffects): void {
    const boostedCash = this.state.baseStartingCash * (1 + effects.startingCashBonus);
    this.state.portfolio.cash = Number(boostedCash.toFixed(2));
  }

  private addArtifactToRun(artifactId: string): void {
    if (this.state.activeArtifacts.includes(artifactId)) return;
    if (!findArtifactDefinition(artifactId)) return;
    this.state.activeArtifacts.push(artifactId);
    this.refreshArtifactEffects();
    saveRun(this.state);
    this.onSave?.(this.state);
  }

  private grantStartingLevelArtifact(): void {
    if (this.startingArtifactGranted || this.metaState.level < 3) {
      return;
    }
    const eligible = artifactLibrary.filter(
      (artifact) =>
        artifact.rarity === "common" &&
        !this.state.activeArtifacts.includes(artifact.id)
    );
    if (eligible.length === 0) {
      return;
    }
    const index = Math.floor(this.rng.next() * eligible.length);
    const chosen = eligible[index];
    this.startingArtifactGranted = true;
    this.addArtifactToRun(chosen.id);
  }

  private selectArtifactRewardOptions(count: number): string[] {
    const pool = artifactLibrary.filter(
      (artifact) => !this.state.activeArtifacts.includes(artifact.id)
    );
    const picks: string[] = [];
    const poolCopy = [...pool];
    while (picks.length < count && poolCopy.length > 0) {
      const index = Math.floor(this.rng.next() * poolCopy.length);
      picks.push(poolCopy[index].id);
      poolCopy.splice(index, 1);
    }
    return picks;
  }

  private maybeOfferArtifactReward(): void {
    if (this.state.pendingArtifactReward) return;
    const completedDay = Math.max(1, this.state.day - 1);
    if (!ARTIFACT_REWARD_DAYS.includes(completedDay)) {
      return;
    }
    if (this.artifactRewardMilestones.has(completedDay)) {
      return;
    }
    const options = this.selectArtifactRewardOptions(this.rewardChoiceCount);
    if (options.length === 0) return;
    this.state.pendingArtifactReward = options;
    this.artifactRewardMilestones.add(completedDay);
    this.state.artifactRewardHistory.push(completedDay);
  }

  private maybeSpawnMiniGameEvent(): void {
    if (this.state.pendingMiniGame) return;
    if (this.state.pendingChoice || this.state.pendingArtifactReward) return;
    const currentDay = this.state.day;
    if (currentDay <= this.state.lastMiniGameDay) return;
    const chance =
      Math.min(
        MINI_GAME_MAX_CHANCE,
        MINI_GAME_BASE_CHANCE + this.metaState.level * MINI_GAME_LEVEL_BONUS
      );
    if (this.rng.next() >= chance) {
      return;
    }
    const event = pickRandomMiniGameEvent(() => this.rng.next());
    this.state.pendingMiniGame = event;
    this.state.lastMiniGameDay = currentDay;
    recordLifecycleEvent(
      this.state,
      `Side hustle drops: ${event.title}. ${event.story}`
    );
  }

  public claimArtifactReward(artifactId: string): void {
    if (!this.state.pendingArtifactReward?.includes(artifactId)) return;
    this.state.pendingArtifactReward = null;
    this.addArtifactToRun(artifactId);
  }

  public dismissArtifactReward(): void {
    if (!this.state.pendingArtifactReward) return;
    this.state.pendingArtifactReward = null;
    saveRun(this.state);
    this.onSave?.(this.state);
  }

  private prepareCarryChoices(): void {
    if (this.state.pendingCarryChoices) return;
    const options: CarryOption[] = [];
    const artifactId = this.state.activeArtifacts[0];
    if (artifactId) {
      const artifact = findArtifactDefinition(artifactId);
      options.push({
        id: "keep-artifact",
        label: "Keep artifact",
        description: `Unlock ${artifact?.name ?? "an artifact"} permanently.`,
        payload: artifactId,
      });
    }
    const buffId = pickLegacyBuff(this.metaState.legacyBuffs, this.rng);
    if (buffId) {
      options.push({
        id: "legacy-buff",
        label: "Carry legacy buff",
        description: `Keep legacy buff ${buffId} for future runs.`,
        payload: buffId,
      });
    }
    const nextCampaign = campaignLibrary.find(
      (campaign) => !this.metaState.unlockedCampaigns.includes(campaign.id)
    );
    if (nextCampaign) {
      options.push({
        id: "unlock-campaign",
        label: "Unlock campaign",
        description: `Add ${nextCampaign.name} to your campaign roster.`,
        payload: nextCampaign.id,
      });
    }
    this.state.pendingCarryChoices = options.length > 0 ? options : null;
  }

  public claimCarryOption(optionId: string): void {
    const options = this.state.pendingCarryChoices;
    if (!options) return;
    const option = options.find((entry) => entry.id === optionId);
    if (!option) return;
    this.state.pendingCarryChoices = null;
    this.applyCarryChoice(option);
    this.state.carryHistory.push(option.label);
    if (this.state.carryHistory.length > 10) {
      this.state.carryHistory.shift();
    }
    saveRun(this.state);
    this.onSave?.(this.state);
  }

  private applyCarryChoice(option: CarryOption): void {
    switch (option.id) {
      case "keep-artifact":
        if (!option.payload) return;
        this.metaState = progressArtifact(this.metaState, option.payload);
        this.logDevAction(`Carry chose artifact ${option.payload}.`);
        break;
      case "legacy-buff":
        if (!option.payload) return;
        this.metaState = addLegacyBuff(this.metaState, option.payload);
        this.logDevAction(`Carry gained legacy buff ${option.payload}.`);
        break;
      case "unlock-campaign":
        if (!option.payload) return;
        this.metaState = unlockCampaign(this.metaState, option.payload);
        this.logDevAction(`Carry unlocked campaign ${option.payload}.`);
        break;
      default:
        return;
    }
    saveMeta(this.metaState);
    this.notifyMetaChange();
    this.refreshArtifactEffects();
  }

  private applyCampaignModifiers(): void {
    if (!this.campaignId) return;
    const campaign = findCampaign(this.campaignId);
    if (!campaign) return;
    this.state.campaignId = campaign.id;
    this.state.campaignObjective = campaign.objective;
    const progress = this.metaState.campaignProgress[campaign.id];
    this.state.campaignRunIndex = (progress?.runs ?? 0) + 1;

    const { startingCashMult, volatilityMultiplier, watchOrderLimitBonus } =
      campaign.modifiers;
    if (startingCashMult && startingCashMult > 0) {
      this.state.baseStartingCash *= startingCashMult;
      this.state.portfolio.cash = Number(
        (this.state.portfolio.cash * startingCashMult).toFixed(2)
      );
      this.state.baseMarginLimit = this.state.baseStartingCash * 0.25;
    }

    if (volatilityMultiplier && volatilityMultiplier > 0) {
      this.state.baseVolatilityMultiplier *= volatilityMultiplier;
    }

    if (watchOrderLimitBonus) {
      this.state.baseWatchOrderLimit += watchOrderLimitBonus;
    }
  }

  private applyChallengeModifiers(): void {
    if (!this.challengeId) return;
    const challenge = findChallengeMode(this.challengeId);
    if (!challenge) return;
    this.state.challengeId = challenge.id;
    if (challenge.modifiers.volatilityMultiplier) {
      this.state.baseVolatilityMultiplier *= challenge.modifiers.volatilityMultiplier;
    }
    if (challenge.modifiers.eventChanceBonus) {
      this.state.baseEventChance *= 1 + challenge.modifiers.eventChanceBonus;
    }
  }

  private handleEraTransition(deckReset: boolean): void {
    if (deckReset) {
      this.refreshArtifactEffects();
      const cycleBonus = 1 + CONFIG.ENDLESS_VOLATILITY_BONUS * this.state.eraDeckCycle;
      this.state.volatilityMultiplier = Math.max(
        0,
        this.state.volatilityMultiplier * cycleBonus
      );
      const eventMultiplier = 1 + CONFIG.ENDLESS_EVENT_BONUS * this.state.eraDeckCycle;
      this.state.eventChance = Math.min(1, this.state.eventChance * eventMultiplier);
    }
    refreshBondMarket(this.state, this.rng);
    this.updateNextEraPrediction();
  }

  private getPredictionAccuracy(): number {
    const base = CONFIG.ERA_PREDICTION_BASE_ACCURACY;
    const artifactBonus = this.state.artifactEffects.predictionBonus ?? 0;
    const metaBonus = this.metaState.unlockedEraPredictionLevel * CONFIG.ERA_PREDICTION_LEVEL_BONUS;
    return Math.min(
      CONFIG.ERA_PREDICTION_MAX_ACCURACY,
      base + artifactBonus + metaBonus
    );
  }

  private updateNextEraPrediction(): void {
    const nextEra = this.state.eras[this.state.currentEraIndex + 1];
    this.state.actualNextEraId = nextEra?.id ?? null;
    if (!nextEra) {
      this.state.predictedNextEraId = null;
      this.state.predictionConfidence = 0;
      this.state.predictionWasAccurate = true;
      return;
    }
    const accuracy = this.getPredictionAccuracy();
    this.state.predictionConfidence = accuracy;
    const accurate = this.rng.next() < accuracy;
    if (accurate) {
      this.state.predictedNextEraId = nextEra.id;
      this.state.predictionWasAccurate = true;
      return;
    }
    const alternatives = this.state.eras.filter(
      (era) => era.id !== nextEra.id && era.rarity === nextEra.rarity
    );
    if (alternatives.length > 0) {
      const index = Math.floor(this.rng.next() * alternatives.length);
      this.state.predictedNextEraId = alternatives[index].id;
    } else {
      this.state.predictedNextEraId = nextEra.id;
    }
    this.state.predictionWasAccurate = false;
  }

  private mutateCurrentEra(): boolean {
    const currentEra = getCurrentEra(this.state);
    const options = ERA_MUTATIONS[currentEra.id];
    if (!options?.length) {
      return false;
    }
    const targetId = options[Math.floor(this.rng.next() * options.length)];
    const template = findEraTemplate(targetId);
    if (!template) {
      return false;
    }
    const mutatedEra = createEraFromTemplate(template, this.rng);
    this.state.eras[this.state.currentEraIndex] = {
      ...mutatedEra,
      revealed: true,
      mutatedFromId: currentEra.id,
    };
    this.state.currentEraMutated = true;
    this.state.mutationMessage = `Era unexpectedly shifted to ${mutatedEra.name}.`;
    return true;
  }

  private maybeMutateCurrentEra(): void {
    if (this.state.currentEraMutated) {
      return;
    }
    const base = CONFIG.ERA_MUTATION_BASE_CHANCE;
    const chance = Math.min(
      0.5,
      base + this.state.eraDeckCycle * CONFIG.ERA_MUTATION_CYCLE_BONUS
    );
    if (this.rng.next() < chance && this.mutateCurrentEra()) {
      this.updateNextEraPrediction();
    }
  }

  currentEraName(): string {
    return getCurrentEra(this.state)?.name ?? "Unknown";
  }

  getPortfolioValue(): number {
    return portfolioValue(this.state);
  }

  summary(): string {
    const totalDays =
      this.state.totalDays === Number.MAX_SAFE_INTEGER ? "∞" : this.state.totalDays;
    return `${this.state.day}/${totalDays} · ${this.currentEraName()} · ${this.getPortfolioValue().toFixed(
      2
    )} cash`;
  }
}
