"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearRun = exports.loadRun = exports.saveRun = void 0;
const RUN_SAVE_KEY = "rogue-market-run";
const saveRun = (state) => {
    const payload = { state, updatedAt: Date.now() };
    localStorage.setItem(RUN_SAVE_KEY, JSON.stringify(payload));
};
exports.saveRun = saveRun;
const loadRun = () => {
    const raw = localStorage.getItem(RUN_SAVE_KEY);
    if (!raw)
        return null;
    try {
        const payload = JSON.parse(raw);
        return payload.state;
    }
    catch {
        localStorage.removeItem(RUN_SAVE_KEY);
        return null;
    }
};
exports.loadRun = loadRun;
const clearRun = () => {
    localStorage.removeItem(RUN_SAVE_KEY);
};
exports.clearRun = clearRun;
