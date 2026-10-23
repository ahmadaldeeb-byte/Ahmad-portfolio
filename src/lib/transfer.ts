import type { GameConfig, Question } from "./types";
import { uid } from "./utils";

export interface GameFile {
  app: "heroes-world";
  kind: "game";
  version: 1;
  game: GameConfig;
}

export interface QuestionsFile {
  app: "heroes-world";
  kind: "questions";
  version: 1;
  questions: Question[];
}

export const gameToFile = (game: GameConfig): GameFile => ({ app: "heroes-world", kind: "game", version: 1, game });
export const questionsToFile = (questions: Question[]): QuestionsFile => ({ app: "heroes-world", kind: "questions", version: 1, questions });

function isQuestionLike(q: unknown): q is Question {
  const x = q as Question;
  return !!x && typeof x.prompt === "string" && typeof x.kind === "string" && [1, 2, 3].includes(x.grade) && typeof x.subject === "string";
}

/** Parses an exported game. Gives it a fresh id so importing never overwrites an existing game. */
export function parseGameFile(data: unknown): GameConfig {
  const f = data as GameFile;
  if (!f || f.app !== "heroes-world" || f.kind !== "game" || !f.game || !Array.isArray(f.game.questions))
    throw new Error("هذا الملف ليس لعبة من عالم الأبطال.");
  if (!f.game.questions.every(isQuestionLike)) throw new Error("بعض أسئلة اللعبة تالفة.");
  const now = Date.now();
  return { ...f.game, id: uid("g_"), builtin: false, createdAt: now, updatedAt: now };
}

/** Parses an exported question list (or a plain array of questions). */
export function parseQuestionsFile(data: unknown): Question[] {
  const list = Array.isArray(data) ? data : (data as QuestionsFile)?.kind === "questions" ? (data as QuestionsFile).questions : null;
  if (!list) throw new Error("هذا الملف لا يحتوي على أسئلة.");
  const valid = list.filter(isQuestionLike);
  if (valid.length === 0) throw new Error("لم يُعثر على أسئلة صالحة في الملف.");
  const now = Date.now();
  return valid.map((q) => ({
    ...q,
    choices: Array.isArray(q.choices) ? q.choices : [],
    correctIndex: Number.isInteger(q.correctIndex) ? q.correctIndex : 0,
    difficulty: [1, 2, 3].includes(q.difficulty) ? q.difficulty : 1,
    lesson: q.lesson ?? "",
    id: q.id || uid("q_"),
    createdAt: q.createdAt ?? now,
    updatedAt: now,
  }));
}
