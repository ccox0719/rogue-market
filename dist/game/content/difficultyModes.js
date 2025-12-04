const difficultyModes = [
    {
        id: "novice",
        label: "Novice",
        description: "Reduced volatility, extra starting cash, fewer negative events.",
        modifiers: {
            startingCashMultiplier: 1.5,
            volatilityMultiplier: 0.8,
            eventMultiplier: 0.85,
        },
    },
    {
        id: "classic",
        label: "Classic",
        description: "Balanced runs with standard rules.",
        modifiers: {
            startingCashMultiplier: 1,
            volatilityMultiplier: 1,
            eventMultiplier: 1,
        },
    },
    {
        id: "iron_trader",
        label: "Iron Trader",
        description: "Less starting cash, higher volatility, punishing downturns.",
        modifiers: {
            startingCashMultiplier: 0.8,
            volatilityMultiplier: 1.15,
            eventMultiplier: 1.2,
        },
    },
    {
        id: "endless",
        label: "Endless",
        description: "No game over. Eras stack, chaos accelerates, markets stay hot.",
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
