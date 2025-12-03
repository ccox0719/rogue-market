"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderEraList = void 0;
const ui_helpers_js_1 = require("./ui_helpers.js");
const renderEraList = (container, eras, currentIndex) => {
    if (!container)
        return;
    container.innerHTML = "";
    eras.forEach((era, index) => {
        const trend = era.effects.global ?? 0;
        const trendLabel = `${trend >= 0 ? "+" : ""}${trend.toFixed(3)}`;
        const description = era.description ? ` — ${era.description}` : "";
        const item = (0, ui_helpers_js_1.createListItem)(`${era.name} · ${era.duration}d · Trend ${trendLabel}${description}`);
        if (index === currentIndex) {
            item.classList.add("active-era");
        }
        container.appendChild(item);
    });
};
exports.renderEraList = renderEraList;
