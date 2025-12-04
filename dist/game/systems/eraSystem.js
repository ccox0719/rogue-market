import { generateEraDeck } from "../generators/eraGen.js";
export const getCurrentEra = (state) => state.eras[state.currentEraIndex];
export const advanceEraProgress = (state, rng, difficulty) => {
    if (state.runOver) {
        return { eraChanged: false, deckReset: false };
    }
    state.currentEraDay += 1;
    const currentEra = getCurrentEra(state);
    if (state.currentEraDay >= currentEra.duration) {
        state.currentEraDay = 0;
        if (state.currentEraIndex < state.eras.length - 1) {
            state.currentEraIndex += 1;
            state.eras[state.currentEraIndex].revealed = true;
            state.currentEraMutated = false;
            state.mutationMessage = "";
            return { eraChanged: true, deckReset: false };
        }
        if (difficulty.special?.noRunOver) {
            const nextDeck = generateEraDeck(rng, { cycle: state.eraDeckCycle + 1 });
            state.eras = nextDeck;
            state.eraDeckCycle += 1;
            state.currentEraIndex = 0;
            state.currentEraDay = 0;
            state.eras[0].revealed = true;
            state.currentEraMutated = false;
            state.mutationMessage = "";
            return { eraChanged: true, deckReset: true };
        }
    }
    return { eraChanged: false, deckReset: false };
};
