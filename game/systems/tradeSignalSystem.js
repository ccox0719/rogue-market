"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateTradeSignals = void 0;
const MOVING_WINDOW = 5;
const calculateConfidence = (gap, trend) => {
    const normalizedGap = Math.min(1, Math.abs(gap) * 5);
    const normalizedTrend = Math.min(1, Math.abs(trend) * 10);
    return Math.min(1, (normalizedGap + normalizedTrend) / 2);
};
const evaluateTradeSignals = (state) => {
    const signals = [];
    for (const company of state.companies) {
        const history = company.history.slice(-MOVING_WINDOW);
        if (history.length < 2)
            continue;
        const average = history.reduce((sum, value) => sum + value, 0) / history.length;
        const gap = (company.price - average) / average;
        const previous = history[history.length - 2];
        const trend = (company.price - previous) / previous;
        const holdings = state.portfolio.holdings[company.ticker] ?? 0;
        const buyThreshold = -0.06 - company.volatility * 0.25;
        const sellThreshold = 0.12 + company.volatility * 0.3;
        if (gap <= buyThreshold) {
            const confidence = calculateConfidence(gap, trend);
            signals.push({
                ticker: company.ticker,
                action: "buy",
                reason: `Price ${(-gap * 100).toFixed(1)}% below ${MOVING_WINDOW}-day average`,
                confidence,
            });
        }
        else if (gap >= sellThreshold && holdings > 0) {
            const confidence = calculateConfidence(gap, trend);
            signals.push({
                ticker: company.ticker,
                action: "sell",
                reason: `Price ${(gap * 100).toFixed(1)}% above ${MOVING_WINDOW}-day average with ${holdings} sh`,
                confidence,
            });
        }
    }
    return signals
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5);
};
exports.evaluateTradeSignals = evaluateTradeSignals;
