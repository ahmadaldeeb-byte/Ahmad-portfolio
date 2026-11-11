import React from 'react';
import * as THREE from 'three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvasContainer } from '@3d-assets/remotion';
import {
  CurtainWallSkyscraper,
  ModernCurvedTower,
  SteppedCommercialBlock,
  HighRiseTower,
  DistantSkyline,
  MiniatureHouse,
  LollipopTree,
  LowPolyCar,
  LowPolyScooter,
  LowPolyCharacter,
  LowPolyCloud,
  TechnicalCallout3D,
} from '@3d-assets/assets';
import { deterministicNoise1D } from '@3d-assets/core';
import { useThree } from '@react-three/fiber';

/**
 * Atmosphere component applying soft horizon fog to blend the ground into the creamy sky.
 */
const SceneAtmosphere: React.FC = () => {
  const { scene } = useThree();
  React.useLayoutEffect(() => {
    scene.fog = new THREE.Fog('#ece6db', 24, 75);
  }, [scene]);
  return null;
};

/**
 * Custom Cinematic Camera for the Recreated & Improved Metropolis Scene.
 * Recreates the exact elevated perspective from Reference Image #1 with wide depth of field.
 */
const MetropolisCamera: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { camera } = useThree();

  React.useLayoutEffect(() => {
    const progress = frame / durationInFrames;
    const timeSec = frame / fps;

    // Organic handheld micro-shake
    const shakeX = deterministicNoise1D(timeSec * 0.7, 55) * 0.04;
    const shakeY = deterministicNoise1D(timeSec * 0.7, 155) * 0.04;

    // Camera framed so that the hero skyscraper, side buildings, and foreground street are all visible
    const camX = 2.0 - progress * 0.6 + shakeX;
    const camY = 16.0 + progress * 1.8 + shakeY;
    const camZ = 35.5 - progress * 2.5;

    const targetX = 0;
    const targetY = 8.5 + progress * 2.0;
    const targetZ = -1.8;

    camera.position.set(camX, camY, camZ);
    camera.lookAt(new THREE.Vector3(targetX, targetY, targetZ));
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      (camera as THREE.PerspectiveCamera).fov = 42;
      camera.updateProjectionMatrix();
    }
  }, [camera, frame, fps, durationInFrames]);

  return null;
};

/**
 * Faithful Recreation & Enhancement of Reference Image #1.
 */
export const UrbanCityScene: React.FC = () => {
  return (
    <ThreeCanvasContainer clearColor="#ece6db">
      {/* 1. Camera & Horizon Atmosphere */}
      <MetropolisCamera />
      <SceneAtmosphere />

      {/* 2. Soft Daylight Lighting (Recreating the Warm Diffuse Reference Atmosphere) */}
      <directionalLight
        position={[16, 32, 18]}
        intensity={1.3}
        color="#fffbf2"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={75}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={32}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0004}
      />
      <ambientLight intensity={0.65} color="#f5efe4" />
      <hemisphereLight args={['#faf6ed', '#dcd6c4', 0.45]} position={[0, 30, 0]} />

      {/* 3. Vast Ground Plane in Authentic Khaki-Sandy Tone (Seamlessly blends into fog) */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[160, 160]} />
        <meshStandardMaterial color="#d9d3c1" roughness={0.95} flatShading />
      </mesh>

      {/* 4. Distant Skyline Background (Stepped towers & Matrix dotted high-rises from Reference #1) */}
      <DistantSkyline position={[0, 0, -16]} scale={1.2} tintColor="#cfc8b6" />

      {/* 5. Floating Soft Low-Poly Clouds High in the Sky */}
      <LowPolyCloud position={[-8, 22, -8]} scale={2.0} driftSpeed={0.3} color="#f8f6f0" opacity={0.8} />
      <LowPolyCloud position={[8, 24, -10]} scale={1.6} driftSpeed={0.2} color="#f8f6f0" opacity={0.8} />

      {/* 6. THE HERO CURTAIN-WALL SKYSCRAPER (Centerpiece from Reference Image #1) */}
      <CurtainWallSkyscraper
        position={[0, 0, -1.8]}
        height={23.0}
        width={4.2}
        depth={3.8}
        glassColor="#c2d6d0"
        glassOpacity={0.52}
        floorCount={28}
        showPlaza={true}
        showBlueBarrier={true}
      />

      {/* 7. ARCHITECTURAL IMPROVEMENTS (Visible within the 9:16 frame width!) */}
      {/* Mid-Ground Left: Modern Curved Glass Skyscraper */}
      <ModernCurvedTower
        position={[-5.2, 0, -4.8]}
        height={15.0}
        radius={1.8}
        glassColor="#b5cecc"
      />

      {/* Mid-Ground Right: Stepped Contemporary Commercial Block with Rooftop Gardens */}
      <SteppedCommercialBlock
        position={[5.2, 0, -4.5]}
        width={3.6}
        depth={3.4}
        facadeColor="#f1f5f9"
      />

      {/* Flanking Office High-Rises in the Background */}
      <HighRiseTower
        position={[-8.5, 0, -9.0]}
        height={16.0}
        width={3.2}
        depth={3.0}
        facadeColor="#94a3b8"
        windowColor="#38bdf8"
      />
      <HighRiseTower
        position={[8.5, 0, -8.5]}
        height={16.5}
        width={3.2}
        depth={3.0}
        facadeColor="#cbd5e1"
        windowColor="#0284c7"
      />

      {/* 8. MINIATURE RESIDENTIAL VILLAGE SURROUNDING THE TOWER BASE (From Reference #1) */}
      {/* Left village cluster (varied cottages, townhouses, and villas) */}
      <MiniatureHouse variant="cottage" position={[-2.8, 0, 1.4]} rotationY={0.1} />
      <MiniatureHouse variant="townhouse" position={[-3.8, 0, 1.8]} rotationY={-0.15} />
      <MiniatureHouse variant="villa" position={[-4.8, 0, 1.2]} rotationY={0.3} />
      <MiniatureHouse variant="cottage" position={[-3.0, 0, 2.7]} rotationY={-0.2} />
      <MiniatureHouse variant="apartment" position={[-4.2, 0, 2.9]} rotationY={0.1} />
      <MiniatureHouse variant="cottage" position={[-5.5, 0, 2.5]} rotationY={0.25} />
      <MiniatureHouse variant="townhouse" position={[-3.4, 0, 0.2]} rotationY={-0.4} />
      <MiniatureHouse variant="cottage" position={[-4.6, 0, -0.4]} rotationY={0.2} />

      {/* Right village cluster */}
      <MiniatureHouse variant="townhouse" position={[3.0, 0, 1.5]} rotationY={-0.2} />
      <MiniatureHouse variant="cottage" position={[4.0, 0, 2.0]} rotationY={0.15} />
      <MiniatureHouse variant="apartment" position={[5.2, 0, 1.4]} rotationY={-0.3} />
      <MiniatureHouse variant="villa" position={[3.2, 0, 2.8]} rotationY={0.2} />
      <MiniatureHouse variant="cottage" position={[4.5, 0, 2.9]} rotationY={-0.1} />
      <MiniatureHouse variant="townhouse" position={[5.8, 0, 2.6]} rotationY={0.35} />
      <MiniatureHouse variant="cottage" position={[3.6, 0, 0.2]} rotationY={0.4} />
      <MiniatureHouse variant="villa" position={[4.8, 0, -0.3]} rotationY={-0.2} />

      {/* Rear miniature houses flanking the plaza */}
      <MiniatureHouse variant="cottage" position={[-3.2, 0, -3.2]} rotationY={0.5} />
      <MiniatureHouse variant="townhouse" position={[-4.2, 0, -2.6]} rotationY={-0.3} />
      <MiniatureHouse variant="cottage" position={[3.2, 0, -3.0]} rotationY={-0.4} />
      <MiniatureHouse variant="cottage" position={[4.2, 0, -2.5]} rotationY={0.2} />

      {/* 9. LOLLIPOP TREES SCATTERED NATURALLY (Matching Image #1) */}
      {/* Front road & sidewalk trees */}
      <LollipopTree position={[-6.2, 0, 3.8]} scale={1.0} />
      <LollipopTree position={[-4.5, 0, 3.7]} scale={0.9} />
      <LollipopTree position={[-2.2, 0, 3.8]} scale={1.05} />
      <LollipopTree position={[2.0, 0, 3.8]} scale={0.95} />
      <LollipopTree position={[4.2, 0, 3.7]} scale={1.05} />
      <LollipopTree position={[6.0, 0, 3.8]} scale={1.0} />

      {/* Inner village trees */}
      <LollipopTree position={[-2.0, 0, 1.8]} scale={0.85} />
      <LollipopTree position={[-3.4, 0, 1.0]} scale={0.9} />
      <LollipopTree position={[-5.2, 0, 1.9]} scale={0.95} />
      <LollipopTree position={[2.2, 0, 1.2]} scale={0.88} />
      <LollipopTree position={[3.6, 0, 1.3]} scale={0.92} />
      <LollipopTree position={[5.0, 0, 2.2]} scale={0.95} />
      <LollipopTree position={[2.6, 0, -0.6]} scale={0.85} />
      <LollipopTree position={[-2.4, 0, -0.5]} scale={0.85} />

      {/* 10. FOREGROUND DIAGONAL AVENUE & INFRASTRUCTURE */}
      <group position={[0, 0.02, 4.8]} rotation={[-Math.PI / 2, 0, -0.07]}>
        {/* Asphalt Road Surface */}
        <mesh receiveShadow>
          <planeGeometry args={[36, 2.4]} />
          <meshStandardMaterial color="#536273" roughness={0.85} />
        </mesh>

        {/* Center Dashed Markings */}
        {Array.from({ length: 16 }).map((_, i) => (
          <mesh key={i} position={[-18 + i * 2.3, 0, 0.005]}>
            <planeGeometry args={[1.2, 0.1]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
        ))}

        {/* Crosswalk Zebra Crossing */}
        <group position={[0.5, 0, 0.006]}>
          {Array.from({ length: 7 }).map((_, i) => (
            <mesh key={i} position={[0, -0.85 + i * 0.28, 0]}>
              <planeGeometry args={[1.2, 0.16]} />
              <meshBasicMaterial color="#f8fafc" />
            </mesh>
          ))}
        </group>
      </group>

      {/* 11. DYNAMIC VEHICLES ON THE ROAD (Deterministic Frame Physics) */}
      {/* Yellow City Taxi traveling Eastbound (+X) */}
      <LowPolyCar
        variant="taxi"
        color="#facc15"
        speed={2.8}
        startPosition={[-10.0, 0.22, 5.2]}
        direction={1}
        scale={0.7}
      />

      {/* Blue Scooter Rider traveling Westbound (-X) */}
      <LowPolyScooter
        bodyColor="#0284c7"
        speed={2.2}
        startPosition={[8.0, 0.22, 4.5]}
        direction={-1}
        scale={0.65}
        riderVariant="casual"
      />

      {/* 12. PEDESTRIAN CHARACTERS */}
      <LowPolyCharacter
        variant="worker"
        action="wave"
        position={[1.6, 0.05, 3.4]}
        scale={0.65}
        rotationY={-0.3}
      />
      <LowPolyCharacter
        variant="casual"
        action="walk"
        position={[-1.2, 0.05, 3.4]}
        scale={0.65}
        rotationY={Math.PI / 2}
      />

      {/* 13. TECHNICAL EXPLAINER CALLOUT (Matching Reference Subtitle Card) */}
      <TechnicalCallout3D
        title="28 LANTAI"
        anchorPosition={[0, 8.5, 0.2]}
        badgeOffset={[1.8, 1.8, 0]}
        startFrame={15}
        badgeColor="#1d4ed8"
      />
    </ThreeCanvasContainer>
  );
};
