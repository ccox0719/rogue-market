import whales from "../content/whales.json";
import type { RNG } from "../core/rng.js";

export interface WhaleTrigger {
  eras?: string[];
  minDay?: number;
  chance?: number;
}

export interface WhaleImpactModel {
  sectorTrendDelta?: number;
  companyTrendDelta?: number;
}

export interface WhaleProfile {
  id: string;
  displayName: string;
  style: string;
  description: string;
  favoriteSectors: string[];
  triggers?: WhaleTrigger;
  impactModel: WhaleImpactModel;
  revealAtLevel?: number;
}

export interface WhaleInstance {
  id: string;
  profileId: string;
  targetSector: string | null;
  targetCompanyId: string | null;
  visible: boolean;
  obsession: string[];
  lastActionDay: number;
}

const whaleDefinitions = whales as WhaleProfile[];

export const whaleLibrary = whaleDefinitions;

export const findWhaleProfile = (id: string): WhaleProfile | undefined =>
  whaleLibrary.find((whale) => whale.id === id);

export const createWhaleInstance = (profileId: string): WhaleInstance => ({
  id: crypto.randomUUID(),
  profileId,
  targetSector: null,
  targetCompanyId: null,
  visible: false,
  obsession: [],
  lastActionDay: 0,
});

export const pickRandomWhaleProfiles = (
  count: number,
  rng: RNG
): WhaleProfile[] => {
  const pool = [...whaleLibrary];
  const picks: WhaleProfile[] = [];
  while (picks.length < count && pool.length > 0) {
    const index = Math.floor(rng.next() * pool.length);
    picks.push(pool[index]);
    pool.splice(index, 1);
  }
  return picks;
};
