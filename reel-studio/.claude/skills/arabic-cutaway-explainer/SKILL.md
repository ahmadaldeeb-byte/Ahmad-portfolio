---
name: arabic-cutaway-explainer
description: Produce a short vertical Arabic explainer reel (1080×1920, Remotion + React Three Fiber) that shows how a device works inside - familiar device first, then a cutaway reveal of the hidden part, then the mechanism moving with cause and effect in one frame, with Apple-style Arabic kinetic type (hook, part label, number). Use when asked for "ريل يشرح كيف يشتغل…", "كيف بيشتغل … من جوّا", a cutaway / x-ray / inside-the-device explainer, or a new episode of the Reel Studio series. Input - the episode topic (an Arabic question).
---

# arabic-cutaway-explainer

Reel Studio's episode workflow. Project root: the folder holding this `.claude/` (`reel-studio/`).
Reference pilot: `src/episodes/gimbal/` (8 s gimbal tilt reel) - copy its level of detail.

## Inputs
- **Topic** (Arabic question), e.g. «كيف طنجرة الضغط بتطبخ أسرع؟». Optional: seconds (default 8), fps (30).

## Steps

### 1. Verify the mechanism before writing anything
Write the cause → effect chain in 3 steps (familiar view → hidden part → what moves and what result).
Check it against a reliable source (manufacturer docs, textbook, engineering reference); if you cannot
verify a claim, simplify it to what you can verify and say so. No invented numbers: the number on screen
must be physically right (angle, pressure, temperature, RPM...) or omitted.

### 2. Scaffold
```bash
npm run new-episode -- --slug <kebab-slug> --topic "<السؤال>" [--seconds 8]
```
Creates `src/episodes/<slug>/{storyboard.ts, Model.tsx, index.tsx, BRIEF.md}` and registers
`<Name>Reel` + `<Name>TextPreview` in `src/Root.tsx`. Fill `BRIEF.md` (mechanism + sources + storyboard)
and the `MECHANISM` comment in `storyboard.ts`.

### 3. Write the Arabic hook and on-screen text
- Hook: 2 short lines, ≤ 6 words total, spoken Levantine/white dialect, ends on the question
  (pilot: «إيدك بتميل… / والكاميرا لأ. كيف؟»). The hook states the *visible paradox*, not the answer.
- Part label: 1–3 words, the name of the revealed part. Number: one value + 2-line caption.
- Payoff: one idea, ≤ 5 words per line.
- Reading time: ≥ 0.35 s per word on screen after the entry finishes.

### 4. Storyboard with timings (30 fps)
Fill `BEATS` + defaults in `storyboard.ts` (all timing props are editable in Studio):
| beat | share of length | rule |
|---|---|---|
| hook | 0 – 26 % | whole device, slow oblique push-in; show the phenomenon already happening |
| reveal | 22 – 40 % | context parts → translucent ghost, focus part solid + orange; label enters **with** the reveal (≤ 10 frames after it starts) |
| mechanism | 40 – 82 % | cause and effect in the **same frame**; number rolls in sync with the motion (same easing) and leaves when the value stops being true |
| payoff | 82 – 100 % | result held still, payoff line |

### 5. Build the model and the scene
- 3D: follow `remotion-3d-skill` (deterministic frame contract, `<StructuralCutaway />` pattern:
  translucent casing with `depthWrite={false}`, solid coloured internals) and the official
  `remotion-markup/3d.md` rules (`<ThreeCanvas width height>`, no `useFrame`). Build original geometry
  from primitives in `Model.tsx`; drive everything from `s.reveal`, `s.action`, `s.focusGlow` (generic
  template `src/templates/cutaway/`) or write an episode rig like `episodes/gimbal/rig.ts` when the
  mechanism needs real kinematics. Put the label anchor (`labelAnchor`) on the explained part.
- 2D alternative (flows, arrows, fluid paths, side sections): use the `animated-svg` skill
  (HyperFrames + GSAP, `--lang ar`) when a flat section explains better than 3D. It needs a one-time
  `bash .claude/skills/animated-svg/scripts/setup.sh`.
- Precise modelling / `.blend` delivery: only if Blender is installed (`which blender`) - otherwise
  stay with primitives and say so.

### 6. Text: invoke `apple-motion` when building titles, labels and numbers
Load the `apple-motion` skill and use its measured motion through the shared Arabic components in
`src/text/ArabicMotion.tsx` (they wrap the patched `src/apple-motion/KineticText` + `Counter`):
- `ArabicHook` - `perWord` entry (Arabic words stay joined), fade-out.
- `PartLabel` - anchor dot → leader line draws on → label `slideUpMask`; label sits in empty space,
  only the leader touches the model.
- `ArabicNumber` - apple-motion `Counter` (gradient numerals, tabular figures) + Arabic caption.
Arabic rules (from official `remotion-markup/arabic-text.md`): `dir="rtl"`, no letter-spacing,
animate per word or per line; per letter only via `splitArabicLetters` (ZWJ). Fonts are vendored in
`public/fonts` (IBM Plex Sans Arabic, Cairo, Tajawal, Readex Pro) - choose with the `font` prop.

### 6b. Voice-over (ElevenLabs, Eleven v4)
1. `npm run vo -- models` - confirm the Eleven v4 model id (the tts step picks v4 automatically, warns
   and falls back to v3 / multilingual v2 if the account has no v4).
2. Library first: `npm run vo -- library --gender male --previews 1` (Arabic voices + preview mp3s in
   `public/vo/library/`), listen, then `npm run vo -- add --public-owner <id> --voice <id> --name "<name>"`.
3. If no library voice has the tone: Voice Design with `scripts/voiceover/voice-design.txt`
   (`npm run vo -- design --description-file scripts/voiceover/voice-design.txt --text-file <hook.txt>`),
   listen to the previews in `public/vo/design/`, then `save-design --generated <id> --name "<name>"`.
4. `npm run vo -- tts --voice <voice_id> --text-file <hook.txt> --out vo/<slug>-hook` writes the mp3 and
   `<slug>-hook.words.json` (word start/end from ElevenLabs timestamps, forced alignment as fallback).
5. Set `voiceover: 'vo/<slug>-hook'` and the cue props. `calculateMetadata` re-times the episode on
   the recording: on-screen hook words land on the spoken words (`cueLeadFrames` = 2 frames early, the
   apple-motion VO rule), the reveal starts on `revealCue`, the apple-motion part label on `labelCue`,
   the mechanism follows, and the duration grows to fit the voice. Pilot: `src/episodes/gimbal/voiceSync.ts`.
   Longer episodes (full ~30 s reel, several parts): drive every beat from an ordered list of cue
   phrases, as in `src/episodes/gimbal/` (`cues` → `cueFrames` in `voiceSync.ts`; the rig, camera views,
   labels and numbers all read `cueFrames`). Before a recording exists, estimate timings with
   `node scripts/voiceover/estimate.mjs --text-file <script> --out vo/<slug>` (writes `.temp.words.json`).
   Recording without API access: `node scripts/voiceover/manual-timing.mjs --audio <mp3> --text-file <script> --out vo/<slug>`
   (pause-mapped phrases, letter-weighted words; correct mid-phrase cues in `<slug>.fixes.json` after
   checking the audio envelope).
6. Review sound + motion together in Studio (`TextMotionPreviewVO`, `GimbalTiltReelVO`) before exporting.

### 7. Preview, then export
```bash
npm run studio                       # Remotion Studio → <Name>TextPreview, then <Name>Reel
npx remotion still src/index.ts <Name>Reel out/stills/f120.png --frame=120 --scale=0.5
```
Check in `<Name>TextPreview` (safe zones on): letters joined, words in RTL order, nothing outside the
green box during entry / hold / exit, label never over the moving part. Render stills of the reel at
hook / reveal / mechanism / payoff and look at them before the full render. Then:
```bash
npx remotion render src/index.ts <Name>Reel out/<slug>.mp4 --codec=h264 --pixel-format=yuv420p --color-space=bt709 --enforce-audio-track
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt -of compact out/<slug>.mp4
```
WebGL in a GPU-less container uses `swangle` (set in `remotion.config.ts`); do not pass `--gl=angle`
there. For upload rules see the `reel-export` skill.
