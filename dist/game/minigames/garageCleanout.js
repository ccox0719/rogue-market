const DOUBLE_ATTEMPTS = 4;
const LOOT_SCORE_MAP = {
    nothing: 0.12,
    cash_small: 0.38,
    cash_medium: 0.6,
    cash_big: 0.72,
    collectible: 0.85,
};
const garageState = {
    boxes: [],
    pickedIndex: null,
    callback: null,
    failureBox: null,
    remainingAttempts: 0,
    currentCash: 0,
    pendingResult: null,
    baseScore: 0,
};
const DEFAULT_GARAGE_TITLE = "Garage Cleanout";
const DEFAULT_GARAGE_SUBTITLE = "Mom and Dad told you the garage sale is a mess. Flip the right crate before you bust the busted one.";
function $(id) {
    return document.getElementById(id);
}
function applyHeaderContext(context) {
    const titleEl = document.querySelector("#minigame-garage-overlay .minigame-title");
    if (titleEl) {
        titleEl.textContent = context?.title ?? DEFAULT_GARAGE_TITLE;
    }
    const subtitleEl = document.querySelector("#minigame-garage-overlay .minigame-subtitle");
    if (subtitleEl) {
        subtitleEl.textContent = context?.subtitle ?? DEFAULT_GARAGE_SUBTITLE;
    }
}
export function launchGarageCleanoutMiniGame(callback, context) {
    const overlay = $("minigame-garage-overlay");
    const resultEl = $("minigame-garage-result");
    const labelEl = $("minigame-garage-label");
    const closeBtn = $("minigame-garage-close");
    const lockInBtn = $("minigame-garage-lockin");
    if (!overlay || !resultEl || !labelEl || !closeBtn) {
        return;
    }
    garageState.callback = callback;
    garageState.boxes = generateGarageLoot();
    garageState.pickedIndex = null;
    garageState.failureBox = null;
    garageState.remainingAttempts = 0;
    garageState.currentCash = 0;
    garageState.pendingResult = null;
    garageState.baseScore = 0;
    applyHeaderContext(context);
    overlay.classList.add("is-visible");
    resultEl.textContent = "";
    labelEl.textContent = "Choose one box.";
    if (lockInBtn) {
        lockInBtn.disabled = true;
    }
    const boxButtons = Array.from(document.querySelectorAll(".minigame-garage-box"));
    const resetButtons = () => {
        boxButtons.forEach((btn) => {
            btn.disabled = false;
            btn.classList.remove("is-selected", "is-empty");
            btn.textContent = "📦";
        });
    };
    resetButtons();
    const handleClick = (btn) => {
        if (garageState.pickedIndex === null) {
            handleInitialPick(btn, labelEl, resultEl, boxButtons, lockInBtn);
        }
        else {
            handleDoublePick(btn, labelEl, resultEl, overlay, lockInBtn, boxButtons);
        }
    };
    boxButtons.forEach((btn) => {
        btn.onclick = () => handleClick(btn);
    });
    if (lockInBtn) {
        lockInBtn.onclick = () => {
            if (!garageState.pendingResult)
                return;
            completeResult(overlay, garageState.pendingResult);
        };
    }
    closeBtn.onclick = () => {
        const result = {
            score: 0,
            story: "You walked away from the garage. The parents will handle the mess.",
            tag: "garage_cleanout",
        };
        completeResult(overlay, result);
    };
}
function handleInitialPick(btn, labelEl, resultEl, boxButtons, lockInBtn) {
    if (garageState.pickedIndex !== null) {
        return;
    }
    const idx = Number(btn.dataset.box ?? -1);
    if (idx < 0) {
        return;
    }
    garageState.pickedIndex = idx;
    boxButtons.forEach((b) => {
        b.disabled = true;
    });
    btn.disabled = true;
    btn.classList.add("is-selected");
    const loot = garageState.boxes[idx];
    revealInitialLoot(loot, labelEl, resultEl, boxButtons, lockInBtn, idx);
}
function handleDoublePick(btn, labelEl, resultEl, overlay, lockInBtn, boxButtons) {
    if (garageState.failureBox === null || garageState.remainingAttempts <= 0) {
        return;
    }
    const idx = Number(btn.dataset.box ?? -1);
    if (idx < 0) {
        return;
    }
    if (idx === garageState.pickedIndex) {
        return;
    }
    btn.disabled = true;
    const isFailure = idx === garageState.failureBox;
    garageState.remainingAttempts = Math.max(0, garageState.remainingAttempts - 1);
    if (isFailure) {
        btn.classList.add("is-empty");
        garageState.currentCash = 0;
        const story = "You hit the busted crate and lose the whole streak.";
        const result = {
            score: 0,
            story,
            tag: "garage_cleanout",
        };
        garageState.pendingResult = result;
        resultEl.textContent = story;
        labelEl.textContent = "Double or nothing failed.";
        window.setTimeout(() => completeResult(overlay, result), 900);
        return;
    }
    garageState.currentCash = Number((garageState.currentCash * 2).toFixed(0));
    const score = computeDoubleScore();
    const story = `You doubled the haul to $${garageState.currentCash.toFixed(0)}.`;
    const result = {
        score,
        story,
        tag: "garage_cleanout",
    };
    garageState.pendingResult = result;
    resultEl.textContent = story;
    const remaining = garageState.remainingAttempts;
    labelEl.textContent = remaining
        ? `Double or nothing? ${remaining} pick(s) left.`
        : "No crates remain. Lock in the haul.";
    if (lockInBtn) {
        lockInBtn.disabled = false;
    }
    if (remaining <= 0) {
        window.setTimeout(() => completeResult(overlay, result), 900);
    }
}
function revealInitialLoot(loot, labelEl, resultEl, boxButtons, lockInBtn, pickedIdx) {
    const displayButton = boxButtons.find((btn) => Number(btn.dataset.box ?? -1) === pickedIdx);
    if (displayButton) {
        if (loot.type === "nothing") {
            displayButton.textContent = "🕸️";
            displayButton.classList.add("is-empty");
        }
        else if (loot.type === "collectible") {
            displayButton.textContent = "🏅";
        }
        else {
            displayButton.textContent = "💵";
        }
    }
    labelEl.textContent = loot.label;
    const cash = loot.cash;
    const description = loot.type === "nothing"
        ? `${loot.flavor} No cash to flip today.`
        : `${loot.flavor} You score $${cash.toFixed(0)} in potential flips.`;
    resultEl.textContent = description;
    garageState.currentCash = cash;
    garageState.baseScore = LOOT_SCORE_MAP[loot.type] ?? 0.25;
    garageState.pendingResult = {
        score: garageState.baseScore,
        story: description,
        tag: "garage_cleanout",
    };
    garageState.failureBox = pickFailureBox(pickedIdx);
    garageState.remainingAttempts = DOUBLE_ATTEMPTS;
    if (lockInBtn) {
        lockInBtn.disabled = false;
    }
    boxButtons.forEach((btn) => {
        const index = Number(btn.dataset.box ?? -1);
        btn.disabled = index === pickedIdx;
    });
    labelEl.textContent = `Double or nothing? ${DOUBLE_ATTEMPTS} pick(s) left.`;
}
function pickFailureBox(exclude) {
    const candidates = [0, 1, 2, 3, 4].filter((index) => index !== exclude);
    const choice = candidates[Math.floor(Math.random() * candidates.length)];
    return choice;
}
function computeDoubleScore() {
    const doubles = DOUBLE_ATTEMPTS - garageState.remainingAttempts;
    const bonus = Math.min(0.35, doubles * 0.08);
    return Math.min(1, garageState.baseScore + bonus);
}
function completeResult(overlay, result) {
    overlay.classList.remove("is-visible");
    garageState.pendingResult = null;
    garageState.failureBox = null;
    garageState.pickedIndex = null;
    garageState.remainingAttempts = 0;
    garageState.currentCash = 0;
    if (garageState.callback) {
        garageState.callback(result);
    }
    cleanupHandlers();
}
function cleanupHandlers() {
    const closeBtn = $("minigame-garage-close");
    const lockInBtn = $("minigame-garage-lockin");
    if (closeBtn) {
        closeBtn.onclick = null;
    }
    if (lockInBtn) {
        lockInBtn.onclick = null;
        lockInBtn.disabled = true;
    }
    const boxButtons = document.querySelectorAll(".minigame-garage-box");
    boxButtons.forEach((btn) => {
        btn.onclick = null;
    });
}
function generateGarageLoot() {
    const makeLoot = (type) => {
        switch (type) {
            case "cash_small":
                return {
                    type,
                    cash: randomInRange(10, 30),
                    label: "Loose Change Box",
                    flavor: "You dig through receipts and coins.",
                };
            case "cash_medium":
                return {
                    type,
                    cash: randomInRange(40, 80),
                    label: "Forgotten Jacket",
                    flavor: "You find bills in a forgotten pocket.",
                };
            case "cash_big":
                return {
                    type,
                    cash: randomInRange(120, 250),
                    label: "Old Envelope",
                    flavor: 'A dusty envelope marked "For later".',
                };
            case "collectible":
                return {
                    type,
                    cash: randomInRange(150, 320),
                    label: "Limited Edition Collectible",
                    flavor: "You uncover something that will sell like crazy online.",
                };
            case "nothing":
            default:
                return {
                    type: "nothing",
                    cash: 0,
                    label: "Just Junk",
                    flavor: "It is mostly spiderwebs and expired coupons.",
                };
        }
    };
    const lootTypes = ["cash_big", "collectible", "cash_medium", "cash_small", "nothing"];
    for (let i = lootTypes.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [lootTypes[i], lootTypes[j]] = [lootTypes[j], lootTypes[i]];
    }
    return lootTypes.map((type) => makeLoot(type));
}
function randomInRange(min, max) {
    return min + Math.random() * (max - min);
}
