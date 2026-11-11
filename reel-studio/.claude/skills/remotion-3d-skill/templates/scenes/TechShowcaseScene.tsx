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

/**
 * 16:9 Landscape Video Composition (Tech & Motion Graphics Showcase)
 */
export const TechShowcaseScene: React.FC = () => {
  return (
    <ThreeCanvasContainer clearColor="#0b0f19" shadows={true}>
      {/* Dynamic 3-point studio lighting with cyan rim light */}
      <StudioLighting keyColor="#f8fafc" fillColor="#64748b" rimColor="#06b6d4" />

      {/* Cinematic orbital turntable camera */}
      <CinematicCamera
        mode="orbit"
        position={[0, 3.8, 9.2]}
        target={[0, 1.2, 0]}
        orbitSpeed={0.12}
        orbitRadius={9.2}
        fov={42}
      />

      {/* Infinite perspective cyber grid floor */}
      <InfiniteCyberGrid
        size={36}
        divisions={36}
        colorCenterLine="#06b6d4"
        colorGrid="#1e293b"
        speed={0.4}
        position={[0, -0.05, 0]}
      />

      {/* Floating 3D frosted glass card */}
      <FloatingGlassCard
        position={[-3.2, 1.8, -0.5]}
        title="3D CORE ENGINE"
        color="#06b6d4"
        startFrame={5}
      />

      {/* Center 3D rotating gold crypto token */}
      <CryptoToken3D
        position={[0, 1.6, 0]}
        radius={1.15}
        rotationSpeed={0.35}
        color="#fbbf24"
      />

      {/* Staggered rising 3D bar chart */}
      <Animated3DBarChart
        position={[3.0, 0, -0.5]}
        values={[3, 5, 4, 8, 10]}
        staggerDelay={5}
        spacing={0.9}
        barWidth={0.65}
      />

      {/* 3D Stickman greeting the camera */}
      <Stickman3D
        position={[0, 0, 2.2]}
        action="wave"
        color="#e2e8f0"
        scale={0.9}
      />
    </ThreeCanvasContainer>
  );
};
