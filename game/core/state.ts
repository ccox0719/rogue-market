import type { RNG } from "./rng.js";
import { createSeededRng } from "./rng.js";
import { CONFIG, getDifficultyMode, type DifficultyMode } from "./config.js";
import { aggregateArtifactEffects, type ArtifactEffects } from "./artifactEffects.js";
import type { Company } from "../generators/companyGen.js";
import { generateCompany } from "../generators/companyGen.js";
import type { Era } from "../generators/eraGen.js";
import { generateEraDeck } from "../generators/eraGen.js";
import type { Sector } from "../generators/sectorGen.js";
import { generateSectors } from "../generators/sectorGen.js";
import type { GameEvent } from "../generators/eventGen.js";
import type { IntradayRange } from "./intraday.js";
import { type BondHolding, type BondMarketListing } from "../generators/bondGen.js";
import type { WhaleInstance } from "../generators/whaleGen.js";

export interface PlayerPortfolio {
  cash: number;
  holdings: Record<string, number>;
  debt: number;
  marginLimit: number;
}

export interface RunStats {
  peakPortfolioValue: number;
  bestSingleDayGain: number;
  previousPortfolioValue: number;
}

export type WatchOrderType = "limit-buy" | "limit-sell" | "stop-loss";
export type WatchOrderTimeInForce = "day" | "good-till-run";

export interface WatchOrder {
  id: string;
  companyId: string;
  type: WatchOrderType;
  triggerPrice: number;
  maxCashToSpend?: number;
  sharesToSell?: number;
  timeInForce: WatchOrderTimeInForce;
  createdDay: number;
}

export interface CarryOption {
  id: string;
  label: string;
  description: string;
  payload?: string;
}

export interface GameState {
  day: number;
  totalDays: number;
  companies: Company[];
  eras: Era[];
  sectors: Sector[];
  currentEraIndex: number;
  currentEraDay: number;
  portfolio: PlayerPortfolio;
  discoveredTools: string[];
  eventsToday: GameEvent[];
  runOver: boolean;
  seed: number;
  eventChance: number;
  volatilityMultiplier: number;
  difficultyId: DifficultyMode["id"];
  difficultyLabel: string;
  artifactEffects: ArtifactEffects;
  pendingChoice: GameEvent | null;
  watchOrders: WatchOrder[];
  runStats: RunStats;
  activeArtifacts: string[];
  pendingArtifactReward: string[] | null;
  artifactRewardHistory: number[];
  watchOrderLimit: number;
  baseStartingCash: number;
  baseEventChance: number;
  baseVolatilityMultiplier: number;
  baseMarginLimit: number;
  baseWatchOrderLimit: number;
  predictedNextEraId: string | null;
  actualNextEraId: string | null;
  predictionConfidence: number;
  predictionWasAccurate: boolean;
  currentEraMutated: boolean;
  mutationMessage: string;
  eraDeckCycle: number;
  activeWhales: WhaleInstance[];
  whaleSectorBonuses: Record<string, number>;
  whaleCompanyBonuses: Record<string, number>;
  whaleActionLog: string[];
  devActionLog: string[];
  bondHoldings: BondHolding[];
  bondMarket: BondMarketListing[];
  bondActionLog: string[];
  lifecycleLog: string[];
  campaignId: string | null;
  campaignObjective: string | null;
  campaignRunIndex: number;
  challengeId: string | null;
  pendingCarryChoices: CarryOption[] | null;
  carryHistory: string[];
}

interface StateOptions {
  difficulty?: DifficultyMode;
}

export const createInitialState = (
  seed?: number,
  providedRng?: RNG,
  options: StateOptions = {}
): GameState => {
  const runSeed = seed ?? Date.now();
  const rng: RNG = providedRng ?? createSeededRng(runSeed);
  const difficulty = options.difficulty ?? getDifficultyMode();
  const sectors = generateSectors();
  const targetCompanyCount = Math.max(CONFIG.COMPANY_COUNT, sectors.length);
  const coreCompanies = sectors.map((sector) =>
    generateCompany(rng, sectors, sector)
  );
  const remainingCompaniesCount = Math.max(0, targetCompanyCount - coreCompanies.length);
  const additionalCompanies = Array.from(
    { length: remainingCompaniesCount },
    () => generateCompany(rng, sectors)
  );
  const companies = [...coreCompanies, ...additionalCompanies];

  const baseCash = CONFIG.START_CASH * difficulty.modifiers.startingCashMultiplier;
  const startingCash = Number(baseCash.toFixed(2));
  const baseEventChance =
    CONFIG.DAILY_EVENT_CHANCE * difficulty.modifiers.eventMultiplier;
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
    whaleSectorBonuses: {},
    whaleCompanyBonuses: {},
    whaleActionLog: [],
    devActionLog: [],
    bondHoldings: [],
    bondMarket: [],
    bondActionLog: [],
    lifecycleLog: [],
    campaignId: null,
    campaignObjective: null,
    campaignRunIndex: 1,
    challengeId: null,
    pendingCarryChoices: null,
    carryHistory: [],
  };
};
