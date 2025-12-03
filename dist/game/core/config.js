"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDifficultyMode = exports.CONFIG = void 0;
const difficultyModes_json_1 = __importDefault(require("../content/difficultyModes.json"));
exports.CONFIG = {
    START_CASH: 1000,
    DAYS_PER_RUN: 30,
    VOLATILITY_RANGE: [0.01, 0.20],
    TREND_BIAS_RANGE: [-0.02, 0.05],
    RANDOMNESS_RANGE: [0.01, 0.10],
    DAILY_EVENT_CHANCE: 0.15,
    ERA_COUNT_RANGE: [3, 6],
    ERA_DURATION_RANGE: [3, 7],
    COMPANY_COUNT: 18,
    STARTING_PRICE_RANGE: [5, 35],
    DEFAULT_DIFFICULTY: "classic",
    DIFFICULTY_MODES: difficultyModes_json_1.default,
};
const difficultyMap = new Map(exports.CONFIG.DIFFICULTY_MODES.map((entry) => [entry.id, entry]));
const getDifficultyMode = (id) => difficultyMap.get(id ?? exports.CONFIG.DEFAULT_DIFFICULTY) ??
    exports.CONFIG.DIFFICULTY_MODES[0];
exports.getDifficultyMode = getDifficultyMode;
