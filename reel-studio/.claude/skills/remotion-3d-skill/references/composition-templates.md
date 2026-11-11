# Ready-Made Composition Templates

This reference contains ready-to-run composition blueprints for agents and developers.

---

## 1. Template: `DioramaExplainer` (9:16 Vertical Mobile Video)

**Best for**: Architectural, engineering, structural, or physical concept explainers.

```tsx
import React from 'react';
import { ThreeCanvasContainer, CinematicCamera } from '@3d-assets/remotion';
import { DioramaSunlight } from '@3d-assets/core';
import {
  DioramaStage,
  StructuralCutaway,
  LowPolyCharacter,
  TechnicalCallout3D,
  ForceVectorArrow,
} from '@3d-assets/assets';

export const DioramaExplainerScene: React.FC = () => {
  return (
    <ThreeCanvasContainer clearColor="#e8dfd5">
      <DioramaSunlight intensity={1.3} sunPosition={[7, 12, 8]} />

      <CinematicCamera
        mode="handheldDrift"
        position={[0, 5.5, 11.5]}
        target={[0, 1.2, 0]}
        fov={38}
        shakeIntensity={0.06}
      />

      <DioramaStage width={9} depth={9} position={[0, -0.8, 0]} showTrees={true} showFence={true} />

      <StructuralCutaway
        position={[0, 1.5, 0]}
        length={5.2}
        showCutaway={true}
        deflectionAmount={0.3}
        startSagFrame={20}
      />

      <LowPolyCharacter
        variant="worker"
        action="point"
        position={[-2.1, 0.9, 0.5]}
        scale={0.85}
        rotationY={0.6}
      />

      <ForceVectorArrow direction="down" position={[0, 2.9, 0]} length={1.0} animated={true} />

      <TechnicalCallout3D
        title="BESI TULANGAN"
        anchorPosition={[0.8, 1.25, 0.3]}
        badgeOffset={[1.2, 1.3, 0]}
        startFrame={15}
        badgeColor="#2563eb"
      />
      <TechnicalCallout3D
        title="SENGKANG"
        anchorPosition={[-0.7, 1.6, 0.3]}
        badgeOffset={[-1.2, 1.3, 0]}
        startFrame={30}
        badgeColor="#dc2626"
      />
    </ThreeCanvasContainer>
  );
};
```

---

## 2. Template: `TechShowcase` (16:9 Landscape Video)

**Best for**: Software product demos, crypto/fintech announcements, data metric presentations.

```tsx
import React from 'react';
import { ThreeCanvasContainer, CinematicCamera } from '@3d-assets/remotion';
import { StudioLighting } from '@3d-assets/core';
import {
  InfiniteCyberGrid,
  FloatingGlassCard,
  CryptoToken3D,
  Animated3DBarChart,
  Stickman3D,
} from '@3d-assets/assets';

export const TechShowcaseScene: React.FC = () => {
  return (
    <ThreeCanvasContainer clearColor="#0b0f19" shadows={true}>
      <StudioLighting keyColor="#f8fafc" fillColor="#64748b" rimColor="#06b6d4" />

      <CinematicCamera
        mode="orbit"
        position={[0, 3.8, 9.2]}
        target={[0, 1.2, 0]}
        orbitSpeed={0.12}
        orbitRadius={9.2}
        fov={42}
      />

      <InfiniteCyberGrid size={36} divisions={36} colorCenterLine="#06b6d4" />

      <FloatingGlassCard position={[-3.2, 1.8, -0.5]} title="3D CORE ENGINE" color="#06b6d4" />
      <CryptoToken3D position={[0, 1.6, 0]} radius={1.15} rotationSpeed={0.35} />
      <Animated3DBarChart position={[3.0, 0, -0.5]} values={[3, 5, 4, 8, 10]} />
      <Stickman3D position={[0, 0, 2.2]} action="wave" scale={0.9} />
    </ThreeCanvasContainer>
  );
};
```
