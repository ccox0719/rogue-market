import type { RNG } from "../core/rng.js";
import type { Sector } from "./sectorGen.js";
import eventTemplates from "../content/eventTemplates.json";

export type EventType = "global" | "sector" | "company" | "player_choice";
export type EventRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

const templates = eventTemplates as EventTemplate[];

export interface EventEffects {
  instantShockPctRange?: [number, number];
  companyTrendBiasDelta?: number;
  sectorTrendBiasDelta?: number;
  volatilityMultiplier?: number;
  durationDays?: number;
}

export interface GameEvent {
  id: string;
  description: string;
  impact: number;
  type: EventType;
  rarity: EventRarity;
  sectorAffinity?: string;
  chain?: string;
  choiceAccepted?: boolean;
  effects?: EventEffects;
}

interface EventTemplate {
  id: string;
  name?: string;
  description: string;
  category?: string;
  tags?: string[];
  scope?: EventType;
  type: EventType;
  impact?: number;
  baseWeight?: number;
  rarity: EventRarity;
  chain?: string;
  effects?: EventEffects;
}

const RARITY_WEIGHT: Record<EventRarity, number> = {
  common: 1,
  uncommon: 1.4,
  rare: 1.7,
  epic: 2.2,
  legendary: 3,
};

const randRange = (rng: RNG, min: number, max: number): number =>
  min + (max - min) * rng.next();

const computeTemplateWeight = (
  template: EventTemplate,
  overrides?: Record<string, number>
): number => {
  const rarityBase = RARITY_WEIGHT[template.rarity];
  const baseWeight = template.baseWeight ?? 1;
  const defaultMultiplier = overrides?.default ?? 1;
  const tagMultiplier =
    template.tags?.reduce(
      (acc, tag) => acc * (overrides?.[tag] ?? 1),
      1
    ) ?? 1;
  return rarityBase * baseWeight * defaultMultiplier * tagMultiplier;
};

const pickTemplate = (
  rng: RNG,
  overrides?: Record<string, number>
): EventTemplate => {
  const weights = templates.map((template) =>
    computeTemplateWeight(template, overrides)
  );
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let threshold = rng.next() * totalWeight;

  for (let index = 0; index < templates.length; index += 1) {
    threshold -= weights[index];
    if (threshold <= 0) {
      return templates[index];
    }
  }

  return templates[templates.length - 1];
};

const pickSectorAffinity = (
  rng: RNG,
  sectors: Sector[],
  force = false
): string | undefined => {
  if (sectors.length === 0) {
    return undefined;
  }

  if (!force) {
    const alpha = rng.next();
    if (alpha >= 0.4) {
      return undefined;
    }
  }

  const index = Math.floor(rng.next() * sectors.length);
  return sectors[index].name;
};

const sampleImpact = (rng: RNG, template: EventTemplate): number => {
  const instantRange = template.effects?.instantShockPctRange;
  if (instantRange) {
    return randRange(rng, instantRange[0], instantRange[1]);
  }

  if (typeof template.impact === "number") {
    const jitter = rng.next() * 0.01 - 0.005;
    return template.impact + jitter;
  }

  return 0;
};

export const generateEvent = (
  rng: RNG,
  sectors: Sector[],
  weightOverrides?: Record<string, number>
): GameEvent => {
  const template = pickTemplate(rng, weightOverrides);
  const needsSector = template.type === "sector" || template.type === "company";
  const sectorAffinity = needsSector
    ? pickSectorAffinity(rng, sectors, template.type === "sector")
    : undefined;

  return {
    id: `${template.id}-${Math.floor(rng.next() * 99999)}`,
    description: template.description,
    impact: sampleImpact(rng, template),
    type: template.type,
    rarity: template.rarity,
    sectorAffinity,
    chain: template.chain,
    effects: template.effects,
  };
};
