import type { Company } from "../generators/companyGen.js";
import type { PlayerPortfolio } from "../core/state.js";
import { formatCurrency } from "./ui_helpers.js";

export const refreshHoldingsPanel = (
  container: HTMLElement | null,
  portfolio: PlayerPortfolio,
  companies: Company[],
  selectedTicker?: string,
  onSelect?: (ticker: string) => void
): void => {
  if (!container) return;
  container.innerHTML = "";

  const entries = Object.entries(portfolio.holdings).filter(([, quantity]) => quantity > 0);
  if (entries.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "No positions yet - buy shares to populate holdings.";
    container.appendChild(empty);
    return;
  }

  for (const [ticker, quantity] of entries) {
    const company = companies.find((item) => item.ticker === ticker);
    const value = (company?.price ?? 0) * quantity;
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "holding-button";
    if (ticker === selectedTicker) {
      button.classList.add("selected");
    }
    button.textContent = `${ticker}: ${quantity} sh - ${formatCurrency(value)}`;
    button.addEventListener("click", () => onSelect?.(ticker));
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

  for (const company of available) {
    const option = document.createElement("option");
    option.value = company.ticker;
    const label = company.reactiveDetails
      ? `${company.ticker} - ${company.name} (Reactive Micro-Cap)`
      : `${company.ticker} - ${company.name}`;
    option.textContent = label;
    select.appendChild(option);
  }
};
