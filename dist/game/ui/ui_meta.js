import { formatCurrency } from "./ui_helpers.js";
export const initializeMetaPanel = ({ container, metaState, }) => {
    const difficultyEl = container.querySelector("[data-role='meta-difficulty']");
    const runsEl = container.querySelector("[data-role='meta-runs']");
    const bestPeakEl = container.querySelector("[data-role='meta-best-peak']");
    const bestFinalEl = container.querySelector("[data-role='meta-best-final']");
    const bestDayEl = container.querySelector("[data-role='meta-best-day']");
    const xpEl = container.querySelector("[data-role='meta-xp']");
    const levelEl = container.querySelector("[data-role='meta-level']");
    const refresh = (state) => {
        difficultyEl && (difficultyEl.textContent = `Difficulty: ${state.difficulty}`);
        runsEl && (runsEl.textContent = state.totalRuns.toString());
        bestPeakEl &&
            (bestPeakEl.textContent = formatCurrency(state.bestPortfolioPeak));
        bestFinalEl &&
            (bestFinalEl.textContent = formatCurrency(state.bestFinalPortfolio));
        bestDayEl &&
            (bestDayEl.textContent = formatCurrency(state.bestSingleDayGain));
        xpEl && (xpEl.textContent = state.xp.toString());
        levelEl && (levelEl.textContent = state.level.toString());
    };
    refresh(metaState);
    return { refresh };
};
