"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEras = void 0;
const config_js_1 = require("../core/config.js");
const eraTemplates_json_1 = __importDefault(require("../content/eraTemplates.json"));
const randInt = (rng, min, max) => Math.floor(min + rng.next() * (max - min + 1));
const pickRandomEraTemplate = (rng, templates) => templates[Math.floor(rng.next() * templates.length)];
const normalizeEffects = (template) => ({
    ...template,
    global: template.global ?? template.globalTrendBias ?? 0,
});
const generateEras = (rng) => {
    const count = randInt(rng, config_js_1.CONFIG.ERA_COUNT_RANGE[0], config_js_1.CONFIG.ERA_COUNT_RANGE[1]);
    const eras = [];
    const templates = eraTemplates_json_1.default;
    for (let i = 0; i < count; i += 1) {
        const template = pickRandomEraTemplate(rng, templates);
        eras.push({
            id: template.id,
            name: template.name,
            description: template.description,
            duration: Math.max(config_js_1.CONFIG.ERA_DURATION_RANGE[0], Math.min(config_js_1.CONFIG.ERA_DURATION_RANGE[1], randInt(rng, config_js_1.CONFIG.ERA_DURATION_RANGE[0], config_js_1.CONFIG.ERA_DURATION_RANGE[1]))),
            effects: normalizeEffects(template.effects),
            sectorEffects: template.sectorEffects ?? {},
            eventWeights: template.eventWeights ?? {},
            difficulty: template.difficulty,
            revealed: false,
        });
    }
    return eras;
};
exports.generateEras = generateEras;
