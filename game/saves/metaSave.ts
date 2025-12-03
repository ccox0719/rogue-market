import type { MetaState } from "../core/metaState.js";
import { defaultMetaState } from "../core/metaState.js";

const META_SAVE_KEY = "rogue-market-meta";

export const saveMeta = (meta: MetaState): void => {
  localStorage.setItem(META_SAVE_KEY, JSON.stringify(meta));
};

export const loadMeta = (): MetaState => {
  const raw = localStorage.getItem(META_SAVE_KEY);
  if (!raw) {
    saveMeta(defaultMetaState);
    return defaultMetaState;
  }

  try {
    return JSON.parse(raw) as MetaState;
  } catch {
    saveMeta(defaultMetaState);
    return defaultMetaState;
  }
};

export const resetMeta = (): void => {
  saveMeta(defaultMetaState);
};
