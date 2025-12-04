import type { RNG } from "../core/rng.js";
import { CONFIG } from "../core/config.js";
import eraTemplates from "../content/eraTemplates.js";

export type EraRarity = "common" | "uncommon" | "rare";

export interface Era {
  id: string;
  name: string;
  description: string;
  duration: number;
  baseDuration: number;
  effects: {
    global?: number;
    globalTrendBias?: number;
    volatilityMultiplier?: number;
    eventFrequencyMultiplier?: number;
    intradayRangeMultiplier?: number;
    bondYieldMult?: number;
    bondDefaultDelta?: number;
    splitThresholdMultiplier?: number;
    bankruptcySeverity?: number;
    ipoFrequencyMultiplier?: number;
  };
  sectorEffects: Record<string, number>;
  eventWeights: Record<string, number>;
  difficulty?: string;
  revealed: boolean;
  rarity: EraRarity;
  mutatedFromId?: string;
}

interface EraTemplate {
  id: string;
  name: string;
  description: string;
  effects: {
    globalTrendBias?: number;
    global?: number;
    volatilityMultiplier?: number;
    eventFrequencyMultiplier?: number;
    intradayRangeMultiplier?: number;
    bondYieldMult?: number;
    bondDefaultDelta?: number;
    splitThresholdMultiplier?: number;
    bankruptcySeverity?: number;
    ipoFrequencyMultiplier?: number;
  };
  sectorEffects?: Record<string, number>;
  eventWeights?: Record<string, number>;
  difficulty?: string;
  rarity?: EraRarity;
}

const randInt = (rng: RNG, min: number, max: number): number =>
  Math.floor(min + rng.next() * (max - min + 1));

const templates = eraTemplates as unknown as EraTemplate[];

const normalizeEffects = (template: EraTemplate["effects"]) => ({
  global: template.global ?? template.globalTrendBias ?? 0,
  globalTrendBias: template.globalTrendBias,
  volatilityMultiplier: template.volatilityMultiplier,
  eventFrequencyMultiplier: template.eventFrequencyMultiplier,
  intradayRangeMultiplier: template.intradayRangeMultiplier,
  bondYieldMult: template.bondYieldMult ?? 1,
  bondDefaultDelta: template.bondDefaultDelta ?? 0,
  splitThresholdMultiplier: template.splitThresholdMultiplier ?? 1,
  bankruptcySeverity: template.bankruptcySeverity ?? 1,
  ipoFrequencyMultiplier: template.ipoFrequencyMultiplier ?? 1,
});

const RARITY_BASE_WEIGHTS: Record<EraRarity, number> = {
  common: 0.7,
  uncommon: 0.2,
  rare: 0.1,
};

const adjustWeightsForCycle = (cycle: number, base: Record<EraRarity, number>) => {
  const rareBoost = Math.max(0, cycle) * 0.02;
  const weights = {
    common: Math.max(0.1, base.common - rareBoost * 0.4),
    uncommon: Math.max(0.15, base.uncommon - rareBoost * 0.2),
    rare: base.rare + rareBoost,
  };
  return weights;
};

const pickRarity = (rng: RNG, cycle: number) => {
  const weights = adjustWeightsForCycle(cycle, RARITY_BASE_WEIGHTS);
  const total = weights.common + weights.uncommon + weights.rare;
  let roll = rng.next() * total;
  for (const key of (["common", "uncommon", "rare"] as EraRarity[])) {
    roll -= weights[key];
    if (roll <= 0) {
      return key;
    }
  }
  return "rare";
};

const pickTemplateByRarity = (rng: RNG, rarity: EraRarity): EraTemplate => {
  const pool = templates.filter((template) => template.rarity === rarity);
  const candidates = pool.length === 0 ? templates : pool;
  const index = Math.floor(rng.next() * candidates.length);
  return candidates[index];
};

export const createEraFromTemplate = (template: EraTemplate, rng: RNG): Era => {
  const duration = Math.max(
    CONFIG.ERA_DURATION_RANGE[0],
    Math.min(
      CONFIG.ERA_DURATION_RANGE[1],
      randInt(rng, CONFIG.ERA_DURATION_RANGE[0], CONFIG.ERA_DURATION_RANGE[1])
    )
  );

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    duration,
    baseDuration: duration,
    effects: normalizeEffects(template.effects),
    sectorEffects: template.sectorEffects ?? {},
    eventWeights: template.eventWeights ?? {},
    difficulty: template.difficulty,
    revealed: false,
    rarity: template.rarity ?? "common",
  };
};

export const generateEraDeck = (
  rng: RNG,
  options: { cycle?: number } = {}
): Era[] => {
  const count = randInt(rng, CONFIG.ERA_COUNT_RANGE[0], CONFIG.ERA_COUNT_RANGE[1]);
  const deck: Era[] = [];
  const cycle = options.cycle ?? 0;

  for (let i = 0; i < count; i += 1) {
    const rarity = pickRarity(rng, cycle);
    const template = pickTemplateByRarity(rng, rarity);
    deck.push(createEraFromTemplate(template, rng));
  }

  return deck;
};

export const findEraTemplate = (id: string): EraTemplate | undefined =>
  templates.find((entry) => entry.id === id);
