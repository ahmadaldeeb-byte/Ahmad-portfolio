// Voice-over word timings → frames. Words file is written by scripts/voiceover/eleven.mjs (tts).
export type VoWord = {word: string; start: number; end: number};
export type VoWords = {text: string; model_id?: string; voice_id?: string; words: VoWord[]};

const TASHKEEL = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
/** Normalise an Arabic word for matching: no tashkeel/tatweel/punctuation, unified alef/yeh/teh marbuta. */
export const norm = (w: string) =>
  w
    .replace(TASHKEEL, '')
    .replace(/[؟،؛.,!?:;…"'«»()\-–—]/g, '')
    .replace(/[آأإٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim();

const CLITIC = /^(?:[وفبلك]|ال|وال|بال|فال|لل)/;
const same = (spoken: string, cue: string) => {
  const a = norm(spoken);
  const b = norm(cue);
  return a === b || (a.endsWith(b) && CLITIC.test(a.slice(0, a.length - b.length)));
};

/** Index of the first word of `phrase` in the voice-over (clitic prefixes like بـ/وـ allowed), from `fromIdx`. */
export const findPhrase = (words: VoWord[], phrase: string, fromIdx = 0): number => {
  const cue = phrase.split(/\s+/).filter(Boolean);
  for (let i = fromIdx; i <= words.length - cue.length; i++) if (cue.every((c, k) => same(words[i + k].word, c))) return i;
  return -1;
};

/** Start frame (relative to the text block's own start) for every on-screen word, matched in order to
 *  the spoken words. Unmatched words follow the previous one by `fallbackStagger` frames. */
export const onScreenWordStarts = (
  lines: string[],
  words: VoWord[],
  fps: number,
  blockStartFrame: number,
  voiceFrom: number,
  leadFrames: number,
  fallbackStagger = 4,
): number[] => {
  const out: number[] = [];
  let j = 0;
  let prev = 0;
  for (const w of lines.join(' ').split(/\s+/).filter(Boolean)) {
    let k = j;
    while (k < words.length && !same(words[k].word, w)) k++;
    if (k < words.length) {
      prev = Math.max(0, voiceFrom + Math.round(words[k].start * fps) - leadFrames - blockStartFrame);
      j = k + 1;
    } else prev += fallbackStagger;
    out.push(prev);
  }
  return out;
};
