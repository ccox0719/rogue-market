const whaleDefinitions = [
    {
        id: "dividend-baron",
        displayName: "Dividend Baron",
        style: "value",
        description: "The Dividend Baron chases stable cash flows and makes slow, deliberate moves in energy and financial names.",
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
        revealAtLevel: 2,
    },
    {
        id: "momentum-siren",
        displayName: "Momentum Siren",
        style: "momentum",
        description: "Momentum Siren rides hype cycles, leaning into whatever sector is running hot before the tide turns.",
        favoriteSectors: ["Tech", "Retail"],
        triggers: {
            eras: ["tech-boom", "bubble-euphoria", "stimulus-wave"],
            chance: 0.65,
        },
        impactModel: {
            sectorTrendDelta: 0.018,
            companyTrendDelta: 0.025,
        },
        revealAtLevel: 3,
    },
    {
        id: "short-sentinel",
        displayName: "Short Sentinel",
        style: "short-seller",
        description: "Always looking for overextended sectors; the Short Sentinel leaks pressure into weak retail and infrastructure names.",
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
        revealAtLevel: 4,
    },
    {
        id: "quantum-drone",
        displayName: "Quantum Drone",
        style: "growth",
        description: "Quantum Drone seeks the freshest startups, giving extra love to blockchain and fintech companies.",
        favoriteSectors: ["Blockchain", "FinTech"],
        triggers: {
            eras: ["crypto-winter", "earnings-season", "fear-cycle"],
            chance: 0.5,
        },
        impactModel: {
            sectorTrendDelta: 0.014,
            companyTrendDelta: 0.02,
        },
        revealAtLevel: 5,
    },
    {
        id: "supply-whisper",
        displayName: "Supply Whisper",
        style: "value",
        description: "Supply Whisper manipulates resource-heavy sectors, pressing on energy or supply names depending on the day.",
        favoriteSectors: ["Supply", "Energy"],
        triggers: {
            minDay: 3,
            chance: 0.45,
        },
        impactModel: {
            sectorTrendDelta: 0.01,
            companyTrendDelta: 0.015,
        },
        revealAtLevel: 1,
    },
];
export default whaleDefinitions;
