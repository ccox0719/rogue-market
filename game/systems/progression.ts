import type { GameState } from "../core/state.js";
import { portfolioValue } from "./portfolioSystem.js";

export const UNLOCK_THRESHOLDS = [
  { value: 5_000, tool: "sectorView" },
  { value: 15_000, tool: "options" },
  { value: 40_000, tool: "insiderTips" },
];

export const checkUnlocks = (state: GameState): void => {
  const value = portfolioValue(state);

  for (const threshold of UNLOCK_THRESHOLDS) {
    if (value > threshold.value && !state.discoveredTools.includes(threshold.tool)) {
      state.discoveredTools.push(threshold.tool);
    }
  }
};
