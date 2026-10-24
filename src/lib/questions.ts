import { gameMeta, KIND_LABELS } from "./constants";
import type { GameConfig, Question, QuestionKind } from "./types";
import { TRAIN_DEFAULTS, validateTrainSettings } from "./train";
import { normalizeDigits, shuffle } from "./utils";

/** A question reduced to "prompt + choices + one correct index", the shape choice-based games play. */
export interface PlayableQuestion {
  id: string;
  prompt: string;
  image?: string;
  choices: string[];
  correctIndex: number;
  difficulty?: number;
}

const ARITH_RE = /^\s*([0-9٠-٩]+)\s*([+\-×x*÷/])\s*([0-9٠-٩]+)\s*(=\s*[?؟]?)?\s*$/;

/** Evaluates simple "a op b" expressions. Returns null for anything else. */
export function evaluateArithmetic(expr: string): number | null {
  const m = ARITH_RE.exec(expr);
  if (!m) return null;
  const a = Number(normalizeDigits(m[1]));
  const b = Number(normalizeDigits(m[3]));
  switch (m[2]) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "×":
    case "x":
    case "*":
      return a * b;
    case "÷":
    case "/":
      return b === 0 || a % b !== 0 ? null : a / b;
  }
  return null;
}

/** Builds distractors close to the correct value (non-negative, distinct). */
export function numericDistractors(correct: number, count = 3): number[] {
  const out = new Set<number>();
  const offsets = shuffle([1, -1, 2, -2, 3, -3, 10, -10, 4, 5]);
  for (const o of offsets) {
    const v = correct + o;
    if (v >= 0 && v !== correct) out.add(v);
    if (out.size >= count) break;
  }
  let extra = correct + 6;
  while (out.size < count) out.add(extra++);
  return [...out];
}

export function toPlayable(q: Question): PlayableQuestion | null {
  switch (q.kind) {
    case "mcq": {
      const choices = q.choices.map((c) => c.trim());
      if (choices.length < 2 || choices.some((c) => !c)) return null;
      if (q.correctIndex < 0 || q.correctIndex >= choices.length) return null;
      return { id: q.id, prompt: q.prompt, image: q.image, choices, correctIndex: q.correctIndex, difficulty: q.difficulty };
    }
    case "truefalse":
      return {
        id: q.id,
        prompt: q.prompt,
        image: q.image,
        choices: ["صح", "خطأ"],
        correctIndex: q.correctIndex === 1 ? 1 : 0,
        difficulty: q.difficulty,
      };
    case "arithmetic": {
      const value = evaluateArithmetic(q.prompt);
      if (value === null) return null;
      const choices = shuffle([value, ...numericDistractors(value)]).map(String);
      const prompt = /[=]/.test(q.prompt) ? q.prompt.replace(/=\s*[?؟]?\s*$/, "= ؟") : `${q.prompt.trim()} = ؟`;
      return { id: q.id, prompt, image: q.image, choices, correctIndex: choices.indexOf(String(value)), difficulty: q.difficulty };
    }
    default:
      return null;
  }
}

/** Shuffles choice order while keeping track of the correct one. */
export function shuffleChoices(p: PlayableQuestion): PlayableQuestion {
  const order = shuffle(p.choices.map((_, i) => i));
  return { ...p, choices: order.map((i) => p.choices[i]), correctIndex: order.indexOf(p.correctIndex) };
}

export function preparePlayable(game: GameConfig): PlayableQuestion[] {
  const meta = gameMeta(game.type);
  const list = game.questions
    .filter((q) => meta.kinds.includes(q.kind))
    .map(toPlayable)
    .filter((p): p is PlayableQuestion => p !== null);
  if (!game.settings.shuffle) return list;
  return shuffle(list).map((p) => (p.choices.length > 2 ? shuffleChoices(p) : p));
}

export interface ValidationIssue {
  questionId?: string;
  index?: number;
  message: string;
}

export function validateQuestion(q: Question): string[] {
  const errs: string[] = [];
  if (!q.prompt.trim() && !q.image) errs.push("نص السؤال فارغ.");
  switch (q.kind) {
    case "mcq": {
      const filled = q.choices.filter((c) => c.trim());
      if (filled.length < 2) errs.push("أضف خيارين على الأقل.");
      if (filled.length !== q.choices.length) errs.push("يوجد خيار فارغ.");
      if (q.correctIndex < 0 || q.correctIndex >= q.choices.length || !q.choices[q.correctIndex]?.trim())
        errs.push("حدّد الإجابة الصحيحة.");
      if (new Set(filled.map((c) => c.trim())).size !== filled.length) errs.push("يوجد خيارات مكررة.");
      break;
    }
    case "truefalse":
      if (q.correctIndex !== 0 && q.correctIndex !== 1) errs.push("حدّد إن كانت العبارة صحيحة أم خاطئة.");
      break;
    case "arithmetic":
      if (evaluateArithmetic(q.prompt) === null)
        errs.push("اكتب العملية بالشكل: ٣ + ٤ (جمع، طرح، ضرب، أو قسمة بلا باقٍ).");
      break;
    case "order":
      if (!q.answer?.trim()) errs.push("اكتب الكلمة أو الجملة المطلوب ترتيبها.");
      break;
    case "match":
      if (!q.pairs || q.pairs.length < 2) errs.push("أضف زوجين على الأقل للمطابقة.");
      else if (q.pairs.some((p) => !p.a.trim() || !p.b.trim())) errs.push("يوجد زوج غير مكتمل.");
      break;
  }
  return errs;
}

export function validateGame(game: GameConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const meta = gameMeta(game.type);
  if (!game.title.trim()) issues.push({ message: "أدخل عنوانًا للعبة." });
  if (!game.lesson.trim()) issues.push({ message: "أدخل عنوان الدرس." });
  game.questions.forEach((q, index) => {
    for (const message of validateQuestion(q)) issues.push({ questionId: q.id, index, message });
    if (!meta.kinds.includes(q.kind))
      issues.push({
        questionId: q.id,
        index,
        message: `نوع السؤال «${KIND_LABELS[q.kind]}» غير مدعوم في لعبة «${meta.name}».`,
      });
  });
  if (meta.generated) {
    if (game.type === "train") for (const message of validateTrainSettings(game.settings.train ?? TRAIN_DEFAULTS)) issues.push({ message });
    return issues;
  }
  const playable = game.questions.filter((q) => meta.kinds.includes(q.kind) && validateQuestion(q).length === 0);
  const isNamesWheel = game.type === "wheel" && game.settings.wheelMode === "names";
  if (isNamesWheel) {
    const names = (game.settings.wheelNames ?? []).filter((n) => n.trim());
    if (names.length < 2) issues.push({ message: "أضف اسمين على الأقل لعجلة الأسماء." });
  } else if (playable.length < meta.minQuestions) {
    issues.push({ message: `تحتاج هذه اللعبة إلى ${meta.minQuestions} أسئلة صالحة على الأقل.` });
  }
  if (game.settings.timePerQuestion < 0 || game.settings.timePerQuestion > 300)
    issues.push({ message: "الوقت لكل سؤال يجب أن يكون بين ٠ و٣٠٠ ثانية." });
  if (game.settings.pointsPerCorrect <= 0) issues.push({ message: "النقاط لكل إجابة يجب أن تكون أكبر من صفر." });
  if (meta.teamBased && game.settings.teams.some((t) => !t.name.trim()))
    issues.push({ message: "يوجد فريق بلا اسم." });
  return issues;
}

export function blankQuestion(partial: Partial<Question> & Pick<Question, "grade" | "subject">, kind: QuestionKind = "mcq"): Question {
  const now = Date.now();
  return {
    id: `q_${now.toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    lesson: "",
    difficulty: 1,
    kind,
    prompt: "",
    choices: kind === "truefalse" ? ["صح", "خطأ"] : kind === "mcq" ? ["", "", "", ""] : [],
    correctIndex: 0,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}
