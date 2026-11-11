# Camera Choreography & Recipes

This guide outlines cinematic camera presets and movement patterns for Remotion 3D scenes using `<CinematicCamera />`.

---

## 1. Overview
The camera is purely deterministic, calculating position, rotation, and field-of-view from `frame` and `fps`.

```typescript
import { CinematicCamera } from '@3d-assets/remotion';

<CinematicCamera
  mode="handheldDrift"
  position={[0, 5.5, 11.5]}
  target={[0, 1.2, 0]}
  fov={38}
  shakeIntensity={0.06}
/>
```

---

## 2. Presets & Use Cases

### Recipe A: Handheld Explainer (9:16 Vertical Shorts/Reels)
Adds an organic, subtle human camera operator feel, ideal for explainer videos, educational dioramas, and mobile shorts.
```typescript
<CinematicCamera
  mode="handheldDrift"
  position={[0, 5.5, 11.5]}
  target={[0, 1.2, 0]}
  fov={38}
  shakeIntensity={0.05} // Subtle float
/>
```

### Recipe B: Orbital Turntable (Product / Token Reveal)
Continuously rotates around the target object in a smooth 360-degree circle.
```typescript
<CinematicCamera
  mode="orbit"
  position={[0, 3.8, 9.2]}
  target={[0, 1.2, 0]}
  orbitSpeed={0.12} // 1 rotation every ~8 seconds @ 30fps
  orbitRadius={9.2}
  fov={42}
/>
```

### Recipe C: Dramatic Push-In (Focus on Reveal / Problem)
Smoothly dolly-zooms closer to the focal point as the video progresses.
```typescript
<CinematicCamera
  mode="pushIn"
  position={[0, 4, 14]}
  target={[0, 1, 0]}
  pushInDistance={5}
  fov={35}
/>
```

### Recipe D: Static Isometric High-Angle
Classic low-poly miniature perspective with zero motion, allowing scene animations to take full focus.
```typescript
<CinematicCamera
  mode="static"
  position={[8, 10, 8]}
  target={[0, 0, 0]}
  fov={30}
/>
```
