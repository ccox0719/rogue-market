"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderSignalList = void 0;
const ui_helpers_js_1 = require("./ui_helpers.js");
const renderSignalList = (container, signals) => {
    if (!container)
        return;
    container.innerHTML = "";
    if (signals.length === 0) {
        container.appendChild((0, ui_helpers_js_1.createListItem)("No signals right now."));
        return;
    }
    for (const signal of signals) {
        const item = (0, ui_helpers_js_1.createListItem)(`${signal.ticker} · ${signal.action.toUpperCase()} · ${signal.reason}`);
        const badge = document.createElement("span");
        badge.className = `signal-badge signal-${signal.action}`;
        badge.textContent = `${Math.round(signal.confidence * 100)}%`;
        item.appendChild(badge);
        container.appendChild(item);
    }
};
exports.renderSignalList = renderSignalList;
