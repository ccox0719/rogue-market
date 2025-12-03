import type { RNG } from "../core/rng.js";
import { CONFIG } from "../core/config.js";
import eraTemplates from "../content/eraTemplates.json";

export interface Era {
  id: string;
  name: string;
  description: string;
  duration: number;
  effects: {
    global?: number;
    globalTrendBias?: number;
    volatilityMultiplier?: number;
    eventFrequencyMultiplier?: number;
    intradayRangeMultiplier?: number;
  };
  sectorEffects: Record<string, number>;
  eventWeights: Record<string, number>;
  difficulty?: string;
  revealed: boolean;
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
  };
  sectorEffects?: Record<string, number>;
  eventWeights?: Record<string, number>;
  difficulty?: string;
}

const randInt = (rng: RNG, min: number, max: number): number =>
  Math.floor(min + rng.next() * (max - min + 1));

const pickRandomEraTemplate = (rng: RNG, templates: EraTemplate[]): EraTemplate =>
  templates[Math.floor(rng.next() * templates.length)];

const normalizeEffects = (template: EraTemplate["effects"]) => ({
  ...template,
  global: template.global ?? template.globalTrendBias ?? 0,
});

export const generateEras = (rng: RNG): Era[] => {
  const count = randInt(rng, CONFIG.ERA_COUNT_RANGE[0], CONFIG.ERA_COUNT_RANGE[1]);
  const eras: Era[] = [];
  const templates = eraTemplates as unknown as EraTemplate[];

  for (let i = 0; i < count; i += 1) {
    const template = pickRandomEraTemplate(rng, templates);
    eras.push({
      id: template.id,
      name: template.name,
      description: template.description,
      duration: Math.max(
        CONFIG.ERA_DURATION_RANGE[0],
        Math.min(CONFIG.ERA_DURATION_RANGE[1], randInt(rng, CONFIG.ERA_DURATION_RANGE[0], CONFIG.ERA_DURATION_RANGE[1]))
      ),
      effects: normalizeEffects(template.effects),
      sectorEffects: template.sectorEffects ?? {},
      eventWeights: template.eventWeights ?? {},
      difficulty: template.difficulty,
      revealed: false,
    });
  }

  return eras;
};
