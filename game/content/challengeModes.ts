export interface ChallengeMode {
  id: string;
  name: string;
  description: string;
  seed: number;
  modifiers: {
    volatilityMultiplier?: number;
    eventChanceBonus?: number;
  };
}

const challengeModes: ChallengeMode[] = [
  {
    id: "iron-run",
    name: "Iron Run",
    description: "Permanent hard mode with increased volatility and a seeded daily pattern.",
    seed: 42,
    modifiers: {
      volatilityMultiplier: 1.3,
      eventChanceBonus: 0.1,
    },
  },
  {
    id: "tech-only",
    name: "Tech Only",
    description: "Only tech-aligned sectors appear. Rely on trend bias and prediction tools.",
    seed: 312,
    modifiers: {
      volatilityMultiplier: 1.1,
    },
  },
];

export const challengeLibrary = challengeModes;

export const findChallengeMode = (id: string): ChallengeMode | undefined =>
  challengeLibrary.find((mode) => mode.id === id);
