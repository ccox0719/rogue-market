import { CONFIG } from "../core/config.js";
import eraTemplates from "../content/eraTemplates.js";
const randInt = (rng, min, max) => Math.floor(min + rng.next() * (max - min + 1));
const templates = eraTemplates;
const normalizeEffects = (template) => ({
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
const RARITY_BASE_WEIGHTS = {
    common: 0.7,
    uncommon: 0.2,
    rare: 0.1,
};
const adjustWeightsForCycle = (cycle, base) => {
    const rareBoost = Math.max(0, cycle) * 0.02;
    const weights = {
        common: Math.max(0.1, base.common - rareBoost * 0.4),
        uncommon: Math.max(0.15, base.uncommon - rareBoost * 0.2),
        rare: base.rare + rareBoost,
    };
    return weights;
};
const pickRarity = (rng, cycle) => {
    const weights = adjustWeightsForCycle(cycle, RARITY_BASE_WEIGHTS);
    const total = weights.common + weights.uncommon + weights.rare;
    let roll = rng.next() * total;
    for (const key of ["common", "uncommon", "rare"]) {
        roll -= weights[key];
        if (roll <= 0) {
            return key;
        }
    }
    return "rare";
};
const pickTemplateByRarity = (rng, rarity) => {
    const pool = templates.filter((template) => template.rarity === rarity);
    const candidates = pool.length === 0 ? templates : pool;
    const index = Math.floor(rng.next() * candidates.length);
    return candidates[index];
};
export const createEraFromTemplate = (template, rng) => {
    const duration = Math.max(CONFIG.ERA_DURATION_RANGE[0], Math.min(CONFIG.ERA_DURATION_RANGE[1], randInt(rng, CONFIG.ERA_DURATION_RANGE[0], CONFIG.ERA_DURATION_RANGE[1])));
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
export const generateEraDeck = (rng, options = {}) => {
    const count = randInt(rng, CONFIG.ERA_COUNT_RANGE[0], CONFIG.ERA_COUNT_RANGE[1]);
    const deck = [];
    const cycle = options.cycle ?? 0;
    for (let i = 0; i < count; i += 1) {
        const rarity = pickRarity(rng, cycle);
        const template = pickTemplateByRarity(rng, rarity);
        deck.push(createEraFromTemplate(template, rng));
    }
    return deck;
};
export const findEraTemplate = (id) => templates.find((entry) => entry.id === id);
