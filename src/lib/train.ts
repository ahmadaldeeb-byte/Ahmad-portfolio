import { randomInt, shuffle } from "./utils";

/**
 * Question generator for «قطار الأرقام السحري» (previous / next / missing number).
 * Every number it produces stays inside [min, max]; a previous or next number
 * is never asked for when it would fall outside the chosen range.
 */
export type TrainKind = "prev" | "next" | "missing" | "challenge";
export type TrainMode = "prev" | "next" | "missing" | "mix";
export type TrainDifficulty = "easy" | "medium" | "advanced";

export interface TrainSettings {
  mode: TrainMode;
  min: number;
  max: number;
  count: number;
  difficulty: TrainDifficulty;
  /** Learning mode: wrong answers cost nothing and can be retried. */
  learning: boolean;
}

export interface TrainQuestion {
  key: string;
  kind: TrainKind;
  /** Wagon numbers in reading order; null marks a missing number. */
  cars: (number | null)[];
  /** The full correct sequence. */
  sequence: number[];
  /** Indexes of the missing cars, in reading order. */
  missing: number[];
  /** The number the question is about (prev/next). */
  target?: number;
}

export const TRAIN_DEFAULTS: TrainSettings = { mode: "mix", min: 0, max: 10, count: 8, difficulty: "easy", learning: true };

export const STATION_NAMES: Record<TrainKind, string> = {
  prev: "محطة السابق",
  next: "محطة التالي",
  missing: "محطة العدد الناقص",
  challenge: "تحدي الأبطال",
};

/** Number of wagons for a question kind at a difficulty. */
export function carCount(kind: TrainKind, difficulty: TrainDifficulty) {
  if (kind === "challenge") return 5;
  return difficulty === "easy" ? 3 : difficulty === "medium" ? 4 : 5;
}

/** Smallest range span (max - min) that can host every kind the settings ask for. */
export function minSpan(s: Pick<TrainSettings, "mode" | "difficulty">) {
  const kinds = kindsFor(s.mode, s.difficulty);
  return Math.max(...kinds.map((k) => carCount(k, s.difficulty) - 1));
}

export function kindsFor(mode: TrainMode, difficulty: TrainDifficulty): TrainKind[] {
  if (mode === "mix") return difficulty === "easy" ? ["prev", "next", "missing"] : ["prev", "next", "missing", "challenge"];
  return [mode];
}

export function validateTrainSettings(s: TrainSettings): string[] {
  const errs: string[] = [];
  if (!Number.isInteger(s.min) || !Number.isInteger(s.max)) errs.push("حدود النطاق يجب أن تكون أعدادًا صحيحة.");
  if (s.min < 0 || s.max > 999) errs.push("النطاق المسموح من ٠ إلى ٩٩٩.");
  if (s.max - s.min < minSpan(s)) errs.push(`النطاق ضيق جدًا: يحتاج هذا المستوى إلى ${minSpan(s) + 1} أعداد متتالية على الأقل.`);
  if (!Number.isInteger(s.count) || s.count < 1 || s.count > 50) errs.push("عدد الأسئلة يجب أن يكون بين ١ و٥٠.");
  return errs;
}

/** Splits `count` questions across the station kinds in order (prev → next → missing → challenge). */
export function plannedKinds(s: TrainSettings): TrainKind[] {
  const kinds = kindsFor(s.mode, s.difficulty);
  const out: TrainKind[] = [];
  kinds.forEach((k, i) => {
    const share = Math.floor(s.count / kinds.length) + (i < s.count % kinds.length ? 1 : 0);
    for (let j = 0; j < share; j++) out.push(k);
  });
  return out;
}

function build(kind: TrainKind, start: number, n: number, rng: (k: number) => number): TrainQuestion {
  const sequence = Array.from({ length: n }, (_, i) => start + i);
  let missing: number[];
  let target: number | undefined;
  if (kind === "prev") {
    // [?] [t] [t+1] ... : the first car is missing and asks for the number before t.
    missing = [0];
    target = sequence[1];
  } else if (kind === "next") {
    missing = [n - 1];
    target = sequence[n - 2];
  } else if (kind === "missing") {
    missing = [1 + rng(n - 2)]; // never the first or last car
  } else {
    missing = n >= 5 ? [1, 3] : [1];
  }
  const cars = sequence.map((v, i) => (missing.includes(i) ? null : v));
  return { key: `${kind}:${sequence.join(",")}:${missing.join(",")}`, kind, cars, sequence, missing, target };
}

/**
 * Generates the questions. `exclude` holds keys that must not be reused
 * (e.g. the lesson's closing challenge). Repeats are only allowed once every
 * distinct question in the range has been used.
 */
export function generateTrainQuestions(s: TrainSettings, opts: { exclude?: Set<string>; rng?: (k: number) => number } = {}): TrainQuestion[] {
  const rng = opts.rng ?? randomInt;
  const used = new Set(opts.exclude ?? []);
  return plannedKinds(s).map((kind) => {
    const n = carCount(kind, s.difficulty);
    const starts = Array.from({ length: s.max - s.min - (n - 1) + 1 }, (_, i) => s.min + i);
    if (starts.length === 0) throw new Error("range too small");
    for (const start of shuffle(starts)) {
      const q = build(kind, start, n, rng);
      if (!used.has(q.key)) {
        used.add(q.key);
        return q;
      }
    }
    return build(kind, starts[rng(starts.length)], n, rng);
  });
}

/** Answer tiles: the correct numbers plus nearby distractors, all inside the range. */
export function answerTiles(q: TrainQuestion, s: Pick<TrainSettings, "min" | "max">, total = 4): number[] {
  const correct = q.missing.map((i) => q.sequence[i]);
  const set = new Set(correct);
  const near = shuffle([1, -1, 2, -2, 10, -10, 3, -3]);
  for (const base of correct)
    for (const d of near) {
      if (set.size >= Math.max(total, correct.length + 2)) break;
      const v = base + d;
      if (v >= s.min && v <= s.max && !q.cars.includes(v)) set.add(v);
    }
  let v = s.min;
  while (set.size < Math.min(total, s.max - s.min + 1) && v <= s.max) {
    if (!q.cars.includes(v)) set.add(v);
    v++;
  }
  return shuffle([...set]);
}

/** Spoken/written question in Arabic. */
export function trainPrompt(q: TrainQuestion, fmt: (n: number) => string = String): string {
  if (q.kind === "prev") return `ما العدد السابق للعدد ${fmt(q.target!)}؟`;
  if (q.kind === "next") return `ما العدد التالي للعدد ${fmt(q.target!)}؟`;
  if (q.kind === "missing") return "ما العدد الناقص؟";
  return "أكمل الأعداد الناقصة في القطار!";
}

/** A hint that explains the idea without giving the answer away. */
export function trainHint(q: TrainQuestion): string {
  if (q.kind === "prev") return "العدد السابق أقل من العدد بواحد. عدّ خطوة واحدة إلى الخلف.";
  if (q.kind === "next") return "العدد التالي أكبر من العدد بواحد. عدّ خطوة واحدة إلى الأمام.";
  return "الأعداد في القطار متتالية: كل عربة تزيد واحدًا على العربة التي قبلها.";
}
