# CLAUDE.md — Claude Code Guidelines for Remotion 3D Skill

## Overview
This repository is a Standalone Universal Multi-Agent Skill for composing and rendering deterministic 3D Remotion video assets using Three.js and React Three Fiber.

---

## Essential Commands

```bash
# Inspect all available 3D components and prop types
npm run list-assets

# Scaffold a new scene and inject self-contained 3D templates into target project
npm run scaffold -- --name=MyNewScene --template=diorama-explainer --inject

# In target Remotion project, install 3D rendering dependencies:
npm install three @react-three/fiber @remotion/three zod
npm install -D @types/three
```

---

## Prime Directive: The Deterministic Frame Contract

> **CRITICAL**: Never use real-time clocks or asynchronous tick handlers for animation. Remotion renders frames deterministically offline.

### Forbidden APIs:
- ❌ `Date.now()`, `performance.now()`
- ❌ `requestAnimationFrame()`
- ❌ `THREE.Clock.getDelta()`, `THREE.Clock.getElapsedTime()`
- ❌ `Math.random()` during render cycles (use seeded noise or deterministic hash of `frame`)
- ❌ `setTimeout`, `setInterval`

### Required Pattern:
Every 3D property (position, rotation, scale, material, camera pose) must be a pure function of frame:
```typescript
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

const frame = useCurrentFrame();
const { fps } = useVideoConfig();
const rotationY = (frame / 60) * Math.PI * 2;
```

---

## References & Templates
- `SKILL.md` - Primary agent workflow and procedure
- `references/asset-catalog.md` - 25+ detailed 3D asset properties & Zod schemas
- `references/composition-templates.md` - 9:16 vertical & 16:9 landscape scene blueprints
- `references/camera-recipes.md` - Cinematic camera presets (`handheldDrift`, `orbit`, `pushIn`)
- `templates/` - Ready-to-inject components (`assets`, `core`, `remotion`, `scenes`)
