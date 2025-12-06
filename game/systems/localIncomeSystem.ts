import type { GameState } from "../core/state.js";
import type { RNG } from "../core/rng.js";

export type LocalIncomeEventType = "no_payout" | "reduced_income" | "cost" | "bonus";
export type RiskTone = "very-low" | "low" | "medium" | "medium-high" | "high";

export interface LocalIncomeEventDefinition {
  id: string;
  name: string;
  description: string;
  type: LocalIncomeEventType;
  duration?: number;
  durationRange?: [number, number];
  factor?: number;
  factorRange?: [number, number];
  amount?: number;
  amountRange?: [number, number];
}

export interface LocalIncomeDefinition {
  id: string;
  name: string;
  description: string;
  dailyIncome: number;
  riskLevel: number;
  riskLabel: string;
  riskTone: RiskTone;
  negativeEvents: LocalIncomeEventDefinition[];
  bonusRate?: number;
  bonusEvents?: LocalIncomeEventDefinition[];
}

export interface ActiveIncomeEvent {
  type: Extract<LocalIncomeEventType, "no_payout" | "reduced_income">;
  remainingDays: number;
  factor?: number;
  message: string;
}

export interface LocalIncomeStreamStatus {
  activeEvent: ActiveIncomeEvent | null;
}

export interface LocalIncomeEventLogEntry {
  day: number;
  streamId: string;
  message: string;
  type: LocalIncomeEventType;
}

const LOCAL_INCOME_LOG_LIMIT = 5;

export const localIncomeDefinitions: LocalIncomeDefinition[] = [
  {
    id: "community-business-fund",
    name: "Community Business Fund",
    description: "Neighborhood shops pool their payouts so you get reliable cash.",
    dailyIncome: 8,
    riskLabel: "Low",
    riskTone: "low",
    riskLevel: 0.01,
    negativeEvents: [
      {
        id: "community-slow-week",
        name: "Slow bakery week",
        description: "Local bakery had a slow week, pausing this stream for the day.",
        type: "no_payout",
        duration: 1,
      },
      {
        id: "community-plumbing",
        name: "Plumbing repair",
        description: "Plumbing hiccup drains $15 for urgent repairs.",
        type: "cost",
        amount: 15,
      },
      {
        id: "community-seasonal-dip",
        name: "Seasonal slowdown",
        description: "Seasonal downturn trims payouts by 20% for two days.",
        type: "reduced_income",
        factor: 0.8,
        duration: 2,
      },
    ],
    bonusRate: 0.03,
    bonusEvents: [
      {
        id: "community-pop-up",
        name: "Pop-up weekend",
        description: "A pop-up seller boosts the fund by an extra 5% today.",
        type: "bonus",
        factor: 0.05,
      },
    ],
  },
  {
    id: "solar-co-op",
    name: "Solar Co-op Shares",
    description: "Neighbors share clean energy earnings from rooftop panels.",
    dailyIncome: 7,
    riskLabel: "Low",
    riskTone: "low",
    riskLevel: 0.01,
    negativeEvents: [
      {
        id: "solar-cloudy",
        name: "Cloudy stretch",
        description: "Cloudy stretch halves todays payout.",
        type: "reduced_income",
        factor: 0.5,
        duration: 1,
      },
      {
        id: "solar-inverter",
        name: "Inverter issue",
        description: "Inverter issue costs $25 to restore production.",
        type: "cost",
        amount: 25,
      },
    ],
    bonusRate: 0.02,
    bonusEvents: [
      {
        id: "solar-feed-in",
        name: "Feed-in credit",
        description: "Surplus sun sells back to the grid for +4% today.",
        type: "bonus",
        factor: 0.04,
      },
    ],
  },
  {
    id: "mini-rental-pool",
    name: "Mini Rental Pool",
    description: "A few tight-knit rental units share steady income.",
    dailyIncome: 10,
    riskLabel: "Medium",
    riskTone: "medium",
    riskLevel: 0.015,
    negativeEvents: [
      {
        id: "rental-tenant-late",
        name: "Tenant late",
        description: "Tenant is late on rent, so no payout today.",
        type: "no_payout",
        duration: 1,
      },
      {
        id: "rental-maintenance",
        name: "Maintenance hiccup",
        description: "Maintenance bill pops up, costing $20.",
        type: "cost",
        amount: 20,
      },
      {
        id: "rental-vacancy",
        name: "Vacancy week",
        description: "A vacancy cuts income by 70% for the next three days.",
        type: "reduced_income",
        factor: 0.3,
        duration: 3,
      },
    ],
    bonusRate: 0.02,
    bonusEvents: [
      {
        id: "rental-upgrade",
        name: "Quick upgrade",
        description: "A quick unit upgrade raises rent by 10% today.",
        type: "bonus",
        factor: 0.1,
      },
    ],
  },
  {
    id: "food-truck-collective",
    name: "Food Truck Collective",
    description: "Rotating food trucks share profits through a co-op.",
    dailyIncome: 9,
    riskLabel: "Medium",
    riskTone: "medium",
    riskLevel: 0.015,
    negativeEvents: [
      {
        id: "food-rain",
        name: "Rainy weekend",
        description: "Rain wipes foot traffic, so there is no payout today.",
        type: "no_payout",
        duration: 1,
      },
      {
        id: "food-breakdown",
        name: "Truck breakdown",
        description: "Truck repairs cost $35.",
        type: "cost",
        amount: 35,
      },
      {
        id: "food-permit",
        name: "Permit delay",
        description: "Permit paperwork cuts payouts by 60% for two days.",
        type: "reduced_income",
        factor: 0.4,
        duration: 2,
      },
    ],
    bonusRate: 0.04,
    bonusEvents: [
      {
        id: "food-festival",
        name: "Big festival",
        description: "Festival weekend boosts sales by 8% today.",
        type: "bonus",
        factor: 0.08,
      },
    ],
  },
  {
    id: "municipal-micro-bonds",
    name: "Municipal Micro-Bonds",
    description: "Tiny muni bonds that trail neighborhood projects.",
    dailyIncome: 5,
    riskLabel: "Very Low",
    riskTone: "very-low",
    riskLevel: 0.008,
    negativeEvents: [
      {
        id: "microbond-delay",
        name: "Project delay",
        description: "Project delay pauses payout for one or two days.",
        type: "no_payout",
        durationRange: [1, 2],
      },
      {
        id: "microbond-budget",
        name: "Budget snag",
        description: "Administrative snag costs $10.",
        type: "cost",
        amount: 10,
      },
    ],
    bonusRate: 0.015,
    bonusEvents: [
      {
        id: "microbond-boost",
        name: "Budget surplus",
        description: "Budget surplus chips in $6 today.",
        type: "bonus",
        amount: 6,
      },
    ],
  },
  {
    id: "school-fundraiser",
    name: "School Fundraiser Shares",
    description: "School fundraiser payouts you fund with community effort.",
    dailyIncome: 6,
    riskLabel: "Low",
    riskTone: "low",
    riskLevel: 0.01,
    negativeEvents: [
      {
        id: "school-low-turnout",
        name: "Low turnout",
        description: "Low turnout kills today's payout.",
        type: "no_payout",
        duration: 1,
      },
      {
        id: "school-volunteers",
        name: "Volunteer shortage",
        description: "Volunteer issues cut income by 40% today.",
        type: "reduced_income",
        factor: 0.6,
        duration: 1,
      },
    ],
    bonusRate: 0.02,
    bonusEvents: [
      {
        id: "school-boost",
        name: "Friendly donor",
        description: "A friendly donor adds $5 today.",
        type: "bonus",
        amount: 5,
      },
    ],
  },
  {
    id: "neighborhood-ag-coop",
    name: "Neighborhood Agriculture Co-op",
    description: "Small farm co-op selling produce every morning.",
    dailyIncome: 8,
    riskLabel: "Medium-High",
    riskTone: "medium-high",
    riskLevel: 0.025,
    negativeEvents: [
      {
        id: "ag-bad-weather",
        name: "Bad weather",
        description: "Bad weather slashes income by 70% for two days.",
        type: "reduced_income",
        factor: 0.3,
        duration: 2,
      },
      {
        id: "ag-bees",
        name: "Bee issue",
        description: "Hive loss costs $20.",
        type: "cost",
        amount: 20,
      },
      {
        id: "ag-animal-damage",
        name: "Animal damage",
        description: "Critters eat the stock, so no payout today.",
        type: "no_payout",
        duration: 1,
      },
    ],
    bonusRate: 0.02,
    bonusEvents: [
      {
        id: "ag-farmers-market",
        name: "Farmers market",
        description: "Farmers market weekend adds 7% extra income.",
        type: "bonus",
        factor: 0.07,
      },
    ],
  },
  {
    id: "youth-micro-business",
    name: "Youth Micro-Business Syndicate",
    description: "Teens running micro-services deliver volatile gains.",
    dailyIncome: 11,
    riskLabel: "High",
    riskTone: "high",
    riskLevel: 0.03,
    negativeEvents: [
      {
        id: "youth-rain",
        name: "Rain cancellation",
        description: "Rain cancels gigs, so the payout is 0 today.",
        type: "no_payout",
        duration: 1,
      },
      {
        id: "youth-sick",
        name: "Sick day",
        description: "Sick days reduce income by 60% today.",
        type: "reduced_income",
        factor: 0.4,
        duration: 1,
      },
      {
        id: "youth-drama",
        name: "Drama delay",
        description: "Drama between the kids pauses work for one or two days.",
        type: "no_payout",
        durationRange: [1, 2],
      },
      {
        id: "youth-equipment",
        name: "Equipment break",
        description: "Equipment repair hits $25.",
        type: "cost",
        amount: 25,
      },
    ],
    bonusRate: 0.03,
    bonusEvents: [
      {
        id: "youth-good-vibes",
        name: "Good vibes",
        description: "A viral post adds 9% extra today.",
        type: "bonus",
        factor: 0.09,
      },
    ],
  },
];

const DEFINITIONS_BY_ID = new Map(localIncomeDefinitions.map((definition) => [definition.id, definition]));

export const getLocalIncomeDefinition = (id: string): LocalIncomeDefinition | undefined =>
  DEFINITIONS_BY_ID.get(id);

export const createInitialLocalIncomeStreams = (): Record<string, LocalIncomeStreamStatus> =>
  localIncomeDefinitions.reduce<Record<string, LocalIncomeStreamStatus>>((acc, definition) => {
    acc[definition.id] = { activeEvent: null };
    return acc;
  }, {});

const pickRandom = <T>(items: T[], rng: RNG): T =>
  items[Math.floor(rng.next() * items.length)];

const resolveDuration = (event: LocalIncomeEventDefinition, rng: RNG): number => {
  if (event.durationRange) {
    const [min, max] = event.durationRange;
    const safeMax = Math.max(min, max);
    const span = Math.floor(Math.max(0, safeMax - min)) + 1;
    return min + Math.floor(rng.next() * span);
  }
  return event.duration ?? 1;
};

const resolveFactor = (event: LocalIncomeEventDefinition, rng: RNG): number => {
  if (event.factorRange) {
    const [min, max] = event.factorRange;
    return min + rng.next() * (max - min);
  }
  return event.factor ?? 0.5;
};

const resolveAmount = (event: LocalIncomeEventDefinition, rng: RNG): number => {
  if (event.amountRange) {
    const [min, max] = event.amountRange;
    const span = Math.max(0, max - min);
    return Number((min + rng.next() * span).toFixed(2));
  }
  return event.amount ?? 0;
};

const recordEvent = (state: GameState, entry: LocalIncomeEventLogEntry): void => {
  state.localIncomeEventLog.unshift(entry);
  if (state.localIncomeEventLog.length > LOCAL_INCOME_LOG_LIMIT) {
    state.localIncomeEventLog.length = LOCAL_INCOME_LOG_LIMIT;
  }
};

const applyNegativeEvent = (
  state: GameState,
  definition: LocalIncomeDefinition,
  status: LocalIncomeStreamStatus,
  eventDef: LocalIncomeEventDefinition,
  rng: RNG
): void => {
  const message = `${definition.name}: ${eventDef.description}`;
  recordEvent(state, {
    day: state.day,
    streamId: definition.id,
    message,
    type: eventDef.type,
  });

  if (eventDef.type === "cost") {
    const amount = resolveAmount(eventDef, rng);
    if (amount !== 0) {
      state.portfolio.cash = Number((state.portfolio.cash - amount).toFixed(2));
    }
    return;
  }

  const duration = Math.max(1, resolveDuration(eventDef, rng));
  const activeEvent: ActiveIncomeEvent = {
    type: eventDef.type === "no_payout" ? "no_payout" : "reduced_income",
    remainingDays: duration,
    message: eventDef.description,
  };

  if (activeEvent.type === "reduced_income") {
    activeEvent.factor = resolveFactor(eventDef, rng);
  } else {
    activeEvent.factor = 0;
  }

  status.activeEvent = activeEvent;
};

const applyBonusEvent = (
  state: GameState,
  definition: LocalIncomeDefinition,
  eventDef: LocalIncomeEventDefinition,
  rng: RNG
): void => {
  const message = `${definition.name}: ${eventDef.description}`;
  recordEvent(state, {
    day: state.day,
    streamId: definition.id,
    message,
    type: "bonus",
  });

  let amount = resolveAmount(eventDef, rng);
  if (!amount) {
    const factor = eventDef.factor ?? (eventDef.factorRange ? resolveFactor(eventDef, rng) : 0);
    amount = Number((definition.dailyIncome * factor).toFixed(2));
  }

  if (amount > 0) {
    state.portfolio.cash = Number((state.portfolio.cash + amount).toFixed(2));
  }
};

export const processLocalIncomeStreams = (state: GameState, rng: RNG): void => {
  for (const definition of localIncomeDefinitions) {
    const status = state.localIncomeStreams[definition.id];
    if (!status) continue;

    const hadActiveEvent = !!status.activeEvent;
    if (!hadActiveEvent && rng.next() < definition.riskLevel) {
      const eventDef = pickRandom(definition.negativeEvents, rng);
      applyNegativeEvent(state, definition, status, eventDef, rng);
    }

    const activeEvent = status.activeEvent;
    let multiplier = 1;
    if (activeEvent) {
      multiplier = activeEvent.type === "no_payout" ? 0 : Math.max(0, activeEvent.factor ?? 1);
      activeEvent.remainingDays -= 1;
      if (activeEvent.remainingDays <= 0) {
        status.activeEvent = null;
      }
    }

    const income = definition.dailyIncome * multiplier;
    if (income !== 0) {
      state.portfolio.cash = Number((state.portfolio.cash + income).toFixed(2));
    }

    if (definition.bonusRate && definition.bonusEvents?.length && rng.next() < definition.bonusRate) {
      const bonusEvent = pickRandom(definition.bonusEvents, rng);
      applyBonusEvent(state, definition, bonusEvent, rng);
    }
  }
};
