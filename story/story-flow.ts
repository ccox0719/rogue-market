import type { MarketNewsItem } from "../game/core/state.js";

export type StoryActId = "ACT_I" | "ACT_II" | "ACT_III" | "ACT_IV";

export type StoryTrigger =
  | "start"
  | "day"
  | "portfolio"
  | "whale"
  | "era"
  | "final";

export interface StoryContext {
  day: number;
  maxDays: number;
  portfolioValue: number;
  startCapital: number;
  targetRetirement: number;
  activeEraId: string | null;
  activeWhaleId: string | null;
  defeatedWhales: string[];
  recentNews: MarketNewsItem[];
  newsDecisionUsed: boolean;
  whaleDefeatedThisTick: boolean;
  storyBoonUsed: boolean;
  runEnded: boolean;
  runWon: boolean;
  level: number;
  xp: number;
}

export interface StoryCutscene {
  id: string;
  trigger: StoryTrigger;
  condition: (ctx: StoryContext) => boolean;
  text: string[] | ((ctx: StoryContext) => string[]);
  once: boolean;
  actId: StoryActId;
}

export interface StoryAct {
  id: StoryActId;
  title: string;
  description: string;
  cutscenes: StoryCutscene[];
}

const resolveSceneText = (scene: StoryCutscene, ctx: StoryContext): string[] =>
  typeof scene.text === "function" ? scene.text(ctx) : scene.text;

export const STORY_ACTS: StoryAct[] = [
  {
    id: "ACT_I",
    title: "Act I — The Startup Gamble",
    description: "You set out with the last of your parents’ cash and a ridiculous dream.",
    cutscenes: [
      {
        id: "ACT_I_OPENING",
        actId: "ACT_I",
        trigger: "start",
        once: true,
        condition: () => true,
        text: (ctx) => [
          "You hear your parents whispering in the kitchen again.",
          `“We only have ${ctx.startCapital.toFixed(0)} until next payday… and still nothing saved.”`,
          "You stare at the glowing number on their banking app.",
          "It doesn’t feel like money. It feels like borrowed time.",
          "Tonight, you cross a line: you log in as them and move the stack.",
          "Not to gamble. Not to flex.",
          "To try and build the future they keep giving up on.",
        ],
      },
      {
        id: "ACT_I_FIRST_GREEN",
        actId: "ACT_I",
        trigger: "portfolio",
        once: true,
        condition: (ctx) => ctx.portfolioValue >= ctx.startCapital * 1.1,
        text: (ctx) => [
          "Your stomach drops when the numbers tick green.",
          "You expected chaos. Panic. The feeling of doing something wrong.",
          "Instead you feel… calm.",
          "You watched the sectors, read the whispers of the day, and it worked.",
          "Maybe this isn’t a one-time stunt.",
          "Maybe this is what you were built to do.",
          `You just turned ${ctx.startCapital.toFixed(0)} into ${ctx.portfolioValue.toFixed(
            0
          )}. The board just noticed.`,
        ],
      },
      {
        id: "ACT_I_FIRST_RED",
        actId: "ACT_I",
        trigger: "portfolio",
        once: true,
        condition: (ctx) => ctx.portfolioValue <= ctx.startCapital * 0.9,
        text: [
          "Red.",
          "For a moment you imagine trying to explain this to your parents.",
          "You can’t. Not yet.",
          "So you open the charts, look at what went wrong, and start tracing patterns.",
          "Losing hurts. But losing and learning?",
          "That might be the only way forward.",
        ],
      },
    ],
  },
  {
    id: "ACT_II",
    title: "Act II — The Whales Smell Blood",
    description: "You stop looking like noise. The titans don’t like surprises.",
    cutscenes: [
      {
        id: "ACT_II_THRESHOLD",
        actId: "ACT_II",
        trigger: "portfolio",
        once: true,
        condition: (ctx) => ctx.portfolioValue >= ctx.startCapital * 2,
        text: [
          "You double the money.",
          "It doesn’t feel real until you imagine your parents seeing the number.",
          "For the first time, you think: early retirement isn’t a fantasy.",
          "But if you can see this, someone else can too.",
          "Someone who lives on the other side of every trade.",
        ],
      },
      {
        id: "ACT_II_FIRST_WHALE",
        actId: "ACT_II",
        trigger: "whale",
        once: true,
        condition: (ctx) => ctx.activeWhaleId != null,
        text: [
          "Today feels off.",
          "Your sector doesn’t just move. It lurches.",
          "Volume spikes, spreads widen, and prices swing like someone’s pulling strings.",
          "You’re not alone in this market anymore.",
          "You’ve attracted a whale.",
        ],
      },
      {
        id: "ACT_II_FIRST_COUNTERPUNCH",
        actId: "ACT_II",
        trigger: "day",
        once: true,
        condition: (ctx) =>
          ctx.activeWhaleId != null && ctx.portfolioValue < ctx.startCapital && ctx.day > 3,
        text: [
          "You compare your notes from yesterday to today’s price action.",
          "Your read on the market wasn’t wrong.",
          "Something else leaned on it. Hard.",
          "Whoever it is, they’re big enough to bend reality.",
          "You’re not just playing the market now.",
          "You’re playing whoever owns it.",
        ],
      },
      {
        id: "ACT_II_NEWS_PROMPT",
        actId: "ACT_II",
        trigger: "day",
        once: true,
        condition: (ctx) => ctx.recentNews.length > 0 && !ctx.newsDecisionUsed,
        text: (ctx) => {
          const headline = ctx.recentNews[0]?.headline ?? "an unexplained headline";
          return [
            `Today’s briefing whispers: "${headline}".`,
            "The inbox says this could be a clue. Ignore it, or build a case?",
            "You decide to keep your eyes on the tape, the narrative, the whispers.",
            "Consider this a prompt: every clue you chase can change the board.",
          ];
        },
      },
    ],
  },
  {
    id: "ACT_III",
    title: "Act III — The Shadow War",
    description: "They don’t know you’re a kid. They only know you keep winning where you shouldn’t.",
    cutscenes: [
      {
        id: "ACT_III_MIDPOINT",
        actId: "ACT_III",
        trigger: "day",
        once: true,
        condition: (ctx) => ctx.day >= Math.floor(ctx.maxDays / 2),
        text: [
          "Half the run is gone. The easy plays are over.",
          "Eras shift faster, events hit harder, and every safe harbor suddenly has teeth.",
          "It’s not bad luck. It’s intent.",
          "They’re trying to shake you out, same as everyone else.",
          "You’re just the only one fighting back with five hundred dollars and a secret.",
        ],
      },
      {
        id: "ACT_III_FIRST_WHALE_DEFEATED",
        actId: "ACT_III",
        trigger: "whale",
        once: true,
        condition: (ctx) => ctx.defeatedWhales.length >= 1,
        text: [
          "You check the chart again.",
          "The sector that used to move like a marionette suddenly breathes like a normal market.",
          "Did you outlast them?",
          "Somewhere, a whale shifts focus to easier prey.",
          "For the first time, the idea hits you:",
          "You're not just surviving whales.",
          "You're learning how to hunt them.",
        ],
      },
      {
        id: "ACT_III_AFTER_WHALE_CONTINUED",
        actId: "ACT_III",
        trigger: "day",
        once: true,
        condition: (ctx) => ctx.defeatedWhales.length >= 1 && ctx.day > 3,
        text: [
          "The fight is over, but the story hasn’t folded.",
          "You ride the calm after their storm and realize the next chapter doesn’t wait.",
          "Every dollar feels heavier now. Every move, dialog fodder.",
          "You’ve broken a whale. The next act asks for something even bigger.",
        ],
      },
      {
        id: "ACT_III_STRUGGLING_BOON",
        actId: "ACT_III",
        trigger: "portfolio",
        once: true,
        condition: (ctx) =>
          ctx.day >= 5 &&
          ctx.portfolioValue < ctx.startCapital * 0.85 &&
          !ctx.runEnded &&
          !ctx.storyBoonUsed,
        text: [
          "The margin whispers that you’re losing traction.",
          "An old mentor forges a quick wire with a note: 'One more breath.'",
          "It’s a promise that the story can bend back toward you.",
          "You take the hand. The grind continues.",
        ],
      },
    ],
  },
  {
    id: "ACT_IV",
    title: "Act IV — Retire the Parents. Beat the Empire.",
    description: "It’s not about proving you’re right. It’s about proving your family still has a future.",
    cutscenes: [
      {
        id: "ACT_IV_APPROACH_GOAL",
        actId: "ACT_IV",
        trigger: "portfolio",
        once: true,
        condition: (ctx) => ctx.portfolioValue >= ctx.targetRetirement * 0.7 && !ctx.runEnded,
        text: [
          "You sketch numbers on a notepad: rent, food, medical, a little extra for joy.",
          "The line where your parents could stop working isn’t a fantasy anymore.",
          "You drag your finger across the graph.",
          "You’re close.",
          "Close enough that the whales will never let this stay easy.",
        ],
      },
      {
        id: "ACT_IV_RUN_WIN",
        actId: "ACT_IV",
        trigger: "final",
        once: true,
        condition: (ctx) => ctx.runEnded && ctx.runWon,
        text: (ctx) => [
          "The final day closes. The number holds.",
          "Enough to give your parents a runway. Enough to change the ending of their story.",
          "You stare at the account, then at the old kitchen table where they still argue about bills.",
          "They’ll never know how close they came to having nothing.",
          "They’ll just know that somehow, someday, they got a second chance.",
          `You finish this run with Level ${ctx.level} and ${ctx.xp} XP.`,
          "The whales will reset the board for the next run.",
          "You will too.",
        ],
      },
      {
        id: "ACT_IV_RUN_LOSS",
        actId: "ACT_IV",
        trigger: "final",
        once: false,
        condition: (ctx) => ctx.runEnded && !ctx.runWon,
        text: [
          "The graph dips below the line you needed.",
          "You sit with the number in silence.",
          "In another house, in another story, this would be the end.",
          "But tomorrow your parents will wake up, go to work, keep grinding.",
          "And you?",
          "You’ll queue up another run.",
          "Because the whales don’t stop. So neither do you.",
        ],
      },
    ],
  },
];

const hasSeenCutscene = (
  sceneId: string,
  seenCutsceneIds?: Set<string> | string[]
): boolean => {
  if (!seenCutsceneIds) return false;
  if (seenCutsceneIds instanceof Set) {
    return seenCutsceneIds.has(sceneId);
  }
  return seenCutsceneIds.includes(sceneId);
};

export function getTriggeredCutscenes(
  ctx: StoryContext,
  trigger: StoryTrigger,
  seenCutsceneIds?: Set<string> | string[]
): StoryCutscene[] {
  const result: StoryCutscene[] = [];

  for (const act of STORY_ACTS) {
    for (const scene of act.cutscenes) {
      if (scene.trigger !== trigger) continue;
      if (scene.once && hasSeenCutscene(scene.id, seenCutsceneIds)) {
        continue;
      }
      if (scene.condition(ctx)) {
        result.push(scene);
      }
    }
  }

  return result;
}

export function renderSceneText(scene: StoryCutscene, ctx: StoryContext): string[] {
  return resolveSceneText(scene, ctx);
}
