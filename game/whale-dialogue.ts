import type { GameState } from "./core/state.js";
import type { WhaleProfile } from "./generators/whaleGen.js";
import { whaleLibrary } from "./generators/whaleGen.js";

export type WhaleDialogueType =
  | "arrival"
  | "signature"
  | "backfire"
  | "collapse"
  | "buyout"
  | "hint";

export interface WhaleDialogueEvent {
  whaleId: WhaleProfile["id"];
  icon: string;
  text: string;
  type: WhaleDialogueType;
  timestamp: number;
}

interface WhaleDialogueLines {
  icon: string;
  lines: Partial<Record<WhaleDialogueType, string[]>>;
}

const DEFAULT_ICON = "🐋";
const DIALOGUE_LIMIT = 6;

const DIALOGUES: Record<string, WhaleDialogueLines> = {
  aurora_vale: {
    icon: "✨",
    lines: {
      arrival: ["Oh? A newcomer with opinions. How quaint.", "Try not to drown in the wave I am about to send."],
      signature: ["Watch how easily the crowd bends.", "One whisper, and the market remembers who leads."],
      backfire: ["Impossible… they listened to you?", "Your timing is… concerning."],
      collapse: ["The noise… slips from my grasp… Silence."],
      buyout: ["You claim the stage. I concede… for now."],
      hint: ["Vale is not a name. It's a frequency.", "The crowd always needs a shepherd. You could have been mine."],
    },
  },
  gideon_pike: {
    icon: "⚔️",
    lines: {
      arrival: ["Fresh meat. I smell fear on your balance sheet.", "Stand still. It makes the cut cleaner."],
      signature: ["Collapse is inevitable. I merely accelerate it.", "One bad day is all it takes."],
      backfire: ["How did you sidestep that strike?", "Hmph. Not bad for a child."],
      collapse: ["The knife slips from my hand… Don’t think this means you’re safe."],
      buyout: ["So you cut the butcher. Respect."],
      hint: ["Every bubble ends in blood. Yours was supposed to.", "I bury opportunity in panic. Watch the tremors."],
    },
  },
  cyrus_vale: {
    icon: "🕰️",
    lines: {
      arrival: ["Time bends for those who understand it.", "You feel small because you are."],
      signature: ["Observe the turn of the epoch.", "The wise act before the cycle is visible."],
      backfire: ["You read the era pivot? Impossible.", "Your instincts… inconvenient."],
      collapse: ["The cycle rejects me… perhaps it favors you."],
      buyout: ["Take the wheel of time. Let us see how long you survive."],
      hint: ["All eras end. Including mine.", "I measure defeat by decades, not days."],
    },
  },
  vesper_grimm: {
    icon: "🌑",
    lines: {
      arrival: ["Do you fear the dark between candles?", "Volatility is my mother tongue."],
      signature: ["Let the shadows shake your convictions.", "Chaos… breathes."],
      backfire: ["You danced through the void? Impressive.", "Your steadiness is nauseating."],
      collapse: ["Light… how vile."],
      buyout: ["Then take my storm. It was never mine anyway."],
      hint: ["I was born in the crash of ’08. I remember every scream."],
    },
  },
  indigo_slate: {
    icon: "🜁",
    lines: {
      arrival: ["Names don’t matter. Influence does.", "You shouldn’t be able to see me."],
      signature: ["Liquidity flows in unseen rivers.", "Your orders… slip into the abyss."],
      backfire: ["You pierced… the veil?", "Your visibility is… unsettling."],
      collapse: ["The darkness… remembers your name."],
      buyout: ["Take the shadows. They’ll stain you eventually."],
      hint: ["Everything traded is a confession."],
    },
  },
  selene_marr: {
    icon: "🏚️",
    lines: {
      arrival: ["Homes crumble, dreams with them.", "You play; I evict."],
      signature: ["A little pressure… watch the roofs cave in.", "Foreclosure comes swiftly."],
      backfire: ["You bought the dip—unwise, yet effective.", "These properties… resist collapse?"],
      collapse: ["I… am condemned."],
      buyout: ["You own the land now. Treat it better than I did."],
      hint: ["The market is not a home. Do not love it."],
    },
  },
};

const getDialogueData = (whaleId: WhaleProfile["id"]): WhaleDialogueLines => {
  return DIALOGUES[whaleId] ?? {
    icon: DEFAULT_ICON,
    lines: {
      arrival: ["We trade in silence."],
      signature: ["Watch the market bend."],
      collapse: ["Even monsters fall."],
    },
  };
};

export function queueWhaleDialogue(
  state: GameState,
  whaleId: WhaleProfile["id"],
  type: WhaleDialogueType
): void {
  const data = getDialogueData(whaleId);
  const lines = data.lines[type];
  if (!lines || lines.length === 0) return;
  const text = lines[Math.floor(Math.random() * lines.length)];
  const event: WhaleDialogueEvent = {
    whaleId,
    icon: data.icon,
    text,
    type,
    timestamp: Date.now(),
  };

  const existing = state.whaleDialogueQueue ?? [];
  const updated = [...existing, event];
  state.whaleDialogueQueue = updated.slice(-DIALOGUE_LIMIT);
}
