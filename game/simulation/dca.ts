export type DCAStreamId =
  | "community_fund"
  | "solar_coop"
  | "mini_rentals"
  | "food_truck_collective"
  | "municipal_bonds"
  | "school_fundraiser"
  | "agri_coop"
  | "youth_syndicate";

export type DCAEventKind = "daily_income" | "bonus" | "negative";

export interface DCAEvent {
  kind: DCAEventKind;
  streamId: DCAStreamId;
  label: string;
  description: string;
  cashDelta: number;
  meta?: Record<string, unknown>;
}

export interface DCAStreamDef {
  id: DCAStreamId;
  name: string;
  description: string;
  incomeRatePerDay: number;
  negativeChancePerDay: number;
  bonusChancePerDay: number;
}

export interface DCAState {
  activeStreamId: DCAStreamId;
  dailyContribution: number;
  totalContributed: number;
  totalEarned: number;
  lastAppliedDay?: number;
}

export const DCA_STREAMS: Record<DCAStreamId, DCAStreamDef> = {
  community_fund: {
    id: "community_fund",
    name: "Community Business Fund",
    description: "A basket of neighborhood shops and services. Very steady, low risk.",
    incomeRatePerDay: 0.0015,
    negativeChancePerDay: 0.01,
    bonusChancePerDay: 0.02,
  },
  solar_coop: {
    id: "solar_coop",
    name: "Solar Co-op Shares",
    description: "Local rooftop solar program. Stable, with occasional sunny bonuses.",
    incomeRatePerDay: 0.0012,
    negativeChancePerDay: 0.01,
    bonusChancePerDay: 0.03,
  },
  mini_rentals: {
    id: "mini_rentals",
    name: "Mini Rental Pool",
    description: "Fractional shares of neighborhood rentals. High yield with landlord problems.",
    incomeRatePerDay: 0.002,
    negativeChancePerDay: 0.02,
    bonusChancePerDay: 0.02,
  },
  food_truck_collective: {
    id: "food_truck_collective",
    name: "Food Truck Collective",
    description: "Shares in food trucks. Weather and events create spikes and slumps.",
    incomeRatePerDay: 0.0013,
    negativeChancePerDay: 0.02,
    bonusChancePerDay: 0.05,
  },
  municipal_bonds: {
    id: "municipal_bonds",
    name: "Municipal Micro-Bonds",
    description: "Tiny pieces of city projects. Safest, but not flashy.",
    incomeRatePerDay: 0.001,
    negativeChancePerDay: 0.005,
    bonusChancePerDay: 0.005,
  },
  school_fundraiser: {
    id: "school_fundraiser",
    name: "School Fundraiser Shares",
    description: "Invest in school events and fundraisers. Slow, then big event spikes.",
    incomeRatePerDay: 0.0008,
    negativeChancePerDay: 0.01,
    bonusChancePerDay: 0.02,
  },
  agri_coop: {
    id: "agri_coop",
    name: "Neighborhood Agriculture Co-op",
    description: "Community gardens and honey. Seasonal boosts, weather risk.",
    incomeRatePerDay: 0.0009,
    negativeChancePerDay: 0.02,
    bonusChancePerDay: 0.03,
  },
  youth_syndicate: {
    id: "youth_syndicate",
    name: "Youth Micro-Business Syndicate",
    description: "A pool of teen-run side hustles. Chaotic but profitable.",
    incomeRatePerDay: 0.0017,
    negativeChancePerDay: 0.03,
    bonusChancePerDay: 0.04,
  },
};

export function createDefaultDCAState(): DCAState {
  return {
    activeStreamId: "community_fund",
    dailyContribution: 0,
    totalContributed: 0,
    totalEarned: 0,
    lastAppliedDay: undefined,
  };
}

export function setActiveDCAStream(state: DCAState, streamId: DCAStreamId): DCAState {
  if (!DCA_STREAMS[streamId]) {
    return state;
  }
  return {
    ...state,
    activeStreamId: streamId,
  };
}

export function setDCADailyContribution(state: DCAState, amount: number): DCAState {
  const safeAmount = Math.max(0, Math.floor(amount));
  return {
    ...state,
    dailyContribution: safeAmount,
  };
}

export function applyDCAForDay(
  dca: DCAState,
  currentDayIndex: number,
  availableCash: number,
  rng: () => number = Math.random
): { newState: DCAState; cashDelta: number; events: DCAEvent[] } {
  if (dca.lastAppliedDay === currentDayIndex) {
    return { newState: dca, cashDelta: 0, events: [] };
  }

  const stream = DCA_STREAMS[dca.activeStreamId];
  let state = { ...dca, lastAppliedDay: currentDayIndex };
  let cashDelta = 0;
  const events: DCAEvent[] = [];

  let actualContribution = 0;
  if (state.dailyContribution > 0 && availableCash > 0) {
    actualContribution = Math.min(state.dailyContribution, availableCash);
    state.totalContributed += actualContribution;
    cashDelta -= actualContribution;
    if (actualContribution > 0) {
      events.push({
        kind: "daily_income",
        streamId: stream.id,
        label: "DCA Contribution",
        description: `You committed $${actualContribution.toFixed(0)} to ${stream.name}.`,
        cashDelta: -actualContribution,
      });
    }
  }

  if (state.totalContributed <= 0) {
    return { newState: state, cashDelta, events };
  }

  const baseIncome = Number((state.totalContributed * stream.incomeRatePerDay).toFixed(2));
  if (baseIncome > 0) {
    cashDelta += baseIncome;
    state.totalEarned += baseIncome;
    events.push({
      kind: "daily_income",
      streamId: stream.id,
      label: "Local Income",
      description: `Your investment in ${stream.name} generated $${baseIncome.toFixed(2)} today.`,
      cashDelta: baseIncome,
    });
  }

  if (rng() < stream.bonusChancePerDay) {
    const bonusEvent = buildBonusEvent(stream.id, state.totalContributed, rng);
    if (bonusEvent.cashDelta !== 0) {
      cashDelta += bonusEvent.cashDelta;
      state.totalEarned += Math.max(0, bonusEvent.cashDelta);
    }
    events.push(bonusEvent);
  }

  if (rng() < stream.negativeChancePerDay) {
    const negEvent = buildNegativeEvent(stream.id, state.totalContributed, rng);
    if (negEvent.cashDelta !== 0) {
      cashDelta += negEvent.cashDelta;
      if (negEvent.cashDelta >= 0) {
        state.totalEarned += negEvent.cashDelta;
      }
    }
    events.push(negEvent);
  }

  return { newState: state, cashDelta, events };
}

function buildBonusEvent(streamId: DCAStreamId, totalContributed: number, rng: () => number): DCAEvent {
  const base = Math.max(0, totalContributed);
  switch (streamId) {
    case "community_fund": {
      const bonus = Number((base * (0.005 + rng() * 0.01)).toFixed(2));
      return {
        kind: "bonus",
        streamId,
        label: "Local Festival Weekend",
        description: `Festival sales gave your fund a boost of $${bonus.toFixed(2)}.`,
        cashDelta: bonus,
      };
    }
    case "solar_coop": {
      const bonus = Number((base * (0.006 + rng() * 0.012)).toFixed(2));
      return {
        kind: "bonus",
        streamId,
        label: "Sunny Week Bonus",
        description: `Sunny skies meant a clean energy windfall of $${bonus.toFixed(2)}.`,
        cashDelta: bonus,
      };
    }
    case "mini_rentals": {
      const bonus = Number((base * (0.008 + rng() * 0.02)).toFixed(2));
      return {
        kind: "bonus",
        streamId,
        label: "Peak Rental Season",
        description: `High demand filled every unit. Rental bonus: $${bonus.toFixed(2)}.`,
        cashDelta: bonus,
      };
    }
    case "food_truck_collective": {
      const bonus = Number((base * (0.01 + rng() * 0.03)).toFixed(2));
      return {
        kind: "bonus",
        streamId,
        label: "Big Festival Weekend",
        description: `Food trucks crushed it at the festival, adding $${bonus.toFixed(2)}.`,
        cashDelta: bonus,
      };
    }
    case "municipal_bonds": {
      const bonus = Number((base * (0.003 + rng() * 0.007)).toFixed(2));
      return {
        kind: "bonus",
        streamId,
        label: "Bond Interest Adjustment",
        description: `Municipal projects performed slightly better. Bonus $${bonus.toFixed(2)}.`,
        cashDelta: bonus,
      };
    }
    case "school_fundraiser": {
      const bonus = Number((base * (0.02 + rng() * 0.05)).toFixed(2));
      return {
        kind: "bonus",
        streamId,
        label: "Mega Fundraiser Day",
        description: `The big fundraiser was a hit. You pocket an extra $${bonus.toFixed(2)}.`,
        cashDelta: bonus,
      };
    }
    case "agri_coop": {
      const bonus = Number((base * (0.01 + rng() * 0.03)).toFixed(2));
      return {
        kind: "bonus",
        streamId,
        label: "Harvest Month",
        description: `Great growing conditions delivered $${bonus.toFixed(2)} in bonus income.`,
        cashDelta: bonus,
      };
    }
    case "youth_syndicate": {
      const bonus = Number((base * (0.015 + rng() * 0.05)).toFixed(2));
      return {
        kind: "bonus",
        streamId,
        label: "Busy Weekend",
        description: `The teens booked extra jobs. You bank $${bonus.toFixed(2)} more.`,
        cashDelta: bonus,
      };
    }
  }
}

function buildNegativeEvent(streamId: DCAStreamId, totalContributed: number, rng: () => number): DCAEvent {
  const base = Math.max(0, totalContributed);
  switch (streamId) {
    case "community_fund": {
      const cost = -(10 + rng() * 20);
      return {
        kind: "negative",
        streamId,
        label: "Unexpected Repairs",
        description: `Community shops needed repairs. You cover $${Math.abs(cost).toFixed(2)}.`,
        cashDelta: cost,
      };
    }
    case "solar_coop": {
      const cost = -(15 + rng() * 25);
      return {
        kind: "negative",
        streamId,
        label: "Inverter Issue",
        description: `Solar equipment needed maintenance. You spend $${Math.abs(cost).toFixed(2)}.`,
        cashDelta: cost,
      };
    }
    case "mini_rentals": {
      if (rng() < 0.5) {
        return {
          kind: "negative",
          streamId,
          label: "Late Rent",
          description: "A tenant paid late. No payout today.",
          cashDelta: 0,
        };
      }
      const cost = -(20 + rng() * 40);
      return {
        kind: "negative",
        streamId,
        label: "Maintenance Issue",
        description: `Plumbing repairs cost you $${Math.abs(cost).toFixed(2)}.`,
        cashDelta: cost,
      };
    }
    case "food_truck_collective": {
      if (rng() < 0.6) {
        return {
          kind: "negative",
          streamId,
          label: "Rainy Weekend",
          description: "Bad weather emptied the streets. No income today.",
          cashDelta: 0,
        };
      }
      const cost = -(25 + rng() * 35);
      return {
        kind: "negative",
        streamId,
        label: "Truck Breakdown",
        description: `A truck needed repairs. You cover $${Math.abs(cost).toFixed(2)}.`,
        cashDelta: cost,
      };
    }
    case "municipal_bonds": {
      const cost = -(5 + rng() * 10);
      return {
        kind: "negative",
        streamId,
        label: "Project Delay",
        description: `Paperwork delayed a project. You pay $${Math.abs(cost).toFixed(2)} in admin fees.`,
        cashDelta: cost,
      };
    }
    case "school_fundraiser": {
      return {
        kind: "negative",
        streamId,
        label: "Slow Week",
        description: "School events were quiet this week. No income lost today.",
        cashDelta: 0,
      };
    }
    case "agri_coop": {
      if (rng() < 0.5) {
        return {
          kind: "negative",
          streamId,
          label: "Bad Weather",
          description: "Weather hurt crops. Co-op income drops to almost nothing today.",
          cashDelta: 0,
        };
      }
      const cost = -(15 + rng() * 25);
      return {
        kind: "negative",
        streamId,
        label: "Pest Damage",
        description: `Pest damage hit the harvest. You cover $${Math.abs(cost).toFixed(2)}.`,
        cashDelta: cost,
      };
    }
    case "youth_syndicate": {
      if (rng() < 0.5) {
        return {
          kind: "negative",
          streamId,
          label: "Rain Cancelled Jobs",
          description: "Weather erased lawn jobs. No income today.",
          cashDelta: 0,
        };
      }
      const cost = -(20 + rng() * 30);
      return {
        kind: "negative",
        streamId,
        label: "Equipment Broke",
        description: `The kids had to replace equipment. You cover $${Math.abs(cost).toFixed(2)}.`,
        cashDelta: cost,
      };
    }
  }
}
