#!/usr/bin/env node
// ElevenLabs voice-over tool for Reel Studio (Node >= 22, no dependencies).
//
//   npm run vo -- models                                  # list TTS models (find Eleven v4's id)
//   npm run vo -- library [--accent levantine] [--gender male]   # Arabic voices in the shared library
//   npm run vo -- add --public-owner <id> --voice <id> --name "<name>"   # add a library voice to My Voices
//   npm run vo -- design --description-file scripts/voiceover/voice-design.txt --text-file <txt> [--model <ttv model>]
//   npm run vo -- save-design --generated <generated_voice_id> --name "<name>" --description-file <txt>
//   npm run vo -- align --audio <uploaded.mp3|.wav> --text-file scripts/voiceover/gimbal-hook.txt --out vo/gimbal-hook
//   npm run vo -- tts --voice <voice_id> --text-file scripts/voiceover/gimbal-hook.txt --out vo/gimbal-hook [--model auto]
//
// tts writes public/<out>.mp3 + public/<out>.words.json (word start/end in seconds) — the episode reads
// the words file to time the text motion. Key: ELEVENLABS_API_KEY, or injected by the session proxy.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const API = 'https://api.elevenlabs.io';
const [cmd, ...rest] = process.argv.slice(2);
const opt = {};
for (let i = 0; i < rest.length; i++) if (rest[i].startsWith('--')) opt[rest[i].slice(2)] = rest[i + 1]?.startsWith('--') ? true : rest[++i];
const readText = (k) => (opt[`${k}-file`] ? fs.readFileSync(path.resolve(root, opt[`${k}-file`]), 'utf8').trim() : opt[k]);

const headers = {'xi-api-key': process.env.ELEVENLABS_API_KEY || 'proxy-injected', 'Content-Type': 'application/json'};
const call = async (method, url, body) => {
  const res = await fetch(API + url, {method, headers, body: body ? JSON.stringify(body) : undefined});
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${url} → ${res.status}: ${text.slice(0, 400)}`);
  return JSON.parse(text);
};

const pickModel = async (wanted) => {
  const models = await call('GET', '/v1/models');
  const tts = models.filter((m) => m.can_do_text_to_speech);
  if (wanted && wanted !== 'auto') return wanted;
  // prefer Eleven v4, then v3, then multilingual v2 — must list Arabic
  const ar = (m) => (m.languages || []).some((l) => l.language_id === 'ar');
  const order = [/v4/i, /v3/i, /multilingual_v2/i];
  for (const re of order) {
    const m = tts.find((x) => re.test(x.model_id) && ar(x));
    if (m) {
      if (!/v4/i.test(m.model_id)) console.warn(`! Eleven v4 not available on this account; using ${m.model_id}`);
      return m.model_id;
    }
  }
  throw new Error('no Arabic TTS model found');
};

/** Character alignment → words with start/end seconds (split on whitespace). */
const toWords = (al) => {
  const words = [];
  let cur = null;
  al.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) {
      if (cur) words.push(cur);
      cur = null;
      return;
    }
    if (!cur) cur = {word: '', start: al.character_start_times_seconds[i], end: 0};
    cur.word += ch;
    cur.end = al.character_end_times_seconds[i];
  });
  if (cur) words.push(cur);
  return words;
};

const forcedAlign = async (mp3Path, text) => {
  const form = new FormData();
  form.append('file', new Blob([fs.readFileSync(mp3Path)], {type: 'audio/mpeg'}), path.basename(mp3Path));
  form.append('text', text);
  const res = await fetch(`${API}/v1/forced-alignment`, {method: 'POST', headers: {'xi-api-key': headers['xi-api-key']}, body: form});
  if (!res.ok) throw new Error(`forced-alignment → ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const j = await res.json();
  return j.words.map((w) => ({word: w.text, start: w.start, end: w.end})).filter((w) => w.word.trim());
};

const commands = {
  /** uploaded MP3 → <out>.mp3 + <out>.words.json via ElevenLabs forced alignment */
  async align() {
    const text = readText('text');
    const out = path.join(root, 'public', opt.out || 'vo/voiceover');
    const src = path.resolve(root, opt.audio);
    fs.mkdirSync(path.dirname(out), {recursive: true});
    if (/\.mp3$/i.test(src)) {
      if (path.resolve(`${out}.mp3`) !== src) fs.copyFileSync(src, `${out}.mp3`);
    } else {
      // WAV (or any other format ffmpeg reads) -> MP3 for Remotion's <Audio>
      const {spawnSync} = await import('node:child_process');
      const r = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', src, '-c:a', 'libmp3lame', '-q:a', '2', `${out}.mp3`], {stdio: 'inherit'});
      if (r.status !== 0) throw new Error(`ffmpeg could not convert ${opt.audio}`);
    }
    const words = await forcedAlign(`${out}.mp3`, text);
    fs.writeFileSync(`${out}.words.json`, JSON.stringify({text, source: `uploaded ${path.extname(src).slice(1)} + ElevenLabs forced alignment`, words}, null, 1));
    console.log(`→ public/${opt.out}.mp3 + .words.json`);
    for (const w of words) console.log(`  ${w.start.toFixed(2)}–${w.end.toFixed(2)}  ${w.word}`);
  },
  async models() {
    const models = await call('GET', '/v1/models');
    for (const m of models)
      console.log(`${m.model_id.padEnd(34)} ${m.name.padEnd(28)} tts=${m.can_do_text_to_speech ? 'y' : 'n'} ar=${(m.languages || []).some((l) => l.language_id === 'ar') ? 'y' : 'n'}`);
  },
  async library() {
    const q = new URLSearchParams({page_size: '40', language: 'ar', ...(opt.gender ? {gender: opt.gender} : {}), ...(opt.accent ? {accent: opt.accent} : {}), ...(opt.search ? {search: opt.search} : {})});
    const {voices} = await call('GET', `/v1/shared-voices?${q}`);
    const dir = path.join(root, 'public/vo/library');
    fs.mkdirSync(dir, {recursive: true});
    for (const v of voices) {
      console.log(`${v.voice_id}  owner=${v.public_owner_id}  ${v.name} | ${v.gender}/${v.age} | accent=${v.accent} locale=${v.locale ?? ''} | ${v.descriptive ?? ''} ${v.use_case ?? ''}`);
      if (opt.previews && v.preview_url) {
        const buf = Buffer.from(await (await fetch(v.preview_url)).arrayBuffer());
        fs.writeFileSync(path.join(dir, `${v.voice_id}.mp3`), buf);
      }
    }
    if (opt.previews) console.log(`previews → public/vo/library/`);
  },
  async add() {
    const r = await call('POST', `/v1/voices/add/${opt['public-owner']}/${opt.voice}`, {new_name: opt.name || 'Reel narrator'});
    console.log('voice_id', r.voice_id);
  },
  async design() {
    const description = readText('description');
    const text = readText('text');
    const model_id = opt.model || 'eleven_ttv_v3';
    const r = await call('POST', '/v1/text-to-voice/design', {voice_description: description, text, model_id, auto_generate_text: false});
    const dir = path.join(root, 'public/vo/design');
    fs.mkdirSync(dir, {recursive: true});
    r.previews.forEach((p, i) => {
      const f = path.join(dir, `preview-${i + 1}-${p.generated_voice_id}.mp3`);
      fs.writeFileSync(f, Buffer.from(p.audio_base_64, 'base64'));
      console.log(`preview ${i + 1}: generated_voice_id=${p.generated_voice_id}  ${p.duration_secs ?? ''}s  → ${path.relative(root, f)}`);
    });
  },
  async 'save-design'() {
    const r = await call('POST', '/v1/text-to-voice', {voice_name: opt.name, voice_description: readText('description'), generated_voice_id: opt.generated});
    console.log('voice_id', r.voice_id);
  },
  async tts() {
    const text = readText('text');
    const model_id = await pickModel(opt.model);
    const out = path.join(root, 'public', opt.out || 'vo/voiceover');
    fs.mkdirSync(path.dirname(out), {recursive: true});
    console.log(`model ${model_id} · voice ${opt.voice}`);
    const body = {
      text,
      model_id,
      language_code: 'ar',
      voice_settings: {stability: Number(opt.stability ?? 0.45), similarity_boost: 0.8, style: Number(opt.style ?? 0.35), use_speaker_boost: true, speed: Number(opt.speed ?? 1.0)},
    };
    let words;
    try {
      const r = await call('POST', `/v1/text-to-speech/${opt.voice}/with-timestamps?output_format=mp3_44100_128`, body);
      fs.writeFileSync(`${out}.mp3`, Buffer.from(r.audio_base64, 'base64'));
      words = toWords(r.alignment);
    } catch (e) {
      console.warn(`! with-timestamps failed (${e.message.slice(0, 120)}); plain TTS + forced alignment`);
      const res = await fetch(`${API}/v1/text-to-speech/${opt.voice}?output_format=mp3_44100_128`, {method: 'POST', headers, body: JSON.stringify(body)});
      if (!res.ok) throw new Error(`tts → ${res.status}: ${(await res.text()).slice(0, 300)}`);
      fs.writeFileSync(`${out}.mp3`, Buffer.from(await res.arrayBuffer()));
      words = await forcedAlign(`${out}.mp3`, text);
    }
    fs.writeFileSync(`${out}.words.json`, JSON.stringify({text, model_id, voice_id: opt.voice, words}, null, 1));
    console.log(`→ public/${opt.out}.mp3 + .words.json`);
    for (const w of words) console.log(`  ${w.start.toFixed(2)}–${w.end.toFixed(2)}  ${w.word}`);
  },
};

if (!commands[cmd]) {
  console.error('commands: ' + Object.keys(commands).join(', '));
  process.exit(1);
}
commands[cmd]().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
