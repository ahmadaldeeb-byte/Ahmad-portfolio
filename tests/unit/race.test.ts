import { describe, expect, it } from "vitest";
import { decideRace, fairSequences, validateRaceSettings } from "@/lib/race";
import type { PlayableQuestion } from "@/lib/questions";

const q = (id: string, difficulty: number): PlayableQuestion => ({ id, prompt: id, choices: ["1", "2"], correctIndex: 0, difficulty });

describe("split-screen race", () => {
  const bank = [...Array.from({ length: 8 }, (_, i) => q(`e${i}`, 1)), ...Array.from({ length: 6 }, (_, i) => q(`m${i}`, 2)), ...Array.from({ length: 4 }, (_, i) => q(`h${i}`, 3))];

  it("gives both teams the same difficulty at every position", () => {
    for (let r = 0; r < 100; r++) {
      const { red, blue } = fairSequences(bank, 40);
      expect(red).toHaveLength(40);
      red.forEach((x, i) => expect(x.difficulty).toBe(blue[i].difficulty));
    }
  });
  it("uses different questions for each team and no repeats before a team's share runs out", () => {
    const { red, blue } = fairSequences(bank, 9); // one full pattern: 4 easy + 3 medium + 2 hard
    expect(new Set(red.map((x) => x.id)).size).toBe(9);
    expect(new Set(blue.map((x) => x.id)).size).toBe(9);
    const redIds = new Set(red.map((x) => x.id));
    expect(blue.some((x) => redIds.has(x.id))).toBe(false);
  });
  it("still works with tiny banks and questions without a difficulty", () => {
    const tiny = [q("a", 1)];
    const { red, blue } = fairSequences(tiny, 5);
    expect(red.map((x) => x.id)).toEqual(["a", "a", "a", "a", "a"]);
    expect(blue).toHaveLength(5);
    const plain = fairSequences([{ id: "x", prompt: "x", choices: ["1", "2"], correctIndex: 0 }, { id: "y", prompt: "y", choices: ["1", "2"], correctIndex: 0 }], 4);
    expect(plain.red[0].id).not.toBe(plain.blue[0].id);
  });
  it("decides the winner", () => {
    expect(decideRace([6, 3], 6, false)).toEqual({ winner: 0, reason: "finish" });
    expect(decideRace([2, 6], 6, false)).toEqual({ winner: 1, reason: "finish" });
    expect(decideRace([2, 3], 6, false)).toBeNull();
    expect(decideRace([4, 3], 6, true)).toEqual({ winner: 0, reason: "time" });
    expect(decideRace([1, 5], 6, true)).toEqual({ winner: 1, reason: "time" });
    expect(decideRace([3, 3], 6, true)).toEqual({ winner: null, reason: "time" });
  });
  it("validates teacher settings", () => {
    expect(validateRaceSettings({ durationSec: 180, finishSteps: 6 })).toEqual([]);
    expect(validateRaceSettings({ durationSec: 10, finishSteps: 1 })).toHaveLength(2);
  });
});
