#!/usr/bin/env node
// Scaffold a new Arabic cutaway explainer episode and register it in Remotion Studio.
//
//   npm run new-episode -- --slug pressure-cooker --topic "كيف طنجرة الضغط بتطبخ أسرع؟" [--seconds 8] [--fps 30]
//
// Creates src/episodes/<slug>/{storyboard.ts, Model.tsx, index.tsx, BRIEF.md} and adds two compositions
// (<Name>Reel and <Name>TextPreview) to src/Root.tsx. Timings are proportional to --seconds; the text,
// model and mechanism are placeholders the arabic-cutaway-explainer skill fills in.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const slug = (args.slug || '').toLowerCase();
if (!/^[a-z][a-z0-9-]*$/.test(slug) || !args.topic) {
  console.error('usage: npm run new-episode -- --slug <kebab-case> --topic "<Arabic question>" [--seconds 8] [--fps 30]');
  process.exit(1);
}
const seconds = Number(args.seconds || 8);
const fps = Number(args.fps || 30);
const total = Math.round(seconds * fps);
const name = slug.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
const dir = path.join(root, 'src/episodes', slug);
if (fs.existsSync(dir)) {
  console.error(`src/episodes/${slug} already exists`);
  process.exit(1);
}
fs.mkdirSync(dir, {recursive: true});

// beat grid as fractions of the episode (same proportions as the gimbal pilot)
const at = (x) => Math.round(x * total);
const t = {
  hookFrames: at(0.26), revealFrom: at(0.225), labelFrom: at(0.267), labelFrames: at(0.55),
  actionFrom: at(0.4), actionFrames: at(0.117), counterFrames: at(0.233), outroFrom: at(0.825),
};
t.outroFrames = total - t.outroFrom;
const topic = JSON.stringify(args.topic);

fs.writeFileSync(path.join(dir, 'storyboard.ts'), `import type {CutawayProps} from '../../templates/cutaway/schema';

/**
 * Episode: ${args.topic}
 * ${seconds} s · 1080×1920 · ${fps} fps = ${total} frames.
 *
 * MECHANISM (verify before animating — write the checked cause → effect chain here):
 *   1. TODO familiar view: what the viewer already knows
 *   2. TODO hidden part: what we reveal and why it matters
 *   3. TODO cause → effect: what moves, in which direction, and what result the viewer sees
 */
export const TOPIC = ${topic};
export const FPS = ${fps};
export const FRAMES = ${total};

export const BEATS = [
  {id: 'hook', from: 0, to: ${t.hookFrames}, visual: 'TODO الجهاز بشكله المألوف', text: 'هوك عربي سطرين'},
  {id: 'reveal', from: ${t.revealFrom}, to: ${t.actionFrom}, visual: 'TODO الغلاف يصير شفاف والجزء المشروح يتلوّن', text: 'تسمية الجزء'},
  {id: 'mechanism', from: ${t.actionFrom}, to: ${t.outroFrom}, visual: 'TODO الآلية تتحرك: السبب ثم النتيجة بنفس الكادر', text: 'رقم + سطر شرح'},
  {id: 'payoff', from: ${t.outroFrom}, to: ${total}, visual: 'TODO النتيجة', text: 'سطر النتيجة'},
] as const;

export const defaults: CutawayProps = {
  font: 'IBM Plex Sans Arabic',
  hook: ['TODO سطر الهوك الأول', 'TODO السطر الثاني؟'],
  hookFrom: 0,
  hookFrames: ${t.hookFrames},
  hookCapPct: 3.4,
  hookY: 13,
  label: 'TODO اسم الجزء',
  labelFrom: ${t.labelFrom},
  labelFrames: ${t.labelFrames},
  labelCapPct: 2.5,
  labelX: 86,
  labelY: 16,
  labelAnchor: [0.9, 0.4, 0],
  counterTo: 0,
  counterSuffix: '',
  counterCaption: ['TODO سطر', 'الشرح'],
  counterFrom: ${t.actionFrom},
  counterFrames: ${t.counterFrames},
  counterCapPct: 6,
  counterX: 20,
  counterY: 50,
  outro: ['TODO سطر النتيجة'],
  outroFrom: ${t.outroFrom},
  outroFrames: ${t.outroFrames},
  revealFrom: ${t.revealFrom},
  actionFrom: ${t.actionFrom},
  actionFrames: ${t.actionFrames},
  cameraFrom: [7.5, 3.2, 6.5],
  cameraTo: [6.6, 2.6, 5.6],
  target: [0, 0, 0],
  fov: 32,
  showGuides: false,
};
`);

fs.writeFileSync(path.join(dir, 'Model.tsx'), `// Placeholder model: replace with the real device built from primitives (original geometry).
// Rules: everything is a pure function of \`s\` (no useFrame / clocks). Context parts fade with
// s.reveal; the explained part stays solid and orange; the mechanism moves with s.action.
import React from 'react';
import type {CutawayModel} from '../../templates/cutaway/CutawayReel';

export const Model: CutawayModel = ({s}) => (
  <group>
    {/* housing (familiar outside) */}
    <mesh>
      <boxGeometry args={[2.4, 3.2, 1.6]} />
      <meshStandardMaterial color="#2a2d33" transparent opacity={1 - 0.8 * s.reveal} depthWrite={s.reveal < 0.01} />
    </mesh>
    {/* focus part (what the label names) */}
    <mesh position={[0, -0.6 + 1.2 * s.action, 0]}>
      <cylinderGeometry args={[0.5, 0.5, 0.4, 32]} />
      <meshStandardMaterial color="#ff8a1f" emissive="#ff8a1f" emissiveIntensity={0.2 + 0.6 * s.focusGlow} />
    </mesh>
  </group>
);
`);

fs.writeFileSync(path.join(dir, 'index.tsx'), `import React from 'react';
import {Composition} from 'remotion';
import {CutawayTextPreview, makeCutawayReel} from '../../templates/cutaway/CutawayReel';
import {cutawaySchema} from '../../templates/cutaway/schema';
import {Model} from './Model';
import {defaults, FPS, FRAMES} from './storyboard';

const Reel = makeCutawayReel(Model);

export const ${name}Episode: React.FC = () => (
  <>
    <Composition id="${name}Reel" component={Reel} schema={cutawaySchema} defaultProps={defaults} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} />
    <Composition id="${name}TextPreview" component={CutawayTextPreview} schema={cutawaySchema} defaultProps={{...defaults, showGuides: true}} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} />
  </>
);
`);

fs.writeFileSync(path.join(dir, 'BRIEF.md'), `# ${args.topic}

- slug: \`${slug}\` · ${seconds} s · 1080×1920 · ${fps} fps (${total} frames)
- compositions: \`${name}Reel\`, \`${name}TextPreview\`

## Mechanism (checked)
TODO — sources + cause → effect chain.

## Storyboard
| beat | frames | visual | text |
|---|---|---|---|
| hook | 0–${t.hookFrames} | الجهاز بشكله المألوف | هوك |
| reveal | ${t.revealFrom}–${t.actionFrom} | كشف الجزء المخفي + تلوينه | تسمية |
| mechanism | ${t.actionFrom}–${t.outroFrom} | السبب → النتيجة بنفس الكادر | رقم + سطر |
| payoff | ${t.outroFrom}–${total} | النتيجة | سطر النتيجة |
`);

// register in Root.tsx
const rootFile = path.join(root, 'src/Root.tsx');
let src = fs.readFileSync(rootFile, 'utf8');
src = src.replace('// @episodes-imports', `import {${name}Episode} from './episodes/${slug}';\n// @episodes-imports`);
src = src.replace('{/* @episodes-compositions', `<${name}Episode />\n      {/* @episodes-compositions`);
fs.writeFileSync(rootFile, src);

console.log(`Created src/episodes/${slug}/ and registered ${name}Reel + ${name}TextPreview in Root.tsx`);
console.log(`Preview:  npm run studio   →  Episodes/${name}TextPreview, then ${name}Reel`);
console.log(`Render:   npx remotion render src/index.ts ${name}Reel out/${slug}.mp4 --codec=h264 --pixel-format=yuv420p --enforce-audio-track`);
