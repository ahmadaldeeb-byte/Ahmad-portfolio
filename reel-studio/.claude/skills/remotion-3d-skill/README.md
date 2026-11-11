# Remotion 3D Skill — Standalone Universal Agent Skill

A standalone, deterministic 3D animation skill for **Remotion**, powered by **Three.js** and **React Three Fiber**. Designed to be piloted autonomously by AI coding agents (**Google Antigravity**, **Anthropic Claude Code**, **Cursor**, **Windsurf**, **GitHub Copilot**, and **Cline**).

Turn natural language prompts into stunning 3D miniature explainers, structural cutaways, metropolis dioramas, and tech motion graphics.

---

## 🌟 Why This Skill?

1. **Zero Frame-Drift (Deterministic Frame Contract)**:
   - All 3D transformations, spring mechanics, and camera choreography are pure mathematical functions of Remotion's `frame` and `fps`.
   - Never uses `Date.now()`, `Clock.getDelta()`, or `requestAnimationFrame()`.
2. **25+ Reusable 3D Component Templates**:
   - **Characters**: `<LowPolyCharacter />` (casual, worker, scooterRider), `<Stickman3D />`.
   - **Architecture & Diorama**: `<CurtainWallSkyscraper />` (28-story glass tower), `<ModernCurvedTower />`, `<SteppedCommercialBlock />`, `<MiniatureHouse />`, `<DistantSkyline />`, `<LollipopTree />`.
   - **Vehicles & Infrastructure**: `<LowPolyCar />` (yellow taxi), `<LowPolyScooter />`, `<Streetlamp />`, `<TrafficLight />`, `<LowPolyCloud />`.
   - **Explainer Cutaways**: `<StructuralCutaway />` (concrete beam with interior steel rebars, stirrups, and animated load sag), `<TechnicalCallout3D />`, `<ForceVectorArrow />`.
   - **Motion Graphics**: `<FloatingGlassCard />`, `<Animated3DBarChart />`, `<CryptoToken3D />`, `<InfiniteCyberGrid />`.
3. **Self-Contained Code Injector**:
   - Easily injects the required 3D component source code into any target Remotion project (`--inject` flag).

---

## 🚀 How to Install This Skill

### Option 1: Global Installation for Google Antigravity
Clone this repository into your global Antigravity skills directory:
```bash
git clone https://github.com/yusqohid/remotion-3d-skill.git ~/.gemini/antigravity-cli/skills/remotion-3d-skill
```

### Option 2: Global Installation for Anthropic Claude Code
Clone this repository into your Claude Code skills directory:
```bash
git clone https://github.com/yusqohid/remotion-3d-skill.git ~/.claude/skills/remotion-3d-skill
```

### Option 3: Project-Level Installation
Clone directly into your Remotion project's agent skills folder:
```bash
git clone https://github.com/yusqohid/remotion-3d-skill.git .agents/skills/remotion-3d-skill
```

---

## 🤖 Multi-Agent Compatibility Matrix

| Agent / IDE | Configuration Entry Point | How It Works |
| :--- | :--- | :--- |
| **Google Antigravity** | `SKILL.md` & `AGENTS.md` | Native skill discovery & global frame contract rules |
| **Anthropic Claude Code** | `CLAUDE.md` & `.claude/skills/` | Claude Code project memory & native skill loader |
| **Cursor IDE** | `.cursor/rules/remotion-3d-skill.mdc` | Smart contextual rule on `**/*.tsx` / `**/*.ts` |
| **Windsurf (Cascade)** | `.windsurfrules` | Cascade workspace memory & deterministic constraint |
| **Cline / Roo Code** | `.clinerules` | System instructions for VS Code extension agents |
| **GitHub Copilot** | `.github/copilot-instructions.md` | Workspace copilot instructions |

---

## 🛠️ CLI Usage & Scaffolding

### 1. Inspect Available 3D Assets
```bash
npx tsx scripts/list-assets.ts
```

### 2. Scaffold a Scene into Any Remotion Project
Run the scaffolder with `--inject` to copy the required component templates directly into your project's `src/components/3d/`:
```bash
# Scaffold a 9:16 vertical diorama explainer
npx tsx scripts/scaffold-scene.ts --name=BridgeExplainer --template=diorama-explainer --ratio=9:16 --inject

# Scaffold a 9:16 metropolis cityscape diorama
npx tsx scripts/scaffold-scene.ts --name=CityDiorama --template=urban-city --inject

# Scaffold a 16:9 fintech motion graphics scene
npx tsx scripts/scaffold-scene.ts --name=FintechShowcase --template=tech-showcase --ratio=16:9 --inject
```

### 3. Target Project Dependencies
In the target Remotion project, ensure the 3D rendering packages are installed:
```bash
npm install three @react-three/fiber @remotion/three zod
npm install -D @types/three
```

---

## 📁 Repository Layout

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

## 📄 License
[MIT License](./LICENSE) - Free to use, adapt, and build upon.
