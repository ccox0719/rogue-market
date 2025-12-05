export type MiniGameEventId = "delivery" | "phone" | "garage";

export interface MiniGameEventDescriptor {
  id: MiniGameEventId;
  title: string;
  subtitle: string;
  story: string;
  prompt: string;
  tag: string;
}

type EventSeed = () => number;

const deliveryStories = [
  {
    title: "Tip Run – Neon Courier",
    subtitle: "The city courier is stuck in rush hour.",
    story: "The courier's route is blocked and the customers are impatient. You need to line up the timing gauge fast.",
    prompt: "Hit the marker while the neon halo glows.",
  },
  {
    title: "Tip Run – Parcel Surge",
    subtitle: "Late-night parcels are waiting.",
    story: "A friend owes you after they forgot how to time deliveries during the market sprint. Nail the timing and keep the tip.",
    prompt: "Stop the sweep inside the glowing zone.",
  },
];

const phoneStories = [
  {
    title: "Phone Unlock – Pattern Recall",
    subtitle: "Neighborhood AI engineer locked out mid-pitch.",
    story: "The engineer forgot yesterday's pattern right before a crucial call. Watch the flash, remember the rhythm, then recreate it.",
    prompt: "Repeat the pattern with steady memory.",
  },
  {
    title: "Phone Unlock – Emergency Call",
    subtitle: "A panic neighbor needs access.",
    story: "Their encrypted phone holds a tip about a mother company, but the PIN is missing. Mirror their flashes before time runs out.",
    prompt: "Keep your focus on the flashing symbols.",
  },
];

const garageStories = [
  {
    title: "Garage Cleanout – Collector's Gamble",
    subtitle: "Mom's attic hides a forgotten prototype.",
    story: "Parents are clearing the garage before moving. Choose boxes carefully to double the haul without triggering the busted radio.",
    prompt: "Pick a box and gamble it up to four times.",
  },
  {
    title: "Garage Cleanout – Dad's Side Hustle",
    subtitle: "Dad's stash of remotes might include a jackpot.",
    story: "He is deep dive through crates for refurb parts. You can flip them online as long as you dodge the busted bin.",
    prompt: "Select a box and go double-or-nothing safely.",
  },
];

const STORY_POOLS: Record<MiniGameEventId, Array<Omit<MiniGameEventDescriptor, "id" | "tag">>> = {
  delivery: deliveryStories,
  phone: phoneStories,
  garage: garageStories,
};

const EVENT_TAGS: Record<MiniGameEventId, string> = {
  delivery: "delivery_timing_event",
  phone: "phone_unlock_event",
  garage: "garage_cleanout_event",
};

function pickRandomIndex(length: number, randomizer: EventSeed): number {
  return Math.floor(randomizer() * length);
}

export function createMiniGameEvent(
  type: MiniGameEventId,
  randomizer: EventSeed = Math.random
): MiniGameEventDescriptor {
  const options = STORY_POOLS[type];
  const entry = options[pickRandomIndex(options.length, randomizer)];
  return {
    id: type,
    title: entry.title,
    subtitle: entry.subtitle,
    story: entry.story,
    prompt: entry.prompt,
    tag: EVENT_TAGS[type],
  };
}

export function pickRandomMiniGameEvent(randomizer: EventSeed = Math.random): MiniGameEventDescriptor {
  const types: MiniGameEventId[] = ["delivery", "phone", "garage"];
  const index = pickRandomIndex(types.length, randomizer);
  return createMiniGameEvent(types[index], randomizer);
}
