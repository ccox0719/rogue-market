export const applyArtifactsToState = (state, effects) => {
    state.artifactEffects = effects;
    state.eventChance = Math.min(1, state.baseEventChance * (1 + effects.eventChanceBonus));
    state.volatilityMultiplier = state.baseVolatilityMultiplier * effects.volatilityMultiplier;
    state.portfolio.marginLimit = Math.max(0, state.baseMarginLimit * (1 + effects.marginLimitBonus));
    state.watchOrderLimit = Math.max(1, state.baseWatchOrderLimit + Math.round(effects.triggerSlotBonus));
    state.eras = state.eras.map((era) => {
        const baseDuration = typeof era.baseDuration === "number" ? era.baseDuration : era.duration;
        return {
            ...era,
            duration: Math.max(2, baseDuration - effects.eraDurationReduction),
        };
    });
};
