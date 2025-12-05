import { CONFIG } from "../core/config.js";
import { createBondMarket, findBondDefinition, } from "../generators/bondGen.js";
const addBondLog = (state, message) => {
    state.bondActionLog.push(message);
    if (state.bondActionLog.length > CONFIG.BOND_LOG_LIMIT) {
        state.bondActionLog.shift();
    }
};
export const initializeBondMarket = (state, rng) => {
    if (state.bondMarket.length > 0) {
        return;
    }
    state.bondMarket = createBondMarket(rng, CONFIG.BOND_LISTING_COUNT);
};
export const refreshBondMarket = (state, rng) => {
    state.bondMarket = createBondMarket(rng, CONFIG.BOND_LISTING_COUNT);
};
export const buyBondFromListing = (state, listingId) => {
    const listing = state.bondMarket.find((item) => item.id === listingId);
    if (!listing) {
        return false;
    }
    const cost = listing.faceValue;
    if (state.portfolio.cash < cost) {
        return false;
    }
    const definition = findBondDefinition(listing.bondId);
    const holding = state.bondHoldings.find((entry) => entry.bondId === listing.bondId &&
        entry.daysToMaturity === listing.durationDays);
    if (holding) {
        holding.units += 1;
    }
    else {
        const defaultChance = definition?.defaultChance ?? 0;
        const newHolding = {
            id: crypto.randomUUID(),
            bondId: listing.bondId,
            units: 1,
            faceValue: listing.faceValue,
            couponRate: listing.couponRate,
            daysToMaturity: listing.durationDays,
            type: listing.type,
            defaultChance,
        };
        state.bondHoldings.push(newHolding);
    }
    state.portfolio.cash -= cost;
    addBondLog(state, `Bought ${definition?.name ?? listing.bondId} (${listing.type.toUpperCase()}).`);
    return true;
};
export const processBondsForDay = (state, rng) => {
    const era = state.eras[state.currentEraIndex];
    const eraYield = era?.effects?.bondYieldMult ?? 1;
    const eraDefaultDelta = era?.effects?.bondDefaultDelta ?? 0;
    const couponPeriod = CONFIG.BOND_COUPON_PERIOD;
    const updated = [];
    for (const holding of state.bondHoldings) {
        const couponDaily = (holding.couponRate * eraYield / couponPeriod) *
            holding.faceValue *
            holding.units;
        state.portfolio.cash += couponDaily;
        holding.daysToMaturity -= 1;
        const defaultChance = Math.max(0, holding.defaultChance + eraDefaultDelta);
        if (rng.next() < defaultChance) {
            addBondLog(state, `${holding.type.toUpperCase()} bond ${holding.bondId} defaulted.`);
            continue;
        }
        if (holding.daysToMaturity <= 0) {
            state.portfolio.cash += holding.faceValue * holding.units;
            addBondLog(state, `${holding.type.toUpperCase()} bond ${holding.bondId} matured.`);
            continue;
        }
        updated.push(holding);
    }
    state.bondHoldings = updated;
};
