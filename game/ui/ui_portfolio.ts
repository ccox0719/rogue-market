import type { Company } from "../generators/companyGen.js";
import type { PlayerPortfolio } from "../core/state.js";
import { formatCurrency } from "./ui_helpers.js";

export type HoldingsSortMode = "ticker" | "value" | "delta";

const formatPercentChange = (value: number): string => {
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${(value * 100).toFixed(2)}%`;
};

export const refreshHoldingsPanel = (
  container: HTMLElement | null,
  portfolio: PlayerPortfolio,
  companies: Company[],
  selectedTicker?: string,
  onSelect?: (ticker: string) => void,
  sortMode: HoldingsSortMode = "ticker"
): void => {
  if (!container) return;
  container.innerHTML = "";

  type HoldingEntry = {
    ticker: string;
    quantity: number;
    company?: Company;
    value: number;
    changePct: number;
  };

  const rawEntries = Object.entries(portfolio.holdings).filter(
    ([, quantity]) => quantity > 0
  );

  const entries: HoldingEntry[] = rawEntries.map(([ticker, quantity]) => {
    const company = companies.find((item) => item.ticker === ticker);
    const history = company?.history ?? [];
    const previous =
      history.length > 1
        ? history[history.length - 2]
        : history[history.length - 1] ?? company?.price ?? 0;
    const currentPrice = company?.price ?? 0;
    const changePct = previous === 0 ? 0 : (currentPrice - previous) / previous;
    return {
      ticker,
      quantity,
      company,
      value: currentPrice * quantity,
      changePct,
    };
  });

  if (entries.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "No positions yet - buy shares to populate holdings.";
    container.appendChild(empty);
    return;
  }

  entries.sort((a, b) => {
    if (sortMode === "value") {
      return b.value - a.value;
    }
    if (sortMode === "delta") {
      return b.changePct - a.changePct;
    }
    return a.ticker.localeCompare(b.ticker);
  });

  for (const entry of entries) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "holding-button";
    if (entry.ticker === selectedTicker) {
      button.classList.add("selected");
    }
    if (entry.changePct > 0) {
      button.classList.add("holding-button--up");
    } else if (entry.changePct < 0) {
      button.classList.add("holding-button--down");
    }

    const changeLabel = formatPercentChange(entry.changePct);
    button.textContent = `${entry.ticker}: ${entry.quantity} sh · ${formatCurrency(
      entry.value
    )} (${changeLabel})`;
    button.addEventListener("click", () => onSelect?.(entry.ticker));
    item.appendChild(button);
    container.appendChild(item);
  }
};

export const populateTickerOptions = (
  select: HTMLSelectElement | null,
  companies: Company[]
): void => {
  if (!select) return;
  select.innerHTML = "";
  const available = companies.filter((company) => company.isActive);
  if (available.length === 0) {
    const placeholder = document.createElement("option");
    placeholder.disabled = true;
    placeholder.textContent = "No active listings";
    select.appendChild(placeholder);
    return;
  }

  const sortedOptions = [...available].sort((a, b) => {
    const sectorDiff = a.sector.localeCompare(b.sector);
    return sectorDiff !== 0 ? sectorDiff : a.ticker.localeCompare(b.ticker);
  });

  for (const company of sortedOptions) {
    const option = document.createElement("option");
    option.value = company.ticker;
    const label = company.reactiveDetails
      ? `${company.ticker} - ${company.name} (Reactive Micro-Cap)`
      : `${company.ticker} - ${company.name}`;
    option.textContent = label;
    select.appendChild(option);
  }
};
