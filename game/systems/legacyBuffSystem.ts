import type { ArtifactEffectDescriptor } from "../generators/artifactGen.js";
import { findLegacyBuff, legacyBuffLibrary } from "../content/legacyBuffs.js";
import type { RNG } from "../core/rng.js";

export const aggregateLegacyBuffEffects = (
  buffIds: string[]
): ArtifactEffectDescriptor => {
  const aggregated: ArtifactEffectDescriptor = {};
  for (const id of buffIds) {
    const definition = findLegacyBuff(id);
    if (!definition) continue;
    mergeEffectDescriptors(aggregated, definition.effects);
  }
  return aggregated;
};

export const mergeEffectDescriptors = (
  target: ArtifactEffectDescriptor,
  source: ArtifactEffectDescriptor
): void => {
  for (const [key, value] of Object.entries(source) as Array<
    [keyof ArtifactEffectDescriptor, ArtifactEffectDescriptor[keyof ArtifactEffectDescriptor]]
  >) {
    const typedKey = key as keyof ArtifactEffectDescriptor;
    if (typeof value === "number") {
      const existingNumber =
        typeof target[typedKey] === "number" ? (target[typedKey] as number) : 0;
      (target as Record<string, unknown>)[typedKey] = existingNumber + value;
    } else if (typeof value === "boolean") {
      (target as Record<string, unknown>)[typedKey] = value;
    } else if (value) {
      (target as Record<string, unknown>)[typedKey] = value;
    }
  }
};

export const pickLegacyBuff = (existing: string[], rng: RNG): string | null => {
  const available = legacyBuffLibrary
    .filter((buff) => !existing.includes(buff.id))
    .map((buff) => buff.id);
  if (available.length === 0) {
    return null;
  }
  const index = Math.floor(rng.next() * available.length);
  return available[index];
};
