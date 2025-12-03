"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDifficulty = exports.recordRunOutcome = exports.unlockArtifact = exports.awardXp = exports.defaultMetaState = void 0;
const baseArtifacts_json_1 = __importDefault(require("../content/baseArtifacts.json"));
const config_js_1 = require("./config.js");
const DEFAULT_DIFFICULTY = config_js_1.CONFIG.DEFAULT_DIFFICULTY;
const baseArtifacts = baseArtifacts_json_1.default;
const buildArtifactPool = () => baseArtifacts.map((definition) => ({
    ...definition,
    unlocked: false,
}));
const calculateLevelFromXp = (xp) => {
    return Math.max(1, Math.ceil(Math.sqrt(xp / 100)) + 1);
};
exports.defaultMetaState = {
    xp: 0,
    level: 1,
    artifacts: buildArtifactPool(),
    sectorsUnlocked: [],
    difficulty: DEFAULT_DIFFICULTY,
    totalRuns: 0,
    bestReturn: 0,
};
const awardXp = (meta, amount) => {
    const xp = Math.max(0, meta.xp + amount);
    const level = calculateLevelFromXp(xp);
    return { ...meta, xp, level };
};
exports.awardXp = awardXp;
const unlockArtifact = (meta, artifactId) => {
    const artifacts = meta.artifacts.map((artifact) => artifact.id === artifactId ? { ...artifact, unlocked: true } : artifact);
    return { ...meta, artifacts };
};
exports.unlockArtifact = unlockArtifact;
const recordRunOutcome = (meta, xpGained, portfolioReturn) => {
    const updatedMeta = (0, exports.awardXp)(meta, xpGained);
    const bestReturn = Math.max(meta.bestReturn, portfolioReturn);
    return {
        ...updatedMeta,
        bestReturn,
        totalRuns: meta.totalRuns + 1,
    };
};
exports.recordRunOutcome = recordRunOutcome;
const setDifficulty = (meta, difficultyId) => ({
    ...meta,
    difficulty: difficultyId,
});
exports.setDifficulty = setDifficulty;
