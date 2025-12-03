"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInitialState = void 0;
const rng_js_1 = require("./rng.js");
const config_js_1 = require("./config.js");
const artifactEffects_js_1 = require("./artifactEffects.js");
const artifactGen_js_1 = require("../generators/artifactGen.js");
const companyGen_js_1 = require("../generators/companyGen.js");
const eraGen_js_1 = require("../generators/eraGen.js");
const sectorGen_js_1 = require("../generators/sectorGen.js");
const createInitialState = (seed, providedRng, options = {}) => {
    const runSeed = seed ?? Date.now();
    const rng = providedRng ?? (0, rng_js_1.createSeededRng)(runSeed);
    const difficulty = options.difficulty ?? (0, config_js_1.getDifficultyMode)();
    const artifactEffects = options.artifactEffects ?? (0, artifactEffects_js_1.computeArtifactEffects)((0, artifactGen_js_1.generateArtifactPool)());
    const sectors = (0, sectorGen_js_1.generateSectors)();
    const targetCompanyCount = Math.max(config_js_1.CONFIG.COMPANY_COUNT, sectors.length);
    const coreCompanies = sectors.map((sector) => (0, companyGen_js_1.generateCompany)(rng, sectors, sector));
    const remainingCompaniesCount = Math.max(0, targetCompanyCount - coreCompanies.length);
    const additionalCompanies = Array.from({ length: remainingCompaniesCount }, () => (0, companyGen_js_1.generateCompany)(rng, sectors));
    const companies = [...coreCompanies, ...additionalCompanies];
    const baseCash = config_js_1.CONFIG.START_CASH * difficulty.modifiers.startingCashMultiplier;
    const startingCash = Number((baseCash * (1 + artifactEffects.startingCashBonus)).toFixed(2));
    const baseEventChance = config_js_1.CONFIG.DAILY_EVENT_CHANCE * difficulty.modifiers.eventMultiplier;
    const eventChance = Math.min(1, baseEventChance * (1 + artifactEffects.eventChanceBonus));
    const volatilityMultiplier = difficulty.modifiers.volatilityMultiplier;
    const totalDays = difficulty.special?.noRunOver ? Number.MAX_SAFE_INTEGER : config_js_1.CONFIG.DAYS_PER_RUN;
    const eras = (0, eraGen_js_1.generateEras)(rng).map((era) => ({
        ...era,
        duration: Math.max(2, era.duration - artifactEffects.eraDurationReduction),
    }));
    return {
        day: 1,
        totalDays,
        companies,
        eras,
        sectors,
        currentEraIndex: 0,
        currentEraDay: 0,
        portfolio: {
            cash: startingCash,
            holdings: {},
            debt: 0,
            marginLimit: startingCash * 0.25,
        },
        discoveredTools: [],
        eventsToday: [],
        runOver: false,
        artifacts: (0, artifactGen_js_1.generateArtifactPool)(),
        seed: runSeed,
        eventChance,
        volatilityMultiplier,
        difficultyId: difficulty.id,
        difficultyLabel: difficulty.label,
        artifactEffects,
        pendingChoice: null,
        watchOrders: [],
    };
};
exports.createInitialState = createInitialState;
