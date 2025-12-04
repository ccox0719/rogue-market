import type { RNG } from "../core/rng.js";
import type { GameState } from "../core/state.js";
import { CONFIG } from "../core/config.js";
import { generateCompany, type Company } from "../generators/companyGen.js";

const addLifecycleLog = (state: GameState, message: string): void => {
  state.lifecycleLog.push(message);
  if (state.lifecycleLog.length > CONFIG.LIFECYCLE_LOG_LIMIT) {
    state.lifecycleLog.shift();
  }
};

const resetCompanyRange = (company: Company): void => {
  company.todayRange = {
    open: company.price,
    high: company.price,
    low: company.price,
    close: company.price,
    generated: true,
  };
};

const clearWatchOrdersForCompany = (state: GameState, companyId: string): void => {
  state.watchOrders = state.watchOrders.filter(
    (order) => order.companyId !== companyId
  );
};

export const splitCompany = (
  state: GameState,
  company: Company,
  ratio: number,
  options: { force?: boolean } = {}
): boolean => {
  if (!company.isActive) {
    return false;
  }
  if (ratio <= 1) {
    return false;
  }
  if (!options.force && company.splitCount >= CONFIG.MAX_SPLIT_COUNT) {
    return false;
  }
  const holdings = state.portfolio.holdings[company.ticker] ?? 0;
  if (holdings > 0) {
    state.portfolio.holdings[company.ticker] = holdings * ratio;
  }
  const preSplitPrice = company.price;
  const newPrice = Number(Math.max(0.01, preSplitPrice / ratio).toFixed(2));
  company.price = newPrice;
  company.history[company.history.length - 1] = newPrice;
  company.splitReferencePrice = newPrice;
  company.splitCount += 1;
  resetCompanyRange(company);
  addLifecycleLog(
    state,
    `Stock split: ${company.ticker} ${ratio}-for-1 (${company.name}).`
  );
  return true;
};

export const bankruptCompany = (
  state: GameState,
  company: Company,
  reason?: string
): boolean => {
  if (!company.isActive) {
    return false;
  }
  company.isActive = false;
  const failurePrice = Number(CONFIG.BANKRUPTCY_FINAL_PRICE.toFixed(2));
  company.price = failurePrice;
  company.history[company.history.length - 1] = failurePrice;
  company.daysBelowBankruptcyThreshold = 0;
  resetCompanyRange(company);
  state.portfolio.holdings[company.ticker] = 0;
  clearWatchOrdersForCompany(state, company.id);
  const suffix = reason ? ` (${reason})` : "";
  addLifecycleLog(
    state,
    `Bankruptcy: ${company.ticker} ${company.name} failed${suffix}.`
  );
  return true;
};

export const spawnIPO = (
  state: GameState,
  rng: RNG,
  reason?: string
): Company => {
  const company = generateCompany(rng, state.sectors);
  state.companies.push(company);
  const suffix = reason ? ` after ${reason}` : "";
  addLifecycleLog(
    state,
    `IPO: ${company.name} (${company.ticker}) lists${suffix}.`
  );
  return company;
};

export const processStockLifecycle = (state: GameState, rng: RNG): void => {
  const era = state.eras[state.currentEraIndex];
  const splitMultiplier = era?.effects?.splitThresholdMultiplier ?? 1;
  const bankruptcySeverity = era?.effects?.bankruptcySeverity ?? 1;
  const ipoMultiplier = era?.effects?.ipoFrequencyMultiplier ?? 1;
  const splitOptions = CONFIG.SPLIT_RATIO_OPTIONS;
  const companyCount = state.companies.length;
  let dailyIpoCount = 0;

  for (let i = 0; i < companyCount; i += 1) {
    const company = state.companies[i];
    if (!company.isActive) {
      continue;
    }
    company.daysSinceListing += 1;

    const splitThreshold =
      company.splitReferencePrice *
      CONFIG.SPLIT_THRESHOLD_MULTIPLIER *
      splitMultiplier;
    if (
      company.price >= splitThreshold &&
      company.splitCount < CONFIG.MAX_SPLIT_COUNT
    ) {
      const index = Math.floor(rng.next() * splitOptions.length);
      const ratio = splitOptions[index];
      splitCompany(state, company, ratio);
      continue;
    }

    const bankruptcyThreshold =
      CONFIG.BANKRUPTCY_PRICE_THRESHOLD * bankruptcySeverity;
    if (company.price <= bankruptcyThreshold) {
      company.daysBelowBankruptcyThreshold += 1;
    } else {
      company.daysBelowBankruptcyThreshold = 0;
    }

    if (company.daysBelowBankruptcyThreshold >= CONFIG.BANKRUPTCY_DURATION) {
      if (bankruptCompany(state, company, "prolonged decline")) {
        if (dailyIpoCount < CONFIG.IPO_MAX_PER_DAY) {
          spawnIPO(state, rng, "bankruptcy replacement");
          dailyIpoCount += 1;
        }
      }
    }
  }

  const ipoChance = Math.min(1, CONFIG.IPO_BASE_CHANCE * ipoMultiplier);
  while (dailyIpoCount < CONFIG.IPO_MAX_PER_DAY) {
    if (rng.next() >= ipoChance) {
      break;
    }
    spawnIPO(state, rng, "market wave");
    dailyIpoCount += 1;
  }
};
