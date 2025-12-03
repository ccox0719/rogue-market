"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEvent = void 0;
const eventTemplates_json_1 = __importDefault(require("../content/eventTemplates.json"));
const templates = eventTemplates_json_1.default;
const RARITY_WEIGHT = {
    common: 1,
    uncommon: 1.4,
    rare: 1.7,
    epic: 2.2,
    legendary: 3,
};
const randRange = (rng, min, max) => min + (max - min) * rng.next();
const computeTemplateWeight = (template, overrides) => {
    const rarityBase = RARITY_WEIGHT[template.rarity];
    const baseWeight = template.baseWeight ?? 1;
    const defaultMultiplier = overrides?.default ?? 1;
    const tagMultiplier = template.tags?.reduce((acc, tag) => acc * (overrides?.[tag] ?? 1), 1) ?? 1;
    return rarityBase * baseWeight * defaultMultiplier * tagMultiplier;
};
const pickTemplate = (rng, overrides) => {
    const weights = templates.map((template) => computeTemplateWeight(template, overrides));
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
const pickSectorAffinity = (rng, sectors, force = false) => {
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
const sampleImpact = (rng, template) => {
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
const generateEvent = (rng, sectors, weightOverrides) => {
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
exports.generateEvent = generateEvent;
