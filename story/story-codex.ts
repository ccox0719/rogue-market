import {
  StoryActId,
  StoryCutscene,
  StoryTrigger,
  StoryAct,
  STORY_ACTS,
} from "./story-flow.js";

export interface StoryCodexScene {
  id: string;
  actId: StoryActId;
  preview: string;
  unlocked: boolean;
  seen: boolean;
  trigger: StoryTrigger;
}

export interface StoryCodexAct {
  id: StoryActId;
  title: string;
  description: string;
  sceneCount: number;
  unlockedCount: number;
  scenes: StoryCodexScene[];
}

export const buildStoryCodex = (
  seenCutsceneIds: Set<string> | string[] = []
): StoryCodexAct[] => {
  const seen =
    seenCutsceneIds instanceof Set ? seenCutsceneIds : new Set(seenCutsceneIds);

  return STORY_ACTS.map((act) => {
    const scenes = act.cutscenes.map(
      (scene): StoryCodexScene => {
        const seenScene = seen.has(scene.id);
        return {
          id: scene.id,
          actId: act.id,
          preview: scene.text[0] ?? "",
          unlocked: scene.once ? seenScene : true,
          seen: seenScene,
          trigger: scene.trigger,
        };
      }
    );

    const unlockedCount = scenes.filter((scene) => scene.unlocked).length;

    return {
      id: act.id,
      title: act.title,
      description: act.description,
      sceneCount: scenes.length,
      unlockedCount,
      scenes,
    };
  });
};
