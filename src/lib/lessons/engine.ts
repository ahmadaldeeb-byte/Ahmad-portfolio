import { findLesson, lessonTitle } from "@/content/curriculum";
import { DEFAULT_TEAM_NAMES, TEAM_COLORS } from "../constants";
import type { PlayableQuestion } from "../questions";
import { generateTrainQuestions, trainPrompt, type TrainQuestion, type TrainSettings } from "../train";
import { randomInt, shuffle, uid } from "../utils";
import type { ChallengeSegment, LessonPlan, MainSegment, WarmupQuestion, WarmupSegment } from "./types";

/**
 * Lesson Preparation Engine (version 1): builds a 15-minute plan from fixed
 * teaching templates, rule-based logic and the local question generators.
 * It is NOT AI generation; no network service is involved.
 */

export const TEMPLATE_NAMES: Record<string, string> = { "prev-next": "قالب السابق والتالي" };

export function hasTemplate(lessonId: string) {
  return !!findLesson(lessonId)?.lesson.template;
}

/** Three warm-up questions on a 0–10 number line: before n, after n, before m. */
export function warmupQuestions(min: number, max: number, rng: (k: number) => number = randomInt): WarmupQuestion[] {
  const pick = () => min + 1 + rng(max - min - 1); // strictly inside, so before/after exist
  const a = pick();
  let b = pick();
  if (b === a) b = a === max - 1 ? a - 1 : a + 1;
  return [
    { dir: "before", n: a },
    { dir: "after", n: a },
    { dir: rng(2) ? "before" : "after", n: b },
  ];
}

export function warmupAnswer(q: WarmupQuestion) {
  return q.dir === "before" ? q.n - 1 : q.n + 1;
}

export function warmupPrompt(q: WarmupQuestion, fmt: (n: number) => string = String) {
  return q.dir === "before" ? `ما العدد الذي يأتي قبل ${fmt(q.n)}؟` : `ما العدد الذي يأتي بعد ${fmt(q.n)}؟`;
}

/** Five closing-challenge questions with a mix of skills, all three-wagon trains. */
export function challengeQuestions(min: number, max: number, exclude?: Set<string>): TrainQuestion[] {
  const kinds: ("prev" | "next" | "missing")[] = ["prev", "next", "missing", "prev", "next"];
  const s: TrainSettings = { mode: "prev", min, max, count: 1, difficulty: "easy", learning: false };
  const used = new Set(exclude ?? []);
  return kinds.map((k) => {
    const [q] = generateTrainQuestions({ ...s, mode: k }, { exclude: used });
    used.add(q.key);
    return q;
  });
}

/** Rebuilds a 3-wagon question from its kind and the number it asks about (used by the editor). */
export function buildTrainQuestion(kind: "prev" | "next" | "missing", n: number): TrainQuestion {
  // prev: [?, n, n+1]  next: [n-1, n, ?]  missing: [n-1, ?, n+1]
  const start = kind === "prev" ? n - 1 : n - 1;
  const sequence = [start, start + 1, start + 2];
  const missing = kind === "prev" ? [0] : kind === "next" ? [2] : [1];
  const cars = sequence.map((v, i) => (missing.includes(i) ? null : v));
  return { key: `${kind}:${sequence.join(",")}:${missing.join(",")}`, kind, cars, sequence, missing, target: kind === "missing" ? undefined : n };
}

/** The number a 3-wagon question is "about" (what the editor shows). */
export function questionAnchor(q: TrainQuestion) {
  return q.kind === "missing" ? q.sequence[1] : q.target!;
}

export function isValidTrainQuestion(q: TrainQuestion, min: number, max: number) {
  return (
    q.sequence.every((v, i) => v >= min && v <= max && (i === 0 || v - q.sequence[i - 1] === 1)) &&
    q.missing.length > 0 &&
    q.cars.every((c, i) => (q.missing.includes(i) ? c === null : c === q.sequence[i]))
  );
}

/** Multiple-choice form of a train question, so any choice game can use it. */
export function trainToPlayable(q: TrainQuestion, min: number, max: number, fmt: (n: number) => string = String): PlayableQuestion {
  const answer = q.sequence[q.missing[0]];
  const opts = new Set([answer]);
  for (const d of shuffle([1, -1, 2, -2, 3])) {
    const v = answer + d;
    if (v >= min && v <= max && !q.cars.includes(v)) opts.add(v);
    if (opts.size === 4) break;
  }
  const choices = shuffle([...opts]).map(String);
  const strip = q.cars.map((c) => (c === null ? "؟" : fmt(c))).join(" ، ");
  return { id: q.key, prompt: `${trainPrompt(q, fmt)}  [ ${strip} ]`, choices, correctIndex: choices.indexOf(String(answer)) };
}

export function prepareLesson(lessonId: string, titleOverrides: Record<string, string> = {}): LessonPlan | null {
  const ref = findLesson(lessonId);
  if (!ref || ref.lesson.template !== "prev-next") return null;
  const title = lessonTitle(ref.lesson, titleOverrides);

  const warmup: WarmupSegment = {
    kind: "warmup",
    title: "خط الأعداد: قبل وبعد",
    minutes: 3,
    activity: { type: "numberLine", min: 0, max: 10, questions: warmupQuestions(0, 10) },
  };
  const challenge: ChallengeSegment = {
    kind: "challenge",
    title: "تحدي الأبطال",
    minutes: 5,
    mode: "class",
    teams: [0, 1].map((i) => ({ name: DEFAULT_TEAM_NAMES[i], color: TEAM_COLORS[i] })),
    timer: 0,
    range: { min: 0, max: 20 },
    questions: challengeQuestions(0, 20),
  };
  const main: MainSegment = {
    kind: "main",
    title: "قطار الأرقام السحري",
    minutes: 7,
    game: { type: "train", points: 10, train: { mode: "mix", min: 0, max: 10, count: 6, difficulty: "easy", learning: true } },
  };
  const now = Date.now();
  return {
    id: uid("ls_"),
    title: `حصة: ${title.replace(/[ً-ْ]/g, "")}`,
    lessonId,
    lessonTitle: title,
    unitTitle: ref.unit.title,
    semester: ref.unit.semester,
    grade: ref.book.grade,
    subject: ref.book.subject,
    objectives: [
      "أن يحدّد الطالب العدد السابق لعدد معطى.",
      "أن يحدّد الطالب العدد التالي لعدد معطى.",
      "أن يكمل الطالب العدد الناقص بين عددين متتاليين.",
    ],
    template: "prev-next",
    segments: [warmup, main, challenge],
    createdAt: now,
    updatedAt: now,
  };
}

export function totalMinutes(plan: LessonPlan) {
  return plan.segments.reduce((a, s) => a + s.minutes, 0);
}

/** Main-game questions for a run, never repeating the closing challenge. */
export function mainQuestions(plan: LessonPlan) {
  const main = plan.segments[1];
  const exclude = new Set(plan.segments[2].questions.map((q) => q.key));
  return generateTrainQuestions(main.game.train, { exclude });
}

export function validatePlan(plan: LessonPlan): string[] {
  const errs: string[] = [];
  for (const s of plan.segments) if (!(s.minutes >= 1 && s.minutes <= 30)) errs.push(`مدة «${s.title}» يجب أن تكون بين ١ و٣٠ دقيقة.`);
  const w = plan.segments[0].activity;
  w.questions.forEach((q, i) => {
    const a = warmupAnswer(q);
    if (a < w.min || a > w.max || q.n < w.min || q.n > w.max) errs.push(`سؤال التمهيد ${i + 1} يخرج عن خط الأعداد.`);
  });
  const c = plan.segments[2];
  if (c.questions.length === 0) errs.push("أضف سؤالًا واحدًا على الأقل في التحدي الختامي.");
  c.questions.forEach((q, i) => {
    if (!isValidTrainQuestion(q, c.range.min, c.range.max)) errs.push(`سؤال التحدي ${i + 1} يخرج عن النطاق.`);
  });
  return errs;
}

export function duplicatePlan(plan: LessonPlan): LessonPlan {
  const now = Date.now();
  return { ...structuredClone(plan), id: uid("ls_"), title: `${plan.title} (نسخة)`, createdAt: now, updatedAt: now };
}
