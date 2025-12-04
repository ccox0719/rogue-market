import artifactDefinitions from "../content/artifacts.json";

export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface ArtifactEffectDescriptor {
  energyBonus?: number;
  eventChanceBonus?: number;
  negativeEventMultiplier?: number;
  eraDurationReduction?: number;
  startingCashBonus?: number;
  revealVolatility?: boolean;
  volatilityMultiplier?: number;
  marginLimitBonus?: number;
  triggerSlotBonus?: number;
  predictionBonus?: number;
}

export interface ArtifactDefinition {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  tags: string[];
  effects: ArtifactEffectDescriptor;
}

export interface Artifact extends ArtifactDefinition {
  unlocked: boolean;
}

export const artifactLibrary = artifactDefinitions as ArtifactDefinition[];

export const generateArtifactPool = (): Artifact[] =>
  artifactLibrary.map((entry) => ({
    ...entry,
    unlocked: false,
  }));

export const findArtifactDefinition = (id: string): ArtifactDefinition | undefined =>
  artifactLibrary.find((artifact) => artifact.id === id);
