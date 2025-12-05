import { formatCurrency } from "./ui_helpers.js";
export const initializeMetaPanel = ({ container, metaState, }) => {
    const difficultyEl = container.querySelector("[data-role='meta-difficulty']");
    const artifactGrid = container.querySelector("[data-role='artifact-grid']");
    const runsEl = container.querySelector("[data-role='meta-runs']");
    const bestPeakEl = container.querySelector("[data-role='meta-best-peak']");
    const bestFinalEl = container.querySelector("[data-role='meta-best-final']");
    const bestDayEl = container.querySelector("[data-role='meta-best-day']");
    const xpEl = container.querySelector("[data-role='meta-xp']");
    const levelEl = container.querySelector("[data-role='meta-level']");
    const renderArtifacts = (state) => {
        if (!artifactGrid)
            return;
        artifactGrid.innerHTML = "";
        for (const artifact of state.artifacts) {
            const card = document.createElement("div");
            card.className = `artifact-card${artifact.unlocked ? " unlocked" : ""}`;
            const tags = artifact.tags?.length
                ? `<span class="artifact-card__tags">${artifact.tags.join(" · ")}</span>`
                : "";
            card.innerHTML = `
        <strong>${artifact.name}</strong>
        <p>${artifact.description}</p>
        <div class="artifact-card__meta">
          <small>${artifact.rarity}</small>
          ${tags}
        </div>
      `;
            artifactGrid.appendChild(card);
        }
    };
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
        renderArtifacts(state);
    };
    refresh(metaState);
    return { refresh };
};
