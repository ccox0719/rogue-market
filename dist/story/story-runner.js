import { getTriggeredCutscenes, renderSceneText, } from "./story-flow.js";
const baseStoryContext = (state, extras = {}) => {
    const portfolioValue = calculatePortfolioValue(state);
    const startCapital = state.baseStartingCash;
    const metaGoal = state.targetRetirement ??
        startCapital * 10;
    const activeEraId = state.eras[state.currentEraIndex]?.id ?? null;
    const activeWhaleId = state.activeWhales[0]?.profileId ?? null;
    const defeatedWhales = state.defeatedWhales ?? [];
    const whaleDefeatedThisTick = state.whaleDefeatedThisTick ?? false;
    const storyBoonUsed = state.storyBoonUsed ?? false;
    const recentNews = state.recentNews ?? [];
    const newsDecisionUsed = state.newsDecisionUsed ?? false;
    return {
        day: state.day,
        maxDays: state.totalDays,
        portfolioValue,
        startCapital,
        targetRetirement: metaGoal,
        activeEraId,
        activeWhaleId,
        defeatedWhales,
        runEnded: state.runOver,
        runWon: state.runOver && portfolioValue >= metaGoal,
        level: extras.level ?? 0,
        xp: extras.xp ?? 0,
        whaleDefeatedThisTick,
        storyBoonUsed,
        recentNews,
        newsDecisionUsed,
    };
};
const calculatePortfolioValue = (state) => {
    let value = state.portfolio.cash;
    for (const [companyId, shares] of Object.entries(state.portfolio.holdings)) {
        const company = state.companies.find((entry) => entry.id === companyId);
        if (company) {
            value += company.price * shares;
        }
    }
    return Number(value.toFixed(2));
};
export const createStoryRunnerState = (state) => ({
    seenCutsceneIds: new Set(),
    context: baseStoryContext(state),
});
export const updateStoryContext = (runner, state) => {
    runner.context = baseStoryContext(state);
};
export const triggerStoryScenes = (runner, gameState, trigger, extras = {}) => {
    runner.context = baseStoryContext(gameState, extras);
    const scenes = getTriggeredCutscenes(runner.context, trigger, runner.seenCutsceneIds);
    for (const scene of scenes) {
        if (scene.once) {
            runner.seenCutsceneIds.add(scene.id);
        }
    }
    return scenes;
};
export const mapTriggerFromLifecycle = (event) => event;
export const createStoryContextSnapshot = (runner) => runner.context;
export function buildSceneEvents(scenes, day, ctx) {
    const now = Date.now();
    return scenes.map((scene) => ({
        id: scene.id,
        actId: scene.actId,
        trigger: scene.trigger,
        day,
        timestamp: now,
        lines: renderSceneText(scene, ctx),
    }));
}
