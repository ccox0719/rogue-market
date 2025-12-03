"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkUnlocks = exports.UNLOCK_THRESHOLDS = void 0;
const portfolioSystem_js_1 = require("./portfolioSystem.js");
exports.UNLOCK_THRESHOLDS = [
    { value: 5000, tool: "sectorView" },
    { value: 15000, tool: "options" },
    { value: 40000, tool: "insiderTips" },
];
const checkUnlocks = (state) => {
    const value = (0, portfolioSystem_js_1.portfolioValue)(state);
    for (const threshold of exports.UNLOCK_THRESHOLDS) {
        if (value > threshold.value && !state.discoveredTools.includes(threshold.tool)) {
            state.discoveredTools.push(threshold.tool);
        }
    }
};
exports.checkUnlocks = checkUnlocks;
