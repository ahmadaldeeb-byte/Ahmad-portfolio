import React from 'react';
import * as THREE from 'three';
import { z } from 'zod';

export const distantSkylinePropsSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, -20]),
  scale: z.number().default(1),
  tintColor: z.string().default('#cfc8b6'), // Muted warm haze matching reference
});

export type DistantSkylineProps = z.input<typeof distantSkylinePropsSchema>;

export const DistantSkyline: React.FC<DistantSkylineProps> = ({
  position = [0, 0, -20],
  scale = 1,
  tintColor = '#cfc8b6',
}) => {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Left Stepped Cluster (Matching Image #1 left background) */}
      <group position={[-16, 0, 0]}>
        <mesh position={[0, 6, 0]} castShadow>
          <boxGeometry args={[4.5, 12, 4]} />
          <meshStandardMaterial color={tintColor} roughness={0.9} flatShading />
        </mesh>
        <mesh position={[-2.2, 4.5, 0.5]} castShadow>
          <boxGeometry args={[3.2, 9, 3.5]} />
          <meshStandardMaterial color={tintColor} roughness={0.9} flatShading />
        </mesh>
        <mesh position={[2.2, 3.5, -0.5]} castShadow>
          <boxGeometry args={[2.8, 7, 3.2]} />
          <meshStandardMaterial color={tintColor} roughness={0.9} flatShading />
        </mesh>
      </group>

      {/* Right Matrix Towers (Matching Image #1 right background) */}
      <group position={[14, 0, 0]}>
        <mesh position={[0, 7.5, 0]} castShadow>
          <boxGeometry args={[3.8, 15, 3.6]} />
          <meshStandardMaterial color={tintColor} roughness={0.9} flatShading />
        </mesh>
        {/* Repeating dot matrix pattern */}
        <mesh position={[0, 7.5, 1.82]}>
          <planeGeometry args={[3.4, 14.5]} />
          <meshStandardMaterial color="#b3ac9a" roughness={0.9} wireframe />
        </mesh>
      </group>

      {/* Far Right Distant Tower */}
      <group position={[23, 0, -3]}>
        <mesh position={[0, 7, 0]}>
          <boxGeometry args={[3.5, 14, 3.5]} />
          <meshStandardMaterial color={tintColor} roughness={0.9} flatShading />
        </mesh>
      </group>
    </group>
  );
};
