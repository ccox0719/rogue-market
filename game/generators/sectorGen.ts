import type { RNG } from "../core/rng.js";
import sectorsJson from "../content/baseSectors.json";

export interface Sector {
  name: string;
  weight: number;
  correlation: number;
  description?: string;
  branding?: {
    adjectives?: string[];
    nouns?: string[];
  };
}

const weightedPick = (rng: RNG, items: Sector[]): Sector => {
  const totalWeight = items.reduce((sum, candidate) => sum + candidate.weight, 0);
  let threshold = rng.next() * totalWeight;

  for (const candidate of items) {
    threshold -= candidate.weight;
    if (threshold <= 0) {
      return candidate;
    }
  }

  return items[items.length - 1];
};

export const generateSectors = (): Sector[] => [...sectorsJson];

export const pickSector = (rng: RNG, sectors: Sector[]): Sector =>
  weightedPick(rng, sectors);
