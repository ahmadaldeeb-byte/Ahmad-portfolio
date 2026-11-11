# Reel Studio — ريلز عربية تشرح الأجهزة من جوّا

Remotion 4.0.542 · React 19.1 · @remotion/three + React Three Fiber 9 · three 0.187.
Vertical 1080×1920 · 30 fps. All graphics are original primitives; fonts are vendored (OFL).

```bash
npm install
npm run studio            # Remotion Studio → TextMotionPreview, Episodes/GimbalTiltReel
npm run render:gimbal     # → out/gimbal-tilt.mp4
npm run new-episode -- --slug pressure-cooker --topic "كيف طنجرة الضغط بتطبخ أسرع؟"
```

## Compositions
| id | what |
|---|---|
| `GimbalTiltReelVO` | **full reel (~30 s)** «كيف الجيمبل بثبّت اتجاه الكاميرا لما تميل إيدك؟» — tilt, sensor, roll, pan, payoff, timed on the voice-over |
| `TextMotionPreviewVO` | the full reel's text + voice without WebGL: live silhouette of the moving parts, safe zones, TEMP badge while timings are estimated |
| `GimbalTiltReel` / `TextMotionPreview` | approved 8 s pilot, frozen in `src/episodes/gimbal-pilot/` |
| `<Name>Reel` / `<Name>TextPreview` | added per episode by `npm run new-episode` |

Every text, font, size and timing is a prop (zod schema) — edit it in the Studio props panel.

## Layout
```
src/apple-motion/        apple-motion component library (+ Arabic patch, see PATCHES.md)
src/text/                ArabicMotion.tsx (ArabicHook, PartLabel, ArabicNumber), fonts, safe zones
src/episodes/gimbal/     storyboard.ts (beats + props), rig.ts (frame-driven kinematics + projection),
                         GimbalModel.tsx (3D cutaway), GimbalTiltReel.tsx, GimbalTextLayer.tsx
src/templates/cutaway/   generic episode template used by new-episode
scripts/new-episode.mjs  scaffolder
.claude/skills/          project skills (see below)
```

## Pilot: gimbal tilt (frames @30fps)
| frames | picture | text |
|---|---|---|
| 0–62 | whole gimbal, oblique push-in; wrist wobbles, camera already steady | «إيدك بتميل… / والكاميرا لأ. كيف؟» word by word |
| 54–96 | arms/motors turn to x-ray, tilt-motor cap slides off, stator/rotor + axis turn orange | «محور الميل» + leader pinned to the motor (64–196) |
| 96–196 | handle tilts +20° then −12°; tilt motor counter-rotates (3-frame lag = sensor→motor); lens level line stays flat; arcs show wrist vs. motor | «20°» rolls with the tilt + «المحرك بيلفّ / عكس إيدك» (96–152) |
| 198–240 | handle back home, camera never moved | «بيقيس الميل… / وبيعاكسه فورًا» |

## Skills (`.claude/skills/`)
| skill | source | status |
|---|---|---|
| `remotion-*` (13) | `remotion-dev/skills`, via `npx skills add` | installed, used (3d, arabic-text, render rules) |
| `remotion-3d-skill` | `yusqohid/remotion-3d-skill` | installed; StructuralCutaway/TechnicalCallout3D patterns used; its `scaffold-scene --inject` not used |
| `apple-motion` | `IskakovDamir/apple-motion` (`skill/apple-motion`) | installed; KineticText + Counter used in reel and preview |
| `arabic-cutaway-explainer` | this project | the episode workflow |
| `animated-svg` | `omkamal/animated-diagrams-skill` | files installed; needs `bash .claude/skills/animated-svg/scripts/setup.sh` (npm deps + Chrome for HyperFrames) |
| motion pack (15) | `stanleystaw/Motion-design-Stanley`, via `npx skills add` | installed; `reel-export` rules applied to the MP4 |
| Blender | — | not installed: no Blender in this environment |

## Full reel: voice-over timing
Script to record: `scripts/voiceover/gimbal-full.txt` (hook unchanged + tilt, sensor, roll, pan, payoff).
Until the recording exists the reel runs on `public/vo/gimbal-full.temp.words.json`
(`node scripts/voiceover/estimate.mjs --text-file scripts/voiceover/gimbal-full.txt --out vo/gimbal-full`).
Drop in the recording and align it (MP3 or WAV):
```bash
npm run vo -- align --audio <rec.mp3|rec.wav> --text-file scripts/voiceover/gimbal-full.txt --out vo/gimbal-full
```
That writes `public/vo/gimbal-full.mp3` + `.words.json`; `calculateMetadata` (`src/episodes/gimbal/voiceSync.ts`) then
re-times everything on the real speech: reveal on «هون», label on «محور الميل», sensor on «حسّاس», 20° on «عشرين»,
roll on «محور اللفّ» / «يمين» / «شمال», pan on «محور الدوران» / «بينعّم», 3 on «تلات محاور», payoff on «والنتيجة».
Cue phrases are props (`cues`), searched in order. The TEMP badge goes and the audio plays as soon as the file is there.

## Voice-over (ElevenLabs)
```bash
npm run vo -- models                                     # find Eleven v4
npm run vo -- library --gender male --previews 1         # Arabic library voices → public/vo/library/
npm run vo -- design --description-file scripts/voiceover/voice-design.txt --text-file scripts/voiceover/gimbal-hook.txt
npm run vo -- save-design --generated <generated_voice_id> --name "Reel narrator" --description-file scripts/voiceover/voice-design.txt
npm run vo -- tts --voice <voice_id> --text-file scripts/voiceover/gimbal-hook.txt --out vo/gimbal-hook
npm run studio                                           # TextMotionPreviewVO / GimbalTiltReelVO
npm run render:gimbal-vo                                 # → out/gimbal-tilt-vo.mp4
```
Uploaded MP3 instead: `npm run vo -- align --audio <file.mp3> --text-file scripts/voiceover/gimbal-hook.txt --out vo/gimbal-hook`.
Until `public/vo/gimbal-hook.words.json` exists, the VO compositions run on `gimbal-hook.temp.words.json`
(estimated timings, no audio, a TEMP badge in the preview) and switch to the recording automatically.
The key is read from `ELEVENLABS_API_KEY` (or injected by the cloud-session proxy). With a voice-over, the hook
words follow the speech, the reveal starts on «هون» and the label «محور الميل» lands on the spoken phrase
(`src/episodes/gimbal/voiceSync.ts`); cue words, lead frames and voice offset are props.

## Rendering without a GPU
`remotion.config.ts` sets `--gl=swangle` (SwiftShader). Passing `--gl=angle` on a GPU-less machine fails
with “Error creating WebGL context”. On a machine with a GPU, `--gl=angle` is faster.
