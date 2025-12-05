import type { GameState } from "../game/core/state.js";
import type { MarketNewsItem } from "../game/core/state.js";
import type { Company } from "../game/generators/companyGen.js";
import {
  StoryActId,
  StoryContext,
  StoryTrigger,
  StoryCutscene,
  getTriggeredCutscenes,
  renderSceneText,
} from "./story-flow.js";

export interface StoryRunnerState {
  seenCutsceneIds: Set<string>;
  context: StoryContext;
}

export interface StoryExtras {
  level?: number;
  xp?: number;
}

const baseStoryContext = (
  state: GameState,
  extras: StoryExtras = {}
): StoryContext => {
  const portfolioValue = calculatePortfolioValue(state);
  const startCapital = state.baseStartingCash;
  const metaGoal =
    (state as GameState & { targetRetirement?: number }).targetRetirement ??
    startCapital * 10;
  const activeEraId = state.eras[state.currentEraIndex]?.id ?? null;
  const activeWhaleId = state.activeWhales[0]?.profileId ?? null;
  const defeatedWhales =
    (state as GameState & { defeatedWhales?: string[] }).defeatedWhales ?? [];
  const whaleDefeatedThisTick =
    (state as GameState & { whaleDefeatedThisTick?: boolean }).whaleDefeatedThisTick ?? false;
  const storyBoonUsed =
    (state as GameState & { storyBoonUsed?: boolean }).storyBoonUsed ?? false;
  const recentNews =
    (state as GameState & { recentNews?: MarketNewsItem[] }).recentNews ?? [];
  const newsDecisionUsed =
    (state as GameState & { newsDecisionUsed?: boolean }).newsDecisionUsed ?? false;

  return {
    day: state.day,
    maxDays: state.totalDays,
    portfolioValue,
    startCapital,
    targetRetirement: metaGoal,
    activeEraId,
    activeWhaleId,
    defeatedWhales,
    runEnded: state.runOver,
    runWon: state.runOver && portfolioValue >= metaGoal,
    level: extras.level ?? 0,
    xp: extras.xp ?? 0,
    whaleDefeatedThisTick,
    storyBoonUsed,
    recentNews,
    newsDecisionUsed,
  };
};

const calculatePortfolioValue = (state: GameState): number => {
  let value = state.portfolio.cash;
  for (const [companyId, shares] of Object.entries(state.portfolio.holdings)) {
    const company = state.companies.find((entry) => entry.id === companyId);
    if (company) {
      value += company.price * shares;
    }
  }
  return Number(value.toFixed(2));
};

export const createStoryRunnerState = (state: GameState): StoryRunnerState => ({
  seenCutsceneIds: new Set<string>(),
  context: baseStoryContext(state),
});

export const updateStoryContext = (
  runner: StoryRunnerState,
  state: GameState
): void => {
  runner.context = baseStoryContext(state);
};

export const triggerStoryScenes = (
  runner: StoryRunnerState,
  gameState: GameState,
  trigger: StoryTrigger,
  extras: StoryExtras = {}
): StoryCutscene[] => {
  runner.context = baseStoryContext(gameState, extras);
  const scenes = getTriggeredCutscenes(
    runner.context,
    trigger,
    runner.seenCutsceneIds
  );
  for (const scene of scenes) {
    if (scene.once) {
      runner.seenCutsceneIds.add(scene.id);
    }
  }
  return scenes;
};

export const mapTriggerFromLifecycle = (
  event: "start" | "day" | "portfolio" | "whale" | "era" | "final"
): StoryTrigger => event;

export const createStoryContextSnapshot = (runner: StoryRunnerState) =>
  runner.context;

export interface StorySceneEvent {
  id: string;
  actId: StoryActId;
  trigger: StoryTrigger;
  day: number;
  timestamp: number;
  lines: string[];
}

export function buildSceneEvents(
  scenes: StoryCutscene[],
  day: number,
  ctx: StoryContext
): StorySceneEvent[] {
  const now = Date.now();
  return scenes.map((scene) => ({
    id: scene.id,
    actId: scene.actId,
    trigger: scene.trigger,
    day,
    timestamp: now,
    lines: renderSceneText(scene, ctx),
  }));
}
