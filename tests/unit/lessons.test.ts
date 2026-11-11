import { describe, expect, it } from "vitest";
import {
  buildTrainQuestion,
  challengeQuestions,
  isValidTrainQuestion,
  mainQuestions,
  prepareLesson,
  totalMinutes,
  trainToPlayable,
  validatePlan,
  warmupAnswer,
  warmupQuestions,
} from "@/lib/lessons/engine";

describe("lesson preparation engine", () => {
  it("prepares a 15-minute 3 + 7 + 5 plan for «السابق والتالي»", () => {
    const plan = prepareLesson("g1m-u3-l3")!;
    expect(plan).not.toBeNull();
    expect(plan.segments.map((s) => [s.kind, s.minutes])).toEqual([["warmup", 3], ["main", 7], ["challenge", 5]]);
    expect(totalMinutes(plan)).toBe(15);
    expect(plan.segments[1].game.type).toBe("train");
    expect(plan.segments[1].game.train.count).toBeGreaterThanOrEqual(5);
    expect(plan.segments[1].game.train.count).toBeLessThanOrEqual(7);
    expect(plan.segments[0].activity.questions).toHaveLength(3);
    expect(plan.segments[2].questions).toHaveLength(5);
    expect(validatePlan(plan)).toEqual([]);
  });
  it("returns null for lessons without a template", () => {
    expect(prepareLesson("g1m-u1-l1")).toBeNull();
  });
  it("warm-up answers stay on the number line", () => {
    for (let i = 0; i < 200; i++)
      for (const q of warmupQuestions(0, 10)) {
        const a = warmupAnswer(q);
        expect(a).toBeGreaterThanOrEqual(0);
        expect(a).toBeLessThanOrEqual(10);
      }
  });
  it("challenge questions are correct, in range and distinct from the main game", () => {
    for (let r = 0; r < 50; r++) {
      const plan = prepareLesson("g1m-u3-l3")!;
      const ch = plan.segments[2];
      ch.questions.forEach((q) => expect(isValidTrainQuestion(q, 0, 20)).toBe(true));
      expect(new Set(ch.questions.map((q) => q.key)).size).toBe(5);
      const main = mainQuestions(plan);
      const keys = new Set(ch.questions.map((q) => q.key));
      expect(main.some((q) => keys.has(q.key))).toBe(false);
      main.forEach((q) => q.sequence.forEach((v) => expect(v).toBeLessThanOrEqual(10)));
    }
    expect(challengeQuestions(0, 20)).toHaveLength(5);
  });
  it("editor rebuilds questions correctly", () => {
    expect(buildTrainQuestion("prev", 7).cars).toEqual([null, 7, 8]);
    expect(buildTrainQuestion("next", 8).cars).toEqual([7, 8, null]);
    expect(buildTrainQuestion("missing", 4).cars).toEqual([3, null, 5]);
    expect(isValidTrainQuestion(buildTrainQuestion("prev", 0), 0, 20)).toBe(false); // would need -1
  });
  it("multiple-choice form contains the right answer once", () => {
    const q = buildTrainQuestion("next", 8);
    const p = trainToPlayable(q, 0, 20);
    expect(p.choices[p.correctIndex]).toBe("9");
    expect(p.choices.filter((c) => c === "9")).toHaveLength(1);
  });
  it("flags invalid durations and out-of-range edits", () => {
    const plan = prepareLesson("g1m-u3-l3")!;
    plan.segments[0].minutes = 0;
    plan.segments[2].questions[0] = buildTrainQuestion("next", 20); // asks for 21
    expect(validatePlan(plan).length).toBe(2);
  });
});
