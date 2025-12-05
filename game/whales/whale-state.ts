import type { GameState } from "../core/state.js";
import type { WhaleInstance } from "../generators/whaleGen.js";

export function getActiveWhaleInstance(state: GameState): WhaleInstance | null {
  if (state.activeWhales.length === 0) {
    return null;
  }

  const visible = state.activeWhales.find((entry) => entry.visible);
  if (visible) {
    return visible;
  }

  return state.activeWhales[0] ?? null;
}

export function removeWhaleFromActiveList(state: GameState, whaleId: string): void {
  state.activeWhales = state.activeWhales.filter((entry) => entry.id !== whaleId);
}
