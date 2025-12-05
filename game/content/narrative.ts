export type SectorId =
  | "TECH"
  | "ENERGY"
  | "FINANCE"
  | "HEALTHCARE"
  | "INDUSTRIALS"
  | "CONSUMER"
  | "RETAIL"
  | "REAL_ESTATE"
  | "TRANSPORTATION"
  | "MATERIALS"
  | "UTILITIES"
  | "COMMUNICATION"
  | string;

export type EraTag = string;

export type WhaleId =
  | "aurora_vale"
  | "baron_calder"
  | "vesper_kline"
  | "rocco_marlin"
  | "helix_yuan"
  | "selene_marr"
  | "gideon_pike"
  | "titan_ferro"
  | "mira_solari"
  | "knox_ironwell"
  | "indigo_slate"
  | "cyrus_vale";

export interface WhalePreferenceWindow {
  startPercent: number;
  endPercent: number;
}

export interface WhaleMechanicalProfile {
  driftMultiplier?: number;
  volatilitySpike?: number;
  signatureMoveChance?: number;
  favoredSectors?: SectorId[];
  punishedSectors?: SectorId[];
  preferredWindow?: WhalePreferenceWindow;
}

export interface WhaleNarrative {
  id: WhaleId;
  displayName: string;
  nickname: string;
  publicPersona: string;
  secretTruth: string;
  manipulationStyle: string;
  signatureMoveName: string;
  signatureMoveDescription: string;
  eraInfluence: string[];
  targetPlayer: string;
  mechanicalProfile: WhaleMechanicalProfile;
}

export interface ProtagonistArchetype {
  id: string;
  name: string;
  theme: string;
  startingBonus: string;
  weakness: string;
  hiddenPerk: string;
}

export const narrativeWhales: WhaleNarrative[] = [
  {
    id: "aurora_vale",
    displayName: "Aurora Vale",
    nickname: "The Sentiment Architect",
    publicPersona: "World-famous futurist who predicts the next big trend.",
    secretTruth: "She quietly manufactures the trends she claims to foresee.",
    manipulationStyle: "Social sentiment distortion across growth sectors.",
    signatureMoveName: "Echo Chamber",
    signatureMoveDescription:
      "Boosts one sector with furious optimism for two days before collapsing it hard.",
    eraInfluence: ["Tech Euphoria", "Tech Hangover"],
    targetPlayer:
      "If you ride her boom, she hyper-crashes your top holding the next trading day.",
    mechanicalProfile: {
      driftMultiplier: 1.5,
      volatilitySpike: 0.4,
      signatureMoveChance: 0.15,
      favoredSectors: ["TECH", "COMMUNICATION", "RETAIL"],
      punishedSectors: ["TECH"],
      preferredWindow: { startPercent: 0.0, endPercent: 0.35 },
    },
  },
  {
    id: "baron_calder",
    displayName: "Baron Calder",
    nickname: "The Bond Baron",
    publicPersona: "Philanthropic advocate of so-called safe bond investing.",
    secretTruth: "He commands a massive chunk of the corporate debt market.",
    manipulationStyle: "Yield manipulation and liquidity traps.",
    signatureMoveName: "Vanishing Ladder",
    signatureMoveDescription:
      "Turns attractive high-yield debt into default-risk fireworks overnight.",
    eraInfluence: ["Liquidity Crises", "Debt Cliffs"],
    targetPlayer:
      "If you rotate into bonds early, he forces cascading defaults on your stack.",
    mechanicalProfile: {
      driftMultiplier: 0.9,
      volatilitySpike: 0.3,
      signatureMoveChance: 0.12,
      favoredSectors: ["FINANCE", "REAL_ESTATE"],
      punishedSectors: ["FINANCE"],
      preferredWindow: { startPercent: 0.2, endPercent: 0.6 },
    },
  },
  {
    id: "vesper_kline",
    displayName: "Vesper Kline",
    nickname: "The Volatility Surgeon",
    publicPersona: "Reclusive quant rumored to control dozens of HFT desks.",
    secretTruth: "Her algorithm still governs the heartbeat of most automated funds.",
    manipulationStyle: "Microsecond volatility injections and stop hunts.",
    signatureMoveName: "Knife Edge",
    signatureMoveDescription:
      "Stretches intraday lows far below normal bounds, triggering stops before the rebound.",
    eraInfluence: ["Volatility Storms"],
    targetPlayer:
      "She punishes stop-loss users by chaining forced exits before reversing the tape.",
    mechanicalProfile: {
      driftMultiplier: 1.0,
      volatilitySpike: 0.7,
      signatureMoveChance: 0.18,
      favoredSectors: ["TECH", "ENERGY", "MATERIALS"],
      preferredWindow: { startPercent: 0.2, endPercent: 0.65 },
    },
  },
  {
    id: "rocco_marlin",
    displayName: "Rocco Marlin",
    nickname: "The Commodities King",
    publicPersona: "Friendly blue-collar billionaire who never left his roots.",
    secretTruth: "He manipulates shipping lanes and resource contracts globally.",
    manipulationStyle: "Commodity shocks and supply droughts.",
    signatureMoveName: "Choke Point",
    signatureMoveDescription:
      "Spikes Energy and Materials with +80% drift, then lets them collapse as scarcity fades.",
    eraInfluence: ["Oil Shocks", "Supply Chain Tangles", "Mining Frenzies"],
    targetPlayer:
      "Rocco tracks your highest commodity exposure and flips it overnight.",
    mechanicalProfile: {
      driftMultiplier: 1.6,
      volatilitySpike: 0.5,
      signatureMoveChance: 0.15,
      favoredSectors: ["ENERGY", "MATERIALS", "TRANSPORTATION"],
      punishedSectors: ["TRANSPORTATION"],
      preferredWindow: { startPercent: 0.35, endPercent: 0.8 },
    },
  },
  {
    id: "helix_yuan",
    displayName: "Helix Yuan",
    nickname: "The Bio-Chaos Strategist",
    publicPersona: "Calm wellness guru who hypnotizes every podcast guest.",
    secretTruth: "She owns the world’s largest medical IP conglomerate.",
    manipulationStyle: "Biotech breakthroughs and manufactured scares.",
    signatureMoveName: "Patent Seizure",
    signatureMoveDescription:
      "Crashes any Healthcare name that has run past a +20% gain under regulatory pretense.",
    eraInfluence: ["Biotech Winters", "Regenerative Booms"],
    targetPlayer: "Health-heavy portfolios face 'trial setbacks' he engineers.",
    mechanicalProfile: {
      driftMultiplier: 1.3,
      volatilitySpike: 0.4,
      signatureMoveChance: 0.14,
      favoredSectors: ["HEALTHCARE"],
      punishedSectors: ["HEALTHCARE"],
      preferredWindow: { startPercent: 0.3, endPercent: 0.75 },
    },
  },
  {
    id: "selene_marr",
    displayName: "Selene Marr",
    nickname: "The Housing Oracle",
    publicPersona: "Soft-spoken economist who predicts housing turns.",
    secretTruth: "She owns every node of the mortgage-backed securities pipeline.",
    manipulationStyle: "Synthetic bubbles and controlled demolitions.",
    signatureMoveName: "Eviction Notice",
    signatureMoveDescription:
      "Nukes Real Estate and drags Consumer sectors into a spending freeze.",
    eraInfluence: ["Housing Bubbles", "Foreclosure Waves", "Rate Spikes"],
    targetPlayer:
      "If your portfolio looks stable, Selene hits your safest sector to prove a point.",
    mechanicalProfile: {
      driftMultiplier: 1.2,
      volatilitySpike: 0.6,
      signatureMoveChance: 0.16,
      favoredSectors: ["REAL_ESTATE", "CONSUMER", "FINANCE"],
      punishedSectors: ["REAL_ESTATE", "CONSUMER"],
      preferredWindow: { startPercent: 0.4, endPercent: 0.9 },
    },
  },
  {
    id: "gideon_pike",
    displayName: "Gideon Pike",
    nickname: "The Short Wolf",
    publicPersona: "Transparent activist investor who exposes fraud.",
    secretTruth: "He manufactures the fraud claims he profits from.",
    manipulationStyle: "Short ambushes, rumor cascades, and liquidity hunts.",
    signatureMoveName: "Wolf Bite",
    signatureMoveDescription:
      "Any stock above +30% becomes overvalued and tanks under his narrative.",
    eraInfluence: ["Regulatory Crackdown", "Panic Cycles"],
    targetPlayer: "He always shorts your single best-performing company.",
    mechanicalProfile: {
      driftMultiplier: 1.0,
      volatilitySpike: 0.5,
      signatureMoveChance: 0.2,
      favoredSectors: ["TECH", "RETAIL", "FINANCE"],
      preferredWindow: { startPercent: 0.2, endPercent: 0.9 },
    },
  },
  {
    id: "titan_ferro",
    displayName: "Titan Ferro",
    nickname: "The Industrials Titan",
    publicPersona: "Patriotic industrialist with a never-stop manufacturing message.",
    secretTruth: "His offshore factories undercut the ones he praises.",
    manipulationStyle: "Manufacturing shocks and tariff storms.",
    signatureMoveName: "Steel Curtain",
    signatureMoveDescription:
      "Inflates Industrials while smashes Transportation and exporting chains.",
    eraInfluence: ["Manufacturing Surges", "Tariff Wars"],
    targetPlayer:
      "If you hedge, he flips your weakest sector to work against you.",
    mechanicalProfile: {
      driftMultiplier: 1.4,
      volatilitySpike: 0.45,
      signatureMoveChance: 0.15,
      favoredSectors: ["INDUSTRIALS"],
      punishedSectors: ["TRANSPORTATION"],
      preferredWindow: { startPercent: 0.5, endPercent: 1.0 },
    },
  },
  {
    id: "mira_solari",
    displayName: "Mira Solari",
    nickname: "The Retail Alchemist",
    publicPersona: "Cheerful CEO who champions the common shopper.",
    secretTruth: "She controls the deepest consumer spending data feeds.",
    manipulationStyle: "Consumer confidence whiplash.",
    signatureMoveName: "Flash Frenzy",
    signatureMoveDescription:
      "Delivers a one-day moonshot followed by a three-day consumer collapse.",
    eraInfluence: ["Retail Mania", "Holiday Pop", "Post-Holiday Slumps"],
    targetPlayer: "If you chase momentum, she reverses it the instant you jump in.",
    mechanicalProfile: {
      driftMultiplier: 1.5,
      volatilitySpike: 0.6,
      signatureMoveChance: 0.18,
      favoredSectors: ["RETAIL", "CONSUMER"],
      punishedSectors: ["RETAIL", "CONSUMER"],
      preferredWindow: { startPercent: 0.5, endPercent: 1.0 },
    },
  },
  {
    id: "knox_ironwell",
    displayName: "Knox Ironwell",
    nickname: "The Utility Sovereign",
    publicPersona: "Quiet steward of essential services.",
    secretTruth: "He uses outages and regulations to steer global prices.",
    manipulationStyle: "Infrastructure outages and rolling blackouts.",
    signatureMoveName: "Gridlock",
    signatureMoveDescription:
      "Spikes Utilities then cascades outages into Tech and Energy.",
    eraInfluence: ["Infrastructure Failures", "Energy Rations", "Rate Hikes"],
    targetPlayer: "If you play conservatively, he attacks defensive sectors.",
    mechanicalProfile: {
      driftMultiplier: 1.1,
      volatilitySpike: 0.5,
      signatureMoveChance: 0.17,
      favoredSectors: ["UTILITIES", "ENERGY"],
      punishedSectors: ["TECH", "ENERGY"],
      preferredWindow: { startPercent: 0.6, endPercent: 1.0 },
    },
  },
  {
    id: "indigo_slate",
    displayName: "Indigo Slate",
    nickname: "The Shadow Broker",
    publicPersona: "No one knows their face.",
    secretTruth: "Controls the dark-pool volume that institutions rely on.",
    manipulationStyle: "Hidden liquidity and ghost trades.",
    signatureMoveName: "Phantom Prints",
    signatureMoveDescription:
      "Revises price history, erasing or muting the days you profited most.",
    eraInfluence: ["Opacity Eras"],
    targetPlayer: "She redacts your best prediction streaks after the fact.",
    mechanicalProfile: {
      driftMultiplier: 1.0,
      volatilitySpike: 0.4,
      signatureMoveChance: 0.15,
      preferredWindow: { startPercent: 0.7, endPercent: 1.0 },
    },
  },
  {
    id: "cyrus_vale",
    displayName: "Cyrus Vale",
    nickname: "The Era Bender",
    publicPersona: "Macro economist and Aurora Vale's cousin.",
    secretTruth: "Manipulates eras through offshore derivatives.",
    manipulationStyle: "Era length warping and flips.",
    signatureMoveName: "Epoch Break",
    signatureMoveDescription:
      "Ends the current era instantly and starts its opposite, invalidating positions.",
    eraInfluence: ["Bull vs Liquidity Crunch", "Tech Boom vs Regression"],
    targetPlayer:
      "Interrupts position building by flipping eras before your thesis resolves.",
    mechanicalProfile: {
      driftMultiplier: 1.0,
      volatilitySpike: 0.6,
      signatureMoveChance: 0.2,
      preferredWindow: { startPercent: 0.5, endPercent: 1.0 },
    },
  },
];

export const protagonistArchetypes: ProtagonistArchetype[] = [
  {
    id: "saver",
    name: "The Saver",
    theme: "You have always been good at holding onto money.",
    startingBonus: "+3% more cash per day you don't trade.",
    weakness: "-5% starting capital.",
    hiddenPerk: "Immune to Gideon Pike's first short ambush.",
  },
  {
    id: "math-kid",
    name: "The Math Kid",
    theme: "Quiet numbers genius.",
    startingBonus: "+15% prediction accuracy for the first era.",
    weakness: "Triggers execute 1 day slower.",
    hiddenPerk: "Vesper Kline's volatility attacks are reduced by half.",
  },
  {
    id: "risk-taker",
    name: "The Risk Taker",
    theme: "You leap before you look.",
    startingBonus: "+50% intraday range visibility.",
    weakness: "-10% bond yields.",
    hiddenPerk: "Immune to Mira Solari's Flash Frenzy reversal once per run.",
  },
  {
    id: "empath",
    name: "The Empath",
    theme: "You read people as well as markets.",
    startingBonus: "Detect which whale is active one day earlier.",
    weakness: "Lower starting XP (slow early meta growth).",
    hiddenPerk: "Aurora Vale cannot mislead your sentiment indicator.",
  },
  {
    id: "hustler",
    name: "The Hustler",
    theme: "Raised in chaos - adaptive trader.",
    startingBonus: "+1 free reroll on sectors each run.",
    weakness: "Era predictions start at -10% accuracy.",
    hiddenPerk: "Immune to Cyrus Vale's Epoch Break once.",
  },
  {
    id: "ghost",
    name: "The Ghost",
    theme: "You slip under the radar.",
    startingBonus: "Whales target you 30% later in the run.",
    weakness: "Lower profit ceilings in the early game.",
    hiddenPerk: "Indigo Slate cannot rewrite your best day.",
  },
];
