"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderEventList = void 0;
const ui_helpers_js_1 = require("./ui_helpers.js");
const renderEventList = (container, events) => {
    if (!container)
        return;
    container.innerHTML = "";
    if (events.length === 0) {
        container.appendChild((0, ui_helpers_js_1.createListItem)("No events today"));
        return;
    }
    for (const event of events) {
        const scope = event.sectorAffinity
            ? event.sectorAffinity
            : event.type === "global"
                ? "global"
                : event.type;
        const item = (0, ui_helpers_js_1.createListItem)(`${event.description} · ${scope} · impact ${(event.impact * 100).toFixed(2)}%`);
        container.appendChild(item);
    }
};
exports.renderEventList = renderEventList;
