import { narrativeWhales, } from "../content/narrative.js";
export class WhaleManager {
    constructor(whales = narrativeWhales) {
        this.whales = whales;
        this.activeWhaleId = null;
        this.lastSignatureMoveDay = 0;
        this.lastSignatureWhaleId = null;
        this.lastLogDay = 0;
    }
    applyWhales(ctx, rng) {
        const roll = rng ? () => rng.next() : Math.random;
        const progress = ctx.totalDays > 0 ? Math.min(1, Math.max(0, ctx.day / ctx.totalDays)) : 0;
        const whale = this.ensureActiveWhale(progress, roll);
        const withPassive = this.applyPassiveEffects(ctx, whale);
        return this.maybeTriggerSignatureMove(withPassive, whale, roll);
    }
    ensureActiveWhale(progress, roll) {
        const current = this.whales.find((entry) => entry.id === this.activeWhaleId);
        if (current && this.isWithinWindow(current, progress)) {
            return current;
        }
        const next = this.pickWhale(progress, roll);
        this.activeWhaleId = next.id;
        return next;
    }
    isWithinWindow(whale, progress) {
        const window = whale.mechanicalProfile.preferredWindow;
        if (!window) {
            return true;
        }
        return progress >= window.startPercent && progress <= window.endPercent;
    }
    pickWhale(progress, roll) {
        const eligible = this.whales.filter((whale) => this.isWithinWindow(whale, progress));
        const pool = eligible.length > 0 ? eligible : this.whales;
        if (pool.length === 1) {
            return pool[0];
        }
        const index = Math.floor(roll() * pool.length);
        const candidate = pool[index];
        if (candidate.id === this.activeWhaleId) {
            const fallback = pool.find((entry) => entry.id !== this.activeWhaleId);
            return fallback ?? candidate;
        }
        return candidate;
    }
    applyPassiveEffects(ctx, whale) {
        const mechanical = whale.mechanicalProfile;
        const sectors = {};
        const driftMultiplier = mechanical.driftMultiplier ?? 1;
        const volatilitySpike = mechanical.volatilitySpike ?? 0;
        const favored = new Set(mechanical.favoredSectors ?? []);
        const punished = new Set(mechanical.punishedSectors ?? []);
        for (const sectorId of Object.keys(ctx.sectors)) {
            const state = ctx.sectors[sectorId];
            if (!state) {
                continue;
            }
            let drift = state.drift;
            let volatility = state.volatility;
            if (favored.has(sectorId)) {
                drift *= driftMultiplier;
                volatility += volatilitySpike;
            }
            if (punished.has(sectorId)) {
                drift *= 0.75;
                volatility += volatilitySpike;
            }
            sectors[sectorId] = { ...state, drift, volatility };
        }
        const logEntry = `${whale.displayName} (${whale.nickname}) is shaping ${ctx.activeEra}.`;
        const narrativeLog = this.appendLog(ctx, logEntry);
        return {
            ...ctx,
            sectors,
            narrativeLog,
            activeWhaleId: whale.id,
        };
    }
    maybeTriggerSignatureMove(ctx, whale, roll) {
        const chance = whale.mechanicalProfile.signatureMoveChance ?? 0;
        if (chance <= 0) {
            return ctx;
        }
        if (this.lastSignatureMoveDay === ctx.day && this.lastSignatureWhaleId === whale.id) {
            return ctx;
        }
        if (roll() >= chance) {
            return ctx;
        }
        this.lastSignatureMoveDay = ctx.day;
        this.lastSignatureWhaleId = whale.id;
        const sectors = {};
        const favored = new Set(whale.mechanicalProfile.favoredSectors ?? []);
        const punished = new Set(whale.mechanicalProfile.punishedSectors ?? []);
        for (const sectorId of Object.keys(ctx.sectors)) {
            const state = ctx.sectors[sectorId];
            if (!state) {
                continue;
            }
            let drift = state.drift;
            let volatility = state.volatility;
            if (favored.has(sectorId)) {
                drift *= 1.3;
                volatility += 0.3;
            }
            if (punished.has(sectorId)) {
                drift *= -0.5;
                volatility += 0.4;
            }
            sectors[sectorId] = { ...state, drift, volatility };
        }
        const logEntry = `${whale.displayName} triggers ${whale.signatureMoveName}: ${whale.signatureMoveDescription}`;
        const narrativeLog = this.appendLog(ctx, logEntry);
        return {
            ...ctx,
            sectors,
            narrativeLog,
            activeWhaleId: whale.id,
        };
    }
    appendLog(ctx, entry) {
        if (this.lastLogDay === ctx.day && ctx.narrativeLog[ctx.narrativeLog.length - 1] === entry) {
            return ctx.narrativeLog;
        }
        this.lastLogDay = ctx.day;
        return [...ctx.narrativeLog, entry];
    }
}
