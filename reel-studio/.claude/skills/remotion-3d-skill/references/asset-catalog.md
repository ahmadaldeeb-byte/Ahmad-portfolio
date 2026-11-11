# Remotion 3D Asset Library - Catalog & Reference

This catalog details all declarative 3D components available in `@3d-assets/assets` and `@3d-assets/remotion`.

---

## 1. Characters (`@3d-assets/assets`)

### `<LowPolyCharacter />`
Stylized low-poly humanoid character with customizable skins and deterministic animations.
- **Props**:
  - `variant`: `'casual'` | `'worker'` | `'scooterRider'` (default: `'casual'`)
  - `action`: `'idle'` | `'walk'` | `'wave'` | `'point'` | `'ride'` (default: `'idle'`)
  - `scale`: `number` (default: `1`)
  - `position`: `[x, y, z]` (default: `[0, 0, 0]`)
  - `rotationY`: `number` (rotation in radians)
  - `vestColor`: `string` (hex, default: `'#f97316'`)
  - `hairColor`: `string` (hex, default: `'#4a2e18'`)
  - `skinColor`: `string` (hex, default: `'#f5c396'`)
  - `pantsColor`: `string` (hex, default: `'#334155'`)

### `<Stickman3D />`
Minimalist 3D stickman with articulated joints and action poses.
- **Props**:
  - `action`: `'idle'` | `'walk'` | `'wave'` | `'point'` | `'jump'` (default: `'idle'`)
  - `color`: `string` (default: `'#ffffff'`)
  - `headColor`: `string` (default: `'#ffffff'`)
  - `limbThickness`: `number` (default: `0.06`)
  - `scale`: `number` (default: `1`)
  - `position`: `[x, y, z]`

---

## 2. Explainer & Structural Cutaway Assets (`@3d-assets/assets`)

### `<StructuralCutaway />`
Cross-section of a concrete beam showing interior steel rebars and stirrups (*sengkang*), featuring animated load deflection.
- **Props**:
  - `length`: `number` (beam length, default: `6`)
  - `height`: `number` (beam height, default: `0.8`)
  - `depth`: `number` (beam depth, default: `0.8`)
  - `showCutaway`: `boolean` (makes casing transparent to show interior rebars, default: `true`)
  - `deflectionAmount`: `number` (sagging depth under load, default: `0.25`)
  - `startSagFrame`: `number` (frame when deflection begins, default: `15`)
  - `position`: `[x, y, z]`
  - `rebarColor`: `string` (default: `'#2563eb'`)
  - `stirrupColor`: `string` (default: `'#dc2626'`)

### `<TechnicalCallout3D />`
3D-anchored pin with a leader line, anchor point, and floating badge with spring entrance.
- **Props**:
  - `title`: `string` (badge label)
  - `anchorPosition`: `[x, y, z]` (world point on object)
  - `badgeOffset`: `[dx, dy, dz]` (relative badge offset)
  - `startFrame`: `number` (trigger frame, default: `10`)
  - `badgeColor`: `string` (hex, default: `'#2563eb'`)

### `<ForceVectorArrow />`
Dynamic 3D directional arrow demonstrating force, pressure, tension, or sway.
- **Props**:
  - `direction`: `'down'` | `'up'` | `'left'` | `'right'` | `'sway'` (default: `'down'`)
  - `length`: `number` (default: `1.2`)
  - `color`: `string` (default: `'#2563eb'`)
  - `position`: `[x, y, z]`
  - `animated`: `boolean` (subtle pulse or sway)

---

## 3. Environments & Stages (`@3d-assets/assets`)

### `<DioramaStage />`
Floating 3D ground chunk with subsoil cross-section, top grass, faceted low-poly trees, and picket fence.
- **Props**:
  - `width`: `number` (default: `12`)
  - `depth`: `number` (default: `12`)
  - `groundColor`: `string` (default: Sage green)
  - `soilColor`: `string` (default: Brown earth)
  - `showTrees`: `boolean` (default: `true`)
  - `showFence`: `boolean` (default: `true`)
  - `position`: `[x, y, z]`

### `<InfiniteCyberGrid />`
Perspective infinite glowing grid floor with animated forward velocity.
- **Props**:
  - `size`: `number` (default: `40`)
  - `divisions`: `number` (default: `40`)
  - `colorCenterLine`: `string` (default: `'#06b6d4'`)
  - `colorGrid`: `string` (default: `'#1e293b'`)
  - `speed`: `number` (default: `0.5`)
  - `position`: `[x, y, z]`

### `<UrbanCityDiorama />`
Complete urban city diorama foundation slab with 2-lane asphalt road, crosswalk (zebra cross), sidewalks, streetlamps, traffic light, and trees.
- **Props**:
  - `width`: `number` (default: `16`)
  - `depth`: `number` (default: `14`)
  - `position`: `[x, y, z]`
  - `showProps`: `boolean` (default: `true`)

---

## 4. Architecture, Vehicles & Urban Elements (`@3d-assets/assets`)

### `<HighRiseTower />`
Modern low-poly glass skyscraper with repeating window bands, AC chiller box, and antenna mast with warning beacon.
- **Props**:
  - `height`: `number` (default: `9`)
  - `width`: `number` (default: `3`)
  - `depth`: `number` (default: `2.8`)
  - `facadeColor`: `string` (default: `'#94a3b8'`)
  - `windowColor`: `string` (default: `'#38bdf8'`)
  - `position`: `[x, y, z]`

### `<Townhouse />`
Stylized 2-3 story townhouse with terracotta roof, commercial shopfront awning, entrance door, and windows.
- **Props**:
  - `floors`: `number` (default: `3`)
  - `wallColor`: `string` (default: `'#f1f5f9'`)
  - `roofColor`: `string` (default: Terracotta)
  - `hasAwning`: `boolean` (default: `true`)
  - `position`: `[x, y, z]`

### `<LowPolyCar />`
Stylized city car / yellow taxi with rotating wheels, glowing headlights/taillights, and suspension bobbing.
- **Props**:
  - `variant`: `'taxi'` | `'sedan'` | `'van'` (default: `'taxi'`)
  - `color`: `string` (default: `'#facc15'`)
  - `speed`: `number` (units/sec, default: `3.5`)
  - `startPosition`: `[x, y, z]`
  - `direction`: `1` | `-1`

### `<LowPolyScooter />`
Scooter/vespa with seated low-poly rider, handlebar, spinning wheels, and vibration physics.
- **Props**:
  - `bodyColor`: `string` (default: `'#0284c7'`)
  - `speed`: `number` (default: `2.8`)
  - `startPosition`: `[x, y, z]`
  - `direction`: `1` | `-1`
  - `riderVariant`: `'casual'` | `'worker'`

### `<LowPolyCloud />`
Puffy low-poly faceted cloud drifting deterministically across the sky.
- **Props**:
  - `position`: `[x, y, z]`
  - `scale`: `number` (default: `1`)
  - `driftSpeed`: `number` (default: `0.3`)

### `<Streetlamp />` & `<TrafficLight />`
Urban infrastructure props with glowing fixtures.
- `Streetlamp`: `height`, `poleColor`, `lightColor`, `position`
- `TrafficLight`: `height`, `activeColor` (`'red'` | `'yellow'` | `'green'`), `position`

### `<LollipopTree />`
Stylized spherical canopy tree on a slender wooden trunk.
- **Props**:
  - `position`: `[x, y, z]`
  - `scale`: `number` (default: `1`)
  - `foliageColor`: `string` (hex, default: `'#52835f'`)
  - `trunkColor`: `string` (hex, default: `'#856041'`)

### `<CurtainWallSkyscraper />`
28-story translucent glass skyscraper with interior white floor slabs, structural columns, ground plaza, and perimeter blue barrier.
- **Props**:
  - `position`: `[x, y, z]`
  - `height`: `number` (default: `22`)
  - `width`: `number` (default: `3.8`)
  - `depth`: `number` (default: `3.4`)
  - `glassColor`: `string` (hex, default: `'#c2d6d0'`)
  - `glassOpacity`: `number` (default: `0.55`)
  - `floorCount`: `number` (default: `28`)
  - `showPlaza`: `boolean` (default: `true`)
  - `showBlueBarrier`: `boolean` (default: `true`)

### `<ModernCurvedTower />`
Semi-cylindrical curved glass skyscraper with tiered mechanical crown and antenna.
- **Props**:
  - `position`: `[x, y, z]`
  - `height`: `number` (default: `14`)
  - `radius`: `number` (default: `2.2`)
  - `glassColor`: `string` (default: `'#b0cecc'`)

### `<SteppedCommercialBlock />`
Mid-rise contemporary commercial building with setback terrace gardens and blue ribbon glass.
- **Props**:
  - `position`: `[x, y, z]`
  - `width`: `number` (default: `4.2`)
  - `depth`: `number` (default: `3.6`)
  - `facadeColor`: `string` (default: `'#f1f5f9'`)

### `<MiniatureHouse />`
Charming residential house with terracotta roof. Supports multiple architectural styles.
- **Props**:
  - `variant`: `'cottage'` | `'townhouse'` | `'apartment'` | `'villa'` (default: `'cottage'`)
  - `position`: `[x, y, z]`
  - `rotationY`: `number` (radians)
  - `scale`: `number` (default: `1`)
  - `wallColor`: `string` (default: `'#faf7f0'`)
  - `roofColor`: `string` (default: `'#d2543e'`)

### `<DistantSkyline />`
Stepped and matrix silhouette towers providing atmospheric background depth for cityscapes.
- **Props**:
  - `position`: `[x, y, z]` (default: `[0, 0, -20]`)
  - `scale`: `number` (default: `1`)
  - `tintColor`: `string` (default: `'#cfc8b6'`)

---

## 5. Motion Graphics & Data Visualizers (`@3d-assets/assets`)

### `<FloatingGlassCard />`
Frosted glass card with glowing border, decorative tag, chip node, and spring entrance.
- **Props**:
  - `title`: `string`
  - `color`: `string` (glow color, default: `'#06b6d4'`)
  - `width`: `number` (default: `3.6`)
  - `height`: `number` (default: `2.2`)
  - `position`: `[x, y, z]`
  - `startFrame`: `number` (default: `5`)

### `<Animated3DBarChart />`
3D bar chart with staggered spring growth animation and glowing indicator caps.
- **Props**:
  - `values`: `number[]` (e.g. `[4, 7, 5, 9, 12]`)
  - `colors`: `string[]` (hex color array)
  - `position`: `[x, y, z]`
  - `staggerDelay`: `number` (frames between bars)

### `<CryptoToken3D />`
Beveled 3D gold or neon coin with embossed emblem and continuous deterministic spin.
- **Props**:
  - `color`: `string` (default: `'#fbbf24'`)
  - `radius`: `number` (default: `1.2`)
  - `thickness`: `number` (default: `0.25`)
  - `rotationSpeed`: `number` (default: `0.4`)
  - `position`: `[x, y, z]`

---

## 5. Camera & Canvas (`@3d-assets/remotion`)

### `<ThreeCanvasContainer />`
Wrapper synchronizing Three.js rendering with Remotion's frame clock and WebGL setup.
- **Props**:
  - `children`: React Three Fiber nodes
  - `clearColor`: `string` (background color)
  - `shadows`: `boolean` (default: `true`)

### `<CinematicCamera />`
Deterministic camera rig that drives perspective camera transforms strictly from frame.
- **Props**:
  - `mode`: `'static'` | `'orbit'` | `'pushIn'` | `'handheldDrift'`
  - `position`: `[x, y, z]`
  - `target`: `[x, y, z]` (lookAt target)
  - `fov`: `number` (field of view, default: `40`)
  - `orbitSpeed`: `number` (default: `0.2`)
  - `shakeIntensity`: `number` (default: `0.05`)
