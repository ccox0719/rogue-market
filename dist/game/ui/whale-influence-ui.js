import whales from "../content/whales.js";
import { portfolioValue } from "../systems/portfolioSystem.js";
import { checkWhaleBuyout } from "../whales/whale-defeat.js";
import { getActiveWhaleInstance } from "../whales/whale-state.js";
const WHALES = whales;
const formatMoneyShort = (value) => {
    const abs = Math.abs(value);
    const sign = value < 0 ? "-" : "";
    if (abs >= 1000000000)
        return `${sign}${(abs / 1000000000).toFixed(1)}B`;
    if (abs >= 1000000)
        return `${sign}${(abs / 1000000).toFixed(1)}M`;
    if (abs >= 1000)
        return `${sign}${(abs / 1000).toFixed(1)}K`;
    return `${sign}${abs.toFixed(0)}`;
};
let buyoutHandler = null;
export function bindWhaleBuyoutHandler(handler) {
    buyoutHandler = handler;
    const btn = document.getElementById("whale-buyout-button");
    if (!btn)
        return;
    btn.onclick = () => {
        if (btn.disabled)
            return;
        buyoutHandler?.();
    };
}
export function renderWhaleInfluenceBar(state) {
    const root = document.getElementById("whale-influence");
    if (!root)
        return;
    const playerLabelEl = document.getElementById("whale-influence-player-label");
    const whaleLabelEl = document.getElementById("whale-influence-whale-label");
    const playerValEl = document.getElementById("whale-influence-player-value");
    const whaleValEl = document.getElementById("whale-influence-whale-value");
    const statusEl = document.getElementById("whale-influence-status");
    const fillPlayerEl = document.getElementById("whale-influence-fill-player");
    const fillWhaleEl = document.getElementById("whale-influence-fill-whale");
    const markerEl = document.getElementById("whale-influence-marker");
    const buyoutBtn = document.getElementById("whale-buyout-button");
    if (!playerLabelEl ||
        !whaleLabelEl ||
        !playerValEl ||
        !whaleValEl ||
        !statusEl ||
        !fillPlayerEl ||
        !fillWhaleEl ||
        !markerEl) {
        return;
    }
    const playerCapital = Math.max(0, portfolioValue(state));
    const active = getActiveWhaleInstance(state);
    if (!active) {
        root.hidden = true;
        if (buyoutBtn) {
            buyoutBtn.disabled = true;
            buyoutBtn.textContent = "No Active Whale";
            buyoutBtn.title = "";
        }
        return;
    }
    root.hidden = false;
    const whaleProfile = WHALES.find((whale) => whale.id === active.profileId);
    const whaleName = whaleProfile?.displayName ?? "Whale";
    const whaleCapital = Math.max(1, active.capital ?? active.capitalHistory?.[0] ?? 1);
    playerLabelEl.textContent = "You";
    whaleLabelEl.textContent = whaleName;
    playerValEl.textContent = formatMoneyShort(playerCapital);
    whaleValEl.textContent = formatMoneyShort(whaleCapital);
    const total = playerCapital + whaleCapital;
    let playerRatio = total > 0 ? playerCapital / total : 0;
    let whaleRatio = total > 0 ? whaleCapital / total : 0;
    playerRatio = Math.min(Math.max(playerRatio, 0), 1);
    whaleRatio = Math.min(Math.max(whaleRatio, 0), 1);
    fillPlayerEl.style.width = `${playerRatio * 100}%`;
    fillWhaleEl.style.width = `${whaleRatio * 100}%`;
    const dominance = total > 0 ? (playerCapital / total) * 100 : 0;
    markerEl.style.left = `${Math.min(Math.max(dominance, 0), 100)}%`;
    const ratio = playerCapital / whaleCapital;
    let status = "";
    if (ratio < 0.25) {
        status = "They barely know you exist.";
    }
    else if (ratio < 0.5) {
        status = "You're a small ripple in their empire.";
    }
    else if (ratio < 0.9) {
        status = "You're starting to appear on their radar.";
    }
    else if (ratio < 1.0) {
        status = "You are closing in on their scale.";
    }
    else if (ratio < 1.5) {
        status = "You could challenge their position.";
    }
    else {
        status = "Their empire is within your reach.";
    }
    statusEl.textContent = status;
    if (buyoutBtn) {
        const check = checkWhaleBuyout(state);
        buyoutBtn.disabled = !check.canAttempt;
        if (check.canAttempt) {
            buyoutBtn.textContent = "Expose / Buy Out Whale";
            buyoutBtn.title = "You have enough influence to make a move.";
        }
        else {
            buyoutBtn.textContent = "Challenge Whale";
            buyoutBtn.title = check.reason;
        }
    }
}
