const phoneState = {
    pattern: [],
    input: [],
    showingPattern: false,
    inputEnabled: false,
    callback: null,
    flashTimeouts: [],
};
function $(id) {
    return document.getElementById(id);
}
const DEFAULT_PHONE_TITLE = "Phone Unlock – Memory";
const DEFAULT_PHONE_SUBTITLE = "Watch the symbols, then repeat the fade-out pattern to unlock the device.";
function applyHeaderContext(context) {
    const titleEl = document.querySelector("#minigame-phone-overlay .minigame-title");
    if (titleEl) {
        titleEl.textContent = context?.title ?? DEFAULT_PHONE_TITLE;
    }
    const subtitleEl = document.querySelector("#minigame-phone-overlay .minigame-subtitle");
    if (subtitleEl) {
        subtitleEl.textContent = context?.subtitle ?? DEFAULT_PHONE_SUBTITLE;
    }
}
function clearFlashTimeouts() {
    for (const timeoutId of phoneState.flashTimeouts) {
        window.clearTimeout(timeoutId);
    }
    phoneState.flashTimeouts = [];
}
function setSymbolButtonsEnabled(enabled) {
    const symbolButtons = document.querySelectorAll(".minigame-phone-symbol");
    symbolButtons.forEach((btn) => {
        btn.disabled = !enabled;
    });
}
function cleanupPhoneHandlers() {
    const startBtn = $("minigame-phone-start");
    const submitBtn = $("minigame-phone-submit");
    const closeBtn = $("minigame-phone-close");
    if (startBtn) {
        startBtn.onclick = null;
    }
    if (submitBtn) {
        submitBtn.onclick = null;
    }
    if (closeBtn) {
        closeBtn.onclick = null;
    }
    const symbolButtons = document.querySelectorAll(".minigame-phone-symbol");
    symbolButtons.forEach((btn) => {
        btn.onclick = null;
    });
}
function generatePattern() {
    const length = 3 + Math.floor(Math.random() * 3);
    const pattern = [];
    for (let i = 0; i < length; i += 1) {
        const sym = Math.floor(Math.random() * 4);
        pattern.push(sym);
    }
    phoneState.pattern = pattern;
    phoneState.input = [];
}
function playPattern() {
    const sequenceEl = $("minigame-phone-sequence");
    const statusEl = $("minigame-phone-status");
    const submitBtn = $("minigame-phone-submit");
    if (!sequenceEl || !statusEl || !submitBtn) {
        return;
    }
    phoneState.showingPattern = true;
    phoneState.inputEnabled = false;
    submitBtn.disabled = true;
    setSymbolButtonsEnabled(false);
    sequenceEl.innerHTML = "";
    statusEl.textContent = "Memorize the pattern...";
    const pattern = phoneState.pattern;
    const symbolMap = {
        0: "◆",
        1: "●",
        2: "▲",
        3: "★",
    };
    for (let i = 0; i < pattern.length; i += 1) {
        const span = document.createElement("span");
        span.textContent = "•";
        span.style.opacity = "0.3";
        sequenceEl.appendChild(span);
    }
    const children = Array.from(sequenceEl.children);
    const baseDelay = 450;
    clearFlashTimeouts();
    pattern.forEach((sym, idx) => {
        const tShow = idx * baseDelay + 100;
        const tHide = tShow + baseDelay * 0.6;
        const idShow = window.setTimeout(() => {
            const el = children[idx];
            if (!el)
                return;
            el.textContent = symbolMap[sym];
            el.style.opacity = "1";
            el.classList.add("is-flash");
        }, tShow);
        phoneState.flashTimeouts.push(idShow);
        const idHide = window.setTimeout(() => {
            const el = children[idx];
            if (!el)
                return;
            el.classList.remove("is-flash");
            el.textContent = "•";
            el.style.opacity = "0.3";
        }, tHide);
        phoneState.flashTimeouts.push(idHide);
    });
    const totalDuration = pattern.length * baseDelay + 400;
    const idEnable = window.setTimeout(() => {
        phoneState.showingPattern = false;
        phoneState.inputEnabled = true;
        setSymbolButtonsEnabled(true);
        submitBtn.disabled = false;
        statusEl.textContent = `Pattern faded. Repeat the ${pattern.length} symbols you saw.`;
        sequenceEl.innerHTML = "";
    }, totalDuration);
    phoneState.flashTimeouts.push(idEnable);
}
function evaluatePhoneUnlockResult() {
    const { pattern, input } = phoneState;
    const maxLen = pattern.length;
    let correctCount = 0;
    for (let i = 0; i < maxLen; i += 1) {
        if (input[i] === pattern[i]) {
            correctCount += 1;
        }
    }
    const accuracy = maxLen > 0 ? correctCount / maxLen : 0;
    const score = Math.min(1, Math.max(0, accuracy));
    let tier;
    if (accuracy === 1 && input.length === pattern.length) {
        tier = "perfect";
    }
    else if (accuracy >= 0.75) {
        tier = "good";
    }
    else if (accuracy >= 0.4) {
        tier = "ok";
    }
    else {
        tier = "poor";
    }
    const storyMap = {
        perfect: "You replayed the flash perfectly. The neighbor bursts into relieved laughter.",
        good: "A few second guesses, but you still cracked the pattern.",
        ok: "You eventually figured it out. The phone unlocks with a sigh.",
        poor: "The buttons blurred together. You leave them to figure it out.",
    };
    return {
        score,
        story: storyMap[tier],
        tag: "phone_unlock",
    };
}
function randomInRange(min, max) {
    return min + Math.random() * (max - min);
}
export function launchPhoneUnlockMiniGame(callback, context) {
    const overlay = $("minigame-phone-overlay");
    const startBtn = $("minigame-phone-start");
    const submitBtn = $("minigame-phone-submit");
    const closeBtn = $("minigame-phone-close");
    const resultEl = $("minigame-phone-result");
    const statusEl = $("minigame-phone-status");
    if (!overlay || !startBtn || !submitBtn || !closeBtn || !resultEl || !statusEl) {
        return;
    }
    phoneState.callback = callback;
    phoneState.pattern = [];
    phoneState.input = [];
    phoneState.showingPattern = false;
    phoneState.inputEnabled = false;
    clearFlashTimeouts();
    applyHeaderContext(context);
    overlay.classList.add("is-visible");
    resultEl.textContent = "";
    statusEl.textContent = "Press Start to see the pattern.";
    submitBtn.disabled = true;
    setSymbolButtonsEnabled(false);
    startBtn.onclick = () => {
        if (phoneState.showingPattern) {
            return;
        }
        resultEl.textContent = "";
        generatePattern();
        playPattern();
    };
    submitBtn.onclick = () => {
        if (!phoneState.inputEnabled) {
            return;
        }
        const result = evaluatePhoneUnlockResult();
        resultEl.textContent = result.story;
        window.setTimeout(() => {
            overlay.classList.remove("is-visible");
            if (phoneState.callback) {
                phoneState.callback(result);
            }
            cleanupPhoneHandlers();
            clearFlashTimeouts();
        }, 700);
    };
    closeBtn.onclick = () => {
        overlay.classList.remove("is-visible");
        clearFlashTimeouts();
        const result = {
            score: 0,
            story: "You skipped the unlock job. No cash earned.",
            tag: "phone_unlock",
        };
        if (phoneState.callback) {
            phoneState.callback(result);
        }
        cleanupPhoneHandlers();
    };
    const symbolButtons = document.querySelectorAll(".minigame-phone-symbol");
    symbolButtons.forEach((btn) => {
        btn.onclick = () => {
            if (!phoneState.inputEnabled) {
                return;
            }
            const sym = parseInt(btn.dataset.symbol ?? "0", 10);
            phoneState.input.push(sym);
            btn.classList.add("is-flash");
            const flashId = window.setTimeout(() => {
                btn.classList.remove("is-flash");
            }, 120);
            phoneState.flashTimeouts.push(flashId);
            statusEl.textContent = `Entered ${phoneState.input.length}/${phoneState.pattern.length} symbols.`;
        };
    });
}
