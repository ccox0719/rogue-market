"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCompany = void 0;
const config_js_1 = require("../core/config.js");
const nameGen_js_1 = require("./nameGen.js");
const sectorGen_js_1 = require("./sectorGen.js");
const randRange = (rng, min, max) => min + (max - min) * rng.next();
const buildAffinities = (rng, sectors) => {
    const affinities = {};
    for (const sector of sectors) {
        affinities[sector.name] = rng.next() * 2 - 1;
    }
    return affinities;
};
const pickCorrelations = (rng, sectors, primary) => {
    const others = sectors.map((sector) => sector.name).filter((name) => name !== primary);
    const shuffled = [...others].sort(() => rng.next() - 0.5);
    return shuffled.slice(0, 2);
};
const buildInitialRange = (price) => ({
    open: price,
    high: price,
    low: price,
    close: price,
    generated: true,
});
const generateCompany = (rng, sectors, forcedSector) => {
    const primarySector = forcedSector ?? (0, sectorGen_js_1.pickSector)(rng, sectors);
    const name = (0, nameGen_js_1.generateName)(rng, primarySector.branding, primarySector.name);
    const ticker = (0, nameGen_js_1.generateTicker)(rng);
    const price = Number(randRange(rng, ...config_js_1.CONFIG.STARTING_PRICE_RANGE).toFixed(2));
    return {
        id: crypto.randomUUID(),
        name,
        ticker,
        sector: primarySector.name,
        price,
        history: [price],
        volatility: Number(randRange(rng, ...config_js_1.CONFIG.VOLATILITY_RANGE).toFixed(3)),
        trendBias: Number(randRange(rng, ...config_js_1.CONFIG.TREND_BIAS_RANGE).toFixed(4)),
        randomness: Number(randRange(rng, ...config_js_1.CONFIG.RANDOMNESS_RANGE).toFixed(3)),
        eventAffinity: buildAffinities(rng, sectors),
        correlations: pickCorrelations(rng, sectors, primarySector.name),
        todayRange: buildInitialRange(price),
    };
};
exports.generateCompany = generateCompany;
