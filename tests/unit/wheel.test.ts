import { describe, expect, it } from "vitest";
import { planSpin, segmentAtPointer } from "@/lib/wheel";
import { randomInt, shuffle } from "@/lib/utils";

describe("wheel", () => {
  it("maps rotation to the segment under the pointer", () => {
    expect(segmentAtPointer(0, 4)).toBe(0);
    expect(segmentAtPointer(-10, 4)).toBe(0);
    expect(segmentAtPointer(350, 4)).toBe(0); // segment 0 starts at the pointer and spans clockwise
    expect(segmentAtPointer(10, 4)).toBe(3);
    expect(segmentAtPointer(100, 4)).toBe(2);
    expect(segmentAtPointer(360 * 5 + 10, 4)).toBe(3);
  });
  it("always stops on the pre-selected winner, moving forward several turns", () => {
    let rot = 0;
    for (let i = 0; i < 2000; i++) {
      const count = 2 + (i % 15);
      const plan = planSpin(rot, count);
      expect(plan.rotation - rot).toBeGreaterThanOrEqual(5 * 360);
      expect(segmentAtPointer(plan.rotation, count)).toBe(plan.winner);
      rot = plan.rotation % 360;
    }
  });
  it("is statistically fair (chi-square over 60k spins)", () => {
    const n = 6;
    const counts = new Array(n).fill(0);
    let rot = 0;
    const trials = 60000;
    for (let i = 0; i < trials; i++) {
      const p = planSpin(rot, n);
      counts[segmentAtPointer(p.rotation, n)]++;
      rot = p.rotation % 360;
    }
    const expected = trials / n;
    const chi2 = counts.reduce((a, c) => a + (c - expected) ** 2 / expected, 0);
    // 5 degrees of freedom: p = 0.001 critical value ≈ 20.5
    expect(chi2).toBeLessThan(20.5);
  });
});

describe("random helpers", () => {
  it("randomInt stays in range", () => {
    for (let i = 0; i < 5000; i++) {
      const v = randomInt(7);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(7);
    }
    expect(() => randomInt(0)).toThrow();
  });
  it("shuffle returns a permutation", () => {
    const a = [1, 2, 3, 4, 5, 6];
    const s = shuffle(a);
    expect([...s].sort()).toEqual(a);
    expect(a).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
