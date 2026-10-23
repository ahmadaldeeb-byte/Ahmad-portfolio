import type { PlayableQuestion } from "@/lib/questions";
import type { GameConfig, TeamScore } from "@/lib/types";

export interface GameSummary {
  correct: number;
  wrong: number;
  score: number;
  teams?: TeamScore[];
  winner?: string;
}

export interface GameProps {
  game: GameConfig;
  questions: PlayableQuestion[];
  paused: boolean;
  onFinish: (summary: GameSummary) => void;
}
