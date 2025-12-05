import { findWhaleProfile } from "../generators/whaleGen.js";
const computeSectorReturns = (state) => {
    const sectorStats = {};
    for (const company of state.companies) {
        const history = company.history;
        if (history.length < 2) {
            continue;
        }
        const previous = history[history.length - 2];
        if (previous === 0) {
            continue;
        }
        const today = history[history.length - 1];
        const pct = (today - previous) / previous;
        const record = sectorStats[company.sector] ?? { sum: 0, count: 0 };
        record.sum += pct;
        record.count += 1;
        sectorStats[company.sector] = record;
    }
    const returns = {};
    for (const [sector, record] of Object.entries(sectorStats)) {
        if (record.count === 0)
            continue;
        returns[sector] = record.sum / record.count;
    }
    return returns;
};
const computeWeightedReturn = (instance, sectorReturns) => {
    let total = 0;
    for (const [sector, weight] of Object.entries(instance.sectorWeights)) {
        const contribution = (sectorReturns[sector] ?? 0) * weight;
        total += contribution;
    }
    return total;
};
export const updateWhaleCapital = (state) => {
    const sectorReturns = computeSectorReturns(state);
    for (const whale of state.activeWhales) {
        const profile = findWhaleProfile(whale.profileId);
        if (!profile)
            continue;
        const weightedReturn = computeWeightedReturn(whale, sectorReturns);
        const volatilitySensitivity = profile.capitalConfig?.volatilitySensitivity ?? 1;
        let growthMultiplier = 1 + weightedReturn * volatilitySensitivity;
        if (growthMultiplier < 0.5) {
            growthMultiplier = 0.5;
        }
        const leverage = whale.leverage ?? 1;
        const biasSign = Math.sign(profile.impactModel.sectorTrendDelta ?? 0) || 1;
        const targetSector = whale.targetSector ?? profile.favoriteSectors[0] ?? "";
        const targetReturn = sectorReturns[targetSector] ?? 0;
        const signedReturn = biasSign * targetReturn;
        const manipulationImpact = profile.capitalConfig?.manipulationImpact ?? 0.25;
        const backfireFactor = profile.capitalConfig?.backfireFactor ?? 0.12;
        const manipulationProfit = Math.max(0, signedReturn) * manipulationImpact * whale.capital;
        const manipulationBackfire = Math.max(0, -signedReturn) * backfireFactor * whale.capital;
        const newCapital = Math.max(whale.capital * growthMultiplier * leverage + manipulationProfit - manipulationBackfire, 100000);
        whale.capital = Number(newCapital.toFixed(0));
        whale.capitalHistory.push(whale.capital);
    }
};
