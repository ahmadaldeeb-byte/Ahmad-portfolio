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
| `TextMotionPreview` | hook + part label + number of the gimbal episode, without WebGL, with reel safe zones and the projected moving-part silhouette. Same components and same props as the reel. |
| `GimbalTiltReel` | pilot: «كيف الجيمبل بثبّت اتجاه الكاميرا لما تميل إيدك؟» — 8 s, 240 frames |
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

## Rendering without a GPU
`remotion.config.ts` sets `--gl=swangle` (SwiftShader). Passing `--gl=angle` on a GPU-less machine fails
with “Error creating WebGL context”. On a machine with a GPU, `--gl=angle` is faster.
