import type { PlayableQuestion } from "../questions";
import { shuffle } from "../utils";
import { numberChoices, pick, rand, unique, type Counted, type MathGrade, type MathLevel } from "./common";

/*
 * Every generator takes (level, count, grade). Grade 1 keeps the original
 * tasks; grades 2 and 3 get larger numbers and new task kinds. The grade 2–3
 * levels are suggestions for practice, not matched to an official book.
 */

/* ---------- 1. جزيرة الأرقام: counting ---------- */
export const FRUITS: (Counted & { emoji: string })[] = [
  { emoji: "🍎", one: "تفاحة", two: "تفاحتين", few: "تفاحات", many: "تفاحة" },
  { emoji: "🍌", one: "موزة", two: "موزتين", few: "موزات", many: "موزة" },
  { emoji: "🍊", one: "برتقالة", two: "برتقالتين", few: "برتقالات", many: "برتقالة" },
  { emoji: "🍓", one: "فراولة", two: "فراولتين", few: "فراولات", many: "فراولة" },
];
/** Grades 2–3: the target is given as equal groups (a groups of b), a product (a × b) or a share (a shared among b). */
export interface IslandOp { kind: "groups" | "times" | "share"; a: number; b: number }
export interface IslandTask { key: string; target: number; fruit: number; onIsland: number; op?: IslandOp }
export function islandTasks(level: MathLevel, count: number, grade: MathGrade = 1): IslandTask[] {
  if (grade > 1) {
    return unique(count, () => {
      const fruit = rand(0, FRUITS.length - 1);
      let op: IslandOp;
      let target: number;
      if (grade === 3 && level === 3) {
        const baskets = rand(2, 4);
        target = rand(2, Math.floor(24 / baskets));
        op = { kind: "share", a: target * baskets, b: baskets };
      } else {
        const sizes = grade === 2 ? (level === 1 ? [2] : level === 2 ? [5, 10] : [2, 3, 4, 5, 10]) : level === 1 ? [2, 3] : [4, 5, 6];
        const b = pick(sizes);
        const a = rand(2, Math.min(6, Math.floor(24 / b)));
        target = a * b;
        op = { kind: grade === 2 ? "groups" : "times", a, b };
      }
      return { key: `${op.kind}:${op.a}:${op.b}`, target, fruit, op, onIsland: Math.min(24, target + rand(2, 5)) };
    });
  }
  const max = level === 1 ? 10 : 20;
  const min = level === 3 ? 11 : 1;
  return unique(count, () => {
    const target = rand(min, max);
    const fruit = rand(0, FRUITS.length - 1);
    return { key: `${target}`, target, fruit, onIsland: Math.min(24, target + rand(2, 5)) };
  });
}

/* ---------- 2. التمساح الجائع: comparing ---------- */
export type CompareMode = "group" | "symbol" | "number" | "expr";
/** In "expr" tasks a side may be a sum (its terms are shown instead of the number). */
export interface CrocTask { key: string; a: number; b: number; mode: CompareMode; ask: "bigger" | "smaller"; aTerms?: number[]; bTerms?: number[] }
export const compareSymbol = (a: number, b: number) => (a > b ? ">" : a < b ? "<" : "=");
function split(n: number): number[] {
  const x = rand(Math.max(1, Math.floor(n / 5)), n - 1);
  return [x, n - x];
}
export function crocTasks(level: MathLevel, count: number, grade: MathGrade = 1): CrocTask[] {
  if (grade > 1) {
    return unique(count, (i) => {
      if (level === 3) {
        const max = grade === 2 ? 100 : 1000;
        const a = rand(Math.floor(max / 5), max);
        const r = rand(1, 5);
        const b = r === 1 ? a : Math.max(2, Math.min(max, a + pick([-1, 1, -2, 2, -10, 10, -5, 5]) * (grade === 2 ? 1 : 10)));
        const aTerms = split(a);
        const bTerms = i % 2 ? split(b) : undefined;
        return { key: `expr:${aTerms.join("+")}:${b}`, a, b, aTerms, bTerms, mode: "expr", ask: "bigger" };
      }
      const max = grade === 2 ? (level === 1 ? 99 : 999) : level === 1 ? 999 : 9999;
      const a = rand(Math.floor(max / 10), max);
      // Close numbers (same leading digits) make the comparison worth thinking about.
      const b = rand(1, 6) === 1 ? a : Math.max(0, Math.min(max, a + pick([1, -1, 9, -9, 10, -10, 90, -90, 100, -100, 900, -900].filter((d) => Math.abs(d) * 10 <= max))));
      return { key: `number:${a}:${b}`, a, b, mode: "number", ask: "bigger" };
    });
  }
  return unique(count, (i) => {
    const mode: CompareMode = level === 1 ? "group" : level === 2 ? (i % 2 ? "symbol" : "group") : "number";
    const max = mode === "number" ? 99 : 10;
    const a = rand(mode === "number" ? 0 : 1, max);
    // Groups always differ; symbol tasks sometimes compare equal numbers.
    let b = mode !== "group" && rand(1, 5) === 1 ? a : rand(mode === "number" ? 0 : 1, max);
    while (mode === "group" && b === a) b = rand(1, max);
    return { key: `${mode}:${a}:${b}`, a, b, mode, ask: pick(["bigger", "smaller"] as const) };
  });
}

/* ---------- 3. صاروخ الجمع: addition ---------- */
export interface AddTask { key: string; terms: number[]; answer: number; choices: number[] }
function addTerms(level: MathLevel, grade: MathGrade): number[] {
  if (grade === 2) {
    if (level === 1) {
      const a = rand(1, 8) * 10 + rand(2, 9);
      return [a, rand(10 - (a % 10), Math.min(9, 99 - a))]; // two-digit + one-digit with regrouping
    }
    if (level === 2) {
      const a = rand(11, 79);
      return [a, rand(11, 99 - a)];
    }
    const a = rand(100, 800);
    return [a, rand(100, 999 - a)];
  }
  if (level === 1) {
    const a = rand(1, 7) * 100 + rand(1, 9) * 10 + rand(5, 9);
    return [a, rand(1, 8 - Math.floor(a / 100)) * 100 + rand(0, 9) * 10 + rand(10 - (a % 10), 9)]; // regrouping in the ones
  }
  if (level === 2) {
    const a = rand(1000, 8000);
    return [a, rand(100, 9999 - a)];
  }
  const a = rand(10, 400);
  const b = rand(10, 400);
  return [a, b, rand(10, 999 - a - b)];
}
export function rocketTasks(level: MathLevel, count: number, grade: MathGrade = 1): AddTask[] {
  if (grade > 1)
    return unique(count, () => {
      const terms = addTerms(level, grade);
      const answer = terms.reduce((x, y) => x + y, 0);
      return { key: terms.join("+"), terms, answer, choices: numberChoices(answer, 0, 99999) };
    });
  const max = level === 1 ? 10 : 20;
  return unique(count, () => {
    let terms: number[];
    if (level === 3) {
      const a = rand(1, 9);
      const b = rand(1, 9);
      terms = [a, b, rand(1, Math.max(1, 20 - a - b))];
    } else {
      const a = rand(0, max - 1);
      terms = [a, rand(1, max - a)];
    }
    const answer = terms.reduce((x, y) => x + y, 0);
    return { key: terms.join("+"), terms, answer, choices: numberChoices(answer, 0, 20) };
  });
}

/* ---------- 4. سلة التفاح: subtraction by taking away ---------- */
/** `share` set: share the apples equally among `share` baskets (division) instead of taking some away. */
export interface AppleTask { key: string; total: number; take: number; answer: number; choices: number[]; share?: number }
export function appleTasks(level: MathLevel, count: number, grade: MathGrade = 1): AppleTask[] {
  if (grade > 1 && !(grade === 2 && level === 1)) {
    const sizes = grade === 2 ? (level === 2 ? [2] : [2, 3, 4, 5]) : level === 1 ? [2, 3] : level === 2 ? [4, 5] : [2, 3, 4, 5, 6];
    return unique(count, () => {
      const share = pick(sizes);
      const each = rand(2, Math.floor(24 / share));
      const total = share * each;
      return { key: `${total}/${share}`, total, take: 0, share, answer: each, choices: numberChoices(each, 1, 12) };
    });
  }
  if (grade === 2) level = 3; // grade 2, level 1: taking away within 20
  const maxTotal = level === 1 ? 10 : level === 2 ? 15 : 20;
  return unique(count, () => {
    const total = rand(3, maxTotal);
    const take = rand(1, total - 1);
    return { key: `${total}-${take}`, total, take, answer: total - take, choices: numberChoices(total - take, 0, maxTotal) };
  });
}

/* ---------- 5. مصنع الأعداد: tens and ones ---------- */
/** `places`: the place values in play, largest first (e.g. [100, 10, 1]). */
export interface FactoryTask { key: string; target: number; mode: "build" | "read"; choices: number[]; places: number[] }
export const PLACE_NAMES: Record<number, string> = { 1000: "آلاف", 100: "مئات", 10: "عشرات", 1: "آحاد" };
export function factoryTasks(level: MathLevel, count: number, grade: MathGrade = 1): FactoryTask[] {
  if (grade > 1) {
    const [min, max, step] = (grade === 2 ? [[11, 99, 1], [110, 990, 10], [101, 999, 1]] : [[101, 999, 1], [1100, 9900, 100], [1001, 9999, 1]])[level - 1];
    const places = max > 999 ? [1000, 100, 10, 1] : max > 99 ? [100, 10, 1] : [10, 1];
    return unique(count, (i) => {
      const target = rand(min / step, max / step) * step;
      const mode = i % 2 ? "read" : "build";
      const digits = String(target).split("");
      const opts = new Set([target]);
      const reversed = Number([...digits].reverse().join(""));
      if (reversed !== target && reversed >= min && reversed <= max && String(reversed).length === digits.length) opts.add(reversed);
      for (const d of shuffle(places.flatMap((p) => [p, -p]))) if (opts.size < 4 && target + d >= min && target + d <= max) opts.add(target + d);
      return { key: `${mode}:${target}`, target, mode, places, choices: shuffle([...opts]) };
    });
  }
  return unique(count, (i) => {
    const target = level === 1 ? rand(1, 9) * 10 : level === 2 ? rand(11, 50) : rand(11, 99);
    const mode = level === 1 ? "build" : i % 2 ? "read" : "build";
    // «read» distractors swap or nudge digits (e.g. 24 vs 42).
    const swapped = (target % 10) * 10 + Math.floor(target / 10);
    const opts = new Set([target]);
    if (swapped !== target && swapped >= 1 && swapped <= 99) opts.add(swapped);
    for (const d of shuffle([10, -10, 1, -1])) if (opts.size < 4 && target + d >= 1 && target + d <= 99) opts.add(target + d);
    return { key: `${mode}:${target}`, target, mode, places: [10, 1], choices: shuffle([...opts]) };
  });
}

/* ---------- 6. سباق الجمع: two-digit addition (no regrouping) ---------- */
function raceTerms(level: MathLevel, grade: MathGrade): [number, number] {
  if (grade === 2) {
    if (level === 1) {
      const a = rand(11, 79);
      const b = rand(Math.max(11, 10 - (a % 10) + 10), 99 - a); // two-digit + two-digit, usually with regrouping
      return [a, Math.max(1, b)];
    }
    if (level === 2) {
      const a = rand(1, 8) * 100 + rand(0, 8) * 10 + rand(0, 8);
      return [a, rand(1, 9 - Math.floor((a % 100) / 10)) * 10 + rand(0, 9 - (a % 10))]; // three-digit + two-digit, no regrouping
    }
    const a = rand(100, 800);
    return [a, rand(100, 999 - a)];
  }
  if (level === 1) {
    const a = rand(100, 800);
    return [a, rand(100, 999 - a)];
  }
  if (level === 2) {
    const a = rand(1000, 8999);
    return [a, rand(100, 999)];
  }
  const a = rand(1000, 7999);
  return [a, rand(1000, 9999 - a)];
}
export function raceAddQuestions(level: MathLevel, count = 80, grade: MathGrade = 1): PlayableQuestion[] {
  if (grade > 1)
    return Array.from({ length: count }, (_, i) => {
      const [a, b] = raceTerms(level, grade);
      const answer = a + b;
      const choices = numberChoices(answer, 0, 99999).map(String);
      return { id: `ra${i}:${a}+${b}`, prompt: `${a} + ${b} = ؟`, choices, correctIndex: choices.indexOf(String(answer)), difficulty: level };
    });
  return Array.from({ length: count }, (_, i) => {
    const kind = level === 1 ? 1 : level === 2 ? 1 + (i % 2) : 1 + (i % 3);
    let a: number;
    let b: number;
    if (kind === 1) {
      a = rand(1, 8) * 10;
      b = rand(1, 9 - a / 10) * 10; // tens + tens
    } else if (kind === 2) {
      a = rand(1, 8) * 10 + rand(0, 8);
      b = rand(1, 9 - (a % 10)); // two-digit + one-digit, no regrouping
    } else {
      const at = rand(1, 7);
      const ao = rand(0, 8);
      a = at * 10 + ao;
      b = rand(1, 9 - at) * 10 + rand(0, 9 - ao);
    }
    const answer = a + b;
    const choices = numberChoices(answer, 0, 99).map(String);
    return { id: `ra${i}:${a}+${b}`, prompt: `${a} + ${b} = ؟`, choices, correctIndex: choices.indexOf(String(answer)), difficulty: kind };
  });
}

/* ---------- 7. كنز القراصنة: subtraction doors ---------- */
export interface SubTask { key: string; a: number; b: number; answer: number; choices: number[] }
function subTerms(level: MathLevel, grade: MathGrade, i: number): [number, number] {
  if (grade === 2) {
    if (level === 1) {
      const a = rand(2, 9) * 10 + rand(0, 7);
      return [a, rand((a % 10) + 1, 9)]; // two-digit − one-digit with borrowing
    }
    if (level === 2) {
      const a = rand(3, 9) * 10 + rand(0, 7);
      return [a, rand(1, Math.floor(a / 10) - 1) * 10 + rand((a % 10) + 1, 9)];
    }
    const a = rand(200, 999);
    return [a, rand(100, a - 1)];
  }
  if (level === 1) {
    const a = rand(2, 9) * 100 + rand(0, 9) * 10 + rand(0, 7);
    return [a, rand(1, Math.floor(a / 100) - 1) * 100 + rand(0, 9) * 10 + rand((a % 10) + 1, 9)];
  }
  if (level === 2) {
    const a = rand(1500, 9999);
    return [a, rand(100, a - 1000)];
  }
  // Borrowing across zeros: 400 − 127, 3005 − 1248...
  const a = i % 2 ? rand(2, 9) * 100 : rand(2, 9) * 1000 + rand(0, 9);
  return [a, rand(Math.floor(a / 10), a - 1)];
}
export function pirateTasks(level: MathLevel, count: number, grade: MathGrade = 1): SubTask[] {
  if (grade > 1)
    return unique(count, (i) => {
      const [a, b] = subTerms(level, grade, i);
      return { key: `${a}-${b}`, a, b, answer: a - b, choices: numberChoices(a - b, 0, 99999) };
    });
  return unique(count, (i) => {
    let a: number;
    let b: number;
    if (level === 1) {
      a = rand(2, 10);
      b = rand(1, a);
    } else if (level === 2) {
      a = rand(10, 20);
      b = rand(1, a - 1);
    } else if (i % 2) {
      a = rand(2, 9) * 10;
      b = rand(1, a / 10 - 1) * 10; // tens − tens
    } else {
      const at = rand(2, 9);
      const ao = rand(1, 9);
      a = at * 10 + ao;
      b = rand(1, at - 1) * 10 + rand(0, ao); // two-digit, no borrowing
    }
    const answer = a - b;
    return { key: `${a}-${b}`, a, b, answer, choices: numberChoices(answer, 0, 99) };
  });
}

/* ---------- 8. مدينة الأشكال: geometry ---------- */
export type Solid = "cube" | "cylinder" | "cone" | "sphere";
export type Plane = "square" | "rectangle" | "triangle" | "circle" | "pentagon" | "hexagon";
export const SOLID_NAMES: Record<Solid, string> = { cube: "مكعب", cylinder: "أسطوانة", cone: "مخروط", sphere: "كرة" };
export const PLANE_NAMES: Record<Plane, string> = { square: "مربع", rectangle: "مستطيل", triangle: "مثلث", circle: "دائرة", pentagon: "شكل خماسي", hexagon: "شكل سداسي" };
export const PLANE_SIDES: Record<Plane, number> = { square: 4, rectangle: 4, triangle: 3, circle: 0, pentagon: 5, hexagon: 6 };
export type SolidProp = "faces" | "edges" | "vertices" | "bases";
/** Facts about solids asked in grades 2–3 (the cube's faces/edges/vertices, the cone's apex...). */
export const SOLID_FACTS: { solid: Solid; prop: SolidProp; answer: number; text: string }[] = [
  { solid: "cube", prop: "faces", answer: 6, text: "كم وجهًا للمكعب؟" },
  { solid: "cube", prop: "edges", answer: 12, text: "كم حرفًا للمكعب؟" },
  { solid: "cube", prop: "vertices", answer: 8, text: "كم رأسًا للمكعب؟" },
  { solid: "cone", prop: "vertices", answer: 1, text: "كم رأسًا للمخروط؟" },
  { solid: "cylinder", prop: "bases", answer: 2, text: "كم قاعدة دائرية للأسطوانة؟" },
  { solid: "cone", prop: "bases", answer: 1, text: "كم قاعدة دائرية للمخروط؟" },
];
export const SOLID_OBJECTS: Record<Solid, { emoji: string; name: string }[]> = {
  cube: [{ emoji: "🎲", name: "حجر النرد" }, { emoji: "🧊", name: "مكعب الثلج" }],
  cylinder: [{ emoji: "🥫", name: "علبة العصير" }, { emoji: "🔋", name: "البطارية" }],
  cone: [{ emoji: "🍦", name: "قمع البوظة" }, { emoji: "🎉", name: "قبعة الحفلة" }],
  sphere: [{ emoji: "⚽", name: "كرة القدم" }, { emoji: "🌍", name: "الكرة الأرضية" }],
};
export type ShapeTask =
  | { key: string; kind: "solid-name"; solid: Solid; choices: string[]; answer: string }
  | { key: string; kind: "object-solid"; solid: Solid; object: { emoji: string; name: string }; choices: string[]; answer: string }
  | { key: string; kind: "plane-name"; plane: Plane; choices: string[]; answer: string }
  | { key: string; kind: "sides"; plane: Plane; corners: boolean; choices: string[]; answer: string }
  | { key: string; kind: "pattern"; seq: Plane[]; choices: string[]; answer: string }
  | { key: string; kind: "build"; part: Plane; choices: string[]; answer: string }
  | { key: string; kind: "solid-props"; solid: Solid; text: string; choices: string[]; answer: string }
  | { key: string; kind: "perimeter"; w: number; h: number; choices: string[]; answer: string };
const SOLIDS: Solid[] = ["cube", "cylinder", "cone", "sphere"];
const PLANES: Plane[] = ["square", "rectangle", "triangle", "circle"];
const POLYGONS: Plane[] = ["triangle", "square", "rectangle", "pentagon", "hexagon"];
const SHAPE_KINDS: Record<MathGrade, ShapeTask["kind"][][]> = {
  1: [["solid-name", "plane-name", "object-solid"], ["solid-name", "plane-name", "sides", "object-solid"], ["sides", "pattern", "build", "object-solid", "solid-name"]],
  2: [["sides", "plane-name"], ["solid-props", "solid-name", "object-solid"], ["pattern", "build", "sides", "solid-props"]],
  3: [["sides", "solid-props"], ["perimeter"], ["perimeter", "solid-props", "pattern"]],
};
export function shapeTasks(level: MathLevel, count: number, grade: MathGrade = 1): ShapeTask[] {
  const kinds = SHAPE_KINDS[grade][level - 1];
  const polygons = grade > 1;
  return unique(count, (i) => {
    const kind = kinds[i % kinds.length];
    if (kind === "solid-props") {
      const f = pick(SOLID_FACTS);
      return { key: `${kind}:${f.text}`, kind, solid: f.solid, text: f.text, choices: numberChoices(f.answer, 0, 12).map(String), answer: String(f.answer) };
    }
    if (kind === "perimeter") {
      const square = rand(0, 2) === 0;
      const w = rand(2, 9);
      let h = square ? w : rand(2, 9);
      if (!square && h === w) h = w + 1;
      const answer = 2 * (w + h);
      return { key: `${kind}:${w}x${h}`, kind, w, h, choices: numberChoices(answer, 4, 60).map(String), answer: String(answer) };
    }
    if (polygons && kind === "plane-name") {
      const plane = pick([...POLYGONS, "circle"] as Plane[]);
      const others = shuffle([...POLYGONS, "circle"].filter((p) => p !== plane) as Plane[]).slice(0, 3);
      return { key: `${kind}:${plane}`, kind, plane, choices: shuffle([plane, ...others].map((p) => PLANE_NAMES[p])), answer: PLANE_NAMES[plane] };
    }
    if (polygons && kind === "sides") {
      const plane = pick(POLYGONS);
      const corners = rand(0, 1) === 1;
      return { key: `${kind}:${plane}:${corners}`, kind, plane, corners, choices: ["3", "4", "5", "6"], answer: String(PLANE_SIDES[plane]) };
    }
    if (kind === "solid-name" || kind === "object-solid") {
      const solid = pick(SOLIDS);
      const choices = shuffle(SOLIDS.map((s) => SOLID_NAMES[s]));
      if (kind === "solid-name") return { key: `${kind}:${solid}`, kind, solid, choices, answer: SOLID_NAMES[solid] };
      const object = pick(SOLID_OBJECTS[solid]);
      return { key: `${kind}:${object.emoji}`, kind, solid, object, choices, answer: SOLID_NAMES[solid] };
    }
    if (kind === "plane-name") {
      const plane = pick(PLANES);
      return { key: `${kind}:${plane}`, kind, plane, choices: shuffle(PLANES.map((p) => PLANE_NAMES[p])), answer: PLANE_NAMES[plane] };
    }
    if (kind === "sides") {
      const plane = pick(["square", "rectangle", "triangle"] as const);
      const corners = rand(0, 1) === 1; // vertices of a polygon = its sides
      return { key: `${kind}:${plane}:${corners}`, kind, plane, corners, choices: ["3", "4", "5", "0"], answer: String(PLANE_SIDES[plane]) };
    }
    if (kind === "pattern") {
      const [x, y] = shuffle(PLANES).slice(0, 2);
      const unit = rand(0, 1) ? [x, y] : [x, x, y];
      const seq = Array.from({ length: unit.length * 2 + 1 }, (_, k) => unit[k % unit.length]);
      const answer = unit[(unit.length * 2 + 1) % unit.length];
      return { key: `${kind}:${seq.join(",")}`, kind, seq, choices: shuffle(PLANES.map((p) => PLANE_NAMES[p])), answer: PLANE_NAMES[answer] };
    }
    const part = pick(["triangle", "rectangle", "circle", "square"] as const);
    return { key: `${kind}:${part}`, kind: "build", part, choices: shuffle(PLANES.map((p) => PLANE_NAMES[p])), answer: PLANE_NAMES[part] };
  });
}

/* ---------- 9. مطعم البيتزا: halves and quarters ---------- */
export type FractionOrder = "half" | "third" | "quarter";
/** Fractions in grade 3 tasks are written "num/den" (e.g. "3/4"). */
export type PizzaTask =
  | { key: string; kind: "equal"; parts: 2 | 3 | 4; equal: boolean; choices: string[]; answer: string }
  | { key: string; kind: "name"; parts: 2 | 3 | 4; equal: boolean; choices: string[]; answer: string }
  | { key: string; kind: "serve"; order: FractionOrder; customer: string; thirds?: boolean }
  | { key: string; kind: "group"; items: number; num: number; den: number; emoji: string; choices: string[]; answer: string }
  | { key: string; kind: "frac"; num: number; den: number; choices: string[]; answer: string }
  | { key: string; kind: "compare"; a: [number, number]; b: [number, number]; choices: string[]; answer: string };
export const FRACTION_NAMES = { half: "نصف", third: "ثلث", quarter: "ربع" } as const;
const CUSTOMERS = ["سارة", "عمر", "ليان", "يوسف", "مريم", "آدم"];
const PIZZA_KINDS: Record<MathGrade, PizzaTask["kind"][][]> = {
  1: [["equal", "name"], ["equal", "name", "serve"], ["name", "serve", "group"]],
  2: [["equal", "name"], ["name", "serve"], ["group", "serve", "name"]],
  3: [["frac"], ["compare", "frac"], ["group", "compare"]],
};
const frac = (n: number, d: number) => `${n}/${d}`;
export function pizzaTasks(level: MathLevel, count: number, grade: MathGrade = 1): PizzaTask[] {
  const kinds = PIZZA_KINDS[grade][level - 1];
  const partsList = (grade === 1 ? [2, 4] : [2, 3, 4]) as (2 | 3 | 4)[];
  return unique(count, (i) => {
    const kind = kinds[i % kinds.length];
    if (kind === "frac") {
      const den = pick([2, 3, 4, 6, 8]);
      const num = rand(1, den - 1);
      const opts = new Set([frac(num, den), frac(den - num, den), frac(num, den + (den < 8 ? 1 : -1)), frac(Math.min(den, num + 1), den)]);
      return { key: `${kind}:${num}/${den}`, kind, num, den, choices: shuffle([...opts]).slice(0, 4), answer: frac(num, den) };
    }
    if (kind === "compare") {
      // Unit fractions (1/2 vs 1/4) or same denominators (2/6 vs 5/6); sometimes equal (1/2 = 2/4).
      const r = rand(1, 5);
      let a: [number, number];
      let b: [number, number];
      if (r === 1) [a, b] = shuffle([[1, 2], [2, 4]] as [number, number][]) as [[number, number], [number, number]];
      else if (r <= 3) {
        const [x, y] = shuffle([2, 3, 4, 6, 8]).slice(0, 2);
        [a, b] = [[1, x], [1, y]];
      } else {
        const den = pick([4, 6, 8]);
        const [x, y] = shuffle(Array.from({ length: den - 1 }, (_, k) => k + 1)).slice(0, 2);
        [a, b] = [[x, den], [y, den]];
      }
      const va = a[0] / a[1];
      const vb = b[0] / b[1];
      const answer = va === vb ? "متساويان" : frac(...(va > vb ? a : b));
      return { key: `${kind}:${frac(...a)}:${frac(...b)}`, kind, a, b, choices: [frac(...a), frac(...b), "متساويان"], answer };
    }
    if (kind === "equal") {
      const parts = pick(partsList);
      const equal = rand(0, 1) === 1;
      return { key: `${kind}:${parts}:${equal}`, kind, parts, equal, choices: ["نعم، متساوية", "لا، غير متساوية"], answer: equal ? "نعم، متساوية" : "لا، غير متساوية" };
    }
    if (kind === "name") {
      const parts = pick(partsList);
      const equal = rand(0, 3) > 0;
      if (grade === 1) {
        const answer = !equal ? "ليس نصفًا ولا ربعًا" : parts === 2 ? "نصف" : "ربع";
        return { key: `${kind}:${parts}:${equal}`, kind, parts, equal, choices: ["نصف", "ربع", "ليس نصفًا ولا ربعًا"], answer };
      }
      const names = { 2: "نصف", 3: "ثلث", 4: "ربع" } as const;
      return { key: `${kind}:${parts}:${equal}`, kind, parts, equal, choices: ["نصف", "ثلث", "ربع", "الأجزاء غير متساوية"], answer: equal ? names[parts] : "الأجزاء غير متساوية" };
    }
    if (kind === "serve") {
      const order = pick(grade === 1 ? (["half", "quarter"] as const) : (["half", "third", "quarter"] as const));
      return { key: `${kind}:${order}:${i}`, kind, order, customer: pick(CUSTOMERS), thirds: grade > 1 };
    }
    const den = grade === 1 ? pick([2, 4]) : grade === 2 ? pick([2, 3, 4]) : pick([2, 3, 4]);
    const num = grade === 3 ? rand(1, den - 1) : 1;
    const items = den * (grade === 1 ? (den === 2 ? pick([1, 2, 3, 4]) : pick([1, 2])) : rand(1, den === 4 ? 3 : 4));
    const answer = (items / den) * num;
    return { key: `${kind}:${num}/${den}:${items}`, kind, items, num, den, emoji: pick(["🍪", "🧁", "🍩"]), choices: shuffle([...new Set([answer, answer + 1, Math.max(1, answer - 1), items])]).map(String), answer: String(answer) };
  });
}

/* ---------- 10. السوق الصغير: Jordanian coins ---------- */
/*
 * Coin denominations in qirsh, from the Central Bank of Jordan's coin list
 * (cbj.gov.jo › المسكوكات): نصف قرش، قرش، قرشان ونصف، خمسة قروش، عشرة قروش،
 * ربع دينار، نصف دينار، دينار. Grade 1 uses whole-qirsh coins only.
 */
export interface Coin { value: number; name: string; shape: "round" | "heptagon"; metal: "copper" | "nickel" | "bimetal" }
export const COINS: Coin[] = [
  { value: 1, name: "قرش", shape: "round", metal: "copper" },
  { value: 5, name: "خمسة قروش", shape: "round", metal: "nickel" },
  { value: 10, name: "عشرة قروش", shape: "round", metal: "nickel" },
  { value: 25, name: "ربع دينار", shape: "heptagon", metal: "copper" },
  { value: 50, name: "نصف دينار", shape: "round", metal: "bimetal" },
  { value: 100, name: "دينار", shape: "round", metal: "copper" },
];
export const PRODUCTS = [
  { emoji: "✏️", name: "قلم رصاص" },
  { emoji: "🍎", name: "تفاحة" },
  { emoji: "🧃", name: "عصير" },
  { emoji: "📒", name: "دفتر" },
  { emoji: "🧸", name: "دبدوب" },
  { emoji: "⚽", name: "كرة" },
  { emoji: "🍌", name: "موز" },
  { emoji: "🖍️", name: "ألوان" },
];
type Product = { emoji: string; name: string };
export type MarketTask =
  | { key: string; kind: "pay"; product: Product; price: number; coins: number[] }
  | { key: string; kind: "equal"; big: number; small: number; choices: string[]; answer: string }
  | { key: string; kind: "change"; product: Product; price: number; paid: number; choices: number[]; answer: number }
  | { key: string; kind: "sum"; products: [Product, Product]; prices: [number, number]; choices: number[]; answer: number };
function moneyChoices(answer: number) {
  const set = new Set([answer]);
  for (const d of shuffle([5, -5, 10, -10, 25, -25, 50, -50])) if (set.size < 4 && answer + d >= 5) set.add(answer + d);
  return shuffle([...set]);
}
function marketTask(level: MathLevel, grade: MathGrade, i: number): MarketTask {
  const product = pick(PRODUCTS);
  const kind = grade === 2 ? (["pay", "pay", "change"] as const)[level === 3 ? i % 3 : 0] : level === 1 ? "pay" : level === 2 ? (i % 2 ? "change" : "pay") : (["sum", "change", "equal", "pay"] as const)[i % 4];
  if (kind === "change") {
    const paid = grade === 2 ? 100 : pick([100, 200]);
    const price = rand(1, paid / 5 - 1) * 5;
    return { key: `change:${paid}:${price}`, kind, product, price, paid, answer: paid - price, choices: moneyChoices(paid - price) };
  }
  if (kind === "sum") {
    const [p1, p2] = shuffle(PRODUCTS).slice(0, 2);
    const prices: [number, number] = [rand(2, 15) * 5, rand(2, 15) * 5];
    const answer = prices[0] + prices[1];
    return { key: `sum:${prices.join("+")}`, kind, products: [p1, p2], prices, answer, choices: moneyChoices(answer) };
  }
  if (kind === "equal") {
    const [big, small] = pick([[100, 25], [100, 50], [100, 10], [50, 10], [50, 5]]);
    const answer = big / small;
    return { key: `equal:${big}:${small}`, kind, big, small, choices: [...new Set([answer, answer + 1, Math.max(1, answer - 1), answer * 2])].map(String), answer: String(answer) };
  }
  const price = grade === 2 ? (level === 1 ? rand(11, 50) : rand(4, 20) * 5) : rand(21, 50) * 5;
  const coins = grade === 2 ? (level === 1 ? [1, 5, 10] : [5, 10, 25, 50]) : [5, 10, 25, 50, 100];
  return { key: `pay:${price}`, kind: "pay", product, price, coins };
}
export function marketTasks(level: MathLevel, count: number, grade: MathGrade = 1): MarketTask[] {
  if (grade > 1) return unique(count, (i) => marketTask(level, grade, i));
  const coinSet = level === 1 ? [1, 5] : level === 2 ? [1, 5, 10] : [5, 10, 25, 50, 100];
  return unique(count, (i) => {
    if (level >= 2 && i % 3 === 2) {
      const [big, small] = pick(level === 2 ? [[5, 1], [10, 1], [10, 5]] : [[25, 5], [50, 25], [100, 25], [100, 50], [50, 10]]);
      const answer = big / small;
      return { key: `equal:${big}:${small}`, kind: "equal", big, small, choices: [...new Set([answer, answer + 1, Math.max(1, answer - 1), answer * 2])].map(String), answer: String(answer) };
    }
    const price = level === 1 ? rand(1, 10) : level === 2 ? rand(6, 30) : pick([25, 30, 50, 60, 75, 100]);
    return { key: `pay:${price}`, kind: "pay", product: pick(PRODUCTS), price, coins: coinSet };
  });
}
export function priceLabel(qirsh: number, fmt: (n: number) => string = String): string {
  if (qirsh > 100) {
    const d = Math.floor(qirsh / 100);
    const rest = qirsh % 100;
    const dinars = d === 1 ? "دينار" : d === 2 ? "ديناران" : `${fmt(d)} دنانير`;
    return rest ? `${dinars} و${rest === 1 ? "قرش واحد" : `${fmt(rest)} ${rest <= 10 ? "قروش" : "قرشًا"}`}` : dinars;
  }
  if (qirsh === 100) return "دينار";
  if (qirsh === 50) return "نصف دينار";
  if (qirsh === 25) return "ربع دينار";
  if (qirsh === 1) return "قرش واحد";
  if (qirsh === 2) return "قرشان";
  return `${fmt(qirsh)} ${qirsh <= 10 ? "قروش" : "قرشًا"}`;
}

/* ---------- 11. ساعة المغامرات: time ---------- */
export const ROUTINE = [
  { text: "يستيقظ فارس", emoji: "⏰" },
  { text: "يذهب فارس إلى المدرسة", emoji: "🎒" },
  { text: "يتناول فارس الغداء", emoji: "🍽️" },
  { text: "يلعب فارس في الحديقة", emoji: "⚽" },
  { text: "يقرأ فارس قصة", emoji: "📖" },
  { text: "ينام فارس", emoji: "🌙" },
];
export interface ClockTask {
  key: string;
  kind: "read" | "set" | "elapsed";
  h: number;
  m: number;
  activity: number;
  choices: string[];
  answer: string;
  /** Elapsed-time tasks: minutes from the shown time to the answer. */
  minutes?: number;
}
export const pad2 = (m: number) => String(m).padStart(2, "0");
export const timeKey = (h: number, m: number) => `${h}:${pad2(m)}`;
/** Minute step for setting the minute hand: 60 = whole hours only. */
export function clockStep(level: MathLevel, grade: MathGrade) {
  if (grade === 1) return level === 3 ? 30 : 60;
  if (grade === 2) return level === 3 ? 5 : 15;
  return level === 1 ? 5 : 1;
}
function addMinutes(h: number, m: number, d: number) {
  const t = ((((h % 12) * 60 + m + d) % 720) + 720) % 720;
  return { h: Math.floor(t / 60) || 12, m: t % 60 };
}
function timeChoices(h: number, m: number, step: number) {
  const opts = new Set([timeKey(h, m)]);
  const swapped = m % 5 === 0 && m > 0 && h <= 12 ? timeKey(m / 5, (h % 12) * 5) : null; // hands read the wrong way round
  if (swapped) opts.add(swapped);
  for (const d of shuffle([60, -60, step, -step, 2 * step, 30, -5, 5].filter((x) => x % step === 0 || x % 60 === 0))) {
    const t = addMinutes(h, m, d);
    opts.add(timeKey(t.h, t.m));
    if (opts.size >= 4) break;
  }
  return shuffle([...opts].slice(0, 4));
}
export function clockTasks(level: MathLevel, count: number, grade: MathGrade = 1): ClockTask[] {
  if (grade > 1) {
    const step = clockStep(level, grade);
    return unique(count, (i) => {
      const h = rand(1, 12);
      const m = rand(0, 60 / step - 1) * step;
      const activity = rand(0, ROUTINE.length - 1);
      if (grade === 3 && level === 3 && i % 2) {
        const minutes = rand(2, 18) * 5;
        const sm = rand(0, 11) * 5;
        const end = addMinutes(h, sm, minutes);
        return { key: `elapsed:${h}:${sm}:${minutes}`, kind: "elapsed", h, m: sm, minutes, activity, choices: timeChoices(end.h, end.m, 5), answer: timeKey(end.h, end.m) };
      }
      const kind = level === 1 && grade === 2 ? "read" : i % 2 ? "set" : "read";
      const mm = kind === "set" && step < 5 ? m - (m % 5) : m; // the hands are set in 5-minute steps
      return { key: `${kind}:${h}:${mm}`, kind, h, m: mm, activity, choices: timeChoices(h, mm, step), answer: timeKey(h, mm) };
    });
  }
  return unique(count, (i) => {
    const h = rand(1, 12);
    const m: 0 | 30 = level === 3 && rand(0, 1) ? 30 : 0;
    const kind = level === 1 ? "read" : i % 2 ? "set" : "read";
    const answer = `${h}:${m === 0 ? "00" : "30"}`;
    const opts = new Set([answer]);
    for (const [dh, dm] of shuffle([[1, 0], [-1, 0], [0, 30], [6, 0], [2, 0]] as [number, number][])) {
      const hh = ((h - 1 + dh + 12) % 12) + 1;
      const mm = (m + dm) % 60;
      if (level < 3 && mm !== 0) continue;
      opts.add(`${hh}:${mm === 0 ? "00" : "30"}`);
      if (opts.size === 4) break;
    }
    return { key: `${kind}:${answer}`, kind, h, m, activity: rand(0, ROUTINE.length - 1), choices: shuffle([...opts]), answer };
  });
}

/* ---------- 12. مختبر القياس: length, mass, capacity ---------- */
export type MeasureKind = "length" | "mass" | "capacity" | "units" | "ruler" | "unit" | "convert";
export interface MeasureTask {
  key: string;
  kind: MeasureKind;
  ask: "most" | "least";
  /** Relative sizes of the objects (length / mass / capacity), or the object length in units / cm. */
  values: number[];
  items: string[];
  /** "unit" and "convert" tasks: the question text and answer choices. */
  text?: string;
  choices?: string[];
  answer?: string;
}
/** Things measured with a sensible standard unit (grade 2 uses cm, m, kg and litre; grade 3 adds g and mL). */
export const UNIT_ITEMS: { emoji: string; text: string; unit: string; grade3?: boolean }[] = [
  { emoji: "🚪", text: "طول الباب", unit: "متر" },
  { emoji: "✏️", text: "طول قلم الرصاص", unit: "سنتيمتر" },
  { emoji: "🏫", text: "طول ساحة المدرسة", unit: "متر" },
  { emoji: "📒", text: "طول الدفتر", unit: "سنتيمتر" },
  { emoji: "🍉", text: "كتلة البطيخة", unit: "كيلوغرام" },
  { emoji: "🧒", text: "كتلة الطفل", unit: "كيلوغرام" },
  { emoji: "🪣", text: "سعة الدلو", unit: "لتر" },
  { emoji: "🛁", text: "سعة حوض الاستحمام", unit: "لتر" },
  { emoji: "🪶", text: "كتلة الريشة", unit: "غرام", grade3: true },
  { emoji: "🍬", text: "كتلة قطعة الحلوى", unit: "غرام", grade3: true },
  { emoji: "🥄", text: "سعة ملعقة الدواء", unit: "مللتر", grade3: true },
  { emoji: "💧", text: "سعة القطّارة", unit: "مللتر", grade3: true },
];
const UNITS2 = ["سنتيمتر", "متر", "كيلوغرام", "لتر"];
const UNITS3 = [...UNITS2, "غرام", "مللتر"];
const CONVERSIONS: [string, string, number][] = [["م", "سم", 100], ["كغ", "غ", 1000], ["لتر", "مل", 1000]];
const MEASURE_KINDS: Record<2 | 3, MeasureKind[][]> = {
  2: [["ruler"], ["unit", "ruler"], ["unit", "ruler", "mass"]],
  3: [["unit", "ruler"], ["convert"], ["convert", "unit", "ruler"]],
};
function measureTask(kind: MeasureKind, grade: 2 | 3): MeasureTask | null {
  const ask = pick(["most", "least"] as const);
  if (kind === "ruler") {
    const len = rand(2, 15);
    return { key: `ruler:${len}`, kind, ask, values: [len], items: [pick(["✏️", "🖍️", "🔑", "🥕"])] };
  }
  if (kind === "unit") {
    const item = pick(UNIT_ITEMS.filter((u) => grade === 3 || !u.grade3));
    const pool = grade === 3 ? UNITS3 : UNITS2;
    const choices = shuffle([item.unit, ...shuffle(pool.filter((u) => u !== item.unit)).slice(0, 3)]);
    return { key: `unit:${item.text}`, kind, ask, values: [], items: [item.emoji], text: `ما الوحدة المناسبة لقياس ${item.text}؟`, choices, answer: item.unit };
  }
  if (kind === "convert") {
    const [big, small, factor] = pick(CONVERSIONS);
    const n = rand(1, 9);
    const down = rand(0, 1) === 1; // 3 م = ؟ سم  or  300 سم = ؟ م
    const answer = down ? n * factor : n;
    const choices = [...new Set(down ? [n * factor, n * (factor === 100 ? 10 : 100), n * factor * 10, n + factor] : [n, n * 10, n * factor, n + 1])].map(String);
    return { key: `convert:${big}:${n}:${down}`, kind, ask, values: [], items: [], text: down ? `${n} ${big} = ؟ ${small}` : `${n * factor} ${small} = ؟ ${big}`, choices: shuffle(choices), answer: String(answer) };
  }
  return null;
}
/** Objects ordered from lightest / smallest to heaviest / largest, so comparisons match real life. */
export const MEASURE_ITEMS = {
  length: ["✏️", "🖍️", "🖊️"],
  mass: ["🪶", "🎈", "🍎", "📚", "🍉", "🧱"],
  capacity: ["🥛", "🍶", "🫖", "🪣"],
} as const;
export function measureTasks(level: MathLevel, count: number, grade: MathGrade = 1): MeasureTask[] {
  const kinds: MeasureKind[] = grade > 1 ? MEASURE_KINDS[grade as 2 | 3][level - 1] : level === 1 ? ["length"] : level === 2 ? ["length", "mass"] : ["length", "mass", "capacity", "units"];
  return unique(count, (i) => {
    const kind = kinds[i % kinds.length];
    const special = grade > 1 ? measureTask(kind, grade as 2 | 3) : null;
    if (special) return special;
    const ask = pick(["most", "least"] as const);
    if (kind === "units") {
      const len = rand(3, 9);
      return { key: `units:${len}`, kind, ask, values: [len], items: ["📏"] };
    }
    if (kind === "length") {
      const values = shuffle([3, 5, 7, 9]).slice(0, 3);
      return { key: `${kind}:${ask}:${values.join(",")}`, kind, ask, values, items: [...MEASURE_ITEMS.length] };
    }
    // Mass and capacity: pick real objects; their value is their rank in the ordered list.
    const list: readonly string[] = MEASURE_ITEMS[kind as "mass" | "capacity"];
    const idx = shuffle(list.map((_, k) => k)).slice(0, kind === "mass" ? 2 : 3);
    return { key: `${kind}:${ask}:${idx.join(",")}`, kind, ask, values: idx.map((k) => k + 1), items: idx.map((k) => list[k]) };
  });
}
/** Index of the correct object for a comparison task. */
export function measureAnswer(t: MeasureTask) {
  const best = t.ask === "most" ? Math.max(...t.values) : Math.min(...t.values);
  return t.values.indexOf(best);
}
export const MEASURE_WORDS: Record<"length" | "mass" | "capacity", Record<"most" | "least", string>> = {
  length: { most: "الأطول", least: "الأقصر" },
  mass: { most: "الأثقل", least: "الأخف" },
  capacity: { most: "يتسع أكثر", least: "يتسع أقل" },
};
