import { findArtifactDefinition, } from "../generators/artifactGen.js";
const DEFAULT_ARTIFACT_EFFECTS = {
    energyBonus: 0,
    eventChanceBonus: 0,
    negativeEventMultiplier: 1,
    eraDurationReduction: 0,
    startingCashBonus: 0,
    revealsVolatility: false,
    volatilityMultiplier: 1,
    marginLimitBonus: 0,
    triggerSlotBonus: 0,
    predictionBonus: 0,
};
const mergeEffects = (target, source) => {
    if (typeof source.energyBonus === "number") {
        target.energyBonus += source.energyBonus;
    }
    if (typeof source.eventChanceBonus === "number") {
        target.eventChanceBonus += source.eventChanceBonus;
    }
    if (typeof source.negativeEventMultiplier === "number") {
        target.negativeEventMultiplier *= source.negativeEventMultiplier;
    }
    if (typeof source.eraDurationReduction === "number") {
        target.eraDurationReduction += source.eraDurationReduction;
    }
    if (typeof source.startingCashBonus === "number") {
        target.startingCashBonus += source.startingCashBonus;
    }
    if (source.revealVolatility) {
        target.revealsVolatility = true;
    }
    if (typeof source.volatilityMultiplier === "number") {
        target.volatilityMultiplier *= source.volatilityMultiplier;
    }
    if (typeof source.marginLimitBonus === "number") {
        target.marginLimitBonus += source.marginLimitBonus;
    }
    if (typeof source.triggerSlotBonus === "number") {
        target.triggerSlotBonus += source.triggerSlotBonus;
    }
    if (typeof source.predictionBonus === "number") {
        target.predictionBonus += source.predictionBonus;
    }
};
export const aggregateArtifactEffects = (artifactIds, extras) => {
    const aggregated = { ...DEFAULT_ARTIFACT_EFFECTS };
    for (const id of artifactIds) {
        const definition = findArtifactDefinition(id);
        if (!definition)
            continue;
        mergeEffects(aggregated, definition.effects);
    }
    if (extras) {
        mergeEffects(aggregated, extras);
    }
    return aggregated;
};
