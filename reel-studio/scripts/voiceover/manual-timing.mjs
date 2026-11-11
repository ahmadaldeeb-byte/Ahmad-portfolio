#!/usr/bin/env node
// Manual / pause-based word timings for a finished voice-over (no API, no speech model).
//
//   node scripts/voiceover/manual-timing.mjs --audio public/vo/gimbal-full.mp3 --text-file scripts/voiceover/gimbal-full.txt --out vo/gimbal-full
//
// 1. Finds the pauses in the recording (ffmpeg silencedetect, relative to the peak level).
// 2. Maps the text's phrase breaks (؟ … . ، :) onto those pauses with a small dynamic program that
//    keeps phrase durations proportional to their letter count (extra pauses inside phrases are allowed).
// 3. Inside a phrase, spreads the words by letter count and snaps each word start to the nearest
//    micro-gap in the audio (±0.18 s).
// 4. Applies hand corrections from public/<out>.fixes.json, e.g. {"عشرين#1": 13.42} (word#occurrence → start s).
// Writes public/<out>.words.json (the format the episodes read) and prints a table to review.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = Object.fromEntries(process.argv.slice(2).flatMap((a, i, all) => (a.startsWith('--') ? [[a.slice(2), all[i + 1]]] : [])));
const audio = path.resolve(root, args.audio);
const text = fs.readFileSync(path.resolve(root, args['text-file']), 'utf8').trim();
const outBase = path.join(root, 'public', args.out);

const ff = (af) => spawnSync('ffmpeg', ['-hide_banner', '-i', audio, '-af', af, '-f', 'null', '-'], {encoding: 'utf8'}).stderr;
const peak = Number(/max_volume: (-?[\d.]+) dB/.exec(ff('volumedetect'))?.[1] ?? 0);
const duration = Number(/Duration: (\d+):(\d+):([\d.]+)/.exec(ff('anull')).slice(1).reduce((s, v, i) => s + Number(v) * [3600, 60, 1][i], 0));
const silences = (db, d) => {
  const out = [];
  const s = ff(`silencedetect=noise=${peak - db}dB:d=${d}`);
  const re = /silence_(start|end): ([\d.]+)/g;
  let m;
  let cur = null;
  while ((m = re.exec(s))) {
    if (m[1] === 'start') cur = {a: Number(m[2])};
    else if (cur) out.push({...cur, b: Number(m[2])}), (cur = null);
  }
  if (cur) out.push({...cur, b: duration});
  // merge pauses split by a click (< 50 ms of sound between them)
  return out.reduce((acc, p) => (acc.length && p.a - acc[acc.length - 1].b < 0.05 ? (acc[acc.length - 1].b = p.b, acc) : [...acc, p]), []);
};

const pauses = silences(33, 0.1);
const lead = pauses.length && pauses[0].a <= 0.02 ? pauses.shift().b : 0;
const tailP = pauses.length && pauses[pauses.length - 1].b >= duration - 0.02 ? pauses.pop() : null;
const speechEnd = tailP ? tailP.a : duration;

// phrases = runs of words ending in a punctuation mark
const words = text.split(/\s+/).filter(Boolean);
const letters = (w) => w.replace(/[ً-ٰٟـ\p{P}]/gu, '').length || 1;
const phrases = [];
let cur = [];
words.forEach((w, i) => {
  cur.push(i);
  if (/[؟?…،,:.]$/.test(w) || i === words.length - 1) phrases.push(cur), (cur = []);
});
const N = phrases.length;
const weight = phrases.map((ph) => ph.reduce((s, i) => s + letters(words[i]) + 1.2, 0));
const rate = (speechEnd - lead - pauses.reduce((s, p) => s + (p.b - p.a), 0)) / weight.reduce((a, b) => a + b, 0); // s per weighted letter

// DP: assign phrase break k (after phrase k) to pause j, monotonic; cost = duration mismatch + skipped long pauses
const M = pauses.length;
const INF = 1e9;
const cost = Array.from({length: N}, () => Array(M + 1).fill(INF));
const back = Array.from({length: N}, () => Array(M + 1).fill(-1));
const spoken = (from, to, skip) => to - from - skip; // speech time between two instants minus skipped pause time
const skipped = (j0, j1) => pauses.slice(j0, j1).reduce((s, p) => s + (p.b - p.a), 0);
const err = (k, t0, t1, sk) => {
  const want = weight[k] * rate;
  const got = spoken(t0, t1, sk);
  return got <= 0.05 ? INF : Math.log(got / want) ** 2;
};
for (let j = 0; j < M; j++) cost[0][j] = err(0, lead, pauses[j].a, skipped(0, j)) + skipped(0, j) * 2;
for (let k = 1; k < N - 1; k++)
  for (let j = k; j < M; j++)
    for (let i = k - 1; i < j; i++) {
      if (cost[k - 1][i] >= INF) continue;
      const c = cost[k - 1][i] + err(k, pauses[i].b, pauses[j].a, skipped(i + 1, j)) + skipped(i + 1, j) * 2;
      if (c < cost[k][j]) (cost[k][j] = c), (back[k][j] = i);
    }
let best = INF;
let bj = -1;
for (let j = N - 2; j < M; j++) {
  if (cost[N - 2][j] >= INF) continue;
  const c = cost[N - 2][j] + err(N - 1, pauses[j].b, speechEnd, skipped(j + 1, M)) + skipped(j + 1, M) * 2;
  if (c < best) (best = c), (bj = j);
}
if (bj < 0) throw new Error(`could not map ${N - 1} phrase breaks onto ${M} pauses`);
const breaks = Array(N - 1);
for (let k = N - 2, j = bj; k >= 0; k--) (breaks[k] = j), (j = back[k][j]);

// micro-gaps for word snapping
const micro = silences(26, 0.03).map((p) => (p.a + p.b) / 2);
const snap = (t, lo, hi) => {
  const c = micro.filter((m) => m > lo + 0.05 && m < hi - 0.05 && Math.abs(m - t) <= 0.18).sort((a, b) => Math.abs(a - t) - Math.abs(b - t))[0];
  return c ?? t;
};

const out = [];
phrases.forEach((ph, k) => {
  const t0 = k === 0 ? lead : pauses[breaks[k - 1]].b;
  const t1 = k === N - 1 ? speechEnd : pauses[breaks[k]].a;
  // internal pauses (not mapped to punctuation) are removed from the speech time and kept as gaps
  const inner = pauses.filter((p) => p.a > t0 && p.b < t1);
  const total = ph.reduce((s, i) => s + letters(words[i]) + 1.2, 0);
  const span = t1 - t0 - inner.reduce((s, p) => s + (p.b - p.a), 0);
  let acc = 0;
  const toTime = (x) => {
    // x = speech seconds from t0, skipping inner pauses
    let t = t0 + x;
    for (const p of inner) if (t >= p.a) t += p.b - p.a;
    return t;
  };
  const starts = ph.map((i) => {
    const s = toTime((acc / total) * span);
    acc += letters(words[i]) + 1.2;
    return s;
  });
  ph.forEach((i, n) => {
    const s = n === 0 ? t0 : snap(starts[n], t0, t1);
    const e = n === ph.length - 1 ? t1 : starts[n + 1];
    out.push({word: words[i], start: +s.toFixed(3), end: +Math.max(s + 0.05, e).toFixed(3)});
  });
});
// keep ends consistent with snapped starts
for (let i = 0; i < out.length - 1; i++) if (out[i + 1].start > out[i].start) out[i].end = Math.min(out[i].end, out[i + 1].start);

// hand corrections
const fixesFile = `${outBase}.fixes.json`;
const fixes = fs.existsSync(fixesFile) ? JSON.parse(fs.readFileSync(fixesFile, 'utf8')) : {};
const seen = {};
for (const w of out) {
  seen[w.word] = (seen[w.word] || 0) + 1;
  const key = `${w.word}#${seen[w.word]}`;
  if (fixes[key] !== undefined) (w.start = fixes[key]), (w.fixed = true);
}

fs.writeFileSync(
  `${outBase}.words.json`,
  JSON.stringify({text, source: 'manual: pause-mapped phrases + letter-weighted words snapped to micro-gaps', audio: path.relative(root, audio), duration, speechEnd, words: out}, null, 1),
);
console.log(`audio ${duration.toFixed(2)} s · speech ${lead.toFixed(2)}–${speechEnd.toFixed(2)} s · ${M} pauses → ${N - 1} phrase breaks`);
phrases.forEach((ph, k) => {
  const ws = ph.map((i) => out[i]);
  console.log(`${String(k + 1).padStart(2)} ${ws[0].start.toFixed(2).padStart(6)}–${ws[ws.length - 1].end.toFixed(2).padEnd(6)} ${ws.map((w) => `${w.word}@${w.start.toFixed(2)}${w.fixed ? '*' : ''}`).join(' ')}`);
});
console.log(`→ public/${args.out}.words.json${Object.keys(fixes).length ? ` (${Object.keys(fixes).length} fixes applied)` : ''}`);
