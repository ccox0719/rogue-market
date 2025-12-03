import type { GameState } from "../core/state.js";

const RUN_SAVE_KEY = "rogue-market-run";

interface SavedRun {
  state: GameState;
  updatedAt: number;
}

export const saveRun = (state: GameState): void => {
  const payload: SavedRun = { state, updatedAt: Date.now() };
  localStorage.setItem(RUN_SAVE_KEY, JSON.stringify(payload));
};

export const loadRun = (): GameState | null => {
  const raw = localStorage.getItem(RUN_SAVE_KEY);
  if (!raw) return null;

  try {
    const payload: SavedRun = JSON.parse(raw);
    return payload.state;
  } catch {
    localStorage.removeItem(RUN_SAVE_KEY);
    return null;
  }
};

export const clearRun = (): void => {
  localStorage.removeItem(RUN_SAVE_KEY);
};
