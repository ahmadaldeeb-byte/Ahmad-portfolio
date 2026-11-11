---
name: remotion-3d-skill
description: >-
  Compose, customize, and render deterministic 3D animation video assets using Three.js and Remotion.
  Use when the user requests 3D explainer videos, low-poly dioramas, motion graphics, structural cutaways,
  metropolis cityscapes, or 3D product showcase scenes for video rendering.
---

# Remotion 3D Animation Asset Skill

This standalone skill provides an automated workflow for composing, customizing, and rendering deterministic 3D video scenes in Remotion using declarative Three.js / React Three Fiber components.

---

## 1. Prime Directive: The Deterministic Frame Contract

> [!IMPORTANT]
> **Zero Frame-Drift Rule**: Never use `Date.now()`, `requestAnimationFrame()`, or `Clock.getDelta()`.
> All 3D transformations must be pure functions of `frame` and `fps` via Remotion hooks (`useCurrentFrame`, `useVideoConfig`, `spring`, `interpolate`).

---

## 2. Standard Workflow for AI Agents

When tasked with generating or modifying a 3D video scene in any Remotion project:

### Step 1: Ensure Required Dependencies
The target Remotion project must have Three.js and React Three Fiber installed:
```bash
npm install three @react-three/fiber @remotion/three zod
npm install -D @types/three
```

### Step 2: Inspect Available Assets
Browse the catalog in [references/asset-catalog.md](./references/asset-catalog.md) or run:
```bash
npx tsx scripts/list-assets.ts
```

### Step 3: Choose Composition Template
- **Diorama Explainer (9:16 Vertical)**: Architectural/structural cutaways, engineering callouts, characters (`<StructuralCutaway />`, `<TechnicalCallout3D />`, `<LowPolyCharacter />`, `<DioramaStage />`).
- **Urban Metropolis Diorama (9:16 Vertical)**: Modern skyscrapers, miniature houses, vehicles, street props (`<CurtainWallSkyscraper />`, `<ModernCurvedTower />`, `<MiniatureHouse />`, `<LowPolyCar />`, `<LollipopTree />`).
- **Tech Showcase (16:9 Landscape)**: Motion graphics, floating glass UI, crypto coins, animated 3D bar charts (`<FloatingGlassCard />`, `<CryptoToken3D />`, `<Animated3DBarChart />`, `<InfiniteCyberGrid />`).
- Consult [references/composition-templates.md](./references/composition-templates.md) for full blueprints.

### Step 4: Scaffold Scene & Inject Component Templates
To scaffold a new scene and automatically inject the self-contained 3D asset templates into the target project:
```bash
npx tsx scripts/scaffold-scene.ts --name=MyNewScene --template=diorama-explainer --inject
```
This generates:
- Scene component in `src/scenes/MyNewScene.tsx`
- Self-contained components in `src/components/3d/`

Register `<MyNewScene />` in your Remotion `Root.tsx` under `<Composition />`.

### Step 5: Configure Cinematic Camera
Apply camera recipes from [references/camera-recipes.md](./references/camera-recipes.md):
- `handheldDrift`: Organic micro-motion for explainers.
- `orbit`: Turntable rotation for product/diorama showcase.
- `pushIn`: Dynamic dolly zoom.

### Step 6: Verify & Render Video
Always verify a preview frame first:
```bash
npx remotion still src/index.ts <CompositionId> out/preview.jpeg --frame=30
```
Render full MP4:
```bash
npx remotion render src/index.ts <CompositionId> out/<CompositionId>.mp4
```
