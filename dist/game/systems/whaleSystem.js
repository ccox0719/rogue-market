import { CONFIG } from "../core/config.js";
import { createWhaleInstance, findWhaleProfile, pickRandomWhaleProfiles, } from "../generators/whaleGen.js";
const pickSector = (profile, state, rng) => {
    const sectorCandidates = profile.favoriteSectors.filter((sector) => state.sectors.some((entry) => entry.name === sector));
    if (sectorCandidates.length > 0) {
        const index = Math.floor(rng.next() * sectorCandidates.length);
        return sectorCandidates[index];
    }
    const fallback = state.sectors[Math.floor(rng.next() * state.sectors.length)];
    return fallback?.name ?? "General";
};
const pickCompanyForSector = (state, sector, rng) => {
    if (!sector) {
        return state.companies[Math.floor(rng.next() * state.companies.length)];
    }
    const inSector = state.companies.filter((company) => company.sector === sector);
    if (inSector.length === 0) {
        return state.companies[Math.floor(rng.next() * state.companies.length)];
    }
    return inSector[Math.floor(rng.next() * inSector.length)];
};
const shouldWhaleAct = (profile, state, currentEraId, rng) => {
    const trigger = profile.triggers;
    if (trigger?.eras && currentEraId && !trigger.eras.includes(currentEraId)) {
        return false;
    }
    if (trigger?.minDay && state.day < trigger.minDay) {
        return false;
    }
    const chance = trigger?.chance ?? CONFIG.WHALE_BASE_ACTION_CHANCE;
    return rng.next() < chance;
};
const buildActionMessage = (profile, sector, company) => {
    const direction = (profile.impactModel.sectorTrendDelta ?? 0) >= 0 ? "accumulating" : "pressing";
    const target = company ? company.ticker : sector;
    return `${profile.displayName} is ${direction} ${target}.`;
};
export const initializeWhales = (state, rng) => {
    if (state.activeWhales.length > 0) {
        return;
    }
    const profiles = pickRandomWhaleProfiles(CONFIG.WHALE_INITIAL_COUNT, rng);
    state.activeWhales = profiles.map((profile) => createWhaleInstance(profile.id));
};
export const updateWhaleInfluence = (state, rng, meta) => {
    if (state.activeWhales.length === 0) {
        initializeWhales(state, rng);
    }
    state.whaleSectorBonuses = {};
    state.whaleCompanyBonuses = {};
    const currentEraId = state.eras[state.currentEraIndex]?.id;
    for (const whale of state.activeWhales) {
        const profile = findWhaleProfile(whale.profileId);
        if (!profile) {
            continue;
        }
        if (!shouldWhaleAct(profile, state, currentEraId, rng)) {
            continue;
        }
        const sector = pickSector(profile, state, rng);
        const company = pickCompanyForSector(state, sector, rng);
        const sectorDelta = profile.impactModel.sectorTrendDelta ?? 0;
        const companyDelta = profile.impactModel.companyTrendDelta ?? 0;
        if (sector && sectorDelta !== 0) {
            state.whaleSectorBonuses[sector] =
                (state.whaleSectorBonuses[sector] ?? 0) + sectorDelta;
        }
        if (company && companyDelta !== 0) {
            state.whaleCompanyBonuses[company.id] =
                (state.whaleCompanyBonuses[company.id] ?? 0) + companyDelta;
        }
        whale.targetSector = sector;
        whale.targetCompanyId = company?.id ?? null;
        whale.lastActionDay = state.day;
        const obsession = company?.ticker ?? sector;
        whale.obsession.unshift(obsession);
        if (whale.obsession.length > CONFIG.WHALE_OBSESSION_LIMIT) {
            whale.obsession.pop();
        }
        const visible = meta.level >= (profile.revealAtLevel ?? Number.MAX_SAFE_INTEGER);
        whale.visible = visible;
        if (visible) {
            const message = buildActionMessage(profile, sector, company);
            state.whaleActionLog.push(message);
            if (state.whaleActionLog.length > CONFIG.WHALE_LOG_LIMIT) {
                state.whaleActionLog.shift();
            }
        }
    }
};
