import { describe, expect, it } from "vitest";
import { initialScore, recordAnswer, starsFor, successRate, winners } from "@/lib/scoring";
import { raceLength } from "@/lib/race";

const teams = [
  { name: "أحمر", color: "#f00" },
  { name: "أزرق", color: "#00f" },
];

describe("scoring", () => {
  it("counts correct/wrong and points", () => {
    let s = initialScore();
    s = recordAnswer(s, true, 10);
    s = recordAnswer(s, false, 10);
    s = recordAnswer(s, true, 10);
    expect(s).toMatchObject({ correct: 2, wrong: 1, score: 20, streak: 1 });
  });
  it("credits only the answering team", () => {
    let s = initialScore(teams);
    s = recordAnswer(s, true, 10, 1);
    s = recordAnswer(s, false, 10, 0);
    expect(s.teams[0]).toMatchObject({ score: 0, correct: 0, wrong: 1 });
    expect(s.teams[1]).toMatchObject({ score: 10, correct: 1, wrong: 0 });
  });
  it("applies a capped streak bonus only when asked", () => {
    let s = initialScore();
    for (let i = 0; i < 10; i++) s = recordAnswer(s, true, 10, undefined, { streakBonus: true });
    // 10 + 11 + 12 + 13 + 14 + 15*5
    expect(s.score).toBe(10 + 11 + 12 + 13 + 14 + 15 * 5);
    let plain = initialScore();
    for (let i = 0; i < 3; i++) plain = recordAnswer(plain, true, 10);
    expect(plain.score).toBe(30);
  });
  it("computes success rate, winners and stars", () => {
    expect(successRate(0, 0)).toBe(0);
    expect(successRate(3, 1)).toBe(75);
    const ts = [{ name: "أ", color: "", score: 5, correct: 0, wrong: 0 }, { name: "ب", color: "", score: 5, correct: 0, wrong: 0 }];
    expect(winners(ts)).toHaveLength(2);
    expect(starsFor(95)).toBe(3);
    expect(starsFor(60)).toBe(2);
    expect(starsFor(10)).toBe(0);
  });
  it("race length scales with questions per team", () => {
    expect(raceLength(10, 2)).toBe(5);
    expect(raceLength(3, 2)).toBe(2);
    expect(raceLength(100, 2)).toBe(8);
  });
});
