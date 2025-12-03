import artifacts from "../content/baseArtifacts.json";

export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface Artifact {
  id: string;
  name: string;
  effect: string;
  rarity: Rarity;
  unlocked: boolean;
}

const baseArtifacts = artifacts as Array<{
  id: string;
  name: string;
  effect: string;
  rarity: Rarity;
}>;

export const generateArtifactPool = (): Artifact[] =>
  baseArtifacts.map((entry) => ({
    ...entry,
    unlocked: false,
  }));
