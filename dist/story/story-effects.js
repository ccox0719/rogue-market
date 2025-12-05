const effectMap = {
    ACT_II_NEWS_PROMPT: (state) => {
        if (state.newsDecisionUsed)
            return;
        state.newsDecisionUsed = true;
        state.regulatorShots += 1;
        state.whaleActionLog.push("Following the clue unlocked another regulator shot. Stay sharp.");
        if (state.whaleActionLog.length > 12) {
            state.whaleActionLog.shift();
        }
    },
    ACT_III_STRUGGLING_BOON: (state) => {
        if (state.storyBoonUsed)
            return;
        const baseCash = state.baseStartingCash;
        const bonus = Math.max(500, Math.floor(baseCash * 0.05));
        state.portfolio.cash = Number((state.portfolio.cash + bonus).toFixed(2));
        state.storyBoonUsed = true;
        state.whaleActionLog.push(`A quiet mentor wires you ${bonus} Aú while you're down.`);
        if (state.whaleActionLog.length > 12) {
            state.whaleActionLog.shift();
        }
    },
};
export function applyStorySceneEffects(state, scenes) {
    scenes.forEach((scene) => {
        const effect = effectMap[scene.id];
        if (effect) {
            effect(state);
        }
    });
}
