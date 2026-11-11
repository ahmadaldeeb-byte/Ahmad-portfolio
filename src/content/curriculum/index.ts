import type { Grade, Subject } from "@/lib/types";
import { GRADE1_MATH } from "./grade1-math";
import type { CurriculumBook, CurriculumLesson, CurriculumUnit, PlannedGame } from "./types";

export * from "./types";
export const BOOKS: CurriculumBook[] = [GRADE1_MATH];

export const PLANNED_GAME_NAMES: Record<PlannedGame, string> = {
  island: "جزيرة الأرقام 🏝️",
  crocodile: "التمساح الجائع 🐊",
  rocket: "صاروخ الجمع 🚀",
  appleBasket: "سلة التفاح 🍎",
  factory: "مصنع الأعداد 🏗️",
  raceAdd: "سباق الجمع 🚗",
  pirates: "كنز القراصنة 🏴‍☠️",
  shapes: "مدينة الأشكال 🏰",
  pizza: "مطعم البيتزا 🍕",
  market: "السوق الصغير 🛒",
  clock: "ساعة المغامرات 🕒",
  measure: "مختبر القياس ⚖️",
};

export function findBook(grade: Grade, subject: Subject) {
  return BOOKS.find((b) => b.grade === grade && b.subject === subject);
}

export interface LessonRef {
  book: CurriculumBook;
  unit: CurriculumUnit;
  lesson: CurriculumLesson;
}

export function findLesson(lessonId: string): LessonRef | undefined {
  for (const book of BOOKS)
    for (const unit of book.units) {
      const lesson = unit.lessons.find((l) => l.id === lessonId);
      if (lesson) return { book, unit, lesson };
    }
  return undefined;
}

/** Titles shown in the UI: the index title with tashkeel, unless the teacher corrected it. */
export function lessonTitle(lesson: CurriculumLesson, overrides: Record<string, string> = {}) {
  return overrides[lesson.id] || lesson.title;
}
