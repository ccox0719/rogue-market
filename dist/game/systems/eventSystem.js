"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateEventShock = exports.runDailyEvents = void 0;
const eventGen_js_1 = require("../generators/eventGen.js");
const clampChance = (value) => Math.min(1, Math.max(0, value));
const runDailyEvents = (state, rng, eventChance, weightOverrides) => {
    state.eventsToday = [];
    state.pendingChoice = null;
    const chance = clampChance(eventChance);
    if (rng.next() >= chance) {
        return [];
    }
    const event = (0, eventGen_js_1.generateEvent)(rng, state.sectors, weightOverrides);
    if (event.type === "player_choice") {
        event.choiceAccepted = false;
        state.pendingChoice = event;
    }
    state.eventsToday.push(event);
    return [event];
};
exports.runDailyEvents = runDailyEvents;
const calculateEventShock = (company, events, options) => {
    if (events.length === 0)
        return 0;
    const negativeMultiplier = options?.negativeImpactMultiplier ?? 1;
    return events.reduce((total, event) => {
        const multiplier = event.sectorAffinity === company.sector ? 1.2 : 0.7;
        const affinity = company.eventAffinity[event.sectorAffinity ?? company.sector] ?? 1;
        const isChoice = event.type === "player_choice";
        const accepted = isChoice ? event.choiceAccepted ?? true : true;
        const rawImpact = accepted ? event.impact : 0;
        const impact = rawImpact < 0 ? rawImpact * negativeMultiplier : rawImpact;
        return total + impact * multiplier * affinity;
    }, 0);
};
exports.calculateEventShock = calculateEventShock;
