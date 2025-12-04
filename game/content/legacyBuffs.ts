import type { ArtifactEffectDescriptor } from "../generators/artifactGen.js";

export interface LegacyBuffDefinition {
  id: string;
  label: string;
  description: string;
  effects: ArtifactEffectDescriptor;
}

const legacyBuffs: LegacyBuffDefinition[] = [
  {
    id: "steady-hand",
    label: "Steady Hand",
    description: "Gain 5% more starting cash thanks to improved risk budgeting.",
    effects: {
      startingCashBonus: 0.05,
    },
  },
  {
    id: "order-book",
    label: "Order Book",
    description: "Analyst tools add two extra trigger slots for smart order layering.",
    effects: {
      triggerSlotBonus: 2,
    },
  },
  {
    id: "insider-sense",
    label: "Insider Sense",
    description: "Sector models bias towards defensive names, nudging clear trend direction.",
    effects: {
      energyBonus: 0.02,
      volatilityMultiplier: 0.98,
    },
  },
  {
    id: "lucky-strike",
    label: "Lucky Strike",
    description: "Your carryover research shrinks era lengths slightly so you can react faster.",
    effects: {
      eraDurationReduction: 0.5,
    },
  },
];

export const legacyBuffLibrary = legacyBuffs;

export const findLegacyBuff = (id: string): LegacyBuffDefinition | undefined =>
  legacyBuffLibrary.find((buff) => buff.id === id);
