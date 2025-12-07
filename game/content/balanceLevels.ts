export interface BalanceLevelValues {
  volatilityScale: number;
  eventScale: number;
  whaleScale: number;
  whaleCap: number;
  maxWhalesPerSector: number;
  metaRampBoost: number;
  bondProfitScale: number;
  communityFundScale: number;
  sideHustleChance: number;
}

export interface BalanceLevelConfig {
  id: string;
  label: string;
  description: string;
  values: BalanceLevelValues;
}

const balanceLevels: BalanceLevelConfig[] = [
  {
    id: "novice",
    label: "Novice tuning",
    description: "Soft whales, slightly dampened volatility, and friendly events.",
    values: {
      volatilityScale: 0.85,
      eventScale: 0.9,
      whaleScale: 0.4,
      whaleCap: 0.45,
      maxWhalesPerSector: 1,
      metaRampBoost: 0.8,
      bondProfitScale: 0.8,
      communityFundScale: 0.9,
      sideHustleChance: 0.7,
    },
  },
  {
    id: "classic",
    label: "Classic tuning",
    description: "Baseline experience with guarded whales and steady volatility.",
    values: {
      volatilityScale: 1,
      eventScale: 1,
      whaleScale: 0.7,
      whaleCap: 0.5,
      maxWhalesPerSector: 2,
      metaRampBoost: 0.9,
      bondProfitScale: 1,
      communityFundScale: 1,
      sideHustleChance: 1,
    },
  },
  {
    id: "iron",
    label: "Iron tuning",
    description: "Full challenge with bundles of whales and stronger volatility bursts.",
    values: {
      volatilityScale: 1.2,
      eventScale: 1.15,
      whaleScale: 1.0,
      whaleCap: 0.6,
      maxWhalesPerSector: 2,
      metaRampBoost: 1,
      bondProfitScale: 1.1,
      communityFundScale: 1,
      sideHustleChance: 1.15,
    },
  },
];

export default balanceLevels;
