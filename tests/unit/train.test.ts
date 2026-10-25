import { describe, expect, it } from "vitest";
import { answerTiles, carCount, generateTrainQuestions, kindsFor, plannedKinds, trainPrompt, validateTrainSettings, type TrainSettings } from "@/lib/train";

const base: TrainSettings = { mode: "mix", min: 0, max: 10, count: 10, difficulty: "advanced", learning: true };

function check(s: TrainSettings) {
  const qs = generateTrainQuestions(s);
  expect(qs).toHaveLength(s.count);
  for (const q of qs) {
    expect(q.cars).toHaveLength(carCount(q.kind, s.difficulty));
    // consecutive and inside the range
    q.sequence.forEach((v, i) => {
      expect(v).toBeGreaterThanOrEqual(s.min);
      expect(v).toBeLessThanOrEqual(s.max);
      if (i) expect(v - q.sequence[i - 1]).toBe(1);
    });
    q.cars.forEach((c, i) => (q.missing.includes(i) ? expect(c).toBeNull() : expect(c).toBe(q.sequence[i])));
    if (q.kind === "prev") {
      expect(q.missing).toEqual([0]);
      expect(q.sequence[0]).toBe(q.target! - 1);
    }
    if (q.kind === "next") {
      expect(q.missing).toEqual([q.cars.length - 1]);
      expect(q.sequence.at(-1)).toBe(q.target! + 1);
    }
    if (q.kind === "missing") {
      expect(q.missing[0]).toBeGreaterThan(0);
      expect(q.missing[0]).toBeLessThan(q.cars.length - 1);
    }
    if (q.kind === "challenge") expect(q.missing).toEqual([1, 3]);
    const tiles = answerTiles(q, s);
    for (const m of q.missing) expect(tiles).toContain(q.sequence[m]);
    expect(new Set(tiles).size).toBe(tiles.length);
    tiles.forEach((t) => {
      expect(t).toBeGreaterThanOrEqual(s.min);
      expect(t).toBeLessThanOrEqual(s.max);
    });
  }
  return qs;
}

describe("number train generator", () => {
  it("stays within every preset and custom range, for every mode and difficulty", () => {
    for (const [min, max] of [[0, 10], [0, 20], [0, 99], [37, 52], [5, 9]])
      for (const mode of ["prev", "next", "missing", "mix"] as const)
        for (const difficulty of ["easy", "medium", "advanced"] as const) {
          const s = { ...base, min, max, mode, difficulty, count: 15 };
          if (validateTrainSettings(s).length) continue;
          for (let r = 0; r < 20; r++) check(s);
        }
  }, 30_000); // ~1,000 generated rounds: slow containers need more than the default 5 s
  it("matches the lesson examples", () => {
    const qs = generateTrainQuestions({ ...base, mode: "prev", difficulty: "easy", count: 30 });
    const q = qs.find((x) => x.target === 7)!;
    expect(q.cars).toEqual([null, 7, 8]);
    expect(trainPrompt(q)).toBe("ما العدد السابق للعدد 7؟");
  });
  it("orders stations prev → next → missing → challenge in mix mode", () => {
    expect(plannedKinds({ ...base, count: 8 })).toEqual(["prev", "prev", "next", "next", "missing", "missing", "challenge", "challenge"]);
    expect(kindsFor("mix", "easy")).not.toContain("challenge");
  });
  it("avoids excluded and duplicate questions while possible", () => {
    const first = generateTrainQuestions({ ...base, count: 6 });
    const second = generateTrainQuestions({ ...base, count: 6 }, { exclude: new Set(first.map((q) => q.key)) });
    const keys = new Set(first.map((q) => q.key));
    expect(second.some((q) => keys.has(q.key))).toBe(false);
    expect(new Set(second.map((q) => q.key)).size).toBe(6);
  });
  it("rejects ranges too small for the level", () => {
    expect(validateTrainSettings({ ...base, min: 3, max: 5 }).length).toBeGreaterThan(0);
    expect(validateTrainSettings({ ...base, min: 0, max: 4 })).toEqual([]);
    expect(validateTrainSettings({ ...base, count: 0 }).length).toBeGreaterThan(0);
  });
});
