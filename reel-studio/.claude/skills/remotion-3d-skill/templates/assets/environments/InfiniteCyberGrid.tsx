import React from 'react';
import * as THREE from 'three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';

export const infiniteCyberGridPropsSchema = z.object({
  size: z.number().default(40),
  divisions: z.number().default(40),
  colorCenterLine: z.string().default('#06b6d4'),
  colorGrid: z.string().default('#1e293b'),
  speed: z.number().default(0.5),
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
});

export type InfiniteCyberGridProps = z.input<typeof infiniteCyberGridPropsSchema>;

export const InfiniteCyberGrid: React.FC<InfiniteCyberGridProps> = ({
  size = 40,
  divisions = 40,
  colorCenterLine = '#06b6d4',
  colorGrid = '#334155',
  speed = 0.5,
  position = [0, 0, 0],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Smooth continuous forward movement
  const gridOffsetZ = ((frame / fps) * speed * 2) % (size / divisions);

  return (
    <group position={[position[0], position[1], position[2] + gridOffsetZ]}>
      <gridHelper args={[size, divisions, colorCenterLine, colorGrid]} />
      {/* Dark reflective floor beneath grid */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#0b0f19" roughness={0.1} metalness={0.8} />
      </mesh>
    </group>
  );
};
