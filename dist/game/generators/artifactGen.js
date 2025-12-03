"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateArtifactPool = void 0;
const baseArtifacts_json_1 = __importDefault(require("../content/baseArtifacts.json"));
const baseArtifacts = baseArtifacts_json_1.default;
const generateArtifactPool = () => baseArtifacts.map((entry) => ({
    ...entry,
    unlocked: false,
}));
exports.generateArtifactPool = generateArtifactPool;
