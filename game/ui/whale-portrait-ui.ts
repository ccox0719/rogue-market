import type { GameState } from "../core/state.js";
import { whaleLibrary } from "../generators/whaleGen.js";
import { getActiveWhaleInstance } from "../whales/whale-state.js";

export function renderWhalePortrait(state: GameState): void {
  const root = document.getElementById("whale-portrait");
  const iconEl = document.getElementById("whale-portrait-icon");
  const nameEl = document.getElementById("whale-portrait-name");
  const titleEl = document.getElementById("whale-portrait-title");

  if (!root || !iconEl || !nameEl || !titleEl) return;

  const active = getActiveWhaleInstance(state);
  if (!active) {
    root.classList.remove("is-active", "is-speaking");
    nameEl.textContent = "No Whale";
    titleEl.textContent = "Awaiting interference";
    iconEl.textContent = "?";
    return;
  }

  const profile = whaleLibrary.find((entry) => entry.id === active.profileId);
  const icon = profile?.icon ?? "ƒ-+";
  iconEl.textContent = icon;
  nameEl.textContent = profile?.displayName ?? "Unknown Whale";
  titleEl.textContent = profile?.style ?? "Market Force";

  root.classList.add("is-active");
}

export function setWhaleSpeaking(speaking: boolean): void {
  const root = document.getElementById("whale-portrait");
  if (!root) return;
  if (speaking) {
    root.classList.add("is-speaking");
  } else {
    root.classList.remove("is-speaking");
  }
}
