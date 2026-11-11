# GitHub Copilot Instructions for Remotion 3D Skill

## Skill: Remotion 3D Animation Asset Skill

### Architectural Guidelines
- **Deterministic 3D Rendering**: Remotion renders video offline frame-by-frame. Never suggest or write code using real-time timers (`Date.now()`, `Clock.getDelta()`, `requestAnimationFrame()`, or `setTimeout`).
- **State Calculation**: All 3D rotations, translations, scaling, and camera poses must be pure functions of `(frame, fps)` using `useCurrentFrame()` and `useVideoConfig()`.
- **Animations**: Use Remotion's built-in `spring()` and `interpolate()` helpers or deterministic math utilities in `templates/core`.
- **Components & Templates**: Ready-to-use 3D component templates are organized under `templates/` (characters, explainer cutaways, skyscrapers, houses, cars, camera rigs).

### Common Commands
- `npx tsx scripts/list-assets.ts`: Display catalog of 25+ 3D components and props.
- `npx tsx scripts/scaffold-scene.ts --name=MyScene --template=diorama-explainer --inject`: Scaffold scene and inject local 3D templates into target project.
