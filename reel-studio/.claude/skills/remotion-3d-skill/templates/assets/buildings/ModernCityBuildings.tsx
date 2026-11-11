import React from 'react';
import * as THREE from 'three';
import { z } from 'zod';

export const modernCurvedTowerPropsSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  height: z.number().default(14),
  radius: z.number().default(2.2),
  glassColor: z.string().default('#b0cecc'),
});

export type ModernCurvedTowerProps = z.input<typeof modernCurvedTowerPropsSchema>;

/**
 * Modern semi-circular / curved glass skyscraper with tiered crown.
 */
export const ModernCurvedTower: React.FC<ModernCurvedTowerProps> = ({
  position = [0, 0, 0],
  height = 14,
  radius = 2.2,
  glassColor = '#b0cecc',
}) => {
  const segments = 24;
  const floors = Math.floor(height / 0.9);

  return (
    <group position={position}>
      {/* Curved Cylindrical Glass Body */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius * 1.05, height, segments]} />
        <meshPhysicalMaterial
          color={glassColor}
          roughness={0.15}
          transmission={0.4}
          opacity={0.65}
          transparent
          reflectivity={0.6}
        />
      </mesh>

      {/* Internal Core */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius * 0.45, radius * 0.45, height, 12]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
      </mesh>

      {/* Horizontal Floor Rings */}
      {Array.from({ length: floors }).map((_, fi) => (
        <mesh key={fi} position={[0, fi * 0.9 + 0.45, 0]}>
          <cylinderGeometry args={[radius * 0.98, radius * 0.98, 0.06, segments]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
      ))}

      {/* Tiered Architectural Crown */}
      <mesh position={[0, height + 0.4, 0]} castShadow>
        <cylinderGeometry args={[radius * 0.7, radius * 0.9, 0.8, segments]} />
        <meshStandardMaterial color="#64748b" roughness={0.5} />
      </mesh>
      <mesh position={[0, height + 1.1, 0]} castShadow>
        <cylinderGeometry args={[radius * 0.4, radius * 0.6, 0.6, segments]} />
        <meshStandardMaterial color="#334155" roughness={0.5} />
      </mesh>
      <mesh position={[0, height + 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 1.2, 8]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.2} metalness={0.8} />
      </mesh>
    </group>
  );
};

export const steppedCommercialPropsSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  width: z.number().default(4.2),
  depth: z.number().default(3.6),
  facadeColor: z.string().default('#f1f5f9'),
});

export type SteppedCommercialProps = z.input<typeof steppedCommercialPropsSchema>;

/**
 * Mid-rise contemporary commercial building with stepped setback terraces.
 */
export const SteppedCommercialBlock: React.FC<SteppedCommercialProps> = ({
  position = [0, 0, 0],
  width = 4.2,
  depth = 3.6,
  facadeColor = '#f1f5f9',
}) => {
  return (
    <group position={position}>
      {/* Base Tier 1 (Floors 1-2) */}
      <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 2.5, depth]} />
        <meshStandardMaterial color={facadeColor} roughness={0.8} flatShading />
      </mesh>
      {/* Base Glass Ribbons */}
      <mesh position={[0, 1.2, depth / 2 + 0.015]}>
        <planeGeometry args={[width * 0.85, 0.8]} />
        <meshStandardMaterial color="#0284c7" roughness={0.15} metalness={0.7} />
      </mesh>

      {/* Middle Tier 2 (Floors 3-4, Setback) */}
      <mesh position={[0, 3.6, -depth * 0.08]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.8, 2.2, depth * 0.8]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0, 3.6, depth * 0.32 + 0.015]}>
        <planeGeometry args={[width * 0.7, 0.7]} />
        <meshStandardMaterial color="#0284c7" roughness={0.15} metalness={0.7} />
      </mesh>

      {/* Top Tier 3 (Floors 5-6, Setback) */}
      <mesh position={[0, 5.6, -depth * 0.15]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.58, 1.8, depth * 0.62]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.8} flatShading />
      </mesh>

      {/* Rooftop Garden Shrub Accents on Terrace */}
      <mesh position={[-width * 0.32, 2.7, depth * 0.35]} castShadow>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial color="#52835f" roughness={0.8} flatShading />
      </mesh>
      <mesh position={[width * 0.32, 2.7, depth * 0.35]} castShadow>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial color="#52835f" roughness={0.8} flatShading />
      </mesh>
    </group>
  );
};
