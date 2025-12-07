import type { MarketNewsItem } from "../core/state.js";

interface NewsUIController {
  appendHeadlines(headlines: MarketNewsItem[]): void;
  updateTicker(headlines: MarketNewsItem[]): void;
  onClose(listener: () => void): () => void;
  isOpen(): boolean;
}

const MAX_DISPLAY_HEADLINES = 5;

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const TOPIC_LABELS: Record<MarketNewsItem["topic"], string> = {
  era: "Era",
  event: "Event",
  whale: "Whale",
};

const trimModalRows = (modalBody: HTMLElement): void => {
  const rows = Array.from(modalBody.querySelectorAll<HTMLElement>(".news-modal__row"));
  while (rows.length > MAX_DISPLAY_HEADLINES) {
    const row = rows.shift();
    row?.remove();
  }
};

export const initializeNewsUI = (container: ParentNode): NewsUIController => {
  const modal = container.querySelector<HTMLElement>("[data-role='news-modal']");
  const modalBody = container.querySelector<HTMLElement>("[data-role='news-modal-body']");
  const openButton = container.querySelector<HTMLButtonElement>("[data-action='open-news-modal']");
  const closeButton = container.querySelector<HTMLButtonElement>("[data-action='close-news-modal']");
  const tickerEl = container.querySelector<HTMLElement>("[data-role='news-ticker-inner']");
  const closeListeners = new Set<() => void>();
  let isOpen = false;

  const setModalVisibility = (visible: boolean): void => {
    if (!modal) return;
    modal.hidden = !visible;
    modal.classList.toggle("news-modal--open", visible);
    isOpen = visible;
  };

  const closeModal = (): void => {
    if (!isOpen) return;
    setModalVisibility(false);
    closeListeners.forEach((listener) => listener());
  };

  const ensurePlaceholder = (): void => {
    if (!modalBody) return;
    if (modalBody.childElementCount === 0) {
      const placeholder = document.createElement("p");
      placeholder.className = "news-modal__placeholder";
      placeholder.textContent = "No headlines yet. Check back once the market moves.";
      modalBody.appendChild(placeholder);
    }
  };

  openButton?.addEventListener("click", () => {
    ensurePlaceholder();
    setModalVisibility(true);
  });
  closeButton?.addEventListener("click", () => closeModal());
  modal?.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  const appendHeadlines = (headlines: MarketNewsItem[]): void => {
    if (!modalBody || headlines.length === 0) return;
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
    setModalVisibility(true);
  };

  const updateTicker = (headlines: MarketNewsItem[]): void => {
    if (!tickerEl || headlines.length === 0) return;
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
    onClose(listener: () => void) {
      closeListeners.add(listener);
      return () => closeListeners.delete(listener);
    },
    isOpen() {
      return isOpen;
    },
  };
};
