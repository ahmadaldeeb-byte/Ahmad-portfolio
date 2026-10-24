import type { PlayableQuestion } from "../questions";
import { shuffle } from "../utils";
import { numberChoices, pick, rand, unique, type Counted, type MathLevel } from "./common";

/* ---------- 1. جزيرة الأرقام: counting ---------- */
export const FRUITS: (Counted & { emoji: string })[] = [
  { emoji: "🍎", one: "تفاحة", two: "تفاحتين", few: "تفاحات", many: "تفاحة" },
  { emoji: "🍌", one: "موزة", two: "موزتين", few: "موزات", many: "موزة" },
  { emoji: "🍊", one: "برتقالة", two: "برتقالتين", few: "برتقالات", many: "برتقالة" },
  { emoji: "🍓", one: "فراولة", two: "فراولتين", few: "فراولات", many: "فراولة" },
];
export interface IslandTask { key: string; target: number; fruit: number; onIsland: number }
export function islandTasks(level: MathLevel, count: number): IslandTask[] {
  const max = level === 1 ? 10 : 20;
  const min = level === 3 ? 11 : 1;
  return unique(count, () => {
    const target = rand(min, max);
    const fruit = rand(0, FRUITS.length - 1);
    return { key: `${target}`, target, fruit, onIsland: Math.min(24, target + rand(2, 5)) };
  });
}

/* ---------- 2. التمساح الجائع: comparing ---------- */
export type CompareMode = "group" | "symbol" | "number";
export interface CrocTask { key: string; a: number; b: number; mode: CompareMode; ask: "bigger" | "smaller" }
export const compareSymbol = (a: number, b: number) => (a > b ? ">" : a < b ? "<" : "=");
export function crocTasks(level: MathLevel, count: number): CrocTask[] {
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
export function rocketTasks(level: MathLevel, count: number): AddTask[] {
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
export interface AppleTask { key: string; total: number; take: number; answer: number; choices: number[] }
export function appleTasks(level: MathLevel, count: number): AppleTask[] {
  const maxTotal = level === 1 ? 10 : level === 2 ? 15 : 20;
  return unique(count, () => {
    const total = rand(3, maxTotal);
    const take = rand(1, total - 1);
    return { key: `${total}-${take}`, total, take, answer: total - take, choices: numberChoices(total - take, 0, maxTotal) };
  });
}

/* ---------- 5. مصنع الأعداد: tens and ones ---------- */
export interface FactoryTask { key: string; target: number; mode: "build" | "read"; choices: number[] }
export function factoryTasks(level: MathLevel, count: number): FactoryTask[] {
  return unique(count, (i) => {
    const target = level === 1 ? rand(1, 9) * 10 : level === 2 ? rand(11, 50) : rand(11, 99);
    const mode = level === 1 ? "build" : i % 2 ? "read" : "build";
    // «read» distractors swap or nudge digits (e.g. 24 vs 42).
    const swapped = (target % 10) * 10 + Math.floor(target / 10);
    const opts = new Set([target]);
    if (swapped !== target && swapped >= 1 && swapped <= 99) opts.add(swapped);
    for (const d of shuffle([10, -10, 1, -1])) if (opts.size < 4 && target + d >= 1 && target + d <= 99) opts.add(target + d);
    return { key: `${mode}:${target}`, target, mode, choices: shuffle([...opts]) };
  });
}

/* ---------- 6. سباق الجمع: two-digit addition (no regrouping) ---------- */
export function raceAddQuestions(level: MathLevel, count = 80): PlayableQuestion[] {
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
export function pirateTasks(level: MathLevel, count: number): SubTask[] {
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
export type Plane = "square" | "rectangle" | "triangle" | "circle";
export const SOLID_NAMES: Record<Solid, string> = { cube: "مكعب", cylinder: "أسطوانة", cone: "مخروط", sphere: "كرة" };
export const PLANE_NAMES: Record<Plane, string> = { square: "مربع", rectangle: "مستطيل", triangle: "مثلث", circle: "دائرة" };
export const PLANE_SIDES: Record<Plane, number> = { square: 4, rectangle: 4, triangle: 3, circle: 0 };
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
  | { key: string; kind: "build"; part: Plane; choices: string[]; answer: string };
const SOLIDS: Solid[] = ["cube", "cylinder", "cone", "sphere"];
const PLANES: Plane[] = ["square", "rectangle", "triangle", "circle"];
export function shapeTasks(level: MathLevel, count: number): ShapeTask[] {
  const kinds: ShapeTask["kind"][] =
    level === 1 ? ["solid-name", "plane-name", "object-solid"] : level === 2 ? ["solid-name", "plane-name", "sides", "object-solid"] : ["sides", "pattern", "build", "object-solid", "solid-name"];
  return unique(count, (i) => {
    const kind = kinds[i % kinds.length];
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
export type PizzaTask =
  | { key: string; kind: "equal"; parts: 2 | 4; equal: boolean; choices: string[]; answer: string }
  | { key: string; kind: "name"; parts: 2 | 4; equal: boolean; choices: string[]; answer: string }
  | { key: string; kind: "serve"; order: "half" | "quarter"; customer: string }
  | { key: string; kind: "group"; items: number; fraction: "half" | "quarter"; emoji: string; choices: string[]; answer: string };
export const FRACTION_NAMES = { half: "نصف", quarter: "ربع" } as const;
const CUSTOMERS = ["سارة", "عمر", "ليان", "يوسف", "مريم", "آدم"];
export function pizzaTasks(level: MathLevel, count: number): PizzaTask[] {
  const kinds: PizzaTask["kind"][] = level === 1 ? ["equal", "name"] : level === 2 ? ["equal", "name", "serve"] : ["name", "serve", "group"];
  return unique(count, (i) => {
    const kind = kinds[i % kinds.length];
    if (kind === "equal") {
      const parts = pick([2, 4] as const);
      const equal = rand(0, 1) === 1;
      return { key: `${kind}:${parts}:${equal}`, kind, parts, equal, choices: ["نعم، متساوية", "لا، غير متساوية"], answer: equal ? "نعم، متساوية" : "لا، غير متساوية" };
    }
    if (kind === "name") {
      const parts = pick([2, 4] as const);
      const equal = rand(0, 3) > 0;
      const answer = !equal ? "ليس نصفًا ولا ربعًا" : parts === 2 ? "نصف" : "ربع";
      return { key: `${kind}:${parts}:${equal}`, kind, parts, equal, choices: ["نصف", "ربع", "ليس نصفًا ولا ربعًا"], answer };
    }
    if (kind === "serve") {
      const order = pick(["half", "quarter"] as const);
      return { key: `${kind}:${order}:${i}`, kind, order, customer: pick(CUSTOMERS) };
    }
    const fraction = pick(["half", "quarter"] as const);
    const items = fraction === "half" ? pick([2, 4, 6, 8]) : pick([4, 8]);
    const answer = fraction === "half" ? items / 2 : items / 4;
    return { key: `${kind}:${fraction}:${items}`, kind, items, fraction, emoji: pick(["🍪", "🧁", "🍩"]), choices: shuffle([...new Set([answer, answer + 1, Math.max(1, answer - 1), items])]).map(String), answer: String(answer) };
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
export type MarketTask =
  | { key: string; kind: "pay"; product: { emoji: string; name: string }; price: number; coins: number[] }
  | { key: string; kind: "equal"; big: number; small: number; choices: string[]; answer: string };
export function marketTasks(level: MathLevel, count: number): MarketTask[] {
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
export function priceLabel(qirsh: number, fmt: (n: number) => string = String) {
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
export interface ClockTask { key: string; kind: "read" | "set"; h: number; m: 0 | 30; activity: number; choices: string[]; answer: string }
export function clockTasks(level: MathLevel, count: number): ClockTask[] {
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
export type MeasureKind = "length" | "mass" | "capacity" | "units";
export interface MeasureTask {
  key: string;
  kind: MeasureKind;
  ask: "most" | "least";
  /** Relative sizes of the objects (length / mass / capacity), or the object length in units. */
  values: number[];
  items: string[];
}
export const MEASURE_ITEMS = {
  length: ["✏️", "🖍️", "🖊️"],
  mass: ["🍉", "🍎", "🪶", "📚", "🎈", "🧱"],
  capacity: ["🪣", "🥛", "🫖", "🍶"],
} as const;
export function measureTasks(level: MathLevel, count: number): MeasureTask[] {
  const kinds: MeasureKind[] = level === 1 ? ["length"] : level === 2 ? ["length", "mass"] : ["length", "mass", "capacity", "units"];
  return unique(count, (i) => {
    const kind = kinds[i % kinds.length];
    const ask = pick(["most", "least"] as const);
    if (kind === "units") {
      const len = rand(3, 9);
      return { key: `units:${len}`, kind, ask, values: [len], items: ["📏"] };
    }
    const n = kind === "mass" ? 2 : 3;
    const values = shuffle([2, 4, 6, 8, 10].slice(0, 5)).slice(0, n);
    const items = kind === "mass" ? shuffle([...MEASURE_ITEMS.mass]).slice(0, 2) : kind === "capacity" ? shuffle([...MEASURE_ITEMS.capacity]).slice(0, 3) : [...MEASURE_ITEMS.length];
    return { key: `${kind}:${ask}:${values.join(",")}`, kind, ask, values, items };
  });
}
/** Index of the correct object for a comparison task. */
export function measureAnswer(t: MeasureTask) {
  const best = t.ask === "most" ? Math.max(...t.values) : Math.min(...t.values);
  return t.values.indexOf(best);
}
export const MEASURE_WORDS: Record<Exclude<MeasureKind, "units">, Record<"most" | "least", string>> = {
  length: { most: "الأطول", least: "الأقصر" },
  mass: { most: "الأثقل", least: "الأخف" },
  capacity: { most: "يتسع أكثر", least: "يتسع أقل" },
};
