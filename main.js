const appRoot = document.querySelector("#app");
const status = document.createElement("pre");
const gameShell = document.createElement("div");
gameShell.id = "game-shell";

if (appRoot) {
  appRoot.innerHTML = "";
  appRoot.appendChild(gameShell);
  appRoot.appendChild(status);
}

const importWithFallback = async (primary, fallback) => {
  try {
    return await import(primary);
  } catch (error) {
    console.debug("Falling back to dist bundle", error);
    return await import(fallback);
  }
};

const bootstrap = async () => {
  status.textContent = "Launching simulation...";

  if (!appRoot) {
    return;
  }

  try {
    const { CONFIG } = await importWithFallback(
      "./game/core/config.js",
      "./dist/game/core/config.js"
    );
    const { GameRunner } = await importWithFallback(
      "./game/core/runLoop.js",
      "./dist/game/core/runLoop.js"
    );
    const { initializeUI } = await importWithFallback(
      "./game/ui/ui_main.js",
      "./dist/game/ui/ui_main.js"
    );
    const { loadMeta, saveMeta } = await importWithFallback(
      "./game/saves/metaSave.js",
      "./dist/game/saves/metaSave.js"
    );
    const { changeDifficulty } = await importWithFallback(
      "./game/systems/metaProgress.js",
      "./dist/game/systems/metaProgress.js"
    );

    const savedMeta = loadMeta();
    let uiController = null;
    const runner = new GameRunner({
      metaState: savedMeta,
      onMetaUpdate: (meta) => {
        uiController?.updateMeta(meta);
        status.textContent = runner.summary();
      },
      onSave: (state) => {
        uiController?.updateAutosave(state);
      },
    });

    uiController = initializeUI(runner, gameShell, {
      metaState: runner.metaState,
      onSummaryUpdate: (summary) => {
        status.textContent = summary;
      },
    });

    const difficultyList = gameShell.querySelector("[data-role='difficulty-grid']");

    const renderDifficultyOptions = (activeId) => {
      if (!difficultyList) return;
      difficultyList.innerHTML = "";
      for (const mode of CONFIG.DIFFICULTY_MODES) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "difficulty-choice";
        button.dataset.difficulty = mode.id;
        if (mode.id === activeId) {
          button.dataset.active = "true";
        }
        button.innerHTML = `
          <strong>${mode.label}</strong>
          <span>${mode.description}</span>
        `;
        button.addEventListener("click", () => handleDifficultyChange(mode.id));
        difficultyList.appendChild(button);
      }
    };

    const handleDifficultyChange = (difficultyId) => {
      runner.metaState = changeDifficulty(runner.metaState, difficultyId);
      saveMeta(runner.metaState);
      uiController?.updateMeta(runner.metaState);
      status.textContent = `Difficulty queued: ${difficultyId} (new run)`;
      renderDifficultyOptions(difficultyId);
    };

    renderDifficultyOptions(runner.metaState.difficulty);
  } catch (error) {
    console.warn("Game runner unavailable in this environment.", error);
    status.textContent =
      "Simulation modules are not yet compiled. Run the build before relaunching.";
  }
};

bootstrap();
