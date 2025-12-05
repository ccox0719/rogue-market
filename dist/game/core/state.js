import { createSeededRng } from "./rng.js";
import { CONFIG, getDifficultyMode } from "./config.js";
import { aggregateArtifactEffects } from "./artifactEffects.js";
import { generateCompany } from "../generators/companyGen.js";
import { generateEraDeck } from "../generators/eraGen.js";
import { generateSectors } from "../generators/sectorGen.js";
export const createInitialState = (seed, providedRng, options = {}) => {
    const runSeed = seed ?? Date.now();
    const rng = providedRng ?? createSeededRng(runSeed);
    const difficulty = options.difficulty ?? getDifficultyMode();
    const sectors = generateSectors();
    const targetCompanyCount = Math.max(CONFIG.COMPANY_COUNT, sectors.length);
    const coreCompanies = sectors.map((sector) => generateCompany(rng, sectors, sector));
    const remainingCompaniesCount = Math.max(0, targetCompanyCount - coreCompanies.length);
    const additionalCompanies = Array.from({ length: remainingCompaniesCount }, () => generateCompany(rng, sectors));
    const companies = [...coreCompanies, ...additionalCompanies];
    const baseCash = CONFIG.START_CASH * difficulty.modifiers.startingCashMultiplier;
    const startingCash = Number(baseCash.toFixed(2));
    const baseEventChance = CONFIG.DAILY_EVENT_CHANCE * difficulty.modifiers.eventMultiplier;
    const eventChance = baseEventChance;
    const volatilityMultiplier = difficulty.modifiers.volatilityMultiplier;
    const totalDays = difficulty.special?.noRunOver ? Number.MAX_SAFE_INTEGER : CONFIG.DAYS_PER_RUN;
    const eras = generateEraDeck(rng, { cycle: 0 });
    const artifactEffects = aggregateArtifactEffects([]);
    const baseMarginLimit = startingCash * 0.25;
    const baseWatchOrderLimit = CONFIG.BASE_WATCH_ORDER_LIMIT;
    const startingPortfolioValue = startingCash;
    return {
        day: 1,
        totalDays,
        companies,
        eras,
        sectors,
        currentEraIndex: 0,
        currentEraDay: 0,
        portfolio: {
            cash: startingCash,
            holdings: {},
            debt: 0,
            marginLimit: startingCash * 0.25,
        },
        discoveredTools: [],
        eventsToday: [],
        runOver: false,
        seed: runSeed,
        eventChance,
        volatilityMultiplier,
        difficultyId: difficulty.id,
        difficultyLabel: difficulty.label,
        artifactEffects,
        pendingChoice: null,
        watchOrders: [],
        runStats: {
            peakPortfolioValue: startingPortfolioValue,
            bestSingleDayGain: 0,
            previousPortfolioValue: startingPortfolioValue,
        },
        activeArtifacts: [],
        pendingArtifactReward: null,
        artifactRewardHistory: [],
        watchOrderLimit: baseWatchOrderLimit,
        baseStartingCash: startingCash,
        baseEventChance,
        baseVolatilityMultiplier: volatilityMultiplier,
        baseMarginLimit,
        baseWatchOrderLimit,
        predictedNextEraId: eras[1]?.id ?? null,
        actualNextEraId: eras[1]?.id ?? null,
        predictionConfidence: 0,
        predictionWasAccurate: true,
        currentEraMutated: false,
        mutationMessage: "",
        eraDeckCycle: 0,
        activeWhales: [],
        defeatedWhales: [],
        whaleSectorBonuses: {},
        whaleCompanyBonuses: {},
        whaleActionLog: [],
        storyEventLog: [],
        storySceneQueue: [],
        devActionLog: [],
        newsEventLog: [],
        newsQueue: [],
        recentNews: [],
        whaleDialogueQueue: [],
        bondHoldings: [],
        bondMarket: [],
        bondActionLog: [],
        lifecycleLog: [],
        campaignId: null,
        campaignObjective: null,
        campaignRunIndex: 1,
        challengeId: null,
        pendingCarryChoices: null,
        pendingMiniGame: null,
        lastMiniGameDay: 0,
        carryHistory: [],
        lastWhaleDefeatedId: null,
        lastWhaleDefeatedDay: 0,
        whaleDefeatedThisTick: false,
        storyBoonUsed: false,
        newsDecisionUsed: false,
        regulatorShots: 0,
        mediaCampaigns: 0,
        whaleDefeatMode: null,
        whaleCollapseReason: null,
        whaleCollapsedThisTick: false,
    };
};
