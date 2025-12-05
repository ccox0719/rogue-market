import bondDefinitions from "../content/bonds.js";
const catalog = bondDefinitions;
export const bondCatalog = catalog;
export const findBondDefinition = (id) => catalog.find((entry) => entry.id === id);
const pickRandomDefinitions = (count, rng) => {
    const pool = [...catalog];
    const picks = [];
    while (picks.length < count && pool.length > 0) {
        const index = Math.floor(rng.next() * pool.length);
        picks.push(pool[index]);
        pool.splice(index, 1);
    }
    return picks;
};
export const createBondListing = (definition) => ({
    id: crypto.randomUUID(),
    bondId: definition.id,
    faceValue: definition.faceValue,
    couponRate: definition.couponRate,
    type: definition.type,
    durationDays: definition.durationDays,
});
export const createBondMarket = (rng, count = 4) => {
    const picks = pickRandomDefinitions(count, rng);
    return picks.map((definition) => createBondListing(definition));
};
