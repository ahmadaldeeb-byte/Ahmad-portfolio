import React from 'react';
import * as THREE from 'three';
import { z } from 'zod';
import { Palette } from '@3d-assets/core';

export const dioramaStagePropsSchema = z.object({
  width: z.number().default(10),
  depth: z.number().default(10),
  groundColor: z.string().default(Palette.foliageSage),
  soilColor: z.string().default(Palette.soilBrown),
  showTrees: z.boolean().default(true),
  showFence: z.boolean().default(true),
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
});

export type DioramaStageProps = z.input<typeof dioramaStagePropsSchema>;

/**
 * Low-Poly stylized tree component.
 */
export const LowPolyTree: React.FC<{
  position: [number, number, number];
  scale?: number;
  foliageColor?: string;
}> = ({ position, scale = 1, foliageColor = Palette.foliageSage }) => {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Trunk */}
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.12, 0.2, 1.4, 7]} />
        <meshStandardMaterial color={Palette.woodBrown} roughness={0.9} flatShading />
      </mesh>
      {/* Foliage Canopy (Faceted Icosahedrons) */}
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.85, 1]} />
        <meshStandardMaterial color={foliageColor} roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0.3, 2.3, 0.1]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.55, 1]} />
        <meshStandardMaterial color={Palette.foliageDark} roughness={0.8} flatShading />
      </mesh>
    </group>
  );
};

export const DioramaStage: React.FC<DioramaStageProps> = ({
  width = 12,
  depth = 12,
  groundColor = Palette.foliageSage,
  soilColor = Palette.soilBrown,
  showTrees = true,
  showFence = true,
  position = [0, 0, 0],
}) => {
  return (
    <group position={position}>
      {/* Top Grass Surface (Receives soft shadows) */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[width, 0.3, depth]} />
        <meshStandardMaterial color={groundColor} roughness={0.85} flatShading />
      </mesh>

      {/* Earth / Subsoil Cross-Section Block */}
      <mesh position={[0, -1.15, 0]} receiveShadow>
        <boxGeometry args={[width * 0.98, 2.0, depth * 0.98]} />
        <meshStandardMaterial color={soilColor} roughness={0.95} flatShading />
      </mesh>

      {/* Decorative Low-Poly Trees */}
      {showTrees && (
        <>
          <LowPolyTree position={[-width / 2 + 1.8, 0.15, -depth / 2 + 2]} scale={1.2} />
          <LowPolyTree position={[width / 2 - 1.8, 0.15, -depth / 2 + 2.5]} scale={1.0} />
          <LowPolyTree position={[-width / 2 + 2.2, 0.15, depth / 2 - 2.5]} scale={0.85} />
        </>
      )}

      {/* Low-Poly Picket Fence Along Edge */}
      {showFence && (
        <group position={[0, 0.15, depth / 2 - 0.6]}>
          {Array.from({ length: 9 }).map((_, i) => (
            <mesh key={i} position={[(i - 4) * 0.7, 0.3, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.12, 0.6, 0.04]} />
              <meshStandardMaterial color="#ffffff" roughness={0.7} />
            </mesh>
          ))}
          {/* Horizontal crossrails */}
          <mesh position={[0, 0.42, 0.02]} castShadow>
            <boxGeometry args={[6.2, 0.06, 0.03]} />
            <meshStandardMaterial color="#ffffff" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.18, 0.02]} castShadow>
            <boxGeometry args={[6.2, 0.06, 0.03]} />
            <meshStandardMaterial color="#ffffff" roughness={0.7} />
          </mesh>
        </group>
      )}
    </group>
  );
};
