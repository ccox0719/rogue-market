import { portfolioValue } from "../systems/portfolioSystem.js";
import { findWhaleProfile } from "../generators/whaleGen.js";
import { queueWhaleDialogue } from "../whale-dialogue.js";
import { getActiveWhaleInstance, removeWhaleFromActiveList, } from "./whale-state.js";
const DEFAULT_REQUIRED_RATIO = 1.2;
export function checkWhaleBuyout(state) {
    const active = getActiveWhaleInstance(state);
    const playerCapital = Math.max(0, portfolioValue(state));
    const whaleId = active?.profileId ?? null;
    const base = {
        canAttempt: false,
        reason: "",
        ratio: 0,
        requiredRatio: DEFAULT_REQUIRED_RATIO,
        whaleId,
    };
    if (!active) {
        return {
            ...base,
            reason: "No whale is actively manipulating the market.",
        };
    }
    const historicalCapital = active.capitalHistory?.[0] ?? active.capital ?? 1;
    const whaleCapital = Math.max(1, active.capital ?? historicalCapital);
    const ratio = whaleCapital > 0 ? playerCapital / whaleCapital : 0;
    if (ratio < 0.25) {
        return {
            ...base,
            ratio,
            reason: "Your capital is a rounding error to them.",
        };
    }
    const baseCapital = Math.max(historicalCapital, whaleCapital);
    if (whaleCapital < baseCapital * 0.25) {
        return {
            ...base,
            ratio,
            reason: "Their empire is already crumbling; no formal buyout needed.",
        };
    }
    if (ratio >= DEFAULT_REQUIRED_RATIO) {
        return {
            ...base,
            canAttempt: true,
            ratio,
            reason: "You have enough capital to challenge their position.",
        };
    }
    return {
        ...base,
        ratio,
        reason: "Grow a bit more before you can force a buyout.",
    };
}
export function applyWhaleBuyout(state) {
    const check = checkWhaleBuyout(state);
    const active = getActiveWhaleInstance(state);
    if (!active || !check.canAttempt || !check.whaleId) {
        return false;
    }
    removeWhaleFromActiveList(state, active.id);
    const existing = state.defeatedWhales ?? [];
    state.defeatedWhales = existing.includes(check.whaleId)
        ? existing
        : [...existing, check.whaleId];
    state.lastWhaleDefeatedId = check.whaleId;
    state.lastWhaleDefeatedDay = state.day;
    state.whaleDefeatedThisTick = true;
    state.whaleDefeatMode = "buyout";
    state.whaleCollapseReason = null;
    state.whaleCollapsedThisTick = false;
    const profile = findWhaleProfile(check.whaleId);
    const displayName = profile?.displayName ?? check.whaleId;
    state.whaleActionLog.push(`Exposed whale ${displayName} on day ${state.day}.`);
    queueWhaleDialogue(state, check.whaleId, "buyout");
    return true;
}
const COLLAPSE_THRESHOLD_PCT = 0.25;
const COLLAPSE_PLAYER_RATIO = 0.75;
export function checkWhaleCollapse(state) {
    const active = getActiveWhaleInstance(state);
    const playerCapital = Math.max(0, portfolioValue(state));
    const base = {
        shouldCollapse: false,
        reason: "",
        collapseThresholdPct: COLLAPSE_THRESHOLD_PCT,
        playerMinRatio: COLLAPSE_PLAYER_RATIO,
        whaleCapital: 0,
        baseCapital: 0,
        whaleId: active?.profileId ?? null,
        playerCapital,
    };
    if (!active) {
        return {
            ...base,
            reason: "No whale is currently active.",
        };
    }
    const historicalCapital = active.capitalHistory?.[0] ?? active.capital ?? 1;
    const baseCap = Math.max(1, historicalCapital);
    const whaleCap = Math.max(0, active.capital ?? 0);
    const relativeToBase = whaleCap / baseCap;
    const playerVsWhale = whaleCap > 0 ? playerCapital / whaleCap : 0;
    const result = {
        ...base,
        whaleCapital: whaleCap,
        baseCapital: baseCap,
        whaleId: base.whaleId,
    };
    if (relativeToBase > COLLAPSE_THRESHOLD_PCT) {
        return {
            ...result,
            reason: "Their empire still has too much width to collapse.",
        };
    }
    if (playerVsWhale < COLLAPSE_PLAYER_RATIO) {
        return {
            ...result,
            reason: "They’re failing, but you’re not large enough to claim the fall yet.",
        };
    }
    return {
        ...result,
        shouldCollapse: true,
        reason: "Their capital crumbles under its own weight while you keep standing.",
    };
}
export function applyWhaleCollapseIfNeeded(state) {
    const check = checkWhaleCollapse(state);
    if (!check.shouldCollapse) {
        return state;
    }
    const success = applyWhaleBuyout(state);
    if (!success) {
        return state;
    }
    state.whaleDefeatMode = "collapse";
    state.whaleCollapseReason = check.reason;
    state.whaleCollapsedThisTick = true;
    state.whaleActionLog.push(`Whale collapsed while you stood tall: ${check.reason}`);
    if (check.whaleId) {
        queueWhaleDialogue(state, check.whaleId, "collapse");
    }
    if (state.whaleActionLog.length > 12) {
        state.whaleActionLog.shift();
    }
    return state;
}
