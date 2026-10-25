/**
 * Arabic text helpers. Harakat (tashkeel) and other combining marks are kept
 * attached to the letter they decorate so a letter is never separated from its
 * vowel when words are split into tiles.
 */
const COMBINING = /[ؐ-ًؚ-ٰٟۖ-ۜ۟-۪ۨ-ۭ]/;

export function splitLetters(word: string): string[] {
  const out: string[] = [];
  for (const ch of word.replace(/\s+/g, "")) {
    if (COMBINING.test(ch) && out.length) out[out.length - 1] += ch;
    else out.push(ch);
  }
  return out;
}

export function stripTashkeel(s: string) {
  return s.replace(new RegExp(COMBINING.source, "g"), "");
}

/** Checks a tile arrangement (in reading order) against the target word. */
export function isCorrectOrder(tiles: string[], target: string, ignoreTashkeel = false) {
  const a = tiles.join("");
  const b = target.replace(/\s+/g, "");
  return ignoreTashkeel ? stripTashkeel(a) === stripTashkeel(b) : a === b;
}

/** True for prompts that are only numbers and operators, e.g. "6 + 3 = ؟". Shown left-to-right as in math books. */
export function isMathExpression(s: string) {
  return /^[\s0-9٠-٩+\-×÷x*/=؟?().]+$/.test(s) && /[0-9٠-٩]/.test(s);
}

export function isArabic(s: string) {
  return /[؀-ۿ]/.test(s);
}
