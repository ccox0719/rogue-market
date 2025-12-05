import whales from "../content/whales.js";
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
  icon?: string;
  favoriteSectors: string[];
  triggers?: WhaleTrigger;
  impactModel: WhaleImpactModel;
  revealAtLevel?: number;
  capitalConfig?: {
    startingCapital?: number;
    leverage?: number;
    volatilitySensitivity?: number;
    manipulationImpact?: number;
    backfireFactor?: number;
    sectorWeights?: Record<string, number>;
  };
}

export interface WhaleInstance {
  id: string;
  profileId: string;
  targetSector: string | null;
  targetCompanyId: string | null;
  visible: boolean;
  obsession: string[];
  lastActionDay: number;
  capital: number;
  capitalHistory: number[];
  leverage: number;
  sectorWeights: Record<string, number>;
}

const whaleDefinitions = whales as unknown as WhaleProfile[];

export const whaleLibrary = whaleDefinitions;

export const findWhaleProfile = (id: string): WhaleProfile | undefined =>
  whaleLibrary.find((whale) => whale.id === id);

const resolveSectorWeights = (profileId: string): Record<string, number> => {
  const profile = findWhaleProfile(profileId);
  return profile?.capitalConfig?.sectorWeights
    ? { ...profile.capitalConfig.sectorWeights }
    : {};
};

export const createWhaleInstance = (profileId: string): WhaleInstance => ({
  id: crypto.randomUUID(),
  profileId,
  targetSector: null,
  targetCompanyId: null,
  visible: false,
  obsession: [],
  lastActionDay: 0,
  capital: 0,
  capitalHistory: [],
  leverage: 1,
  sectorWeights: resolveSectorWeights(profileId),
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
