import whales from "../content/whales.js";
const whaleDefinitions = whales;
export const whaleLibrary = whaleDefinitions;
export const findWhaleProfile = (id) => whaleLibrary.find((whale) => whale.id === id);
export const createWhaleInstance = (profileId) => ({
    id: crypto.randomUUID(),
    profileId,
    targetSector: null,
    targetCompanyId: null,
    visible: false,
    obsession: [],
    lastActionDay: 0,
});
export const pickRandomWhaleProfiles = (count, rng) => {
    const pool = [...whaleLibrary];
    const picks = [];
    while (picks.length < count && pool.length > 0) {
        const index = Math.floor(rng.next() * pool.length);
        picks.push(pool[index]);
        pool.splice(index, 1);
    }
    return picks;
};
