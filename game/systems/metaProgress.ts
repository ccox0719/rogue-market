import type { MetaProfile } from "../core/metaState.js";
import {
  awardXp,
  unlockArtifact as unlockMetaArtifact,
  setDifficulty,
} from "../core/metaState.js";

export const progressXp = (meta: MetaProfile, amount: number): MetaProfile =>
  awardXp(meta, amount);

export const progressArtifact = (
  meta: MetaProfile,
  artifactId: string
): MetaProfile => unlockMetaArtifact(meta, artifactId);

export const changeDifficulty = (
  meta: MetaProfile,
  difficultyId: MetaProfile["difficulty"]
): MetaProfile => setDifficulty(meta, difficultyId);
