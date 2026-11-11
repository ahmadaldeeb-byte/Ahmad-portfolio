import React from 'react';
import * as THREE from 'three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { deterministicBob } from '@3d-assets/core';

export const forceVectorArrowPropsSchema = z.object({
  direction: z.enum(['down', 'up', 'left', 'right', 'sway']).default('down'),
  length: z.number().default(1.2),
  color: z.string().default('#2563eb'), // Blue force arrow
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  animated: z.boolean().default(true),
});

export type ForceVectorArrowProps = z.input<typeof forceVectorArrowPropsSchema>;

export const ForceVectorArrow: React.FC<ForceVectorArrowProps> = ({
  direction = 'down',
  length = 1.2,
  color = '#2563eb',
  position = [0, 0, 0],
  animated = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Subtle pulsing bob
  const bob = animated ? deterministicBob(frame, fps, 2, 0.1) : 0;

  // Rotation based on direction
  const rotZ =
    direction === 'down'
      ? Math.PI
      : direction === 'up'
      ? 0
      : direction === 'left'
      ? Math.PI / 2
      : direction === 'right'
      ? -Math.PI / 2
      : 0;

  // Sway angle if direction is sway
  const swayAngle = direction === 'sway' ? Math.sin((frame / fps) * 4) * 0.3 : 0;

  return (
    <group position={[position[0], position[1] + (direction === 'down' ? -bob : bob), position[2]]}>
      <group rotation={[0, 0, rotZ + swayAngle]}>
        {/* Shaft */}
        <mesh position={[0, length * 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, length * 0.8, 16]} />
          <meshStandardMaterial color={color} roughness={0.3} emissive={color} emissiveIntensity={0.2} />
        </mesh>
        {/* Arrow Tip */}
        <mesh position={[0, length * 0.9, 0]} castShadow>
          <coneGeometry args={[0.15, 0.35, 16]} />
          <meshStandardMaterial color={color} roughness={0.3} emissive={color} emissiveIntensity={0.2} />
        </mesh>
      </group>
    </group>
  );
};
