const eraTemplates = [
  {
    id: "calm-market",
    name: "Calm Market",
    description:
      "Stability returns to the markets. Trends are gentle, volatility contracts, and events quiet down.",
    effects: {
      globalTrendBias: 0.005,
      volatilityMultiplier: 0.6,
      eventFrequencyMultiplier: 0.7,
      intradayRangeMultiplier: 0.7,
    },
    sectorEffects: {},
    eventWeights: {
      positive: 1.2,
      negative: 0.8,
      scandal: 0.5,
    },
    difficulty: "easy",
  },
  {
    id: "tech-boom",
    name: "Tech Boom",
    description:
      "Software, AI, and robotics dominate. Tech companies surge while traditional sectors lag.",
    effects: {
      globalTrendBias: 0.02,
      volatilityMultiplier: 1.2,
      intradayRangeMultiplier: 1.1,
    },
    sectorEffects: {
      Tech: 0.05,
      Energy: -0.01,
      Infrastructure: -0.005,
    },
    eventWeights: {
      innovation: 3,
      "earnings-beat": 2,
      scandal: 1,
    },
    difficulty: "medium",
  },
  {
    id: "energy-crisis",
    name: "Energy Crisis",
    description:
      "Oil and gas supply shocks ripple across the market. Energy spikes while transport bleeds.",
    effects: {
      globalTrendBias: -0.005,
      volatilityMultiplier: 1.6,
      intradayRangeMultiplier: 1.4,
    },
    sectorEffects: {
      Energy: 0.12,
      Supply: -0.06,
      Retail: -0.02,
    },
    eventWeights: {
      "supply-shock": 4,
      regulation: 2,
      scandal: 1.2,
    },
    difficulty: "hard",
  },
  {
    id: "liquidity-crunch",
    name: "Liquidity Crunch",
    description:
      "Credit tightens and cash becomes king. Companies struggle to borrow, markets sell off sharply.",
    effects: {
      globalTrendBias: -0.03,
      volatilityMultiplier: 1.7,
      eventFrequencyMultiplier: 1.4,
      intradayRangeMultiplier: 1.5,
    },
    sectorEffects: {
      FinTech: -0.06,
      Infrastructure: -0.04,
    },
    eventWeights: {
      default: 3,
      downgrade: 2,
      panic: 1.5,
    },
    difficulty: "very-hard",
  },
  {
    id: "recovery",
    name: "Recovery",
    description:
      "Markets rebound from recent lows. Sentiment improves and risk-taking cautiously resumes.",
    effects: {
      globalTrendBias: 0.015,
      volatilityMultiplier: 0.9,
      intradayRangeMultiplier: 1,
    },
    sectorEffects: {
      Retail: 0.02,
      Infrastructure: 0.015,
    },
    eventWeights: {
      "earnings-beat": 2,
      "guidance-raise": 1.5,
    },
    difficulty: "medium",
  },
  {
    id: "inflation-scare",
    name: "Inflation Scare",
    description:
      "Prices jump across the economy, crushing real earnings and sparking selloffs.",
    effects: {
      globalTrendBias: -0.02,
      volatilityMultiplier: 1.4,
      intradayRangeMultiplier: 1.3,
    },
    sectorEffects: {
      Retail: -0.04,
      Tech: -0.01,
      Supply: 0.02,
    },
    eventWeights: {
      "economic-report": 3,
      miss: 2,
    },
    difficulty: "hard",
  },
  {
    id: "stimulus-wave",
    name: "Stimulus Wave",
    description: "Governments inject capital and markets roar back with optimism.",
    effects: {
      globalTrendBias: 0.03,
      volatilityMultiplier: 1.1,
      intradayRangeMultiplier: 1.2,
    },
    sectorEffects: {
      Retail: 0.03,
      Tech: 0.02,
    },
    eventWeights: {
      stimulus: 5,
      "guidance-raise": 2,
    },
    difficulty: "easy",
  },
  {
    id: "crypto-winter",
    name: "Crypto Winter",
    description:
      "Speculative assets collapse. Volatility in growth stocks trickles downward.",
    effects: {
      globalTrendBias: -0.025,
      volatilityMultiplier: 1.8,
      intradayRangeMultiplier: 1.5,
    },
    sectorEffects: {
      Blockchain: -0.03,
      FinTech: -0.01,
    },
    eventWeights: {
      "bubble-pop": 4,
      scandal: 2,
    },
    difficulty: "hard",
  },
  {
    id: "bubble-euphoria",
    name: "Bubble Euphoria",
    description: "Investors shrug off fundamentals. Everything runs hot.",
    effects: {
      globalTrendBias: 0.04,
      volatilityMultiplier: 1.5,
      intradayRangeMultiplier: 1.8,
    },
    sectorEffects: {},
    eventWeights: {
      hype: 5,
      innovation: 3,
      scandal: 1,
    },
    difficulty: "high-risk-high-reward",
  },
  {
    id: "regulatory-crackdown",
    name: "Regulatory Crackdown",
    description:
      "Governments impose new rules. Scandals rise and compliance costs skyrocket.",
    effects: {
      globalTrendBias: -0.01,
      volatilityMultiplier: 1.2,
      intradayRangeMultiplier: 1.1,
    },
    sectorEffects: {
      Tech: -0.02,
      FinTech: -0.03,
    },
    eventWeights: {
      scandal: 3,
      regulation: 4,
      downgrade: 2,
    },
    difficulty: "medium",
  },
  {
    id: "earnings-season",
    name: "Earnings Season",
    description:
      "Quarterly earnings flood in. High volatility and big winners/losers.",
    effects: {
      volatilityMultiplier: 1.8,
      eventFrequencyMultiplier: 2,
      intradayRangeMultiplier: 1.6,
    },
    sectorEffects: {},
    eventWeights: {
      "earnings-beat": 3,
      miss: 3,
      "guidance-raise": 2,
      panic: 1.2,
    },
    difficulty: "swingy",
  },
  {
    id: "fear-cycle",
    name: "Fear Cycle",
    description: "Investors flee risk. Defensive stocks rise, growth stocks sink.",
    effects: {
      globalTrendBias: -0.015,
      volatilityMultiplier: 1.3,
    },
    sectorEffects: {
      Climate: 0.03,
      BioTech: 0.02,
      Tech: -0.03,
    },
    eventWeights: {
      panic: 3,
      downgrade: 2,
    },
    difficulty: "medium",
  },
  {
    id: "optimism-cycle",
    name: "Optimism Cycle",
    description: "Animal spirits rise. Growth outperforms, risk appetite increases.",
    effects: {
      globalTrendBias: 0.02,
      volatilityMultiplier: 1.1,
    },
    sectorEffects: {
      Tech: 0.04,
      Retail: 0.02,
    },
    eventWeights: {
      hype: 3,
      "earnings-beat": 2,
    },
    difficulty: "easy",
  },
  {
    id: "supply-chain-knot",
    name: "Supply Chain Knot",
    description: "Shortages disrupt production across multiple industries.",
    effects: {
      globalTrendBias: -0.01,
      volatilityMultiplier: 1.4,
    },
    sectorEffects: {
      Infrastructure: -0.03,
      Retail: -0.02,
      Tech: 0,
    },
    eventWeights: {
      "supply-shock": 3,
      delay: 2,
    },
    difficulty: "hard",
  },
  {
    id: "housing-boom",
    name: "Housing Boom",
    description: "Real estate surges as demand pushes prices skyward.",
    effects: {
      globalTrendBias: 0.015,
      volatilityMultiplier: 1.2,
    },
    sectorEffects: {
      Infrastructure: 0.06,
      FinTech: 0.02,
    },
    eventWeights: {
      upgrade: 2,
      "earnings-beat": 2,
    },
    difficulty: "easy",
  },
  {
    id: "housing-bust",
    name: "Housing Bust",
    description: "Real estate collapses, dragging banks and consumers down with it.",
    effects: {
      globalTrendBias: -0.04,
      volatilityMultiplier: 1.5,
    },
    sectorEffects: {
      Infrastructure: -0.08,
      FinTech: -0.04,
      Retail: -0.02,
    },
    eventWeights: {
      default: 3,
      panic: 2,
    },
    difficulty: "very-hard",
  },
  {
    id: "currency-flux",
    name: "Currency Flux",
    description: "Foreign exchange instability causes unpredictable swings.",
    effects: {
      volatilityMultiplier: 2,
      intradayRangeMultiplier: 1.8,
    },
    sectorEffects: {
      Blockchain: 0.03,
      Supply: -0.02,
    },
    eventWeights: {
      "fx-shock": 4,
      scandal: 1,
    },
    difficulty: "chaotic",
  },
  {
    id: "rate-drop",
    name: "Rate Drop",
    description: "Interest rates fall, boosting growth sectors.",
    effects: {
      globalTrendBias: 0.025,
      volatilityMultiplier: 1.1,
    },
    sectorEffects: {
      Tech: 0.03,
      Infrastructure: 0.04,
    },
    eventWeights: {
      "guidance-raise": 2,
      stimulus: 1.5,
    },
    difficulty: "easy",
  },
  {
    id: "volatility-storm",
    name: "Volatility Storm",
    description: "A period of wild price action. Huge swings in every direction.",
    effects: {
      globalTrendBias: 0,
      volatilityMultiplier: 2.5,
      intradayRangeMultiplier: 2,
    },
    sectorEffects: {},
    eventWeights: {
      panic: 3,
      "bubble-pop": 2,
    },
    difficulty: "extreme",
  },
];

export default eraTemplates;
