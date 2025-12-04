const difficultyModes = [
    {
        id: "novice",
        label: "Novice",
        description: "Reduced volatility, more starting cash, fewer negative events.",
        modifiers: {
            startingCashMultiplier: 1.5,
            volatilityMultiplier: 0.8,
            eventMultiplier: 0.85,
        },
    },
    {
        id: "classic",
        label: "Classic",
        description: "Balanced runs with the default rules.",
        modifiers: {
            startingCashMultiplier: 1,
            volatilityMultiplier: 1,
            eventMultiplier: 1,
        },
    },
    {
        id: "iron_trader",
        label: "Iron Trader",
        description: "Less cash, higher volatility, negatives hurt more.",
        modifiers: {
            startingCashMultiplier: 0.8,
            volatilityMultiplier: 1.15,
            eventMultiplier: 1.2,
        },
    },
    {
        id: "endless",
        label: "Endless",
        description: "No run over, events cascade, voltage high.",
        modifiers: {
            startingCashMultiplier: 1,
            volatilityMultiplier: 1.3,
            eventMultiplier: 1.3,
        },
        special: {
            noRunOver: true,
        },
    },
];
export default difficultyModes;
