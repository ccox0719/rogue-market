"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.advanceEraProgress = exports.getCurrentEra = void 0;
const getCurrentEra = (state) => state.eras[state.currentEraIndex];
exports.getCurrentEra = getCurrentEra;
const advanceEraProgress = (state) => {
    if (state.runOver)
        return;
    state.currentEraDay += 1;
    const currentEra = (0, exports.getCurrentEra)(state);
    if (state.currentEraDay >= currentEra.duration) {
        if (state.currentEraIndex < state.eras.length - 1) {
            state.currentEraIndex += 1;
            state.currentEraDay = 0;
            state.eras[state.currentEraIndex].revealed = true;
        }
    }
};
exports.advanceEraProgress = advanceEraProgress;
