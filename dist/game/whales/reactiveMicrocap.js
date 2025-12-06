import { CONFIG } from "../core/config.js";
import { findWhaleProfile } from "../generators/whaleGen.js";
import { getActiveWhaleInstance } from "./whale-state.js";
import { recordLifecycleEvent } from "../systems/lifecycleSystem.js";
const randRange = (rng, min, max) => min + (max - min) * rng.next();
const pickRandom = (list, rng) => list[Math.floor(rng.next() * list.length)];
const NAME_ADJECTIVES = [
    "Silver",
    "Neon",
    "Micro",
    "Velvet",
    "Pico",
    "Quantum",
    "Horizon",
    "Lumen",
    "Twin",
    "Hidden",
];
const NAME_NOUNS = [
    "Dune",
    "Flux",
    "Dynamics",
    "Sparks",
    "Sphere",
    "Labs",
    "Wire",
    "Coast",
    "Nest",
    "Thread",
];
const NAME_ENDINGS = [
    "Analytics",
    "Robotics",
    "Ventures",
    "Holdings",
    "Systems",
    "Works",
    "Networks",
    "Truth",
    "Innovations",
    "Catalyst",
];
const TICKER_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const buildIntradayRange = (price) => ({
    open: price,
    high: price,
    low: price,
    close: price,
    generated: true,
});
const buildAffinities = (rng, sectors) => {
    const affinities = {};
    for (const sector of sectors) {
        affinities[sector.name] = rng.next() * 2 - 1;
    }
    return affinities;
};
const pickCorrelations = (rng, sectors, primary) => {
    const options = sectors.map((sector) => sector.name).filter((value) => value !== primary);
    const shuffled = [...options].sort(() => rng.next() - 0.5);
    return shuffled.slice(0, 2);
};
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const generateReactiveName = (rng) => {
    const adj = pickRandom(NAME_ADJECTIVES, rng);
    const noun = pickRandom(NAME_NOUNS, rng);
    const ending = pickRandom(NAME_ENDINGS, rng);
    const suffix = Math.floor(rng.next() * 99);
    switch (Math.floor(rng.next() * 3)) {
        case 0:
            return `${adj} ${noun} ${ending}`;
        case 1:
            return `${noun} ${ending} ${suffix}`;
        default:
            return `${adj} ${ending} ${suffix}`;
    }
};
const generateReactiveTicker = (rng) => {
    const length = 3 + Math.floor(rng.next() * 3);
    let ticker = "";
    for (let i = 0; i < length; i += 1) {
        const idx = Math.floor(rng.next() * TICKER_CHARS.length);
        ticker += TICKER_CHARS[idx];
    }
    return ticker;
};
const pickSector = (rng, sectors, preferred) => {
    if (preferred) {
        const match = sectors.find((entry) => entry.name === preferred);
        if (match) {
            return match.name;
        }
    }
    if (sectors.length === 0) {
        return "General";
    }
    return sectors[Math.floor(rng.next() * sectors.length)].name;
};
const buildReactiveDescription = (profile, sector, exposure) => {
    const direction = exposure > 0 ? "spikes" : "rattles";
    return `Opposite ${profile.displayName}'s ${sector} bet, this micro-cap ${direction} on every fooled ripple.`;
};
const buildReactiveCompany = (state, rng, whale, profile, exposure) => {
    const sector = pickSector(rng, state.sectors, whale.targetSector ?? profile.favoriteSectors[0]);
    const price = Number(randRange(rng, ...CONFIG.REACTIVE_MICROCAP_PRICE_RANGE).toFixed(2));
    const volatility = Number(randRange(rng, ...CONFIG.REACTIVE_MICROCAP_VOLATILITY_RANGE).toFixed(3));
    const randomness = Number(randRange(rng, ...CONFIG.REACTIVE_MICROCAP_RANDOMNESS_RANGE).toFixed(3));
    const trendBiasValue = Number(randRange(rng, ...CONFIG.REACTIVE_MICROCAP_TREND_BIAS_RANGE).toFixed(4));
    const trendBias = Number(-exposure * trendBiasValue);
    const marketCap = Math.round(randRange(rng, ...CONFIG.REACTIVE_MICROCAP_MARKET_CAP_RANGE));
    const expiresDay = state.day + CONFIG.REACTIVE_MICROCAP_WINDOW_DAYS;
    return {
        id: crypto.randomUUID(),
        name: generateReactiveName(rng),
        ticker: generateReactiveTicker(rng),
        sector,
        price,
        history: [price],
        volatility,
        trendBias,
        randomness,
        eventAffinity: buildAffinities(rng, state.sectors),
        correlations: pickCorrelations(rng, state.sectors, sector),
        todayRange: buildIntradayRange(price),
        isActive: true,
        splitReferencePrice: price,
        splitCount: 0,
        daysBelowBankruptcyThreshold: 0,
        daysSinceListing: 0,
        reactiveDetails: {
            whaleId: whale.id,
            exposure,
            createdDay: state.day,
            expiresDay,
            marketCap,
            description: buildReactiveDescription(profile, sector, exposure),
            targetSector: whale.targetSector ?? sector,
            lastInfluenceGain: 0,
        },
    };
};
const damageWhale = (state, company, profit) => {
    const active = getActiveWhaleInstance(state);
    if (!active) {
        return;
    }
    const profile = findWhaleProfile(active.profileId);
    const damagePct = clamp(profit / CONFIG.REACTIVE_MICROCAP_PROFIT_DIVISOR, CONFIG.REACTIVE_MICROCAP_MIN_DAMAGE, CONFIG.REACTIVE_MICROCAP_MAX_DAMAGE);
    const nextCapital = Number(Math.max(0, active.capital - active.capital * damagePct).toFixed(2));
    active.capital = nextCapital;
    active.capitalHistory.push(nextCapital);
    const influenceGain = 3 + Math.floor(profit / CONFIG.REACTIVE_MICROCAP_INFLUENCE_DIVISOR);
    if (company.reactiveDetails) {
        company.reactiveDetails.lastInfluenceGain = influenceGain;
    }
    const whaleName = profile?.displayName ?? "Whale";
    const damagePctText = Math.round(damagePct * 100);
    const message = `Reactive micro-cap trade shakes ${whaleName} (${damagePctText}% damage).`;
    state.whaleActionLog.push(message);
    if (state.whaleActionLog.length > CONFIG.WHALE_LOG_LIMIT) {
        state.whaleActionLog.shift();
    }
    const lifecycleMessage = `You crushed ${company.ticker} and dented ${whaleName}'s clout. Influence +${influenceGain}.`;
    recordLifecycleEvent(state, lifecycleMessage);
};
export const findReactiveMicrocapCompany = (state) => state.companies.find((company) => Boolean(company.reactiveDetails));
export const removeReactiveMicrocap = (state) => {
    const index = state.companies.findIndex((company) => Boolean(company.reactiveDetails));
    if (index >= 0) {
        const [company] = state.companies.splice(index, 1);
        state.portfolio.holdings[company.ticker] = 0;
        state.watchOrders = state.watchOrders.filter((order) => order.companyId !== company.id);
    }
    state.reactiveMicrocapPosition = null;
};
export const cleanupReactiveMicrocap = (state) => {
    const company = findReactiveMicrocapCompany(state);
    if (!company) {
        return;
    }
    if ((company.reactiveDetails?.expiresDay ?? Infinity) < state.day) {
        removeReactiveMicrocap(state);
    }
};
const computeExposure = (profile) => {
    const combined = (profile.impactModel.companyTrendDelta ?? 0) +
        (profile.impactModel.sectorTrendDelta ?? 0);
    if (combined === 0) {
        return 1;
    }
    return Math.sign(combined) || 1;
};
export const ensureReactiveMicrocapForWhale = (state, whale, profile, rng) => {
    removeReactiveMicrocap(state);
    const exposure = -computeExposure(profile);
    const company = buildReactiveCompany(state, rng, whale, profile, exposure);
    state.companies.push(company);
    state.reactiveMicrocapPosition = {
        shares: 0,
        totalCost: 0,
    };
    recordLifecycleEvent(state, `Reactive micro-cap discovered: ${company.name} (${company.ticker}) responding to ${profile.displayName}.`);
};
export const recordReactiveMicrocapTrade = (state, company, quantity, direction) => {
    if (!company.reactiveDetails) {
        return;
    }
    const currentPosition = state.reactiveMicrocapPosition ?? {
        shares: 0,
        totalCost: 0,
    };
    if (direction === "buy") {
        state.reactiveMicrocapPosition = {
            shares: currentPosition.shares + quantity,
            totalCost: currentPosition.totalCost + company.price * quantity,
        };
        return;
    }
    const sellQty = Math.min(currentPosition.shares, quantity);
    if (sellQty <= 0) {
        return;
    }
    const avgCost = currentPosition.shares > 0
        ? currentPosition.totalCost / currentPosition.shares
        : company.price;
    const profit = sellQty * (company.price - avgCost);
    state.reactiveMicrocapPosition = {
        shares: currentPosition.shares - sellQty,
        totalCost: Math.max(0, currentPosition.totalCost - avgCost * sellQty),
    };
    if (profit <= 0) {
        return;
    }
    damageWhale(state, company, profit);
};
