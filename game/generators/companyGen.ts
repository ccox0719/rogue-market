import { CONFIG } from "../core/config.js";
import type { RNG } from "../core/rng.js";
import { generateName, generateTicker } from "./nameGen.js";
import type { Sector } from "./sectorGen.js";
import { pickSector } from "./sectorGen.js";
import type { IntradayRange } from "../core/intraday.js";

export interface Company {
  id: string;
  name: string;
  ticker: string;
  sector: string;
  price: number;
  history: number[];
  volatility: number;
  trendBias: number;
  randomness: number;
  eventAffinity: Record<string, number>;
  correlations: string[];
  todayRange: IntradayRange;
  isActive: boolean;
  splitReferencePrice: number;
  splitCount: number;
  daysBelowBankruptcyThreshold: number;
  daysSinceListing: number;
  reactiveDetails?: import("../whales/reactiveMicrocapTypes.js").ReactiveMicrocapDetails;
}

const randRange = (rng: RNG, min: number, max: number): number =>
  min + (max - min) * rng.next();

const buildAffinities = (rng: RNG, sectors: Sector[]): Record<string, number> => {
  const affinities: Record<string, number> = {};

  for (const sector of sectors) {
    affinities[sector.name] = rng.next() * 2 - 1;
  }

  return affinities;
};

const pickCorrelations = (rng: RNG, sectors: Sector[], primary: string): string[] => {
  const others = sectors.map((sector) => sector.name).filter((name) => name !== primary);
  const shuffled = [...others].sort(() => rng.next() - 0.5);
  return shuffled.slice(0, 2);
};

const buildInitialRange = (price: number): IntradayRange => ({
  open: price,
  high: price,
  low: price,
  close: price,
  generated: true,
});

export const generateCompany = (
  rng: RNG,
  sectors: Sector[],
  forcedSector?: Sector
): Company => {
  const primarySector = forcedSector ?? pickSector(rng, sectors);
  const name = generateName(rng, primarySector.branding, primarySector.name);
  const ticker = generateTicker(rng);
  const price = Number(randRange(rng, ...CONFIG.STARTING_PRICE_RANGE).toFixed(2));

  return {
    id: crypto.randomUUID(),
    name,
    ticker,
    sector: primarySector.name,
    price,
    history: [price],
    volatility: Number(randRange(rng, ...CONFIG.VOLATILITY_RANGE).toFixed(3)),
    trendBias: Number(randRange(rng, ...CONFIG.TREND_BIAS_RANGE).toFixed(4)),
    randomness: Number(randRange(rng, ...CONFIG.RANDOMNESS_RANGE).toFixed(3)),
    eventAffinity: buildAffinities(rng, sectors),
    correlations: pickCorrelations(rng, sectors, primarySector.name),
    todayRange: buildInitialRange(price),
    isActive: true,
    splitReferencePrice: price,
    splitCount: 0,
    daysBelowBankruptcyThreshold: 0,
    daysSinceListing: 0,
  };
};
