#!/usr/bin/env node
// Download archival images for the camera-history series from Wikimedia Commons, keeping only files whose
// licence allows reuse (public domain / CC0 / CC BY / CC BY-SA), and log page URL, author, licence and credit.
//   NODE_USE_ENV_PROXY=1 node series/camera-history/fetch-archive.mjs
// → public/archive/<id>.<ext> + series/camera-history/sources.json
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(root, 'public/archive');
fs.mkdirSync(OUT, {recursive: true});
const UA = 'reel-studio-archive/1.0 (educational video research)';
// curl (Node's fetch gets 429 from Wikimedia through the proxy); 1 s between calls to stay polite
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const curl = async (url, binary = false) => {
  for (let attempt = 0; ; attempt++) {
    await sleep(attempt === 0 ? 2500 : Math.min(60000, 5000 * 2 ** attempt)); // back off on 429
    try {
      return execFileSync('curl', ['-sS', '-f', '-L', '-A', UA, url], {maxBuffer: 64 * 1024 * 1024, encoding: binary ? 'buffer' : 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
    } catch (e) {
      if (attempt >= 5 || !/429/.test(String(e.stderr))) throw new Error(String(e.stderr).trim() || e.message);
    }
  }
};

// id → Commons file title (or a search query prefixed with "search:")
const WANT = {
  'ep01-frisius-1544': 'search:camera obscura 1545 Frisius woodcut eclipse',
  'ep02-le-gras': 'File:View from the Window at Le Gras, Joseph Nicéphore Niépce.jpg',
  'ep03-boulevard-du-temple': 'File:Boulevard du Temple by Daguerre.jpg',
  'ep04-latticed-window': 'search:Talbot latticed window Lacock Abbey 1835 negative',
  'ep05-horse-in-motion': 'File:The Horse in Motion high res.jpg',
  'ep06-kodak-1888-ad': 'search:Kodak "You press the button, we do the rest" advertisement 1889',
  'ep06-kodak-round-snapshot': 'search:George Eastman Kodak camera 1890 Frederick Church',
  'ep07-tartan-ribbon': 'File:Tartan Ribbon.jpg',
};

const api = async (params) => {
  const u = new URL('https://commons.wikimedia.org/w/api.php');
  Object.entries({format: 'json', formatversion: '2', ...params}).forEach(([k, v]) => u.searchParams.set(k, v));
  return JSON.parse(await curl(u.toString()));
};
const strip = (h) => (h || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const OK = /public domain|^pd|cc0|cc[- ]by/i;

const resolve = async (want) => {
  if (!want.startsWith('search:')) return want;
  const j = await api({action: 'query', list: 'search', srsearch: want.slice(7), srnamespace: '6', srlimit: '5'});
  return j.query.search[0]?.title;
};

const LOG = path.join(root, 'series/camera-history/sources.json');
const sources = fs.existsSync(LOG) ? JSON.parse(fs.readFileSync(LOG, 'utf8')) : {};
for (const [id, want] of Object.entries(WANT)) {
  if (sources[id] && fs.existsSync(path.join(root, sources[id].file))) {
    console.log(`= ${id}: already downloaded`);
    continue;
  }
  try {
    const title = await resolve(want);
    if (!title) throw new Error('no search result');
    const j = await api({action: 'query', titles: title, prop: 'imageinfo', iiprop: 'url|extmetadata|size|mime', iiurlwidth: '2160'});
    const page = j.query.pages[0];
    const ii = page.imageinfo?.[0];
    if (!ii) throw new Error(`not found: ${title}`);
    const m = ii.extmetadata || {};
    const licence = strip(m.LicenseShortName?.value) || strip(m.License?.value);
    if (!OK.test(licence)) {
      console.log(`✗ ${id}: licence "${licence}" not reusable — skipped (${title})`);
      continue;
    }
    const url = ii.thumburl || ii.url;
    const ext = (ii.mime.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
    const file = `${id}.${ext}`;
    const buf = await curl(url, true);
    fs.writeFileSync(path.join(OUT, file), buf);
    sources[id] = {
      file: `public/archive/${file}`,
      title,
      page: ii.descriptionurl,
      author: strip(m.Artist?.value),
      date: strip(m.DateTimeOriginal?.value),
      credit: strip(m.Credit?.value),
      licence,
      licenceUrl: m.LicenseUrl?.value || null,
      description: strip(m.ImageDescription?.value).slice(0, 300),
      size: [ii.thumbwidth || ii.width, ii.thumbheight || ii.height],
    };
    console.log(`✓ ${id}: ${title} · ${licence} · ${(buf.length / 1024).toFixed(0)} KB`);
    fs.writeFileSync(LOG, JSON.stringify(sources, null, 1)); // save as we go (resumable)
  } catch (e) {
    console.log(`✗ ${id}: ${e.message}`);
  }
}
fs.writeFileSync(LOG, JSON.stringify(sources, null, 1));
console.log(`→ series/camera-history/sources.json (${Object.keys(sources).length} files)`);
