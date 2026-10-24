/*
 * Curriculum file format, version 1 (`kind: "curriculum"`).
 *
 * Made outside the app (e.g. by Claude Code from a textbook PDF, see
 * docs/CURRICULUM_IMPORT.md) and imported from «📚 استيراد منهج». Plain JSON,
 * so the same file works in the web, Windows and future iOS versions.
 * The JSON Schema for editors and scripts is docs/curriculum.schema.json.
 */
import { GAMES, gameMetaFor } from "../constants";
import { evaluateArithmetic, validateQuestion } from "../questions";
import type { Difficulty, GameType, Grade, QuestionKind, Subject } from "../types";
import { normalizeDigits } from "../utils";

export const CURRICULUM_FORMAT = 1;

export interface CurriculumFileQuestion {
  /** Unique inside the file. */
  id: string;
  /** "textbook": an exercise from the book; "generated": written by AI (must be reviewed). */
  origin: "textbook" | "generated";
  /** Textbook page of the exercise (or of the lesson for generated questions). */
  page?: number;
  kind: QuestionKind;
  prompt: string;
  /** mcq / truefalse: the choices; arithmetic: omitted. */
  choices?: string[];
  correctIndex?: number;
  /** order: the word or sentence. */
  answer?: string;
  /** match: the pairs. */
  pairs?: { a: string; b: string }[];
  difficulty?: Difficulty;
}

export interface CurriculumFileGame {
  /** An existing game template (game type), e.g. "quiz", "rocket", "memory". */
  template: GameType;
  title?: string;
  /** Math games that generate their own tasks: level 1–3 and number of tasks. */
  level?: 1 | 2 | 3;
  count?: number;
}

export interface CurriculumFileLesson {
  id: string;
  number?: number;
  /** Exactly as printed in the textbook. */
  title: string;
  pages?: [number, number];
  questions: CurriculumFileQuestion[];
  /** Game templates for the lesson; when empty the app picks suitable ones. */
  games?: CurriculumFileGame[];
}

export interface CurriculumFileUnit {
  id: string;
  number: number;
  /** Exactly as printed in the textbook. */
  title: string;
  semester?: 1 | 2;
  pages?: [number, number];
  lessons: CurriculumFileLesson[];
}

export interface CurriculumFile {
  app: "heroes-world";
  kind: "curriculum";
  version: number;
  curriculum: {
    /** Stable id, e.g. "jo-g1-math-s1-2022". */
    id: string;
    country: string;
    title: string;
    grade: Grade;
    subject: Subject;
    semester?: 1 | 2;
    textbook: { title: string; publisher?: string; edition?: string; isbn?: string; pages?: number; sha256?: string; url?: string };
    /** How the file was made, e.g. "Claude Code from the textbook PDF". */
    generatedBy?: string;
    generatedAt?: string;
    units: CurriculumFileUnit[];
  };
}

export interface Issue {
  level: "error" | "warning";
  /** Where, e.g. "الوحدة 1 › الدرس 2 › السؤال q3". */
  where: string;
  message: string;
}

const GRADES = [1, 2, 3];
const SUBJECTS = ["arabic", "math", "science", "english"];
const KINDS: QuestionKind[] = ["mcq", "truefalse", "order", "match", "arithmetic"];
const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);
const text = (x: unknown) => (typeof x === "string" ? x.trim() : "");

/** A prompt like "٣ + ٤ = ؟" whose answer can be computed. */
function computedAnswer(prompt: string): number | null {
  const m = /([0-9٠-٩]+\s*[+\-×x*÷/]\s*[0-9٠-٩]+)/.exec(prompt);
  if (!m || !/=\s*[؟?]?\s*$|[؟?]\s*=/.test(prompt.trim())) return null;
  return evaluateArithmetic(m[1]);
}

/**
 * Checks a curriculum file. Errors block the import; warnings are shown in
 * the preview (e.g. a game that cannot be built from the lesson's questions).
 */
export function validateCurriculumFile(raw: unknown): { file: CurriculumFile | null; issues: Issue[] } {
  const issues: Issue[] = [];
  const err = (where: string, message: string) => issues.push({ level: "error", where, message });
  const warn = (where: string, message: string) => issues.push({ level: "warning", where, message });

  if (!isObj(raw) || raw.app !== "heroes-world" || raw.kind !== "curriculum" || !isObj(raw.curriculum)) {
    err("الملف", "هذا الملف ليس ملف منهج من عالم الأبطال (kind: curriculum).");
    return { file: null, issues };
  }
  if (typeof raw.version !== "number" || raw.version > CURRICULUM_FORMAT) warn("الملف", `إصدار الصيغة ${String(raw.version)} أحدث من المدعوم (${CURRICULUM_FORMAT})؛ ستُستورد الحقول المعروفة فقط.`);
  const c = raw.curriculum;
  if (!text(c.id)) err("المنهج", "المعرّف (id) مفقود.");
  if (!text(c.title)) err("المنهج", "العنوان مفقود.");
  if (!GRADES.includes(c.grade as number)) err("المنهج", "الصف يجب أن يكون 1 أو 2 أو 3.");
  if (!SUBJECTS.includes(c.subject as string)) err("المنهج", "المادة يجب أن تكون arabic أو math أو science أو english.");
  if (c.semester !== undefined && c.semester !== 1 && c.semester !== 2) err("المنهج", "الفصل الدراسي يجب أن يكون 1 أو 2.");
  if (!isObj(c.textbook) || !text(c.textbook.title)) err("الكتاب", "عنوان الكتاب المدرسي مفقود.");
  if (!Array.isArray(c.units) || c.units.length === 0) err("المنهج", "لا توجد وحدات.");
  if (issues.some((i) => i.level === "error")) return { file: null, issues };

  const subject = c.subject as Subject;
  const ids = new Set<string>();
  const unique = (id: string, where: string) => {
    if (ids.has(id)) err(where, `المعرّف «${id}» مكرر.`);
    ids.add(id);
  };

  (c.units as unknown[]).forEach((u, ui) => {
    const uw = `الوحدة ${ui + 1}`;
    if (!isObj(u)) return err(uw, "بيانات الوحدة تالفة.");
    if (!text(u.id)) err(uw, "معرّف الوحدة مفقود.");
    else unique(text(u.id), uw);
    if (!text(u.title)) err(uw, "عنوان الوحدة مفقود.");
    if (u.semester !== undefined && u.semester !== 1 && u.semester !== 2) err(uw, "الفصل الدراسي للوحدة يجب أن يكون 1 أو 2.");
    if (!Array.isArray(u.lessons) || u.lessons.length === 0) return err(uw, "لا توجد دروس في الوحدة.");
    (u.lessons as unknown[]).forEach((l, li) => {
      const lw = `${uw} › الدرس ${li + 1}`;
      if (!isObj(l)) return err(lw, "بيانات الدرس تالفة.");
      if (!text(l.id)) err(lw, "معرّف الدرس مفقود.");
      else unique(text(l.id), lw);
      if (!text(l.title)) err(lw, "عنوان الدرس مفقود.");
      if (!Array.isArray(l.questions)) return err(lw, "قائمة الأسئلة مفقودة (يمكن أن تكون فارغة []).");
      (l.questions as unknown[]).forEach((q, qi) => {
        const qw = `${lw} › السؤال ${isObj(q) && text(q.id) ? text(q.id) : qi + 1}`;
        if (!isObj(q)) return err(qw, "بيانات السؤال تالفة.");
        if (!text(q.id)) err(qw, "معرّف السؤال مفقود.");
        else unique(text(q.id), qw);
        if (q.origin !== "textbook" && q.origin !== "generated") err(qw, "حدّد مصدر السؤال: textbook (من الكتاب) أو generated (مولّد).");
        if (!KINDS.includes(q.kind as QuestionKind)) return err(qw, `نوع السؤال «${String(q.kind)}» غير معروف.`);
        const asQuestion = {
          id: "x", grade: c.grade as Grade, subject, lesson: "x", difficulty: 1 as Difficulty, createdAt: 0, updatedAt: 0,
          kind: q.kind as QuestionKind,
          prompt: typeof q.prompt === "string" ? q.prompt : "",
          choices: q.kind === "truefalse" ? ["صح", "خطأ"] : Array.isArray(q.choices) ? q.choices.map(String) : [],
          correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : -1,
          answer: typeof q.answer === "string" ? q.answer : undefined,
          pairs: Array.isArray(q.pairs) ? (q.pairs as { a: string; b: string }[]) : undefined,
        };
        for (const m of validateQuestion(asQuestion)) err(qw, m);
        if (q.kind === "truefalse" && q.correctIndex !== 0 && q.correctIndex !== 1) err(qw, "صح/خطأ: correctIndex يجب أن يكون 0 (صح) أو 1 (خطأ).");
        // Answer check: a computable prompt must have its result as the correct choice.
        if (q.kind === "mcq" && asQuestion.correctIndex >= 0) {
          const v = computedAnswer(asQuestion.prompt);
          const chosen = asQuestion.choices[asQuestion.correctIndex];
          if (v !== null && chosen !== undefined && Number(normalizeDigits(chosen.trim())) !== v) err(qw, `الإجابة المحددة «${chosen}» خاطئة؛ الناتج الصحيح ${v}.`);
        }
        // Comparison: "a ؟ b" with the symbols < > = as choices.
        const cmp = /^\s*([0-9٠-٩]+)\s*[؟?○]\s*([0-9٠-٩]+)\s*$/.exec(asQuestion.prompt);
        if (q.kind === "mcq" && cmp && asQuestion.correctIndex >= 0) {
          const [x, y] = [Number(normalizeDigits(cmp[1])), Number(normalizeDigits(cmp[2]))];
          const right = x > y ? ">" : x < y ? "<" : "=";
          if (!asQuestion.choices.includes(right)) err(qw, `خيارات المقارنة لا تحتوي الرمز الصحيح «${right}».`);
          else if (asQuestion.choices[asQuestion.correctIndex] !== right) err(qw, `الرمز المحدد «${asQuestion.choices[asQuestion.correctIndex]}» خاطئ؛ الصحيح ${x} ${right} ${y}.`);
        }
        if (q.page !== undefined && (typeof q.page !== "number" || q.page < 1)) warn(qw, "رقم الصفحة غير صالح.");
      });
      if (l.games !== undefined && !Array.isArray(l.games)) err(lw, "قائمة الألعاب يجب أن تكون مصفوفة.");
      for (const g of Array.isArray(l.games) ? l.games : []) {
        const t = isObj(g) ? g.template : undefined;
        const meta = GAMES.find((m) => m.type === t);
        if (!meta) err(lw, `قالب اللعبة «${String(t)}» غير موجود.`);
        else if (!meta.ready) warn(lw, `قالب «${meta.name}» غير جاهز بعد؛ سيُتجاهل.`);
        else if (meta.subjects && !meta.subjects.includes(subject) && !gameMetaFor(meta.type, subject).bank) warn(lw, `قالب «${meta.name}» لا يناسب هذه المادة؛ سيُتجاهل.`);
      }
    });
  });
  if (issues.some((i) => i.level === "error")) return { file: null, issues };
  return { file: raw as unknown as CurriculumFile, issues };
}
