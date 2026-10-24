import { describe, expect, it } from "vitest";
import { builtinGames, seedQuestions } from "@/content/seed";
import { GAMES } from "@/lib/constants";
import { isArabic } from "@/lib/arabic";
import { toPlayable, validateGame, validateQuestion } from "@/lib/questions";

describe("sample content", () => {
  const qs = seedQuestions();
  it("has unique ids and no incomplete questions", () => {
    expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
    for (const q of qs) expect(validateQuestion(q), q.prompt).toEqual([]);
  });
  it("every choice-based question resolves to exactly one correct answer", () => {
    for (const q of qs.filter((x) => x.kind !== "order" && x.kind !== "match")) {
      const p = toPlayable(q)!;
      expect(p, q.prompt).not.toBeNull();
      expect(new Set(p.choices).size, q.prompt).toBe(p.choices.length);
      expect(p.correctIndex).toBeGreaterThanOrEqual(0);
    }
  });
  it("covers every grade × subject with lessons", () => {
    for (const grade of [1, 2, 3])
      for (const subject of ["arabic", "math", "science", "english"]) {
        const list = qs.filter((q) => q.grade === grade && q.subject === subject);
        expect(list.length, `${grade}/${subject}`).toBeGreaterThanOrEqual(8);
      }
  });
  it("uses Arabic in non-English subjects", () => {
    for (const q of qs.filter((x) => x.subject !== "english" && x.kind !== "arithmetic")) expect(isArabic(q.prompt), q.prompt).toBe(true);
  });
  it("all built-in games are valid and playable", () => {
    const games = builtinGames();
    const perSubject = (s: string) => GAMES.filter((g) => g.ready && (!g.subjects || g.subjects.includes(s as never))).length;
    expect(games.filter((g) => !g.lessonId)).toHaveLength(3 * ["arabic", "math", "science", "english"].reduce((a, s) => a + perSubject(s), 0));
    expect(games.filter((g) => g.lessonId).length).toBe(4);
    for (const g of games) expect(validateGame(g), g.id).toEqual([]);
  });
});
