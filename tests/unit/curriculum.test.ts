import { describe, expect, it } from "vitest";
import { BOOKS, findLesson } from "@/content/curriculum";
import { gameMeta } from "@/lib/constants";

describe("curriculum index", () => {
  const book = BOOKS[0];
  it("has 12 units and 66 lessons in two semesters, with unique ids", () => {
    expect(book.units).toHaveLength(12);
    const lessons = book.units.flatMap((u) => u.lessons);
    expect(lessons).toHaveLength(66);
    expect(lessons.filter((_, i) => book.units.flatMap((u) => u.lessons.map(() => u.semester))[i] === 1)).toHaveLength(37);
    expect(new Set(lessons.map((l) => l.id)).size).toBe(66);
  });
  it("is marked provisional with its source", () => {
    expect(book.source.status).toBe("provisional");
    expect(book.source.url).toContain("iqrra.com");
  });
  it("links «السابق والتالي» to the number train and a lesson template", () => {
    const ref = findLesson("g1m-u3-l3")!;
    expect(ref.lesson.title).toContain("السّابِقُ");
    expect(ref.lesson.games).toContain("train");
    expect(ref.lesson.template).toBe("prev-next");
  });
  it("only links games that are playable", () => {
    for (const l of book.units.flatMap((u) => u.lessons)) for (const g of l.games) expect(gameMeta(g).ready).toBe(true);
  });
});
