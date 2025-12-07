const campaigns = [
    {
        id: "rookie-sprint",
        name: "Rookie Sprint",
        description: "Build confidence before the big leagues.",
        objective: "Reach Aú 5,000 before Day 15.",
        targetPortfolio: 5_000,
        dayLimit: 15,
        modifiers: {
            startingCashMult: 1,
            volatilityMultiplier: 0.9,
            watchOrderLimitBonus: 0,
        },
    },
    {
        id: "growth-challenge",
        name: "Growth Challenge",
        description: "Sectors swing harder. Momentum reading becomes essential.",
        objective: "Finish with Aú 12,000 before Day 25.",
        targetPortfolio: 12_000,
        dayLimit: 25,
        modifiers: {
            startingCashMult: 1.1,
            volatilityMultiplier: 1.15,
            watchOrderLimitBonus: 1,
        },
    },
    {
        id: "whale-hunter",
        name: "Whale Hunter",
        description: "Identify and ride whale-driven movements before they hit.",
        objective: "Hold a peak of Aú 18,000 and survive Day 30.",
        targetPortfolio: 18_000,
        dayLimit: 30,
        modifiers: {
            startingCashMult: 1.25,
            volatilityMultiplier: 1.2,
            watchOrderLimitBonus: 2,
        },
    },
];
export const campaignLibrary = campaigns;
export const findCampaign = (id) => campaignLibrary.find((campaign) => campaign.id === id);
