import type { GameState } from "../core/state.js";
import type { RNG } from "../core/rng.js";
import { CONFIG } from "../core/config.js";
import type { Company } from "../generators/companyGen.js";
import type {
  WhaleId,
  WhaleNarrative,
} from "../content/narrative.js";
import { narrativeWhales } from "../content/narrative.js";
import { queueWhaleDialogue } from "../whale-dialogue.js";

const normalizeSector = (value: string): string =>
  value.replace(/\s+/g, "_").toUpperCase();

const buildSectorLookup = (state: GameState): Map<string, string> => {
  const lookup = new Map<string, string>();
  for (const sector of state.sectors) {
    lookup.set(normalizeSector(sector.name), sector.name);
  }
  return lookup;
};

const applySectorDelta = (
  state: GameState,
  lookup: Map<string, string>,
  sectorKey: string,
  delta: number
): void => {
  const actual = lookup.get(normalizeSector(sectorKey));
  if (!actual) return;
  state.whaleSectorBonuses[actual] =
    (state.whaleSectorBonuses[actual] ?? 0) + delta;
};

const applySectorDeltaList = (
  state: GameState,
  lookup: Map<string, string>,
  delta: number,
  sectors: string[]
): void => {
  for (const sector of sectors) {
    applySectorDelta(state, lookup, sector, delta);
  }
};

const applyCompanyDelta = (
  state: GameState,
  companyId: string,
  delta: number
): void => {
  state.whaleCompanyBonuses[companyId] =
    (state.whaleCompanyBonuses[companyId] ?? 0) + delta;
};

const pickRandomCompanyFromSector = (
  state: GameState,
  sectorKey: string,
  rng: RNG
): Company | undefined => {
  const normalized = normalizeSector(sectorKey);
  const candidates = state.companies.filter(
    (company) => normalizeSector(company.sector) === normalized
  );
  if (candidates.length === 0) return undefined;
  const index = Math.floor(rng.next() * candidates.length);
  return candidates[index];
};

const pickTopCompany = (state: GameState): Company | undefined => {
  if (state.companies.length === 0) return undefined;
  return state.companies.reduce((candidate, current) =>
    current.price > candidate.price ? current : candidate
  );
};

const pickRandomSectors = (
  lookup: Map<string, string>,
  rng: RNG,
  count: number
): string[] => {
  const pool = Array.from(lookup.values());
  if (pool.length === 0) return [];
  const picks: string[] = [];
  const copy = [...pool];
  while (picks.length < count && copy.length > 0) {
    const idx = Math.floor(rng.next() * copy.length);
    picks.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return picks;
};

export interface WhaleMechanicsState {
  activeWhaleId: WhaleId | null;
  daysActive: number;
  lastSignatureDay: number;
}

export const createWhaleMechanicsState = (): WhaleMechanicsState => ({
  activeWhaleId: null,
  daysActive: 0,
  lastSignatureDay: 0,
});

const isWithinWindow = (whale: WhaleNarrative, progress: number): boolean => {
  const window = whale.mechanicalProfile.preferredWindow;
  if (!window) {
    return true;
  }
  return progress >= window.startPercent && progress <= window.endPercent;
};

const chooseWhale = (
  state: GameState,
  mechanics: WhaleMechanicsState,
  rng: RNG
): WhaleNarrative | null => {
  const total = Number.isFinite(state.totalDays) && state.totalDays > 0 ? state.totalDays : state.day;
  const progress = total > 0 ? Math.min(1, state.day / total) : 0;
  const active = mechanics.activeWhaleId
    ? narrativeWhales.find((entry) => entry.id === mechanics.activeWhaleId) ?? null
    : null;

  if (active && isWithinWindow(active, progress)) {
    return active;
  }

  const eligible = narrativeWhales.filter((entry) => isWithinWindow(entry, progress));
  const pool = eligible.length > 0 ? eligible : narrativeWhales;
  if (pool.length === 0) {
    return null;
  }

  const selection = pool[Math.floor(rng.next() * pool.length)];
  mechanics.activeWhaleId = selection.id;
  mechanics.daysActive = 0;
  return selection;
};

type SignatureMoveHandler = (
  state: GameState,
  whale: WhaleNarrative,
  sectorLookup: Map<string, string>,
  rng: RNG
) => void;

const applyGenericSignatureMove: SignatureMoveHandler = (
  state,
  whale,
  sectorLookup,
  _rng
): void => {
  const favored = new Set((whale.mechanicalProfile.favoredSectors ?? []).map(normalizeSector));
  const punished = new Set((whale.mechanicalProfile.punishedSectors ?? []).map(normalizeSector));
  const boost = 0.04;

  for (const [key, sectorName] of sectorLookup.entries()) {
    if (favored.has(key)) {
      state.whaleSectorBonuses[sectorName] =
        (state.whaleSectorBonuses[sectorName] ?? 0) + boost;
    }
    if (punished.has(key)) {
      state.whaleSectorBonuses[sectorName] =
        (state.whaleSectorBonuses[sectorName] ?? 0) - boost * 1.5;
    }
  }
};

const signatureMoveHandlers: Record<WhaleId, SignatureMoveHandler> = {
  aurora_vale: (state, _whale, lookup, rng) => {
    applySectorDeltaList(state, lookup, 0.17, ["Tech", "Blockchain", "FinTech"]);
    const target =
      pickRandomCompanyFromSector(state, "Tech", rng) ?? pickTopCompany(state);
    if (target) {
      applyCompanyDelta(state, target.id, -0.45);
    }
  },
  baron_calder: (state, _whale, lookup, rng) => {
    applySectorDeltaList(state, lookup, -0.18, ["FinTech", "Infrastructure"]);
    applySectorDelta(state, lookup, "Energy", 0.05);
    const target =
      pickRandomCompanyFromSector(state, "FinTech", rng) ?? pickTopCompany(state);
    if (target) {
      applyCompanyDelta(state, target.id, -0.35);
    }
  },
  vesper_kline: (state, _whale, lookup, rng) => {
    applySectorDeltaList(state, lookup, -0.25, ["Tech", "Energy"]);
    const target =
      pickRandomCompanyFromSector(state, "Tech", rng) ?? pickTopCompany(state);
    if (target) {
      applyCompanyDelta(state, target.id, -0.5);
    }
  },
  rocco_marlin: (state, _whale, lookup, _rng) => {
    applySectorDeltaList(state, lookup, 0.22, ["Energy", "Supply"]);
    applySectorDelta(state, lookup, "Infrastructure", -0.3);
    applySectorDelta(state, lookup, "Space", -0.2);
  },
  helix_yuan: (state, _whale, lookup, rng) => {
    applySectorDeltaList(state, lookup, -0.3, ["BioTech"]);
    const target = pickRandomCompanyFromSector(state, "BioTech", rng);
    if (target) {
      applyCompanyDelta(state, target.id, -0.4);
    }
  },
  selene_marr: (state, _whale, lookup, rng) => {
    applySectorDeltaList(state, lookup, -0.22, ["Infrastructure", "FinTech"]);
    const target =
      pickRandomCompanyFromSector(state, "Infrastructure", rng) ??
      pickTopCompany(state);
    if (target) {
      applyCompanyDelta(state, target.id, -0.35);
    }
  },
  gideon_pike: (state, _whale, _lookup, _rng) => {
    const target = pickTopCompany(state);
    if (target) {
      applyCompanyDelta(state, target.id, -0.5);
    }
  },
  titan_ferro: (state, _whale, lookup, _rng) => {
    applySectorDeltaList(state, lookup, 0.2, ["Infrastructure"]);
    applySectorDelta(state, lookup, "Energy", -0.25);
    applySectorDelta(state, lookup, "Space", -0.18);
  },
  mira_solari: (state, _whale, lookup, rng) => {
    applySectorDeltaList(state, lookup, 0.2, ["Retail"]);
    applySectorDelta(state, lookup, "Blockchain", -0.25);
    const target =
      pickRandomCompanyFromSector(state, "Retail", rng) ?? pickTopCompany(state);
    if (target) {
      applyCompanyDelta(state, target.id, -0.3);
    }
  },
  knox_ironwell: (state, _whale, lookup, _rng) => {
    applySectorDeltaList(state, lookup, 0.15, ["Energy", "Infrastructure"]);
    applySectorDelta(state, lookup, "Tech", -0.25);
  },
  indigo_slate: (state, _whale, lookup, rng) => {
    const unlucky = pickRandomSectors(lookup, rng, 2);
    for (const sectorName of unlucky) {
      applySectorDelta(state, lookup, sectorName, -0.3);
    }
    const target = pickTopCompany(state);
    if (target) {
      applyCompanyDelta(state, target.id, -0.25);
    }
  },
  cyrus_vale: (state, _whale, lookup, _rng) => {
    for (const sectorName of lookup.values()) {
      applySectorDelta(state, lookup, sectorName, -0.3);
    }
    const target = pickTopCompany(state);
    if (target) {
      applyCompanyDelta(state, target.id, -0.3);
    }
  },
};

const logWhaleAction = (state: GameState, entry: string): void => {
  state.whaleActionLog.push(entry);
  if (state.whaleActionLog.length > CONFIG.WHALE_LOG_LIMIT) {
    state.whaleActionLog.shift();
  }
};

const applyWhalePassives = (
  state: GameState,
  whale: WhaleNarrative,
  sectorLookup: Map<string, string>
): void => {
  const profile = whale.mechanicalProfile;
  const driftBase = 0.025 * (profile.driftMultiplier ?? 1);
  const favored = new Set((profile.favoredSectors ?? []).map(normalizeSector));
  const punished = new Set((profile.punishedSectors ?? []).map(normalizeSector));

  if (favored.size === 0 && punished.size === 0) {
    return;
  }

  for (const [key, sectorName] of sectorLookup.entries()) {
    if (favored.has(key)) {
      state.whaleSectorBonuses[sectorName] =
        (state.whaleSectorBonuses[sectorName] ?? 0) + driftBase;
    }
    if (punished.has(key)) {
      state.whaleSectorBonuses[sectorName] =
        (state.whaleSectorBonuses[sectorName] ?? 0) - driftBase * 1.2;
    }
  }

  const era = state.eras[state.currentEraIndex];
  const eraName = era?.name ?? era?.id ?? "current era";
  logWhaleAction(
    state,
    `${whale.displayName} (${whale.nickname}) molds ${eraName} with passive influence.`
  );
};

const maybeTriggerSignatureMove = (
  state: GameState,
  whale: WhaleNarrative,
  mechanics: WhaleMechanicsState,
  rng: RNG,
  sectorLookup: Map<string, string>
): void => {
  const chance = whale.mechanicalProfile.signatureMoveChance ?? 0;
  if (chance <= 0) {
    return;
  }
  if (mechanics.lastSignatureDay === state.day && mechanics.activeWhaleId === whale.id) {
    return;
  }
  if (rng.next() >= chance) {
    return;
  }

  mechanics.lastSignatureDay = state.day;
  const handler = signatureMoveHandlers[whale.id] ?? applyGenericSignatureMove;
  handler(state, whale, sectorLookup, rng);

  logWhaleAction(
    state,
    `${whale.displayName} fires ${whale.signatureMoveName}: ${whale.signatureMoveDescription}`
  );
  queueWhaleDialogue(state, whale.id, "signature");
};

/**
 * Call once per tick after you determine the current era so the active whale can nudge sector trends.
 * Keep a single `WhaleMechanicsState` instance (via `createWhaleMechanicsState`) and pass the shared RNG.
 */
export const processWhaleMechanics = (
  state: GameState,
  mechanics: WhaleMechanicsState,
  rng: RNG
): void => {
  state.whaleSectorBonuses = {};
  state.whaleCompanyBonuses = {};

  const sectorLookup = buildSectorLookup(state);
  const previousWhaleId = mechanics.activeWhaleId;
  const whale = chooseWhale(state, mechanics, rng);
  if (!whale) {
    return;
  }

  if (previousWhaleId !== whale.id) {
    queueWhaleDialogue(state, whale.id, "arrival");
  }

  applyWhalePassives(state, whale, sectorLookup);
  maybeTriggerSignatureMove(state, whale, mechanics, rng, sectorLookup);
  mechanics.daysActive += 1;
};
