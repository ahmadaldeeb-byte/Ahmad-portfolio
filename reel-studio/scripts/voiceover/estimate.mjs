#!/usr/bin/env node
// Temporary word timings for a script that has no recording yet (no API, deterministic).
//   node scripts/voiceover/estimate.mjs --text-file scripts/voiceover/gimbal-full.txt --out vo/gimbal-full [--wps 3.1]
// Writes public/<out>.temp.words.json. Episodes use it until public/<out>.words.json (the real recording's
// timings from `npm run vo -- tts|align`) exists, then switch automatically.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = Object.fromEntries(process.argv.slice(2).flatMap((a, i, all) => (a.startsWith('--') ? [[a.slice(2), all[i + 1]]] : [])));
const text = fs.readFileSync(path.resolve(root, args['text-file']), 'utf8').trim();
const wps = Number(args.wps || 3.1); // brisk explainer pace (voice brief); apple-motion measured 3.04 for recaps
const letters = (w) => w.replace(/[ً-ٰٟـ\p{P}]/gu, '').length;
const words = text.split(/\s+/).filter(Boolean);
const avg = words.reduce((s, w) => s + letters(w), 0) / words.length;
const PAUSE = [[/[.…]$/, 0.5], [/[؟?]$/, 0.45], [/[:،,]$/, 0.25]];
let t = 0.05;
const out = words.map((w) => {
  const dur = (1 / wps) * (0.45 + 0.55 * (letters(w) / avg));
  const r = {word: w, start: +t.toFixed(3), end: +(t + dur).toFixed(3)};
  t += dur + 0.04 + (PAUSE.find(([re]) => re.test(w))?.[1] ?? 0);
  return r;
});
const file = path.join(root, 'public', `${args.out}.temp.words.json`);
fs.mkdirSync(path.dirname(file), {recursive: true});
fs.writeFileSync(file, JSON.stringify({text, note: 'TEMPORARY estimated timings - replaced by the real recording', words: out}, null, 1));
console.log(`${out.length} words, ${t.toFixed(1)} s → public/${args.out}.temp.words.json`);
