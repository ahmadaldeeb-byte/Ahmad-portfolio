import React from 'react';
import * as THREE from 'three';
import { z } from 'zod';
import { Palette } from '@3d-assets/core';

export const highRiseTowerPropsSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  height: z.number().default(9),
  width: z.number().default(3),
  depth: z.number().default(2.8),
  facadeColor: z.string().default('#94a3b8'), // Sleek glass grey
  windowColor: z.string().default('#38bdf8'), // Sky cyan reflective glass
});

export type HighRiseTowerProps = z.input<typeof highRiseTowerPropsSchema>;

export const HighRiseTower: React.FC<HighRiseTowerProps> = ({
  position = [0, 0, 0],
  height = 9,
  width = 3,
  depth = 2.8,
  facadeColor = '#94a3b8',
  windowColor = '#38bdf8',
}) => {
  const floorCount = Math.floor(height / 0.85);

  return (
    <group position={position}>
      {/* Main Skyscraper Tower Structure */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={facadeColor} roughness={0.4} metalness={0.4} flatShading />
      </mesh>

      {/* Repeating Window Bands on Front and Back */}
      {Array.from({ length: floorCount - 1 }).map((_, i) => {
        const floorY = 0.7 + i * 0.85;
        return (
          <group key={i}>
            {/* Front Window Ribbon */}
            <mesh position={[0, floorY, depth / 2 + 0.015]}>
              <planeGeometry args={[width * 0.85, 0.45]} />
              <meshStandardMaterial
                color={windowColor}
                roughness={0.15}
                metalness={0.8}
                emissive={windowColor}
                emissiveIntensity={0.2}
              />
            </mesh>
            {/* Back Window Ribbon */}
            <mesh position={[0, floorY, -depth / 2 - 0.015]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[width * 0.85, 0.45]} />
              <meshStandardMaterial
                color={windowColor}
                roughness={0.15}
                metalness={0.8}
              />
            </mesh>
          </group>
        );
      })}

      {/* Rooftop Utility Box / AC Chiller */}
      <mesh position={[0, height + 0.45, 0]} castShadow>
        <boxGeometry args={[width * 0.55, 0.9, depth * 0.55]} />
        <meshStandardMaterial color="#475569" roughness={0.8} />
      </mesh>

      {/* Rooftop Antenna Mast */}
      <mesh position={[0, height + 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.05, 1.2, 8]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Red Warning Beacon */}
      <mesh position={[0, height + 2.02, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
    </group>
  );
};

export const townhousePropsSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  floors: z.number().default(3),
  wallColor: z.string().default('#f1f5f9'), // Off-white/cream
  roofColor: z.string().default(Palette.terracottaRoof), // Terracotta
  width: z.number().default(2.4),
  depth: z.number().default(2.2),
  hasAwning: z.boolean().default(true),
});

export type TownhouseProps = z.input<typeof townhousePropsSchema>;

export const Townhouse: React.FC<TownhouseProps> = ({
  position = [0, 0, 0],
  floors = 3,
  wallColor = '#f1f5f9',
  roofColor = Palette.terracottaRoof,
  width = 2.4,
  depth = 2.2,
  hasAwning = true,
}) => {
  const height = floors * 1.35;

  return (
    <group position={position}>
      {/* Wall Structure */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} flatShading />
      </mesh>

      {/* Terracotta Pitched Roof */}
      <mesh position={[0, height + 0.65, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[width * 0.85, 1.3, 4]} />
        <meshStandardMaterial color={roofColor} roughness={0.7} flatShading />
      </mesh>

      {/* Ground Floor Entrance Door */}
      <mesh position={[0, 0.55, depth / 2 + 0.015]} castShadow>
        <planeGeometry args={[0.65, 1.1]} />
        <meshStandardMaterial color="#475569" roughness={0.6} />
      </mesh>

      {/* Commercial Shopfront Awning */}
      {hasAwning && (
        <mesh position={[0, 1.25, depth / 2 + 0.35]} rotation={[0.3, 0, 0]} castShadow>
          <boxGeometry args={[width * 0.9, 0.08, 0.7]} />
          <meshStandardMaterial color="#ef4444" roughness={0.5} />
        </mesh>
      )}

      {/* Upper Floor Windows with dark frames */}
      {Array.from({ length: floors - 1 }).map((_, i) => {
        const winY = 1.8 + i * 1.35;
        return (
          <group key={i}>
            {/* Left Window */}
            <mesh position={[-width * 0.25, winY, depth / 2 + 0.015]}>
              <planeGeometry args={[0.5, 0.65]} />
              <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.6} />
            </mesh>
            {/* Right Window */}
            <mesh position={[width * 0.25, winY, depth / 2 + 0.015]}>
              <planeGeometry args={[0.5, 0.65]} />
              <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.6} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
