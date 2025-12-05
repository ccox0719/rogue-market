const whaleDefinitions = [
  {
    id: "dividend-baron",
    displayName: "Dividend Baron",
    style: "value",
    description: "The Dividend Baron chases stable cash flows and makes slow, deliberate moves in energy and financial names.",
    icon: "⚖",
    favoriteSectors: ["Energy", "Finance"],
    triggers: {
      eras: ["calm-market", "recovery", "housing-boom"],
      minDay: 5,
      chance: 0.6,
    },
    impactModel: {
      sectorTrendDelta: 0.012,
      companyTrendDelta: 0.02,
    },
    capitalConfig: {
      startingCapital: 4_000_000,
      leverage: 1.1,
      volatilitySensitivity: 0.8,
      manipulationImpact: 0.18,
      backfireFactor: 0.08,
      sectorWeights: {
        Energy: 0.6,
        Finance: 0.4,
      },
    },
    revealAtLevel: 2,
  },
  {
    id: "momentum-siren",
    displayName: "Momentum Siren",
    style: "momentum",
    description: "Momentum Siren rides hype cycles, leaning into whatever sector is running hot before the tide turns.",
    icon: "⤴",
    favoriteSectors: ["Tech", "Retail"],
    triggers: {
      eras: ["tech-boom", "bubble-euphoria", "stimulus-wave"],
      chance: 0.65,
    },
    impactModel: {
      sectorTrendDelta: 0.018,
      companyTrendDelta: 0.025,
    },
    capitalConfig: {
      startingCapital: 3_800_000,
      leverage: 1.3,
      volatilitySensitivity: 1.2,
      manipulationImpact: 0.3,
      backfireFactor: 0.15,
      sectorWeights: {
        Tech: 0.5,
        Retail: 0.5,
      },
    },
    revealAtLevel: 3,
  },
  {
    id: "short-sentinel",
    displayName: "Short Sentinel",
    style: "short-seller",
    description: "Always looking for overextended sectors; the Short Sentinel leaks pressure into weak retail and infrastructure names.",
    icon: "⤵",
    favoriteSectors: ["Retail", "Infrastructure"],
    triggers: {
      eras: ["volatility-storm", "liquidity-crunch", "housing-bust"],
      minDay: 8,
      chance: 0.55,
    },
    impactModel: {
      sectorTrendDelta: -0.018,
      companyTrendDelta: -0.022,
    },
    capitalConfig: {
      startingCapital: 3_600_000,
      leverage: 1.4,
      volatilitySensitivity: 1.4,
      manipulationImpact: 0.32,
      backfireFactor: 0.2,
      sectorWeights: {
        Retail: 0.6,
        Infrastructure: 0.4,
      },
    },
    revealAtLevel: 4,
  },
  {
    id: "quantum-drone",
    displayName: "Quantum Drone",
    style: "growth",
    description: "Quantum Drone seeks the freshest startups, giving extra love to blockchain and fintech companies.",
    icon: "⚡",
    favoriteSectors: ["Blockchain", "FinTech"],
    triggers: {
      eras: ["crypto-winter", "earnings-season", "fear-cycle"],
      chance: 0.5,
    },
    impactModel: {
      sectorTrendDelta: 0.014,
      companyTrendDelta: 0.02,
    },
    capitalConfig: {
      startingCapital: 3_200_000,
      leverage: 1,
      volatilitySensitivity: 0.9,
      manipulationImpact: 0.22,
      backfireFactor: 0.11,
      sectorWeights: {
        Blockchain: 0.55,
        FinTech: 0.45,
      },
    },
    revealAtLevel: 5,
  },
  {
    id: "supply-whisper",
    displayName: "Supply Whisper",
    style: "value",
    description: "Supply Whisper manipulates resource-heavy sectors, pressing on energy or supply names depending on the day.",
    icon: "🌀",
    favoriteSectors: ["Supply", "Energy"],
    triggers: {
      minDay: 3,
      chance: 0.45,
    },
    impactModel: {
      sectorTrendDelta: 0.01,
      companyTrendDelta: 0.015,
    },
    capitalConfig: {
      startingCapital: 3_700_000,
      leverage: 1.05,
      volatilitySensitivity: 1.0,
      manipulationImpact: 0.2,
      backfireFactor: 0.1,
      sectorWeights: {
        Supply: 0.6,
        Energy: 0.4,
      },
    },
    revealAtLevel: 1,
  },
];

export default whaleDefinitions;
