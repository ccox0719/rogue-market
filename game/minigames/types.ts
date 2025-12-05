export interface MiniGameResult {
  /** Normalized success score 0..1. */
  score: number;
  /** Story-driven summary line describing what happened. */
  story: string;
  tag?: string;
}

export type MiniGameCallback = (result: MiniGameResult) => void;
