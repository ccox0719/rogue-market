import artifacts from "../content/baseArtifacts.js";
const baseArtifacts = artifacts;
export const generateArtifactPool = () => baseArtifacts.map((entry) => ({
    ...entry,
    unlocked: false,
}));
