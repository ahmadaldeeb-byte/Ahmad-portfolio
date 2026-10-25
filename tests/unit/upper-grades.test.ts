import { describe, expect, it } from "vitest";
import { builtinGames, seedQuestions, seedQuestionsSince } from "@/content/seed";
import { GAMES, gameMetaFor } from "@/lib/constants";
import { splitLetters } from "@/lib/arabic";
import {
  COINS,
  PLANE_SIDES,
  SOLID_FACTS,
  appleTasks,
  clockStep,
  clockTasks,
  crocTasks,
  factoryTasks,
  islandTasks,
  marketTasks,
  measureTasks,
  pirateTasks,
  pizzaTasks,
  raceAddQuestions,
  rocketTasks,
  shapeTasks,
  timeKey,
} from "@/lib/math/games";
import { MATH_GAME_INFO, MATH_GAME_TYPES, mathHowTo } from "@/lib/math/meta";
import { preparePlayable, validateGame } from "@/lib/questions";
import { memoryDeck } from "@/games/memory/MemoryGame";
import { makeWordTask } from "@/games/words/WordsGame";
import { puzzleBoards } from "@/games/puzzle/PuzzleGame";

const UPPER = [2, 3] as const;
const LEVELS = [1, 2, 3] as const;
const R = 40;
const each = (fn: (grade: 2 | 3, level: 1 | 2 | 3) => void) => {
  for (const g of UPPER) for (const l of LEVELS) for (let r = 0; r < R; r++) fn(g, l);
};
const evalFrac = (s: string) => {
  const [n, d] = s.split("/").map(Number);
  return n / d;
};

describe("grades 2–3 math generators", () => {
  it("every math game has three level labels for each grade", () => {
    for (const t of MATH_GAME_TYPES) for (const g of [1, 2, 3] as const) expect(MATH_GAME_INFO[t].levels[g]).toHaveLength(3);
    expect(mathHowTo("appleBasket", 3)).not.toEqual(mathHowTo("appleBasket", 1));
  });

  it("island: groups, products and shares give the right target", () => {
    each((g, l) => {
      for (const t of islandTasks(l, 8, g)) {
        expect(t.op).toBeDefined();
        const { kind, a, b } = t.op!;
        expect(t.target).toBe(kind === "share" ? a / b : a * b);
        expect(Number.isInteger(t.target)).toBe(true);
        expect(t.onIsland).toBeGreaterThanOrEqual(t.target);
        expect(t.onIsland).toBeLessThanOrEqual(24);
      }
    });
  });

  it("crocodile: bigger numbers and sums; expression terms add up", () => {
    each((g, l) => {
      const max = g === 2 ? (l === 1 ? 99 : l === 2 ? 999 : 100) : l === 1 ? 999 : l === 2 ? 9999 : 1000;
      for (const t of crocTasks(l, 8, g)) {
        expect(t.a).toBeLessThanOrEqual(max);
        expect(t.b).toBeLessThanOrEqual(max);
        expect(t.b).toBeGreaterThanOrEqual(0);
        if (t.aTerms) expect(t.aTerms.reduce((x, y) => x + y, 0)).toBe(t.a);
        if (t.bTerms) expect(t.bTerms.reduce((x, y) => x + y, 0)).toBe(t.b);
        expect(t.mode === "expr").toBe(l === 3);
      }
    });
  });

  it("rocket and race: correct sums inside each grade's range", () => {
    each((g, l) => {
      const max = g === 2 ? (l === 3 ? 999 : 99) : l === 2 ? 9999 : 999;
      for (const t of rocketTasks(l, 8, g)) {
        expect(t.answer).toBe(t.terms.reduce((x, y) => x + y, 0));
        expect(t.answer).toBeLessThanOrEqual(max);
        expect(t.terms.every((x) => x > 0)).toBe(true);
        expect(t.choices).toContain(t.answer);
      }
      for (const q of raceAddQuestions(l, 6, g)) {
        const [a, b] = q.prompt.match(/\d+/g)!.map(Number);
        expect(Number(q.choices[q.correctIndex])).toBe(a + b);
        expect(a + b).toBeLessThanOrEqual(g === 2 ? 999 : 9999);
      }
    });
    // grade 2, level 1 always needs regrouping in the ones
    for (let r = 0; r < R; r++) for (const t of rocketTasks(1, 8, 2)) expect((t.terms[0] % 10) + (t.terms[1] % 10)).toBeGreaterThanOrEqual(10);
  });

  it("pirates: positive differences; borrowing where the level says so", () => {
    each((g, l) => {
      for (const t of pirateTasks(l, 8, g)) {
        expect(t.answer).toBe(t.a - t.b);
        expect(t.answer).toBeGreaterThan(0);
        expect(t.choices).toContain(t.answer);
        if (l === 1 || (g === 2 && l === 2)) expect(t.a % 10).toBeLessThan(t.b % 10);
      }
    });
  });

  it("apple basket: equal sharing (division) and taking away", () => {
    each((g, l) => {
      for (const t of appleTasks(l, 8, g)) {
        expect(t.total).toBeLessThanOrEqual(24);
        expect(t.choices).toContain(t.answer);
        if (t.share) expect(t.answer * t.share).toBe(t.total);
        else expect(t.answer).toBe(t.total - t.take);
        expect(!!t.share).toBe(!(g === 2 && l === 1));
      }
    });
  });

  it("factory: hundreds and thousands with matching place values", () => {
    each((g, l) => {
      for (const t of factoryTasks(l, 8, g)) {
        expect(t.places[0]).toBe(10 ** (String(t.target).length - 1));
        expect(t.choices).toContain(t.target);
        expect(new Set(t.choices).size).toBe(t.choices.length);
      }
    });
  });

  it("shapes: polygon sides, solid facts and perimeters are right", () => {
    each((g, l) => {
      for (const t of shapeTasks(l, 9, g)) {
        expect(t.choices).toContain(t.answer);
        if (t.kind === "sides") expect(t.answer).toBe(String(PLANE_SIDES[t.plane]));
        if (t.kind === "solid-props") expect(t.answer).toBe(String(SOLID_FACTS.find((f) => f.text === t.text)!.answer));
        if (t.kind === "perimeter") expect(Number(t.answer)).toBe(2 * (t.w + t.h));
      }
    });
    expect(SOLID_FACTS.find((f) => f.solid === "cube" && f.prop === "edges")!.answer).toBe(12);
  });

  it("pizza: thirds, fraction names and comparisons are right", () => {
    each((g, l) => {
      for (const t of pizzaTasks(l, 9, g)) {
        if (t.kind === "frac") {
          expect(t.answer).toBe(`${t.num}/${t.den}`);
          expect(t.choices).toContain(t.answer);
        }
        if (t.kind === "compare") {
          const [va, vb] = [t.a[0] / t.a[1], t.b[0] / t.b[1]];
          expect(t.answer).toBe(va === vb ? "متساويان" : va > vb ? `${t.a[0]}/${t.a[1]}` : `${t.b[0]}/${t.b[1]}`);
          if (t.answer !== "متساويان") expect(evalFrac(t.answer)).toBe(Math.max(va, vb));
        }
        if (t.kind === "group") {
          expect(Number(t.answer)).toBe((t.items / t.den) * t.num);
          expect(t.items % t.den).toBe(0);
          expect(t.choices).toContain(t.answer);
        }
        if (t.kind === "name") expect(t.choices).toContain(t.answer);
      }
    });
  });

  it("market: change and totals add up; prices payable with the coins offered", () => {
    each((g, l) => {
      for (const t of marketTasks(l, 9, g)) {
        if (t.kind === "pay") {
          t.coins.forEach((c) => expect(COINS.some((x) => x.value === c)).toBe(true));
          expect(t.price % Math.min(...t.coins)).toBe(0);
        } else if (t.kind === "change") {
          expect(t.answer).toBe(t.paid - t.price);
          expect(t.answer).toBeGreaterThan(0);
          expect(t.choices).toContain(t.answer);
        } else if (t.kind === "sum") {
          expect(t.answer).toBe(t.prices[0] + t.prices[1]);
          expect(t.choices).toContain(t.answer);
        } else expect(t.answer).toBe(String(t.big / t.small));
      }
    });
  });

  it("clock: minutes follow the level's step; elapsed time is right", () => {
    each((g, l) => {
      const step = clockStep(l, g);
      for (const t of clockTasks(l, 10, g)) {
        expect(t.choices).toContain(t.answer);
        expect(new Set(t.choices).size).toBe(t.choices.length);
        if (t.kind === "elapsed") {
          const end = ((t.h % 12) * 60 + t.m + t.minutes!) % 720;
          expect(t.answer).toBe(timeKey(Math.floor(end / 60) || 12, end % 60));
        } else {
          expect(t.m % step).toBe(0);
          expect(t.answer).toBe(timeKey(t.h, t.m));
          if (t.kind === "set") expect(t.m % 5).toBe(0);
        }
      }
    });
  });

  it("measure: rulers, units and conversions", () => {
    each((g, l) => {
      for (const t of measureTasks(l, 9, g)) {
        if (t.kind === "convert") {
          const [n] = t.text!.match(/\d+/)!.map(Number);
          const factor = /م = ؟ سم|سم = ؟ م/.test(t.text!) ? 100 : 1000;
          const down = /^\d+ (م|كغ|لتر) =/.test(t.text!);
          expect(Number(t.answer)).toBe(down ? n * factor : n / factor);
          expect(t.choices).toContain(t.answer);
        }
        if (t.kind === "unit") {
          expect(t.choices).toContain(t.answer);
          if (g === 2) expect(["غرام", "مللتر"]).not.toContain(t.answer);
        }
        if (t.kind === "ruler") expect(t.values[0]).toBeLessThanOrEqual(15);
      }
    });
  });
});

describe("game worlds in every subject", () => {
  it("math games play bank questions outside math, generated tasks in math", () => {
    expect(gameMetaFor("rocket", "math").generated).toBe(true);
    const ar = gameMetaFor("rocket", "arabic");
    expect(ar.generated).toBe(false);
    expect(ar.name).toBe("صاروخ المعرفة");
    expect(ar.minQuestions).toBeGreaterThan(0);
    expect(gameMetaFor("raceAdd", "science").subjects).toEqual(["math"]);
  });

  it("every ready game has built-in versions; all valid and playable", () => {
    const games = builtinGames();
    for (const meta of GAMES) expect(meta.ready, meta.type).toBe(true);
    for (const subject of ["arabic", "science", "english"] as const)
      for (const grade of [1, 2, 3] as const)
        for (const type of MATH_GAME_TYPES.filter((t) => t !== "raceAdd")) {
          const g = games.find((x) => x.id === `builtin_${type}_${grade}_${subject}`);
          expect(g, `${type} ${grade} ${subject}`).toBeDefined();
          expect(validateGame(g!)).toEqual([]);
          expect(preparePlayable(g!).length).toBeGreaterThanOrEqual(3);
        }
    for (const grade of [1, 2, 3] as const) {
      for (const type of MATH_GAME_TYPES) expect(games.some((x) => x.id === `builtin_${type}_${grade}_math`)).toBe(true);
      for (const subject of ["arabic", "math", "science", "english"] as const) {
        expect(games.some((x) => x.id === `builtin_memory_${grade}_${subject}`)).toBe(true);
        expect(games.some((x) => x.id === `builtin_puzzle_${grade}_${subject}`)).toBe(true);
        expect(games.some((x) => x.id === `builtin_space_${grade}_${subject}`)).toBe(true);
      }
      for (const subject of ["arabic", "english"] as const) expect(games.some((x) => x.id === `builtin_words_${grade}_${subject}`)).toBe(true);
      expect(games.some((x) => x.id === `builtin_numbers_${grade}_math`)).toBe(true);
    }
  });

  it("new sample questions reach banks seeded before them", () => {
    const added = seedQuestionsSince(1);
    expect(added.length).toBeGreaterThan(20);
    expect(added.every((q) => q.kind === "match" || q.kind === "order")).toBe(true);
    expect(seedQuestionsSince(2)).toEqual([]);
    expect(seedQuestions().slice(-added.length)).toEqual(added);
  });
});

describe("memory, words and puzzle helpers", () => {
  it("memory deck: two cards per pair, no repeated text", () => {
    const qs = seedQuestions().filter((q) => q.kind === "match" && q.grade === 1 && q.subject === "arabic");
    const deck = memoryDeck(qs);
    expect(deck.length).toBe(16);
    expect(new Set(deck.map((c) => c.text)).size).toBe(16);
    for (let p = 0; p < 8; p++) expect(deck.filter((c) => c.pair === p)).toHaveLength(2);
  });

  it("word tasks keep harakat on their letters and shuffle the tiles", () => {
    const t = makeWordTask("x", "رتّب", "قَلَم");
    expect([...t.tiles].sort()).toEqual([...splitLetters("قَلَم")].sort());
    expect(t.tiles.join("")).not.toBe("قَلَم");
    const s = makeWordTask("y", "رتّب", "ذهب الولد إلى المدرسة");
    expect(s.words).toBe(true);
    expect([...s.tiles].sort()).toEqual(["إلى", "الولد", "المدرسة", "ذهب"].sort());
    expect(makeWordTask("z", "Order", "cat").ltr).toBe(true);
  });

  it("puzzle: one piece per question on 2×2 or 3×3 boards", () => {
    expect(puzzleBoards(4)).toEqual([{ picture: 0, pieces: 4 }]);
    expect(puzzleBoards(6)).toHaveLength(2);
    expect(puzzleBoards(12).map((b) => b.pieces)).toEqual([9, 9]);
  });
});
