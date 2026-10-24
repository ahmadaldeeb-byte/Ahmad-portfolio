/*
 * Turns a validated curriculum file into what the app already knows: a
 * CurriculumBook (units → lessons), question-bank questions and saved games
 * built from the existing game templates and linked to their lessons.
 * Nothing existing is overwritten: every new record gets an id derived from
 * the import, and importing the same book twice is refused.
 */
import { defaultSettings } from "@/content/seed";
import type { CurriculumBook, CurriculumLesson } from "@/content/curriculum/types";
import { GAMES, gameMetaFor } from "../constants";
import { isMathGame } from "../math/meta";
import { MATH_DEFAULTS } from "../math/common";
import { validateGame } from "../questions";
import type { GameConfig, GameType, Question } from "../types";
import type { CurriculumFile, CurriculumFileGame, CurriculumFileLesson, Issue } from "./schema";

export interface ImportPlan {
  book: CurriculumBook;
  questions: Question[];
  games: GameConfig[];
  issues: Issue[];
}

/** Same book → same fingerprint (the PDF hash when known, otherwise its identity and lesson titles). */
export function fingerprint(file: CurriculumFile) {
  const c = file.curriculum;
  if (c.textbook.sha256) return `sha256:${c.textbook.sha256.toLowerCase()}`;
  const body = [c.grade, c.subject, c.semester ?? "", c.textbook.title.trim(), ...c.units.flatMap((u) => [u.title.trim(), ...u.lessons.map((l) => l.title.trim())])].join("|");
  let h = 2166136261;
  for (let i = 0; i < body.length; i++) h = Math.imul(h ^ body.charCodeAt(i), 16777619);
  return `titles:${(h >>> 0).toString(16)}`;
}

/** Ids safe to use inside other ids. */
export const slug = (s: string) => s.trim().replace(/[^\p{L}\p{N}_-]+/gu, "-");

/** Templates picked for a lesson that lists none: a quiz for choice questions, memory for pairs, word maker for ordering. */
export function suggestGames(lesson: CurriculumFileLesson, subject: CurriculumFile["curriculum"]["subject"]): CurriculumFileGame[] {
  const kinds = lesson.questions.map((q) => q.kind);
  const count = (ks: string[]) => kinds.filter((k) => ks.includes(k)).length;
  const out: CurriculumFileGame[] = [];
  if (count(["mcq", "truefalse", "arithmetic"]) >= 3) out.push({ template: "quiz" });
  if (count(["match"]) >= 1) out.push({ template: "memory" });
  if (count(["order"]) >= 2 && (subject === "arabic" || subject === "english")) out.push({ template: "words" });
  return out;
}

/** Builds everything an import would save, without saving it. */
export function planImport(file: CurriculumFile, now = Date.now()): ImportPlan {
  const c = file.curriculum;
  const importId = `imp_${slug(c.id)}`;
  const issues: Issue[] = [];
  const questions: Question[] = [];
  const games: GameConfig[] = [];
  const lessonId = (id: string) => `${importId}__${slug(id)}`;

  const units = c.units.map((u, ui) => ({
    id: `${importId}__${slug(u.id)}`,
    number: u.number ?? ui + 1,
    title: u.title.trim(),
    semester: (u.semester ?? c.semester ?? 1) as 1 | 2,
    lessons: u.lessons.map((l): CurriculumLesson => {
      const id = lessonId(l.id);
      const lessonQs: Question[] = l.questions.map((q, qi) => ({
        id: `${importId}__${slug(q.id)}`,
        grade: c.grade,
        subject: c.subject,
        lesson: l.title.trim(),
        difficulty: q.difficulty ?? 1,
        kind: q.kind,
        prompt: q.prompt.trim(),
        choices: q.kind === "truefalse" ? ["صح", "خطأ"] : (q.choices ?? []).map((x) => String(x).trim()),
        correctIndex: q.correctIndex ?? 0,
        answer: q.answer?.trim(),
        pairs: q.pairs?.map((p) => ({ a: p.a.trim(), b: p.b.trim() })),
        origin: q.origin,
        lessonId: id,
        importId,
        page: q.page,
        createdAt: now + qi,
        updatedAt: now + qi,
      }));
      questions.push(...lessonQs);

      const wanted = l.games?.length ? l.games : suggestGames(l, c.subject);
      const made: GameType[] = [];
      for (const g of wanted) {
        const meta = GAMES.find((m) => m.type === g.template);
        if (!meta?.ready || made.includes(g.template)) continue;
        const asPlayed = gameMetaFor(g.template, c.subject);
        if (meta.subjects && !meta.subjects.includes(c.subject) && !meta.bank) continue;
        const settings = defaultSettings(g.template);
        if (isMathGame(g.template)) settings.math = { ...MATH_DEFAULTS, level: g.level ?? 1, count: g.count ?? MATH_DEFAULTS.count };
        const own = asPlayed.generated ? [] : lessonQs.filter((q) => asPlayed.kinds.includes(q.kind));
        const game: GameConfig = {
          id: `${importId}__${slug(l.id)}__${g.template}`,
          title: g.title?.trim() || `${asPlayed.name} — ${l.title.trim()}`,
          grade: c.grade,
          subject: c.subject,
          lesson: l.title.trim(),
          type: g.template,
          difficulty: 1,
          questions: own,
          settings,
          lessonId: id,
          importId,
          createdAt: now,
          updatedAt: now,
        };
        const problems = validateGame(game);
        if (problems.length) {
          issues.push({ level: "warning", where: `الدرس «${l.title}»`, message: `لم تُنشأ لعبة «${asPlayed.name}»: ${problems[0].message}` });
          continue;
        }
        made.push(g.template);
        games.push(game);
      }
      if (!made.length) issues.push({ level: "warning", where: `الدرس «${l.title}»`, message: "لا توجد لعبة لهذا الدرس (أسئلته غير كافية لأي قالب)." });
      return { id, title: l.title.trim(), games: made, planned: [] };
    }),
  }));

  const book: CurriculumBook = {
    id: importId,
    grade: c.grade,
    subject: c.subject,
    country: c.country || "",
    source: {
      name: c.textbook.title,
      url: c.textbook.url ?? "",
      checkedOn: (c.generatedAt ?? new Date(now).toISOString()).slice(0, 10),
      status: "provisional",
      note: `مستورد من ملف منهج${c.generatedBy ? ` (${c.generatedBy})` : ""}. الدروس والعناوين من الكتاب المدرسي؛ الأسئلة المولّدة بالذكاء الاصطناعي معلّمة ويجب أن يراجعها المعلم.`,
    },
    units,
    imported: {
      importId,
      importedAt: now,
      fingerprint: fingerprint(file),
      title: c.title,
      semester: c.semester,
      textbook: { title: c.textbook.title, publisher: c.textbook.publisher, edition: c.textbook.edition, isbn: c.textbook.isbn, pages: c.textbook.pages, sha256: c.textbook.sha256 },
      counts: { units: units.length, lessons: units.reduce((n, u) => n + u.lessons.length, 0), questions: questions.length, games: games.length },
    },
  };
  return { book, questions, games, issues };
}

/** Why an import must not go ahead (the same book or the same id was already imported). */
export function duplicateOf(plan: ImportPlan, existing: CurriculumBook[]): CurriculumBook | null {
  return existing.find((b) => b.id === plan.book.id || (b.imported && b.imported.fingerprint === plan.book.imported!.fingerprint)) ?? null;
}
