import { findLegacyBuff, legacyBuffLibrary } from "../content/legacyBuffs.js";
export const aggregateLegacyBuffEffects = (buffIds) => {
    const aggregated = {};
    for (const id of buffIds) {
        const definition = findLegacyBuff(id);
        if (!definition)
            continue;
        mergeEffectDescriptors(aggregated, definition.effects);
    }
    return aggregated;
};
export const mergeEffectDescriptors = (target, source) => {
    for (const [key, value] of Object.entries(source)) {
        const typedKey = key;
        if (typeof value === "number") {
            const existingNumber = typeof target[typedKey] === "number" ? target[typedKey] : 0;
            target[typedKey] = existingNumber + value;
        }
        else if (typeof value === "boolean") {
            target[typedKey] = value;
        }
        else if (value) {
            target[typedKey] = value;
        }
    }
};
export const pickLegacyBuff = (existing, rng) => {
    const available = legacyBuffLibrary
        .filter((buff) => !existing.includes(buff.id))
        .map((buff) => buff.id);
    if (available.length === 0) {
        return null;
    }
    const index = Math.floor(rng.next() * available.length);
    return available[index];
};
