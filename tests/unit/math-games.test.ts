import { describe, expect, it } from "vitest";
import { countPhrase, numberChoices, numberWord } from "@/lib/math/common";
import {
  COINS,
  FRUITS,
  PLANE_NAMES,
  PLANE_SIDES,
  SOLID_NAMES,
  appleTasks,
  clockTasks,
  compareSymbol,
  crocTasks,
  factoryTasks,
  islandTasks,
  marketTasks,
  measureAnswer,
  measureTasks,
  pirateTasks,
  pizzaTasks,
  raceAddQuestions,
  rocketTasks,
  shapeTasks,
} from "@/lib/math/games";

const LEVELS = [1, 2, 3] as const;
const R = 30; // repeat each generator to cover randomness

describe("math game generators", () => {
  it("number helpers", () => {
    expect(numberWord(5)).toBe("خمسة");
    expect(numberWord(20)).toBe("عشرون");
    expect(countPhrase(1, FRUITS[0])).toBe("تفاحة واحدة");
    expect(countPhrase(2, FRUITS[0])).toBe("تفاحتين");
    expect(countPhrase(5, FRUITS[0])).toBe("5 تفاحات");
    expect(countPhrase(12, FRUITS[0])).toBe("12 تفاحة");
    for (let i = 0; i < 200; i++) {
      const c = numberChoices(3, 0, 10);
      expect(c).toContain(3);
      expect(new Set(c).size).toBe(4);
      c.forEach((v) => expect(v >= 0 && v <= 10).toBe(true));
    }
  });

  it("island: targets inside the level range, enough fruit on the island", () => {
    for (const l of LEVELS)
      for (let r = 0; r < R; r++)
        for (const t of islandTasks(l, 10)) {
          expect(t.target).toBeGreaterThanOrEqual(l === 3 ? 11 : 1);
          expect(t.target).toBeLessThanOrEqual(l === 1 ? 10 : 20);
          expect(t.onIsland).toBeGreaterThan(t.target);
        }
  });

  it("crocodile: groups differ, symbols are right", () => {
    expect(compareSymbol(7, 3)).toBe(">");
    expect(compareSymbol(2, 9)).toBe("<");
    expect(compareSymbol(4, 4)).toBe("=");
    for (const l of LEVELS)
      for (let r = 0; r < R; r++)
        for (const t of crocTasks(l, 10)) {
          if (t.mode === "group") expect(t.a).not.toBe(t.b);
          expect(Math.max(t.a, t.b)).toBeLessThanOrEqual(t.mode === "number" ? 99 : 10);
          if (l === 1) expect(t.mode).toBe("group");
        }
  });

  it("rocket: sums correct and within the level", () => {
    for (const l of LEVELS)
      for (let r = 0; r < R; r++)
        for (const t of rocketTasks(l, 10)) {
          expect(t.answer).toBe(t.terms.reduce((a, b) => a + b, 0));
          expect(t.answer).toBeLessThanOrEqual(l === 1 ? 10 : 20);
          expect(t.choices).toContain(t.answer);
          if (l === 3) expect(t.terms).toHaveLength(3);
        }
  });

  it("apple basket: takes fewer apples than on the tree", () => {
    for (const l of LEVELS)
      for (let r = 0; r < R; r++)
        for (const t of appleTasks(l, 10)) {
          expect(t.take).toBeGreaterThanOrEqual(1);
          expect(t.take).toBeLessThan(t.total);
          expect(t.answer).toBe(t.total - t.take);
          expect(t.choices).toContain(t.answer);
        }
  });

  it("factory: numbers fit the lesson, choices include the target", () => {
    for (const l of LEVELS)
      for (let r = 0; r < R; r++)
        for (const t of factoryTasks(l, 10)) {
          if (l === 1) expect(t.target % 10).toBe(0);
          expect(t.target).toBeGreaterThanOrEqual(1);
          expect(t.target).toBeLessThanOrEqual(l === 2 ? 50 : 99);
          expect(t.choices).toContain(t.target);
          expect(new Set(t.choices).size).toBe(t.choices.length);
        }
  });

  it("addition race: two-digit sums without regrouping", () => {
    for (const l of LEVELS)
      for (let r = 0; r < 5; r++)
        for (const q of raceAddQuestions(l, 60)) {
          const [a, b] = q.prompt.match(/\d+/g)!.map(Number);
          expect(q.choices[q.correctIndex]).toBe(String(a + b));
          expect(a + b).toBeLessThanOrEqual(99);
          expect((a % 10) + (b % 10)).toBeLessThan(10); // no carrying
        }
  });

  it("pirates: subtraction never negative or borrowing at level 3", () => {
    for (const l of LEVELS)
      for (let r = 0; r < R; r++)
        for (const t of pirateTasks(l, 10)) {
          expect(t.answer).toBe(t.a - t.b);
          expect(t.answer).toBeGreaterThanOrEqual(0);
          expect(t.choices).toContain(t.answer);
          if (l === 3) expect(t.a % 10).toBeGreaterThanOrEqual(t.b % 10);
        }
  });

  it("shapes: answers are among the choices and facts are right", () => {
    expect(PLANE_SIDES.triangle).toBe(3);
    expect(PLANE_SIDES.rectangle).toBe(4);
    for (const l of LEVELS)
      for (let r = 0; r < R; r++)
        for (const t of shapeTasks(l, 12)) {
          expect(t.choices).toContain(t.answer);
          if (t.kind === "solid-name" || t.kind === "object-solid") expect(t.answer).toBe(SOLID_NAMES[t.solid]);
          if (t.kind === "plane-name") expect(t.answer).toBe(PLANE_NAMES[t.plane]);
          if (t.kind === "sides") expect(t.answer).toBe(String(PLANE_SIDES[t.plane]));
          if (t.kind === "pattern") {
            // the answer continues the repeating unit
            const len = t.seq.length;
            const unit = t.seq[0] === t.seq[1] ? 3 : 2;
            expect(t.answer).toBe(PLANE_NAMES[t.seq[len % unit]]);
          }
        }
  });

  it("pizza: fraction names and group answers", () => {
    for (const l of LEVELS)
      for (let r = 0; r < R; r++)
        for (const t of pizzaTasks(l, 9)) {
          if (t.kind === "name") expect(t.answer).toBe(!t.equal ? "ليس نصفًا ولا ربعًا" : t.parts === 2 ? "نصف" : "ربع");
          if (t.kind === "group") {
            expect(Number(t.answer)).toBe(t.fraction === "half" ? t.items / 2 : t.items / 4);
            expect(t.choices).toContain(t.answer);
          }
        }
  });

  it("market: only real Jordanian coins; prices payable", () => {
    expect(COINS.map((c) => c.value)).toEqual([1, 5, 10, 25, 50, 100]);
    for (const l of LEVELS)
      for (let r = 0; r < R; r++)
        for (const t of marketTasks(l, 9)) {
          if (t.kind === "pay") {
            t.coins.forEach((c) => expect(COINS.some((x) => x.value === c)).toBe(true));
            // payable exactly with the offered coins (smallest coin divides the price)
            expect(t.price % Math.min(...t.coins)).toBe(0);
          } else expect(t.answer).toBe(String(t.big / t.small));
        }
  });

  it("clock: whole hours before level 3, answer in choices", () => {
    for (const l of LEVELS)
      for (let r = 0; r < R; r++)
        for (const t of clockTasks(l, 10)) {
          if (l < 3) expect(t.m).toBe(0);
          expect(t.h >= 1 && t.h <= 12).toBe(true);
          expect(t.choices).toContain(t.answer);
          if (l < 3) t.choices.forEach((c) => expect(c.endsWith(":00")).toBe(true));
        }
  });

  it("measure: distinct values so there is one right answer", () => {
    for (const l of LEVELS)
      for (let r = 0; r < R; r++)
        for (const t of measureTasks(l, 8)) {
          if (t.kind === "units") continue;
          expect(new Set(t.values).size).toBe(t.values.length);
          expect(measureAnswer(t)).toBeGreaterThanOrEqual(0);
          if (t.kind === "mass") {
            // a feather is never heavier than a brick
            const order = ["🪶", "🎈", "🍎", "📚", "🍉", "🧱"];
            t.items.forEach((it, k) => expect(t.values[k]).toBe(order.indexOf(it) + 1));
          }
        }
  });
});
