import type { MetaState } from "../core/metaState.js";

export interface MetaPanelController {
  refresh(meta: MetaState): void;
}

interface MetaPanelOptions {
  container: HTMLElement;
  metaState: MetaState;
}

export const initializeMetaPanel = ({
  container,
  metaState,
}: MetaPanelOptions): MetaPanelController => {
  const difficultyEl = container.querySelector<HTMLElement>("[data-role='meta-difficulty']");
  const artifactGrid = container.querySelector<HTMLElement>("[data-role='artifact-grid']");

  const renderArtifacts = (state: MetaState) => {
    if (!artifactGrid) return;
    artifactGrid.innerHTML = "";
    for (const artifact of state.artifacts) {
      const card = document.createElement("div");
      card.className = `artifact-card${artifact.unlocked ? " unlocked" : ""}`;
      card.innerHTML = `
        <strong>${artifact.name}</strong>
        <p>${artifact.effect}</p>
        <small>${artifact.rarity}</small>
      `;
      artifactGrid.appendChild(card);
    }
  };

  const refresh = (state: MetaState) => {
    difficultyEl && (difficultyEl.textContent = `Difficulty: ${state.difficulty}`);
    renderArtifacts(state);
  };

  refresh(metaState);

  return { refresh };
};
