import { setWhaleSpeaking } from "./whale-portrait-ui.js";
const MAX_ENTRIES = 4;
let _speakTimer = null;
export function renderWhaleDialogue(state) {
    const list = document.querySelector("[data-role='whale-dialogue-list']");
    if (!list)
        return;
    const queue = state.whaleDialogueQueue ?? [];
    const entries = queue.slice(-MAX_ENTRIES).reverse();
    list.innerHTML = entries
        .map((entry) => {
        return `
        <li class="whale-dialogue__entry whale-dialogue__entry--${entry.type}">
          <span class="whale-dialogue__icon">${entry.icon}</span>
          <span class="whale-dialogue__text">${entry.text}</span>
        </li>
      `;
    })
        .join("");
    if (entries.length > 0) {
        setWhaleSpeaking(true);
        if (_speakTimer) {
            window.clearTimeout(_speakTimer);
        }
        _speakTimer = window.setTimeout(() => {
            setWhaleSpeaking(false);
            _speakTimer = null;
        }, 2200);
    }
    else {
        setWhaleSpeaking(false);
        if (_speakTimer) {
            window.clearTimeout(_speakTimer);
            _speakTimer = null;
        }
    }
}
