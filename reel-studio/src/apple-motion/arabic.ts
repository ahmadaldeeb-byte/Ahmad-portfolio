// [reel-studio patch] Arabic helpers for apple-motion's KineticText.
// splitArabicLetters is taken from the official Remotion skill (remotion-markup/arabic-text.md):
// units keep harakat with their letter, lam-alef as one ligature, digit/Latin runs together, and get
// zero-width joiners so each unit is drawn in its connected form when animated on its own.
const ZWJ = '‍';
const RIGHT_JOINING =
  /[آ-إاةد-زوٱ-ٳٵ-ٷڈ-ڙۀۃ-ۋۍۏےۓە]/;
const LETTER = /[ؠ-يٮ-ۓەۺ-ۼۿ]/;
const LTR_RUN = /^[0-9٠-٩۰-۹A-Za-z٫٬.,:%°]+$/;
const MARK = /[ً-ٰٟۖ-ۭ]/;
const MARKS = /[ً-ٰٟۖ-ۭ‍]/g;
const first = (u: string) => u.replace(MARKS, '')[0] ?? '';
const last = (u: string) => u.replace(MARKS, '').slice(-1);
const joinsPrev = (u: string) => LETTER.test(first(u)) && first(u) !== 'ء';
const joinsNext = (u: string) => LETTER.test(last(u)) && last(u) !== 'ء' && !RIGHT_JOINING.test(last(u));

export const splitArabicLetters = (text: string): string[] => {
  const g: string[] = [];
  for (const ch of text) {
    if (MARK.test(ch) && g.length > 0) g[g.length - 1] += ch;
    else g.push(ch);
  }
  const units: string[] = [];
  for (let i = 0; i < g.length; i++) {
    if (LTR_RUN.test(g[i])) {
      let run = g[i];
      while (g[i + 1] && LTR_RUN.test(g[i + 1])) run += g[++i];
      units.push(run);
    } else if (first(g[i]) === 'ل' && /[آأإا]/.test(first(g[i + 1] ?? ''))) {
      units.push(g[i] + g[++i]);
    } else {
      units.push(g[i]);
    }
  }
  return units.map((u, i) => {
    const before = i > 0 && joinsNext(units[i - 1]) && joinsPrev(u) ? ZWJ : '';
    const after = i < units.length - 1 && joinsNext(u) && joinsPrev(units[i + 1]) ? ZWJ : '';
    return before + u + after;
  });
};

const RTL_CHAR = /[֐-ࣿיִ-﷿ﹰ-﻿]/;
/** Decide direction by counting words (Arabic lines often start with a Latin brand name). */
export const isRtl = (text: string) => {
  const words = text.split(/\s+/).filter(Boolean);
  return words.filter((w) => RTL_CHAR.test(w)).length > words.length / 2;
};
