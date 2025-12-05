const MAX_DISPLAY_HEADLINES = 5;
const escapeHtml = (value) => value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
const TOPIC_LABELS = {
    era: "Era",
    event: "Event",
    whale: "Whale",
};
const trimModalRows = (modalBody) => {
    const rows = Array.from(modalBody.querySelectorAll(".news-modal__row"));
    while (rows.length > MAX_DISPLAY_HEADLINES) {
        const row = rows.shift();
        row?.remove();
    }
};
export const initializeNewsUI = (container) => {
    const modal = container.querySelector("[data-role='news-modal']");
    const modalBody = container.querySelector("[data-role='news-modal-body']");
    const openButton = container.querySelector("[data-action='open-news-modal']");
    const closeButton = container.querySelector("[data-action='close-news-modal']");
    const tickerEl = container.querySelector("[data-role='news-ticker-inner']");
    const toggleModal = (visible) => {
        if (!modal)
            return;
        modal.hidden = !visible;
        modal.classList.toggle("news-modal--open", visible);
    };
    const ensurePlaceholder = () => {
        if (!modalBody)
            return;
        if (modalBody.childElementCount === 0) {
            const placeholder = document.createElement("p");
            placeholder.className = "news-modal__placeholder";
            placeholder.textContent = "No headlines yet. Check back once the market moves.";
            modalBody.appendChild(placeholder);
        }
    };
    openButton?.addEventListener("click", () => {
        ensurePlaceholder();
        toggleModal(true);
    });
    closeButton?.addEventListener("click", () => toggleModal(false));
    modal?.addEventListener("click", (event) => {
        if (event.target === modal) {
            toggleModal(false);
        }
    });
    const appendHeadlines = (headlines) => {
        if (!modalBody || headlines.length === 0)
            return;
        const existingPlaceholder = modalBody.querySelector(".news-modal__placeholder");
        if (existingPlaceholder) {
            existingPlaceholder.remove();
        }
        const fragment = document.createDocumentFragment();
        for (const headline of headlines) {
            const row = document.createElement("article");
            row.className = `news-modal__row news-modal__row--${headline.topic}`;
            const tag = document.createElement("span");
            tag.className = "news-modal__tag";
            tag.textContent = TOPIC_LABELS[headline.topic];
            row.appendChild(tag);
            const title = document.createElement("h4");
            title.className = "news-modal__headline";
            title.textContent = headline.headline;
            row.appendChild(title);
            if (headline.lines.length > 0) {
                const detail = document.createElement("div");
                detail.className = "news-modal__details";
                for (const line of headline.lines) {
                    const lineNode = document.createElement("p");
                    lineNode.className = "news-modal__line";
                    lineNode.textContent = line;
                    detail.appendChild(lineNode);
                }
                row.appendChild(detail);
            }
            fragment.appendChild(row);
        }
        modalBody.appendChild(fragment);
        trimModalRows(modalBody);
        modalBody.scrollTop = modalBody.scrollHeight;
        toggleModal(true);
    };
    const updateTicker = (headlines) => {
        if (!tickerEl || headlines.length === 0)
            return;
        const displayHeadlines = headlines.slice(-MAX_DISPLAY_HEADLINES);
        const fragments = displayHeadlines.map((headline) => {
            const topicClass = `news-ticker__item news-ticker__item--${headline.topic}`;
            const label = `[${TOPIC_LABELS[headline.topic].toUpperCase()}]`;
            return `<span class="${topicClass}">${label} ${escapeHtml(headline.headline)}</span>`;
        });
        tickerEl.innerHTML = fragments.join('<span class="news-ticker__separator"> · </span>');
    };
    return {
        appendHeadlines,
        updateTicker,
    };
};
