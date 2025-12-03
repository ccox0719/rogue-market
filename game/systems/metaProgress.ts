import type { MetaState } from "../core/metaState.js";
import {
  awardXp,
  unlockArtifact as unlockMetaArtifact,
  setDifficulty,
} from "../core/metaState.js";

export const progressXp = (meta: MetaState, amount: number): MetaState =>
  awardXp(meta, amount);

export const progressArtifact = (
  meta: MetaState,
  artifactId: string
): MetaState => unlockMetaArtifact(meta, artifactId);

export const changeDifficulty = (
  meta: MetaState,
  difficultyId: MetaState["difficulty"]
): MetaState => setDifficulty(meta, difficultyId);
