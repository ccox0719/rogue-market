import artifacts from "../content/baseArtifacts.json";
import type { Artifact, Rarity } from "../generators/artifactGen.js";
import { CONFIG, type DifficultyMode } from "./config.js";

type ArtifactDefinition = Omit<Artifact, "unlocked">;

export interface MetaState {
  xp: number;
  level: number;
  artifacts: Artifact[];
  sectorsUnlocked: string[];
  difficulty: DifficultyMode["id"];
  totalRuns: number;
  bestReturn: number;
}

const DEFAULT_DIFFICULTY = CONFIG.DEFAULT_DIFFICULTY;

const baseArtifacts = artifacts as Array<{
  id: string;
  name: string;
  effect: string;
  rarity: Rarity;
}>;

const buildArtifactPool = (): Artifact[] =>
  baseArtifacts.map((definition) => ({
    ...definition,
    unlocked: false,
  }));

const calculateLevelFromXp = (xp: number): number => {
  return Math.max(1, Math.ceil(Math.sqrt(xp / 100)) + 1);
};

export const defaultMetaState: MetaState = {
  xp: 0,
  level: 1,
  artifacts: buildArtifactPool(),
  sectorsUnlocked: [],
  difficulty: DEFAULT_DIFFICULTY,
  totalRuns: 0,
  bestReturn: 0,
};

export const awardXp = (meta: MetaState, amount: number): MetaState => {
  const xp = Math.max(0, meta.xp + amount);
  const level = calculateLevelFromXp(xp);
  return { ...meta, xp, level };
};

export const unlockArtifact = (meta: MetaState, artifactId: string): MetaState => {
  const artifacts = meta.artifacts.map((artifact) =>
    artifact.id === artifactId ? { ...artifact, unlocked: true } : artifact
  );
  return { ...meta, artifacts };
};

export const recordRunOutcome = (
  meta: MetaState,
  xpGained: number,
  portfolioReturn: number
): MetaState => {
  const updatedMeta = awardXp(meta, xpGained);
  const bestReturn = Math.max(meta.bestReturn, portfolioReturn);
  return {
    ...updatedMeta,
    bestReturn,
    totalRuns: meta.totalRuns + 1,
  };
};

export const setDifficulty = (
  meta: MetaState,
  difficultyId: DifficultyMode["id"]
): MetaState => ({
  ...meta,
  difficulty: difficultyId,
});
