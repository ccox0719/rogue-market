import type { RNG } from "./rng.js";
import { createSeededRng } from "./rng.js";
import { CONFIG, getDifficultyMode, type DifficultyMode } from "./config.js";
import { computeArtifactEffects, type ArtifactEffects } from "./artifactEffects.js";
import type { Artifact } from "../generators/artifactGen.js";
import { generateArtifactPool } from "../generators/artifactGen.js";
import type { Company } from "../generators/companyGen.js";
import { generateCompany } from "../generators/companyGen.js";
import type { Era } from "../generators/eraGen.js";
import { generateEras } from "../generators/eraGen.js";
import type { Sector } from "../generators/sectorGen.js";
import { generateSectors } from "../generators/sectorGen.js";
import type { GameEvent } from "../generators/eventGen.js";
import type { IntradayRange } from "./intraday.js";

export interface PlayerPortfolio {
  cash: number;
  holdings: Record<string, number>;
  debt: number;
  marginLimit: number;
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
  artifacts: Artifact[];
  seed: number;
  eventChance: number;
  volatilityMultiplier: number;
  difficultyId: DifficultyMode["id"];
  difficultyLabel: string;
  artifactEffects: ArtifactEffects;
  pendingChoice: GameEvent | null;
  watchOrders: WatchOrder[];
}

interface StateOptions {
  difficulty?: DifficultyMode;
  artifactEffects?: ArtifactEffects;
}

export const createInitialState = (
  seed?: number,
  providedRng?: RNG,
  options: StateOptions = {}
): GameState => {
  const runSeed = seed ?? Date.now();
  const rng: RNG = providedRng ?? createSeededRng(runSeed);
  const difficulty = options.difficulty ?? getDifficultyMode();
  const artifactEffects =
    options.artifactEffects ?? computeArtifactEffects(generateArtifactPool());
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
  const startingCash = Number((baseCash * (1 + artifactEffects.startingCashBonus)).toFixed(2));
  const baseEventChance =
    CONFIG.DAILY_EVENT_CHANCE * difficulty.modifiers.eventMultiplier;
  const eventChance = Math.min(1, baseEventChance * (1 + artifactEffects.eventChanceBonus));
  const volatilityMultiplier = difficulty.modifiers.volatilityMultiplier;
  const totalDays = difficulty.special?.noRunOver ? Number.MAX_SAFE_INTEGER : CONFIG.DAYS_PER_RUN;
  const eras = generateEras(rng).map((era) => ({
    ...era,
    duration: Math.max(2, era.duration - artifactEffects.eraDurationReduction),
  }));

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
    artifacts: generateArtifactPool(),
    seed: runSeed,
    eventChance,
    volatilityMultiplier,
    difficultyId: difficulty.id,
    difficultyLabel: difficulty.label,
    artifactEffects,
    pendingChoice: null,
    watchOrders: [],
  };
};
