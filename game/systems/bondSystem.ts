import type { GameState } from "../core/state.js";
import type { RNG } from "../core/rng.js";
import { CONFIG } from "../core/config.js";
import {
  BondHolding,
  BondMarketListing,
  createBondMarket,
  findBondDefinition,
} from "../generators/bondGen.js";

const addBondLog = (state: GameState, message: string): void => {
  state.bondActionLog.push(message);
  if (state.bondActionLog.length > CONFIG.BOND_LOG_LIMIT) {
    state.bondActionLog.shift();
  }
};

export const initializeBondMarket = (state: GameState, rng: RNG): void => {
  if (state.bondMarket.length > 0) {
    return;
  }
  state.bondMarket = createBondMarket(rng, CONFIG.BOND_LISTING_COUNT);
};

export const refreshBondMarket = (state: GameState, rng: RNG): void => {
  state.bondMarket = createBondMarket(rng, CONFIG.BOND_LISTING_COUNT);
};

export const buyBondFromListing = (
  state: GameState,
  listingId: string
): boolean => {
  const listing = state.bondMarket.find((item) => item.id === listingId);
  if (!listing) {
    return false;
  }
  const cost = listing.faceValue;
  if (state.portfolio.cash < cost) {
    return false;
  }
  const definition = findBondDefinition(listing.bondId);
  const holding = state.bondHoldings.find(
    (entry) =>
      entry.bondId === listing.bondId &&
      entry.daysToMaturity === listing.durationDays
  );
  if (holding) {
    holding.units += 1;
  } else {
    const defaultChance = definition?.defaultChance ?? 0;
    const newHolding: BondHolding = {
      id: crypto.randomUUID(),
      bondId: listing.bondId,
      units: 1,
      faceValue: listing.faceValue,
      couponRate: listing.couponRate,
      daysToMaturity: listing.durationDays,
      type: listing.type,
      defaultChance,
    };
    state.bondHoldings.push(newHolding);
  }
  state.portfolio.cash -= cost;
  addBondLog(
    state,
    `Bought ${definition?.name ?? listing.bondId} (${listing.type.toUpperCase()}).`
  );
  return true;
};

export const processBondsForDay = (state: GameState, rng: RNG): void => {
  const era = state.eras[state.currentEraIndex];
  const eraYield = era?.effects?.bondYieldMult ?? 1;
  const eraDefaultDelta = era?.effects?.bondDefaultDelta ?? 0;
  const couponPeriod = CONFIG.BOND_COUPON_PERIOD;

  const updated: BondHolding[] = [];
  for (const holding of state.bondHoldings) {
    const couponDaily =
      (holding.couponRate * eraYield / couponPeriod) *
      holding.faceValue *
      holding.units;
    state.portfolio.cash += couponDaily;
    holding.daysToMaturity -= 1;
    const defaultChance = Math.max(0, holding.defaultChance + eraDefaultDelta);
    if (rng.next() < defaultChance) {
      addBondLog(
        state,
        `${holding.type.toUpperCase()} bond ${holding.bondId} defaulted.`
      );
      continue;
    }
    if (holding.daysToMaturity <= 0) {
      state.portfolio.cash += holding.faceValue * holding.units;
      addBondLog(
        state,
        `${holding.type.toUpperCase()} bond ${holding.bondId} matured.`
      );
      continue;
    }
    updated.push(holding);
  }
  state.bondHoldings = updated;
};
