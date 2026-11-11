import React from 'react';
import * as THREE from 'three';
import { z } from 'zod';

export const lollipopTreePropsSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  scale: z.number().default(1),
  foliageColor: z.string().default('#52835f'), // Soft muted green from reference
  trunkColor: z.string().default('#856041'),
});

export type LollipopTreeProps = z.input<typeof lollipopTreePropsSchema>;

export const LollipopTree: React.FC<LollipopTreeProps> = ({
  position = [0, 0, 0],
  scale = 1,
  foliageColor = '#52835f',
  trunkColor = '#856041',
}) => {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Slender Trunk */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.05, 0.9, 8]} />
        <meshStandardMaterial color={trunkColor} roughness={0.9} flatShading />
      </mesh>

      {/* Spherical Canopy (Soft Stylized Foliage) */}
      <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.38, 16, 16]} />
        <meshStandardMaterial color={foliageColor} roughness={0.8} flatShading />
      </mesh>
    </group>
  );
};
