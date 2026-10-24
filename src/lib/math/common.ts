import { randomInt, shuffle } from "../utils";

export type MathLevel = 1 | 2 | 3;
/** Grade the tasks are generated for (the game's grade). */
export type MathGrade = 1 | 2 | 3;

export interface MathSettings {
  level: MathLevel;
  count: number;
  /** Learning mode: wrong answers cost nothing and can be retried. */
  learning: boolean;
}

export const MATH_DEFAULTS: MathSettings = { level: 1, count: 8, learning: true };

export const rand = (min: number, max: number) => min + randomInt(max - min + 1);
export const pick = <T,>(list: readonly T[]) => list[randomInt(list.length)];

/** Four distinct numeric choices around the answer, all inside [min, max]. */
export function numberChoices(answer: number, min: number, max: number, count = 4): number[] {
  const set = new Set([answer]);
  for (const d of shuffle([1, -1, 2, -2, 10, -10, 3, -3, 5, -5, ...(max > 200 ? [100, -100] : [])])) {
    const v = answer + d;
    if (v >= min && v <= max) set.add(v);
    if (set.size >= count) break;
  }
  for (let v = min; set.size < Math.min(count, max - min + 1); v++) set.add(v);
  return shuffle([...set]);
}

/** Generates `count` tasks, avoiding repeated keys while the space allows it. */
export function unique<T extends { key: string }>(count: number, make: (i: number) => T, tries = 40): T[] {
  const out: T[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < count; i++) {
    let t = make(i);
    for (let k = 0; k < tries && seen.has(t.key); k++) t = make(i);
    seen.add(t.key);
    out.push(t);
  }
  return out;
}

const WORDS = ["صفر", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر", "عشرون"];

/** Arabic name of a number from 0 to 20 (as it is read when counting). */
export function numberWord(n: number) {
  return WORDS[n] ?? String(n);
}

export interface Counted {
  one: string;
  two: string;
  few: string; // 3–10
  many: string; // 11+
}

/** «تفاحة واحدة / تفاحتان / ٥ تفاحات / ١٢ تفاحة» */
export function countPhrase(n: number, noun: Counted, fmt: (n: number) => string = String) {
  if (n === 1) return `${noun.one} واحدة`;
  if (n === 2) return noun.two;
  if (n >= 3 && n <= 10) return `${fmt(n)} ${noun.few}`;
  return `${fmt(n)} ${noun.many}`;
}
