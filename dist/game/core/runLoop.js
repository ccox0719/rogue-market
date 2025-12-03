"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameRunner = void 0;
const state_js_1 = require("./state.js");
const rng_js_1 = require("./rng.js");
const eventSystem_js_1 = require("../systems/eventSystem.js");
const priceSystem_js_1 = require("../systems/priceSystem.js");
const progression_js_1 = require("../systems/progression.js");
const eraSystem_js_1 = require("../systems/eraSystem.js");
const portfolioSystem_js_1 = require("../systems/portfolioSystem.js");
const saveManager_js_1 = require("../saves/saveManager.js");
const metaSave_js_1 = require("../saves/metaSave.js");
const metaState_js_1 = require("./metaState.js");
const metaProgress_js_1 = require("../systems/metaProgress.js");
const artifactEffects_js_1 = require("./artifactEffects.js");
const config_js_1 = require("./config.js");
const watchOrders_js_1 = require("../systems/watchOrders.js");
const ARTIFACT_UNLOCK_TIERS = [
    { value: 5000, artifactId: "neon_compass" },
    { value: 15000, artifactId: "rumor_network" },
    { value: 40000, artifactId: "solar_mirrors" },
];
class GameRunner {
    constructor(options = {}) {
        this.finalised = false;
        this.rng = (0, rng_js_1.createSeededRng)(options.seed);
        this.metaState = options.metaState ?? metaState_js_1.defaultMetaState;
        if (options.difficultyOverride) {
            this.metaState = (0, metaState_js_1.setDifficulty)(this.metaState, options.difficultyOverride);
        }
        this.difficulty = (0, config_js_1.getDifficultyMode)(this.metaState.difficulty);
        this.onMetaUpdate = options.onMetaUpdate;
        this.onSave = options.onSave;
        const artifactEffects = (0, artifactEffects_js_1.computeArtifactEffects)(this.metaState.artifacts);
        this.state = (0, state_js_1.createInitialState)(options.seed, this.rng, {
            difficulty: this.difficulty,
            artifactEffects,
        });
        this.state.artifacts = this.metaState.artifacts;
        this.state.artifactEffects = artifactEffects;
        if (this.state.eras.length > 0) {
            this.state.eras[0].revealed = true;
        }
        (0, saveManager_js_1.saveRun)(this.state);
        (0, metaSave_js_1.saveMeta)(this.metaState);
    }
    step(days = 1) {
        for (let i = 0; i < days; i += 1) {
            if (this.state.runOver && this.finalised)
                break;
            this.runDay();
            if (this.state.pendingChoice) {
                break;
            }
            if (this.state.runOver) {
                break;
            }
        }
    }
    runDay() {
        if (this.state.runOver)
            return;
        const era = this.state.eras[this.state.currentEraIndex];
        const eventMultiplier = era?.effects?.eventFrequencyMultiplier ?? 1;
        const weightedChance = this.state.eventChance * eventMultiplier;
        const events = (0, eventSystem_js_1.runDailyEvents)(this.state, this.rng, weightedChance, era?.eventWeights);
        if (this.state.pendingChoice) {
            return;
        }
        this.completeDay(events);
    }
    resolveChoice(accept) {
        if (!this.state.pendingChoice)
            return;
        this.state.pendingChoice.choiceAccepted = accept;
        this.state.pendingChoice = null;
        this.completeDay(this.state.eventsToday);
    }
    completeDay(events) {
        (0, priceSystem_js_1.updatePrices)(this.state, events, this.rng);
        (0, watchOrders_js_1.processWatchOrdersForDay)(this.state);
        (0, progression_js_1.checkUnlocks)(this.state);
        (0, eraSystem_js_1.advanceEraProgress)(this.state);
        this.state.day += 1;
        (0, saveManager_js_1.saveRun)(this.state);
        this.onSave?.(this.state);
        this.checkArtifactUnlocks();
        if (!this.difficulty.special?.noRunOver &&
            this.state.day > this.state.totalDays) {
            this.state.runOver = true;
        }
        if (this.state.runOver && !this.finalised) {
            this.finalizeRun();
        }
    }
    checkArtifactUnlocks() {
        const value = this.getPortfolioValue();
        for (const tier of ARTIFACT_UNLOCK_TIERS) {
            if (value < tier.value)
                continue;
            const alreadyUnlocked = this.metaState.artifacts.some((artifact) => artifact.id === tier.artifactId && artifact.unlocked);
            if (alreadyUnlocked)
                continue;
            this.metaState = (0, metaProgress_js_1.progressArtifact)(this.metaState, tier.artifactId);
            (0, metaSave_js_1.saveMeta)(this.metaState);
            this.notifyMetaChange();
        }
    }
    finalizeRun() {
        this.finalised = true;
        const value = this.getPortfolioValue();
        const xpGain = Math.floor(value / 100);
        this.metaState = (0, metaState_js_1.recordRunOutcome)(this.metaState, xpGain, value);
        (0, metaSave_js_1.saveMeta)(this.metaState);
        this.notifyMetaChange();
    }
    notifyMetaChange() {
        if (this.onMetaUpdate) {
            this.onMetaUpdate(this.metaState);
        }
    }
    currentEraName() {
        return (0, eraSystem_js_1.getCurrentEra)(this.state)?.name ?? "Unknown";
    }
    getPortfolioValue() {
        return (0, portfolioSystem_js_1.portfolioValue)(this.state);
    }
    summary() {
        const totalDays = this.state.totalDays === Number.MAX_SAFE_INTEGER ? "∞" : this.state.totalDays;
        return `${this.state.day}/${totalDays} · ${this.currentEraName()} · ${this.getPortfolioValue().toFixed(2)} cash`;
    }
}
exports.GameRunner = GameRunner;
