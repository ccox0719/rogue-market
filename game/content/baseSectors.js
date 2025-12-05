const baseSectors = [
    {
        name: "Tech",
        weight: 1.35,
        correlation: 0.88,
        description: "Cloud infrastructure, AI labs, and quantum compute pioneers.",
        branding: {
            adjectives: ["Neon", "Quantum", "Pulse", "Luminous", "Synthetic"],
            nouns: ["Labs", "Systems", "Networks", "Dynamics", "Stacks"],
        },
    },
    {
        name: "Energy",
        weight: 1.05,
        correlation: 0.62,
        description: "Clean fusion, solar grids, and synthetic fuel playbooks.",
        branding: {
            adjectives: ["Solar", "Radiant", "Fusion", "Volt", "Helios"],
            nouns: ["Grid", "Cells", "Flux", "Harvest", "Array"],
        },
    },
    {
        name: "BioTech",
        weight: 0.95,
        correlation: 0.57,
        description: "Gene-editing, longevity platforms, and biological AI.",
        branding: {
            adjectives: ["Helix", "Genome", "Vital", "Cure", "Amp"],
            nouns: ["Therapeutics", "Biologics", "Cell", "Sequence", "Synth"],
        },
    },
    {
        name: "Supply",
        weight: 0.8,
        correlation: 0.45,
        description: "Logistics networks, orbital freight routes, and automation hubs.",
        branding: {
            adjectives: ["Vector", "Flux", "Pulse", "North"],
            nouns: ["Transit", "Grid", "Corridor", "Logistics"],
        },
    },
    {
        name: "Retail",
        weight: 0.75,
        correlation: 0.34,
        description: "Consumer brands, delivery chains and virtual storefronts.",
        branding: {
            adjectives: ["Urban", "Neon", "Swift", "Daily", "Prism"],
            nouns: ["Markets", "Collective", "Outfitters", "Exchange", "Cart"],
        },
    },
    {
        name: "FinTech",
        weight: 1.15,
        correlation: 0.72,
        description: "Neobanks, crypto rails, and payment-layer disruptors.",
        branding: {
            adjectives: ["Vaulted", "Ledger", "Crypto", "Prime", "Auric"],
            nouns: ["Capital", "Commerce", "Payments", "Holdings", "Relay"],
        },
    },
    {
        name: "Infrastructure",
        weight: 0.85,
        correlation: 0.48,
        description: "Data centers, orbital stations, and smart transit.",
        branding: {
            adjectives: ["Atlas", "Orbital", "Core", "Axial", "Forge"],
            nouns: ["Transit", "Construct", "Networks", "Fabric", "Span"],
        },
    },
    {
        name: "Climate",
        weight: 0.7,
        correlation: 0.4,
        description: "Carbon capture, reforestation tech, and geoengineering labs.",
        branding: {
            adjectives: ["Verdant", "Aurora", "Biosphere", "Cascade"],
            nouns: ["Pulse", "Fountain", "Canopy", "Array"],
        },
    },
    {
        name: "Blockchain",
        weight: 0.9,
        correlation: 0.65,
        description: "Decentralized infrastructure, oracle networks, and DAOs.",
        branding: {
            adjectives: ["Silk", "Nexus", "Kinetic", "Lattice"],
            nouns: ["Relay", "Mesh", "Ledger", "Relay"],
        },
    },
    {
        name: "Space",
        weight: 0.6,
        correlation: 0.44,
        description: "Orbital manufacturing, debris mitigation, and aerospike launches.",
        branding: {
            adjectives: ["Stellar", "Auric", "Horizon", "Comet"],
            nouns: ["Launch", "Orbit", "Array", "Updraft"],
        },
    },
];
export default baseSectors;
