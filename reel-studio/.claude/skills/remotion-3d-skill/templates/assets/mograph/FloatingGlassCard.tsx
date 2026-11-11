import React from 'react';
import * as THREE from 'three';
import { useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { z } from 'zod';
import { deterministicBob } from '@3d-assets/core';

export const floatingGlassCardPropsSchema = z.object({
  title: z.string().default('FEATURE REVEAL'),
  color: z.string().default('#06b6d4'), // Cyan accent
  width: z.number().default(3.6),
  height: z.number().default(2.2),
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 1.8, 0]),
  startFrame: z.number().default(5),
});

export type FloatingGlassCardProps = z.input<typeof floatingGlassCardPropsSchema>;

export const FloatingGlassCard: React.FC<FloatingGlassCardProps> = ({
  title = 'FEATURE REVEAL',
  color = '#06b6d4',
  width = 3.6,
  height = 2.2,
  position = [0, 1.8, 0],
  startFrame = 5,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Deterministic spring entrance
  const popProgress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 12, stiffness: 90, mass: 0.8 },
  });

  // Subtle floating wobble
  const floatY = deterministicBob(frame, fps, 0.8, 0.08);
  const tiltZ = Math.sin((frame / fps) * 1.2) * 0.03;

  return (
    <group
      position={[position[0], position[1] + floatY, position[2]]}
      rotation={[0, 0, tiltZ]}
      scale={[popProgress, popProgress, popProgress]}
    >
      {/* Frosted Glass Body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, 0.12]} />
        <meshPhysicalMaterial
          color="#ffffff"
          roughness={0.15}
          transmission={0.88}
          thickness={0.8}
          transparent
          opacity={0.9}
          ior={1.45}
        />
      </mesh>

      {/* Glowing Border Frame */}
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[width + 0.04, height + 0.04, 0.08]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          roughness={0.2}
          wireframe
        />
      </mesh>

      {/* Decorative Top Accent Tag */}
      <mesh position={[-width / 2 + 0.6, height / 2 - 0.3, 0.08]} castShadow>
        <boxGeometry args={[0.8, 0.22, 0.04]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>

      {/* Glowing Inner Chip / Icon Node */}
      <mesh position={[width / 2 - 0.5, height / 2 - 0.4, 0.08]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.06, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
      </mesh>

      {/* Horizontal Text Bars (Stylized Minimalist Data lines) */}
      <mesh position={[0, -0.1, 0.08]}>
        <boxGeometry args={[width * 0.75, 0.12, 0.02]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.5} />
      </mesh>
      <mesh position={[-width * 0.1, -0.4, 0.08]}>
        <boxGeometry args={[width * 0.55, 0.09, 0.02]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.5} />
      </mesh>
    </group>
  );
};
