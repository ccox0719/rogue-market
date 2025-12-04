import { defaultMetaState } from "../core/metaState.js";
const META_SAVE_KEY = "rogue-market-meta";
export const saveMeta = (meta) => {
    localStorage.setItem(META_SAVE_KEY, JSON.stringify(meta));
};
export const loadMeta = () => {
    const raw = localStorage.getItem(META_SAVE_KEY);
    if (!raw) {
        saveMeta(defaultMetaState);
        return defaultMetaState;
    }
    try {
        const parsed = JSON.parse(raw);
        return {
            ...defaultMetaState,
            ...parsed,
            artifacts: parsed.artifacts ?? defaultMetaState.artifacts,
            sectorsUnlocked: parsed.sectorsUnlocked ?? defaultMetaState.sectorsUnlocked,
            unlockedArtifacts: parsed.unlockedArtifacts ?? defaultMetaState.unlockedArtifacts,
            legacyBuffs: parsed.legacyBuffs ?? defaultMetaState.legacyBuffs,
            unlockedCampaigns: parsed.unlockedCampaigns ?? defaultMetaState.unlockedCampaigns,
            campaignProgress: parsed.campaignProgress ?? defaultMetaState.campaignProgress,
            activeCampaignId: parsed.activeCampaignId ?? defaultMetaState.activeCampaignId,
            activeChallengeId: parsed.activeChallengeId ?? defaultMetaState.activeChallengeId,
            challengeRecords: parsed.challengeRecords ?? defaultMetaState.challengeRecords,
        };
    }
    catch {
        saveMeta(defaultMetaState);
        return defaultMetaState;
    }
};
export const resetMeta = () => {
    saveMeta(defaultMetaState);
};
