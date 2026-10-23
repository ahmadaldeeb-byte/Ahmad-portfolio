export type Grade = 1 | 2 | 3;
export type Subject = "arabic" | "math" | "science" | "english";
export type Difficulty = 1 | 2 | 3;

export type GameType =
  | "wheel"
  | "race"
  | "balloons"
  | "memory"
  | "quiz"
  | "words"
  | "numbers"
  | "puzzle"
  | "space"
  | "teams";

/** Question kinds supported by the editor and the question bank. */
export type QuestionKind = "mcq" | "truefalse" | "order" | "match" | "arithmetic";

export interface MatchPair {
  a: string;
  b: string;
}

export interface Question {
  id: string;
  grade: Grade;
  subject: Subject;
  lesson: string;
  difficulty: Difficulty;
  kind: QuestionKind;
  prompt: string;
  /** Data URL of an optional image. */
  image?: string;
  /** Answer choices for mcq / truefalse / arithmetic. */
  choices: string[];
  correctIndex: number;
  /** Target word or sentence for "order" questions. */
  answer?: string;
  pairs?: MatchPair[];
  createdAt: number;
  updatedAt: number;
}

export interface Team {
  name: string;
  color: string;
}

export interface GameSettings {
  /** Seconds per question; 0 disables the timer. */
  timePerQuestion: number;
  pointsPerCorrect: number;
  teams: Team[];
  shuffle: boolean;
  /** Wheel: what the segments contain. */
  wheelMode?: "questions" | "names";
  wheelNames?: string[];
  removeUsed?: boolean;
}

export interface GameConfig {
  id: string;
  title: string;
  grade: Grade;
  subject: Subject;
  lesson: string;
  type: GameType;
  difficulty: Difficulty;
  questions: Question[];
  settings: GameSettings;
  builtin?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TeamScore {
  name: string;
  color: string;
  score: number;
  correct: number;
  wrong: number;
}

export interface GameResult {
  id: string;
  gameId: string;
  gameTitle: string;
  type: GameType;
  grade: Grade;
  subject: Subject;
  startedAt: number;
  durationMs: number;
  correct: number;
  wrong: number;
  score: number;
  teams?: TeamScore[];
  winner?: string;
}
