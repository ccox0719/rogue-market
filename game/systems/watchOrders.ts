import type {
  GameState,
  WatchOrder,
  WatchOrderType,
  WatchOrderTimeInForce,
} from "../core/state.js";
import { buyAtPrice, sellAtPrice } from "./portfolioSystem.js";
import type { IntradayRange } from "../core/intraday.js";

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(value, max));

const getLimitBuyFillPrice = (range: IntradayRange, triggerPrice: number): number => {
  const minAllowed = Math.min(range.open, range.low);
  const maxAllowed = Math.max(range.open, triggerPrice);
  return clamp(triggerPrice, minAllowed, maxAllowed);
};

const getLimitSellFillPrice = (range: IntradayRange, triggerPrice: number): number => {
  const minAllowed = Math.min(range.open, triggerPrice);
  const maxAllowed = Math.max(range.open, range.high);
  return clamp(triggerPrice, minAllowed, maxAllowed);
};

const getStopLossFillPrice = (range: IntradayRange, triggerPrice: number): number => {
  if (range.low <= triggerPrice && range.open < triggerPrice) {
    return Math.max(range.low, triggerPrice * 0.9);
  }
  return Math.min(triggerPrice, range.open);
};

const hasWatchCapacity = (state: GameState): boolean =>
  state.watchOrders.length < state.watchOrderLimit;

export const placeLimitBuyWatch = (
  state: GameState,
  companyId: string,
  triggerPrice: number,
  maxCashToSpend: number,
  timeInForce: WatchOrderTimeInForce = "good-till-run"
): WatchOrder | null => {
  const order: WatchOrder = {
    id: crypto.randomUUID(),
    companyId,
    type: "limit-buy",
    triggerPrice,
    maxCashToSpend,
    timeInForce,
    createdDay: state.day,
  };

  if (!hasWatchCapacity(state)) {
    return null;
  }

  state.watchOrders.push(order);
  return order;
};

export const placeLimitSellWatch = (
  state: GameState,
  companyId: string,
  triggerPrice: number,
  sharesToSell: number,
  timeInForce: WatchOrderTimeInForce = "good-till-run"
): WatchOrder | null => {
  const order: WatchOrder = {
    id: crypto.randomUUID(),
    companyId,
    type: "limit-sell",
    triggerPrice,
    sharesToSell,
    timeInForce,
    createdDay: state.day,
  };

  if (!hasWatchCapacity(state)) {
    return null;
  }

  state.watchOrders.push(order);
  return order;
};

export const placeStopLossWatch = (
  state: GameState,
  companyId: string,
  triggerPrice: number,
  sharesToSell: number,
  timeInForce: WatchOrderTimeInForce = "good-till-run"
): WatchOrder | null => {
  const order: WatchOrder = {
    id: crypto.randomUUID(),
    companyId,
    type: "stop-loss",
    triggerPrice,
    sharesToSell,
    timeInForce,
    createdDay: state.day,
  };

  if (!hasWatchCapacity(state)) {
    return null;
  }

  state.watchOrders.push(order);
  return order;
};

export const cancelWatchOrder = (state: GameState, orderId: string): void => {
  state.watchOrders = state.watchOrders.filter((order) => order.id !== orderId);
};

export const processWatchOrdersForDay = (state: GameState): void => {
  const remaining: WatchOrder[] = [];

  for (const order of state.watchOrders) {
    const company = state.companies.find((item) => item.id === order.companyId);
    const range = company?.todayRange;
    const expired =
      order.timeInForce === "day" && order.createdDay < state.day;

    if (expired) {
      continue;
    }

    if (!company || !range?.generated) {
      if (order.timeInForce === "good-till-run") {
        remaining.push(order);
      }
      continue;
    }

    const hit = range.low <= order.triggerPrice && range.high >= order.triggerPrice;
    if (!hit) {
      if (order.timeInForce === "day" && order.createdDay === state.day) {
        continue;
      }
      remaining.push(order);
      continue;
    }

    const fillPrice =
      order.type === "limit-buy"
        ? getLimitBuyFillPrice(range, order.triggerPrice)
        : order.type === "limit-sell"
        ? getLimitSellFillPrice(range, order.triggerPrice)
        : getStopLossFillPrice(range, order.triggerPrice);

    if (order.type === "limit-buy") {
      const spend = order.maxCashToSpend ?? state.portfolio.cash;
      buyAtPrice(state, company.ticker, fillPrice, spend);
    } else if (order.type === "limit-sell") {
      const shares = order.sharesToSell ?? Math.floor(state.portfolio.holdings[company.ticker] ?? 0);
      sellAtPrice(state, company.ticker, fillPrice, shares);
    } else if (order.type === "stop-loss") {
      const shares = order.sharesToSell ?? Math.floor(state.portfolio.holdings[company.ticker] ?? 0);
      sellAtPrice(state, company.ticker, fillPrice, shares);
    }
  }

  state.watchOrders = remaining;
};
