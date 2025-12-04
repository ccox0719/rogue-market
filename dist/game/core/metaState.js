import { CONFIG } from "./config.js";
import { generateArtifactPool } from "../generators/artifactGen.js";
import { campaignLibrary } from "../content/campaigns.js";
const DEFAULT_DIFFICULTY = CONFIG.DEFAULT_DIFFICULTY;
const DIFFICULTY_RATINGS = {
    novice: 1,
    classic: 2,
    iron_trader: 3,
    endless: 4,
};
const buildArtifactPool = () => generateArtifactPool();
const calculateLevelFromXp = (xp) => Math.max(1, Math.ceil(Math.sqrt(xp / 100)) + 1);
export const defaultMetaState = {
    xp: 0,
    level: 1,
    artifacts: buildArtifactPool(),
    sectorsUnlocked: [],
    difficulty: DEFAULT_DIFFICULTY,
    totalRuns: 0,
    bestPortfolioPeak: 0,
    bestFinalPortfolio: 0,
    bestSingleDayGain: 0,
    bestDifficultyCleared: 0,
    unlockedEraPredictionLevel: 0,
    unlockedArtifacts: [],
    legacyBuffs: [],
    unlockedCampaigns: [campaignLibrary[0]?.id ?? "rookie-sprint"],
    campaignProgress: {},
    activeCampaignId: campaignLibrary[0]?.id ?? null,
    activeChallengeId: null,
    challengeRecords: {},
};
export const getDifficultyRating = (id) => DIFFICULTY_RATINGS[id] ?? 1;
export const awardXp = (meta, amount) => {
    const xp = Math.max(0, meta.xp + amount);
    const level = calculateLevelFromXp(xp);
    return { ...meta, xp, level };
};
export const unlockArtifact = (meta, artifactId) => {
    const artifacts = meta.artifacts.map((artifact) => artifact.id === artifactId ? { ...artifact, unlocked: true } : artifact);
    const unlockedArtifacts = meta.unlockedArtifacts.includes(artifactId)
        ? meta.unlockedArtifacts
        : [...meta.unlockedArtifacts, artifactId];
    return { ...meta, artifacts, unlockedArtifacts };
};
export const recordRunOutcome = (meta, xpGained, stats) => {
    const updatedMeta = awardXp(meta, xpGained);
    const bestPortfolioPeak = Math.max(updatedMeta.bestPortfolioPeak, stats.peakPortfolioValue);
    const bestFinalPortfolio = Math.max(updatedMeta.bestFinalPortfolio, stats.finalPortfolioValue);
    const bestSingleDayGain = Math.max(updatedMeta.bestSingleDayGain, stats.bestSingleDayGain);
    const bestDifficultyCleared = Math.max(updatedMeta.bestDifficultyCleared, stats.difficultyRating);
    const unlockedEraPredictionLevel = Math.max(updatedMeta.unlockedEraPredictionLevel, Math.floor(updatedMeta.level / 2));
    return {
        ...updatedMeta,
        bestPortfolioPeak,
        bestFinalPortfolio,
        bestSingleDayGain,
        bestDifficultyCleared,
        unlockedEraPredictionLevel,
        totalRuns: meta.totalRuns + 1,
    };
};
export const addLegacyBuff = (meta, buffId) => {
    if (meta.legacyBuffs.includes(buffId)) {
        return meta;
    }
    return {
        ...meta,
        legacyBuffs: [...meta.legacyBuffs, buffId],
    };
};
export const unlockCampaign = (meta, campaignId) => {
    if (meta.unlockedCampaigns.includes(campaignId)) {
        return meta;
    }
    return {
        ...meta,
        unlockedCampaigns: [...meta.unlockedCampaigns, campaignId],
    };
};
export const setActiveCampaign = (meta, campaignId) => ({
    ...meta,
    activeCampaignId: campaignId,
});
export const setActiveChallenge = (meta, challengeId) => ({
    ...meta,
    activeChallengeId: challengeId,
});
export const recordCampaignRun = (meta, campaignId, finalValue) => {
    const entry = meta.campaignProgress[campaignId] ?? { runs: 0, bestFinal: 0 };
    const updated = {
        runs: entry.runs + 1,
        bestFinal: Math.max(entry.bestFinal, finalValue),
    };
    return {
        ...meta,
        campaignProgress: {
            ...meta.campaignProgress,
            [campaignId]: updated,
        },
    };
};
export const recordChallengeScore = (meta, challengeId, value) => {
    if (!challengeId)
        return meta;
    const previous = meta.challengeRecords[challengeId] ?? 0;
    if (value <= previous) {
        return meta;
    }
    return {
        ...meta,
        challengeRecords: {
            ...meta.challengeRecords,
            [challengeId]: value,
        },
    };
};
export const setDifficulty = (meta, difficultyId) => ({
    ...meta,
    difficulty: difficultyId,
});
