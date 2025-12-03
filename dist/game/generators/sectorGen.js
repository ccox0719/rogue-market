"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickSector = exports.generateSectors = void 0;
const baseSectors_json_1 = __importDefault(require("../content/baseSectors.json"));
const weightedPick = (rng, items) => {
    const totalWeight = items.reduce((sum, candidate) => sum + candidate.weight, 0);
    let threshold = rng.next() * totalWeight;
    for (const candidate of items) {
        threshold -= candidate.weight;
        if (threshold <= 0) {
            return candidate;
        }
    }
    return items[items.length - 1];
};
const generateSectors = () => [...baseSectors_json_1.default];
exports.generateSectors = generateSectors;
const pickSector = (rng, sectors) => weightedPick(rng, sectors);
exports.pickSector = pickSector;
