import difficultyModes from "../content/difficultyModes.js";

export type DifficultyModifiers = {
  startingCashMultiplier: number;
  volatilityMultiplier: number;
  eventMultiplier: number;
};

export interface DifficultyMode {
  id: string;
  label: string;
  description: string;
  modifiers: DifficultyModifiers;
  special?: Record<string, unknown>;
}

export const CONFIG = {
  START_CASH: 1_000,
  DAYS_PER_RUN: 30,
  VOLATILITY_RANGE: [0.01, 0.20] as const,
  TREND_BIAS_RANGE: [-0.02, 0.05] as const,
  RANDOMNESS_RANGE: [0.01, 0.10] as const,
  DAILY_EVENT_CHANCE: 0.15,
  ERA_COUNT_RANGE: [3, 6] as const,
  ERA_DURATION_RANGE: [3, 7] as const,
  COMPANY_COUNT: 24,
  STARTING_PRICE_RANGE: [5, 35] as const,
  DEFAULT_DIFFICULTY: "classic",
  DIFFICULTY_MODES: difficultyModes as DifficultyMode[],
  BASE_WATCH_ORDER_LIMIT: 12,
  ERA_MUTATION_BASE_CHANCE: 0.08,
  ERA_MUTATION_CYCLE_BONUS: 0.02,
  ERA_PREDICTION_BASE_ACCURACY: 0.6,
  ERA_PREDICTION_LEVEL_BONUS: 0.03,
  ERA_PREDICTION_MAX_ACCURACY: 0.95,
  ENDLESS_VOLATILITY_BONUS: 0.03,
  ENDLESS_EVENT_BONUS: 0.02,
  WHALE_INITIAL_COUNT: 3,
  WHALE_BASE_ACTION_CHANCE: 0.55,
  WHALE_OBSESSION_LIMIT: 3,
  WHALE_LOG_LIMIT: 4,
  STORY_LOG_LIMIT: 8,
  BOND_LISTING_COUNT: 4,
  BOND_COUPON_PERIOD: 7,
  BOND_LOG_LIMIT: 12,
  SPLIT_THRESHOLD_MULTIPLIER: 3.2,
  SPLIT_RATIO_OPTIONS: [2, 3],
  MAX_SPLIT_COUNT: 3,
  BANKRUPTCY_PRICE_THRESHOLD: 1,
  BANKRUPTCY_DURATION: 4,
  BANKRUPTCY_FINAL_PRICE: 0.05,
  IPO_BASE_CHANCE: 0.15,
  IPO_MAX_PER_DAY: 2,
  LIFECYCLE_LOG_LIMIT: 8,
  REACTIVE_MICROCAP_WINDOW_DAYS: 2,
  REACTIVE_MICROCAP_MIN_DAMAGE: 0.02,
  REACTIVE_MICROCAP_MAX_DAMAGE: 0.1,
  REACTIVE_MICROCAP_PROFIT_DIVISOR: 1250,
  REACTIVE_MICROCAP_INFLUENCE_DIVISOR: 75,
  REACTIVE_MICROCAP_PRICE_RANGE: [1, 5] as const,
  REACTIVE_MICROCAP_VOLATILITY_RANGE: [0.25, 0.6] as const,
  REACTIVE_MICROCAP_RANDOMNESS_RANGE: [0.1, 0.25] as const,
  REACTIVE_MICROCAP_TREND_BIAS_RANGE: [0.03, 0.08] as const,
  REACTIVE_MICROCAP_MARKET_CAP_RANGE: [6_000_000, 80_000_000] as const,
};

const difficultyMap = new Map<
  DifficultyMode["id"],
  DifficultyMode
>(CONFIG.DIFFICULTY_MODES.map((entry) => [entry.id, entry]));

export const getDifficultyMode = (
  id?: DifficultyMode["id"]
): DifficultyMode =>
  difficultyMap.get(id ?? CONFIG.DEFAULT_DIFFICULTY) ??
  CONFIG.DIFFICULTY_MODES[0];
