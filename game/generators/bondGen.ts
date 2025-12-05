import type { RNG } from "../core/rng.js";
import bondDefinitions from "../content/bonds.js";

export type BondType = "gov" | "corp" | "junk";

export interface BondDefinition {
  id: string;
  name: string;
  description: string;
  type: BondType;
  couponRate: number;
  durationDays: number;
  faceValue: number;
  defaultChance: number;
}

export interface BondMarketListing {
  id: string;
  bondId: string;
  faceValue: number;
  couponRate: number;
  type: BondType;
  durationDays: number;
}

export interface BondHolding {
  id: string;
  bondId: string;
  units: number;
  faceValue: number;
  couponRate: number;
  daysToMaturity: number;
  type: BondType;
  defaultChance: number;
}

const catalog = bondDefinitions as BondDefinition[];

export const bondCatalog = catalog;

export const findBondDefinition = (id: string): BondDefinition | undefined =>
  catalog.find((entry) => entry.id === id);

const pickRandomDefinitions = (count: number, rng: RNG): BondDefinition[] => {
  const pool = [...catalog];
  const picks: BondDefinition[] = [];
  while (picks.length < count && pool.length > 0) {
    const index = Math.floor(rng.next() * pool.length);
    picks.push(pool[index]);
    pool.splice(index, 1);
  }
  return picks;
};

export const createBondListing = (
  definition: BondDefinition
): BondMarketListing => ({
  id: crypto.randomUUID(),
  bondId: definition.id,
  faceValue: definition.faceValue,
  couponRate: definition.couponRate,
  type: definition.type,
  durationDays: definition.durationDays,
});

export const createBondMarket = (
  rng: RNG,
  count = 4
): BondMarketListing[] => {
  const picks = pickRandomDefinitions(count, rng);
  return picks.map((definition) => createBondListing(definition));
};
