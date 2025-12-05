import { findWhaleProfile } from "../generators/whaleGen.js";
import { getCurrentEra } from "../systems/eraSystem.js";
const NEWS_QUEUE_LIMIT = 32;
const NEWS_LOG_LIMIT = 64;
const MAX_HEADLINES_PER_DAY = 3;
const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);
const formatImpact = (value) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${(value * 100).toFixed(1)}%`;
};
const createNewsId = (topic, suffix) => `${topic}:${suffix}`;
const buildEventNews = (event, day) => {
    const scope = event.sectorAffinity ?? "general market";
    const headline = `${capitalize(event.rarity)} event rattles ${scope}`;
    const lines = [
        event.description,
        `Scope: ${scope}`,
        `Estimated impact: ${formatImpact(event.impact)}`,
    ];
    return {
        id: createNewsId("event", `${event.id}`),
        day,
        topic: "event",
        headline,
        lines,
    };
};
const buildWhaleNews = (state, profileId, whaleId, targetCompanyId, targetSector, obsession, day) => {
    const profile = findWhaleProfile(profileId);
    const company = targetCompanyId
        ? state.companies.find((entry) => entry.id === targetCompanyId)
        : undefined;
    const targetLabel = company
        ? `${company.ticker} (${company.name})`
        : targetSector ?? "the broader market";
    const headline = profile
        ? `${profile.displayName} prowls ${targetLabel}`
        : `Hidden whale influences ${targetLabel}`;
    const details = [
        profile?.description ?? "A shadowy investor is active today.",
        company ? `Ticker spotlight: ${company.ticker}.` : `Sector focus: ${targetSector ?? "general"}.`,
        obsession[0] ? `Obsessed with ${obsession[0]}.` : "",
    ].filter(Boolean);
    return {
        id: createNewsId("whale", `${whaleId}:${day}`),
        day,
        topic: "whale",
        headline,
        lines: details,
    };
};
const buildEraNews = (state, day) => {
    const era = getCurrentEra(state);
    const volatility = era.effects.volatilityMultiplier ?? 1;
    const predictionPhrase = state.predictedNextEraId
        ? `Next era prediction: ${state.predictedNextEraId} (${Math.round(state.predictionConfidence * 100)}% confidence)`
        : `Prediction confidence: ${Math.round(state.predictionConfidence * 100)}%`;
    const headline = state.currentEraMutated && state.mutationMessage
        ? state.mutationMessage
        : `Era shifts to ${era.name}`;
    const lines = [
        era.description,
        `Volatility modifier: ${volatility.toFixed(2)}x`,
        predictionPhrase,
    ];
    const idSuffix = state.currentEraMutated && state.mutationMessage
        ? `mutation:${state.mutationMessage}`
        : `${era.id}:${day}`;
    return {
        id: createNewsId("era", idSuffix),
        day,
        topic: "era",
        headline,
        lines,
    };
};
export const generateDailyNews = (state) => {
    const items = [];
    const day = state.day;
    if (state.eventsToday.length > 0) {
        const event = state.eventsToday[state.eventsToday.length - 1];
        items.push(buildEventNews(event, day));
    }
    const whalesToday = state.activeWhales.filter((whale) => whale.visible && whale.lastActionDay === day);
    for (const whale of whalesToday.slice(-2)) {
        items.push(buildWhaleNews(state, whale.profileId, whale.id, whale.targetCompanyId, whale.targetSector, whale.obsession, day));
    }
    const eraJustChanged = state.currentEraDay === 0 && state.day > 1;
    const mutationPresent = state.currentEraMutated && Boolean(state.mutationMessage);
    if (eraJustChanged || mutationPresent) {
        items.push(buildEraNews(state, day));
    }
    return items.slice(0, MAX_HEADLINES_PER_DAY);
};
export const emitMarketNews = (state) => {
    const candidates = generateDailyNews(state);
    if (candidates.length === 0) {
        return [];
    }
    const unique = candidates.filter((item) => !state.newsEventLog.includes(item.id));
    if (unique.length === 0) {
        return [];
    }
    state.newsQueue.push(...unique);
    while (state.newsQueue.length > NEWS_QUEUE_LIMIT) {
        state.newsQueue.shift();
    }
    state.newsEventLog.push(...unique.map((item) => item.id));
    while (state.newsEventLog.length > NEWS_LOG_LIMIT) {
        state.newsEventLog.shift();
    }
    return unique;
};
