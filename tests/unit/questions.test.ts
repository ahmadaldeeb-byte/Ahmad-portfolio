import { describe, expect, it } from "vitest";
import { blankQuestion, evaluateArithmetic, numericDistractors, preparePlayable, shuffleChoices, toPlayable, validateGame, validateQuestion } from "@/lib/questions";
import { defaultSettings } from "@/content/seed";
import type { GameConfig, Question } from "@/lib/types";

const base = (p: Partial<Question>): Question => ({ ...blankQuestion({ grade: 1, subject: "math" }), ...p });

describe("arithmetic", () => {
  it("evaluates the four operations, including Eastern Arabic digits", () => {
    expect(evaluateArithmetic("3 + 4")).toBe(7);
    expect(evaluateArithmetic("٩ - ٤")).toBe(5);
    expect(evaluateArithmetic("7 × 8")).toBe(56);
    expect(evaluateArithmetic("36 ÷ 6 = ؟")).toBe(6);
  });
  it("rejects invalid or non-integer expressions", () => {
    expect(evaluateArithmetic("7 ÷ 2")).toBeNull();
    expect(evaluateArithmetic("5 ÷ 0")).toBeNull();
    expect(evaluateArithmetic("hello")).toBeNull();
  });
  it("produces distinct, non-negative distractors", () => {
    for (const v of [0, 1, 5, 56]) {
      const d = numericDistractors(v);
      expect(d).toHaveLength(3);
      expect(new Set(d).size).toBe(3);
      expect(d).not.toContain(v);
      expect(d.every((x) => x >= 0)).toBe(true);
    }
  });
});

describe("answer correctness", () => {
  it("mcq keeps the right answer at correctIndex after shuffling", () => {
    const q = toPlayable(base({ kind: "mcq", prompt: "؟", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 }))!;
    for (let i = 0; i < 50; i++) {
      const s = shuffleChoices(q);
      expect(s.choices[s.correctIndex]).toBe("ج");
      expect([...s.choices].sort()).toEqual([...q.choices].sort());
    }
  });
  it("arithmetic questions include the right result exactly once", () => {
    const p = toPlayable(base({ kind: "arithmetic", prompt: "6 + 2" }))!;
    expect(p.choices[p.correctIndex]).toBe("8");
    expect(p.choices.filter((c) => c === "8")).toHaveLength(1);
    expect(p.prompt).toContain("؟");
  });
  it("true/false maps to صح / خطأ", () => {
    const p = toPlayable(base({ kind: "truefalse", prompt: "x", correctIndex: 1 }))!;
    expect(p.choices).toEqual(["صح", "خطأ"]);
    expect(p.choices[p.correctIndex]).toBe("خطأ");
  });
});

describe("validation", () => {
  it("flags incomplete questions", () => {
    expect(validateQuestion(base({ kind: "mcq", prompt: "", choices: ["a", ""], correctIndex: 0 })).length).toBeGreaterThan(0);
    expect(validateQuestion(base({ kind: "mcq", prompt: "س", choices: ["a", "a"], correctIndex: 0 }))).toContain("يوجد خيارات مكررة.");
    expect(validateQuestion(base({ kind: "arithmetic", prompt: "7 ÷ 2" })).length).toBe(1);
    expect(validateQuestion(base({ kind: "match", prompt: "طابق", pairs: [{ a: "1", b: "" }] })).length).toBeGreaterThan(0);
    expect(validateQuestion(base({ kind: "mcq", prompt: "س", choices: ["a", "b"], correctIndex: 1 }))).toEqual([]);
  });

  const game = (p: Partial<GameConfig>): GameConfig => ({
    id: "g",
    title: "لعبة",
    grade: 1,
    subject: "math",
    lesson: "الجمع",
    type: "balloons",
    difficulty: 1,
    questions: [],
    settings: defaultSettings("balloons"),
    createdAt: 0,
    updatedAt: 0,
    ...p,
  });

  it("requires the minimum number of playable questions", () => {
    const qs = [base({ kind: "arithmetic", prompt: "1 + 1" }), base({ kind: "arithmetic", prompt: "2 + 2" })];
    expect(validateGame(game({ questions: qs.slice(0, 1) })).length).toBeGreaterThan(0);
    expect(validateGame(game({ questions: qs }))).toEqual([]);
  });
  it("rejects question kinds the game cannot play", () => {
    const qs = [base({ kind: "arithmetic", prompt: "1 + 1" }), base({ kind: "arithmetic", prompt: "2 + 2" }), base({ kind: "order", prompt: "رتب", answer: "قلم" })];
    expect(validateGame(game({ questions: qs })).some((i) => i.index === 2)).toBe(true);
  });
  it("a names wheel needs names, not questions", () => {
    const g = game({ type: "wheel", settings: { ...defaultSettings("wheel"), wheelMode: "names", wheelNames: ["سارة"] } });
    expect(validateGame(g).length).toBe(1);
    g.settings.wheelNames = ["سارة", "عمر", " "];
    expect(validateGame(g)).toEqual([]);
  });
  it("preparePlayable keeps order when shuffle is off", () => {
    const qs = [base({ kind: "arithmetic", prompt: "1 + 1" }), base({ kind: "arithmetic", prompt: "2 + 2" }), base({ kind: "arithmetic", prompt: "3 + 3" })];
    const p = preparePlayable(game({ questions: qs, settings: { ...defaultSettings("balloons"), shuffle: false } }));
    expect(p.map((x) => x.prompt)).toEqual(["1 + 1 = ؟", "2 + 2 = ؟", "3 + 3 = ؟"]);
  });
});
