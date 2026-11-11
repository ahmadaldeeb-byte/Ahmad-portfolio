# Agent Guidelines & Development Standards

Welcome to the **3D Assets for Remotion** codebase (`/home/light/Dev/3d-assets`). This repository contains a deterministic 3D animation library powered by Three.js and React Three Fiber, designed specifically for offline and real-time video rendering in Remotion, and paired with an Antigravity Agent Skill.

All AI agents, contributors, and automated tooling operating within this repository MUST strictly abide by the rules and conventions defined in this document.

---

## 1. Prime Directive: The Deterministic Frame Contract

> [!CAUTION]
> **NEVER USE REAL-TIME CLOCKS OR ASYNCHRONOUS TICKS FOR ANIMATION.**
> In Remotion, video is rendered frame-by-frame offline. Real-time clocks will desynchronize, causing stutter, missed keyframes, and non-deterministic visual glitches.

### Forbidden APIs in Animation Loops:
- ❌ `Date.now()` or `performance.now()`
- ❌ `requestAnimationFrame()`
- ❌ `THREE.Clock.getDelta()` or `THREE.Clock.getElapsedTime()`
- ❌ `Math.random()` during render cycles (use seeded noise or deterministic hash of `frame`)
- ❌ `setTimeout` or `setInterval` for motion timing

### Mandated Animation Pattern:
Every 3D transformation (position, rotation, scale, material property, camera pose) MUST be a pure, deterministic function of:
$$\mathbf{State} = f(\text{frame}, \text{fps}, \text{durationInFrames})$$

```typescript
// ✅ CORRECT: Deterministic frame calculation
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

export const RotatingMesh = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Deterministic spring animation
  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 }
  });

  // Deterministic constant rotation: 1 full turn every 60 frames
  const rotationY = (frame / 60) * Math.PI * 2;

  return (
    <mesh rotation={[0, rotationY, 0]} scale={[scale, scale, scale]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#4f46e5" />
    </mesh>
  );
};
```

---

## 2. Repository Architecture & Layout

```text
remotion-3d-skill/
├── SKILL.md                          # Universal Agent Skill definition & triggers
├── references/                       # Detailed catalogs & composition blueprints
│   ├── asset-catalog.md              # 25+ 3D components & prop specifications
│   ├── camera-recipes.md             # Camera motion choreography
│   └── composition-templates.md      # Vertical & landscape blueprints
├── scripts/                          # Standalone CLI tools & code injectors
│   ├── list-assets.ts                # Asset catalog inspection CLI
│   └── scaffold-scene.ts             # Scene generator & template injector
├── templates/                        # Injectable 3D assets, math & container
│   ├── assets/                       # Reusable 3D components (R3F)
│   ├── core/                         # Pure deterministic math & lighting
│   ├── remotion/                     # Remotion canvas adapters & camera rigs
│   └── scenes/                       # Example reference scenes
├── .agents/skills/remotion-3d-skill/ # Antigravity agent discovery
├── .claude/skills/remotion-3d-skill/ # Claude Code agent discovery
├── .cursor/rules/                    # Cursor IDE rules
├── AGENTS.md                         # This file
├── CLAUDE.md                         # Claude Code guidelines
├── README.md                         # Quickstart & installation guide
├── LICENSE                           # MIT License
└── package.json                      # Standalone CLI dependencies
```

---

## 3. Component Design & Prop Conventions

1. **Declarative & Modular**: Every 3D asset must be a self-contained React Three Fiber component.
2. **Prop Validation via Zod**: Every component must expose a corresponding Zod schema for runtime validation and agent prop introspection:
   ```typescript
   import { z } from 'zod';

   export const stickman3DPropsSchema = z.object({
     action: z.enum(['idle', 'walk', 'wave', 'point', 'jump']).default('idle'),
     color: z.string().default('#ffffff'),
     scale: z.number().default(1),
     position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
   });

   export type Stickman3DProps = z.infer<typeof stickman3DPropsSchema>;
   ```
3. **No Hidden Global State**: Props must directly configure materials, dimensions, and animation offsets. Do not rely on uninitialized singleton states.
4. **Performance Awareness**:
   - Reuse geometries and materials where possible using Three.js caching.
   - Avoid instantiating heavy meshes inside per-frame render routines.

---

## 4. Git Commit Standards (Structured & Conventional)

All commits in this repository MUST follow the **Conventional Commits** specification. Commits must be atomic, focused, and provide descriptive commit messages.

### Format:
```text
<type>(<scope>): <imperative summary>

[optional body explaining context, changes, and motivation]
```

### Allowed Types:
- `feat`: A new 3D asset, animation helper, or skill capability
- `fix`: Bug fix in rendering, math calculation, or asset geometry
- `docs`: Documentation updates, PRD changes, or AGENTS.md revisions
- `style`: Formatting, missing semi-colons, lint adjustments
- `refactor`: Code restructuring without changing behavior
- `test`: Adding or updating render tests or math unit tests
- `chore`: Tooling, dependency updates, build configurations

### Allowed Scopes:
- `core`: Math helpers, frame clock, lighting rigs, material presets
- `assets`: 3D meshes (characters, mograph, stages, particles, cameras)
- `remotion`: Remotion canvas adapter, compositions, studio setup
- `skill`: Agent Skill, CLI scaffolders, catalogs
- `repo`: Workspace config, gitignore, root scripts

### Examples of Good Commits:
- `feat(core): implement deterministic spring3D and vector interpolation`
- `feat(assets): add procedural Stickman3D component with walk cycle`
- `docs(repo): add PRD and AGENTS guidelines for 3D asset library`
- `chore(deps): configure workspace monorepo and three.js dependencies`

---

## 5. Agent Skill Guidelines (`.agents/skills/remotion-3d-assets`)

When an agent needs to compose a new 3D video scene or asset:
1. **Catalog Lookup**: Read `.agents/skills/remotion-3d-assets/references/asset-catalog.md` first.
2. **Scaffold Scene**: Run `npx tsx .agents/skills/remotion-3d-assets/scripts/scaffold-scene.ts --template=<name>` to generate boilerplate code.
3. **Keep SKILL.md Lean**: Follow progressive disclosure. Keep high-level procedures in `SKILL.md` and deep reference tables in `references/`.
4. **Verification Step**: Always verify that the generated composition can be previewed or rendered:
   ```bash
   # Test frame render
   npx remotion still src/index.ts <CompositionId> out/preview.png --frame=30
   ```

---

## 6. Verification and Quality Checklist

Before completing any task or pushing changes, verify:
- [ ] TypeScript compiles cleanly: `npx tsc --noEmit`
- [ ] No non-deterministic clocks (`Date.now()`, `Clock.getDelta()`) are used in 3D animation loops.
- [ ] Assets have sensible default props and exported Zod schemas.
- [ ] Commits are structured and follow the Conventional Commits format.
- [ ] Remotion Studio runs without console errors.
