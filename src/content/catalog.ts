/*
 * The curricula built into the app: the textbook files in curricula/ become
 * read-only books, lesson games and question-bank questions that exist on
 * every start (nothing to import). Teacher changes are separate records:
 * custom game copies, edited bank questions and saved lesson plans.
 *
 * Semester 2 of Grade 1 math has no textbook file yet, so its units still come
 * from the provisional index (marked as such on screen).
 */
import arabicG1S1 from "../../curricula/jo-g1-arabic-s1-2026.json";
import mathG1S1 from "../../curricula/jo-g1-math-s1-2026.json";
import { planImport, type ImportPlan } from "@/lib/curriculum/import";
import { validateCurriculumFile } from "@/lib/curriculum/schema";
import { findLesson as findIndexLesson, type CurriculumBook, type LessonRef } from "./curriculum";
import { GRADE1_MATH } from "./curriculum/grade1-math";

/** Fixed time stamp so built-in records never change between starts. */
export const BUNDLE_TIME = Date.UTC(2026, 9, 24);

function bundle(raw: unknown): ImportPlan {
  const { file, issues } = validateCurriculumFile(raw);
  if (!file) throw new Error(`Built-in curriculum is invalid: ${issues.map((i) => i.message).join(" | ")}`);
  const plan = planImport(file, BUNDLE_TIME);
  const lessons = plan.book.imported!.counts.lessons;
  plan.book = {
    ...plan.book,
    bundled: true,
    source: {
      ...plan.book.source,
      status: "verified",
      note: `منقول من كتاب الطالب (${lessons} درسًا بعناوينها وصفحاتها). كل سؤال يحمل مصدره: 📘 من الكتاب مع رقم الصفحة، أو ✨ مولّد اعتمادًا على مفاهيم الدرس. الأهداف والشرح والأنشطة اقتراحات من المنصة.`,
    },
  };
  for (const g of plan.games) g.builtin = true;
  return plan;
}

export const BUNDLED: ImportPlan[] = [bundle(mathG1S1), bundle(arabicG1S1)];
export const BUNDLED_BOOKS: CurriculumBook[] = BUNDLED.map((p) => p.book);
export const BUNDLED_GAMES = BUNDLED.flatMap((p) => p.games);
export const BUNDLED_QUESTIONS = BUNDLED.flatMap((p) => p.questions);
const bundledQuestionIds = new Set(BUNDLED_QUESTIONS.map((q) => q.id));
export const isBundledQuestion = (id: string) => bundledQuestionIds.has(id);

/** Grade 1 math, semester 2: still the provisional index (no textbook file yet). */
const G1_MATH_S2: CurriculumBook = {
  ...GRADE1_MATH,
  units: GRADE1_MATH.units.filter((u) => u.semester === 2),
  source: {
    ...GRADE1_MATH.source,
    note: `الفصل الدراسي الثاني فقط: لم يُرفع كتاب الفصل الثاني بعد، لذلك هذه العناوين من الفهرس المؤقت. ${GRADE1_MATH.source.note}`,
  },
};

/** Books shown in «المنهاج والدروس» and «حضّر حصتك». */
export const CATALOG: CurriculumBook[] = [...BUNDLED_BOOKS, G1_MATH_S2];

/** A lesson of the catalog, or of the old provisional index (lesson plans saved before the textbook files). */
export function findLesson(lessonId: string): LessonRef | undefined {
  for (const book of CATALOG)
    for (const unit of book.units) {
      const lesson = unit.lessons.find((l) => l.id === lessonId);
      if (lesson) return { book, unit, lesson };
    }
  return findIndexLesson(lessonId);
}

export const lessonQuestions = (lessonId: string) => BUNDLED_QUESTIONS.filter((q) => q.lessonId === lessonId);
export const lessonBuiltinGames = (lessonId: string) => BUNDLED_GAMES.filter((g) => g.lessonId === lessonId);

