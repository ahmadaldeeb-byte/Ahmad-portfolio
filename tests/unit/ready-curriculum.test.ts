import { beforeEach, describe, expect, it } from "vitest";
import { BUNDLED_BOOKS, BUNDLED_GAMES, BUNDLED_QUESTIONS, CATALOG, lessonQuestions } from "@/content/catalog";
import { questionsRepo, resetDBConnection } from "@/lib/db";
import { builtinPlan, builtinPlanById, customCopy, playableItems, totalMinutes, validatePlan } from "@/lib/lessons/engine";
import { validateGame } from "@/lib/questions";
import { seedBundledQuestions, useData } from "@/store/data";

async function wipe() {
  await resetDBConnection();
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase("heroes-world");
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
  });
  useData.setState({ ready: false, games: [], questions: [], results: [], curricula: [], lessons: [] });
}

const book = (subject: string) => BUNDLED_BOOKS.find((b) => b.grade === 1 && b.subject === subject)!;
const lessonsOf = (subject: string) => book(subject).units.flatMap((u) => u.lessons);
const oral = (title: string) => /أَسْتَمِعُ|أَتَحَدَّثُ/.test(title);

describe("built-in textbooks", () => {
  it("Grade 1 math, semester 1: all six units of the book, 31 lessons", () => {
    const units = book("math").units;
    expect(units.map((u) => u.title)).toEqual([
      "الْوَحْدَةُ التَّمْهيدِيَّةُ: الْأَعْدادُ حَتّى 10",
      "الْأَعْدادُ ضِمْنَ مَنْزِلَتَيْنِ",
      "مُقارَنَةُ الْأَعْدادِ وَتَرْتيبُها",
      "الْجَمْعُ",
      "الطَّرْحُ",
      "مُعالَجَةُ الْبَياناتِ",
    ]);
    expect(units.every((u) => u.semester === 1)).toBe(true);
    expect(lessonsOf("math")).toHaveLength(31);
  });

  it("Grade 1 Arabic, semester 1: five units, 39 lessons", () => {
    expect(book("arabic").units).toHaveLength(5);
    expect(lessonsOf("arabic")).toHaveLength(39);
  });

  it("the catalog shows the textbook for semester 1 and the provisional index only for semester 2", () => {
    const math = CATALOG.filter((b) => b.grade === 1 && b.subject === "math");
    expect(math.filter((b) => b.units.some((u) => u.semester === 1)).map((b) => b.bundled)).toEqual([true]);
    expect(math.find((b) => !b.bundled)!.units.every((u) => u.semester === 2)).toBe(true);
  });

  it.each(["math", "arabic"])("every %s lesson has a guide, enough questions, valid games and a ready 15-minute plan", (subject) => {
    for (const l of lessonsOf(subject)) {
      const qs = lessonQuestions(l.id);
      expect(l.guide?.objectives.length, l.title).toBeGreaterThan(0);
      expect(l.guide?.explanation, l.title).toBeTruthy();
      expect(qs.length, l.title).toBeGreaterThanOrEqual(oral(l.title) ? 6 : 10);
      for (const q of qs) {
        expect(["textbook", "generated"]).toContain(q.origin);
        if (q.origin === "textbook") expect(q.page, q.id).toBeGreaterThan(0);
      }
      const games = BUNDLED_GAMES.filter((g) => g.lessonId === l.id);
      expect(games.length, l.title).toBeGreaterThan(0);
      for (const g of games) expect(validateGame(g)).toEqual([]);

      const plan = builtinPlan(l.id)!;
      expect(plan, l.title).not.toBeNull();
      expect(validatePlan(plan), l.title).toEqual([]);
      expect(totalMinutes(plan)).toBe(15);
      expect(plan.segments.map((s) => s.minutes)).toEqual([3, 7, 5]);
      expect(games.map((g) => g.id)).toContain(plan.segments[1].game.gameId);
      const [warm, , challenge] = plan.segments;
      expect(warm.activity.type === "questions" && playableItems(warm.activity.questions).length).toBeGreaterThan(0);
      expect(playableItems(challenge.items!).length).toBeGreaterThan(0);
      // Every challenge question belongs to the lesson and keeps its right answer.
      for (const q of challenge.items!) expect(qs.find((x) => x.id === q.id)?.correctIndex).toBe(q.correctIndex);
    }
  });

  it("a ready plan is the same on every call, and editing it means a copy", () => {
    const id = lessonsOf("arabic")[5].id;
    const a = builtinPlan(id)!;
    expect(builtinPlanById(a.id)).toEqual(a);
    const mine = customCopy(a);
    mine.segments[0].minutes = 5;
    expect(mine.id).not.toBe(a.id);
    expect(mine.builtin).toBe(false);
    expect(builtinPlan(id)!.segments[0].minutes).toBe(3);
  });
});

describe("question bank seeding", () => {
  beforeEach(wipe);

  it("adds the textbook questions once, keeps the teacher's edits and deletions, and never duplicates", async () => {
    await useData.getState().load();
    const all = await questionsRepo.all();
    for (const q of BUNDLED_QUESTIONS) expect(all.some((x) => x.id === q.id)).toBe(true);
    expect(new Set(all.map((q) => q.id)).size).toBe(all.length);

    const [edited, removed] = BUNDLED_QUESTIONS;
    await useData.getState().saveQuestion({ ...all.find((q) => q.id === edited.id)!, prompt: "سؤالي المعدّل" });
    await useData.getState().deleteQuestion(removed.id);

    // The start-up seeding runs again (twice): nothing comes back, nothing is duplicated or reset.
    for (let i = 0; i < 2; i++) {
      await resetDBConnection();
      await seedBundledQuestions();
    }
    const after = await questionsRepo.all();
    expect(after.length).toBe(all.length - 1);
    expect(after.find((q) => q.id === edited.id)?.prompt).toBe("سؤالي المعدّل");
    expect(after.some((q) => q.id === removed.id)).toBe(false);
  });
});
