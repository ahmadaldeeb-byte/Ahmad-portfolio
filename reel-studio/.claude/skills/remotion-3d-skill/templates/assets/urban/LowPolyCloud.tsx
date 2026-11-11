import React from 'react';
import * as THREE from 'three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';

export const lowPolyCloudPropsSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 8, -4]),
  scale: z.number().default(1),
  driftSpeed: z.number().default(0.3),
  color: z.string().default('#ffffff'),
  opacity: z.number().default(0.92),
});

export type LowPolyCloudProps = z.input<typeof lowPolyCloudPropsSchema>;

export const LowPolyCloud: React.FC<LowPolyCloudProps> = ({
  position = [0, 8, -4],
  scale = 1,
  driftSpeed = 0.3,
  color = '#ffffff',
  opacity = 0.92,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Continuous deterministic drift along X axis
  const driftX = (frame / fps) * driftSpeed;

  return (
    <group position={[position[0] + driftX, position[1], position[2]]} scale={[scale, scale, scale]}>
      {/* Cluster of intersecting faceted icosahedrons */}
      <mesh position={[0, 0, 0]} castShadow>
        <icosahedronGeometry args={[0.9, 1]} />
        <meshStandardMaterial
          color={color}
          roughness={0.9}
          flatShading
          transparent
          opacity={opacity}
        />
      </mesh>
      <mesh position={[-0.8, -0.15, 0.1]} castShadow>
        <icosahedronGeometry args={[0.65, 1]} />
        <meshStandardMaterial
          color={color}
          roughness={0.9}
          flatShading
          transparent
          opacity={opacity}
        />
      </mesh>
      <mesh position={[0.8, -0.1, -0.1]} castShadow>
        <icosahedronGeometry args={[0.7, 1]} />
        <meshStandardMaterial
          color={color}
          roughness={0.9}
          flatShading
          transparent
          opacity={opacity}
        />
      </mesh>
      <mesh position={[0.2, 0.45, 0.1]} castShadow>
        <icosahedronGeometry args={[0.6, 1]} />
        <meshStandardMaterial
          color={color}
          roughness={0.9}
          flatShading
          transparent
          opacity={opacity}
        />
      </mesh>
    </group>
  );
};
