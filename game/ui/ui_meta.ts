import type { MetaProfile } from "../core/metaState.js";
import { formatCurrency } from "./ui_helpers.js";

export interface MetaPanelController {
  refresh(meta: MetaProfile): void;
}

interface MetaPanelOptions {
  container: HTMLElement;
  metaState: MetaProfile;
}

export const initializeMetaPanel = ({
  container,
  metaState,
}: MetaPanelOptions): MetaPanelController => {
  const difficultyEl = container.querySelector<HTMLElement>("[data-role='meta-difficulty']");
  const runsEl = container.querySelector<HTMLElement>("[data-role='meta-runs']");
  const bestPeakEl = container.querySelector<HTMLElement>("[data-role='meta-best-peak']");
  const bestFinalEl = container.querySelector<HTMLElement>("[data-role='meta-best-final']");
  const bestDayEl = container.querySelector<HTMLElement>("[data-role='meta-best-day']");
  const xpEl = container.querySelector<HTMLElement>("[data-role='meta-xp']");
  const levelEl = container.querySelector<HTMLElement>("[data-role='meta-level']");

  const refresh = (state: MetaProfile) => {
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
