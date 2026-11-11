import React from 'react';
import * as THREE from 'three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { deterministicRotation, deterministicBob } from '@3d-assets/core';

export const cryptoToken3DPropsSchema = z.object({
  color: z.string().default('#fbbf24'), // Gold
  edgeColor: z.string().default('#d97706'),
  radius: z.number().default(1.2),
  thickness: z.number().default(0.25),
  rotationSpeed: z.number().default(0.4),
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 1.5, 0]),
});

export type CryptoToken3DProps = z.input<typeof cryptoToken3DPropsSchema>;

export const CryptoToken3D: React.FC<CryptoToken3DProps> = ({
  color = '#fbbf24',
  edgeColor = '#d97706',
  radius = 1.2,
  thickness = 0.25,
  rotationSpeed = 0.4,
  position = [0, 1.5, 0],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Continuous deterministic spin
  const rotY = deterministicRotation(frame, fps, rotationSpeed);
  // Gentle floating bob
  const bobY = deterministicBob(frame, fps, 1, 0.08);

  return (
    <group position={[position[0], position[1] + bobY, position[2]]} rotation={[0.2, rotY, 0.1]}>
      {/* Coin Cylinder Main Body */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, thickness, 36]} />
        <meshStandardMaterial
          color={color}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      {/* Raised Outer Rim Ring */}
      <mesh position={[0, 0, thickness / 2 + 0.01]} castShadow>
        <ringGeometry args={[radius * 0.85, radius * 0.96, 36]} />
        <meshStandardMaterial color={edgeColor} roughness={0.15} metalness={0.95} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, -thickness / 2 - 0.01]} castShadow>
        <ringGeometry args={[radius * 0.85, radius * 0.96, 36]} />
        <meshStandardMaterial color={edgeColor} roughness={0.15} metalness={0.95} side={THREE.DoubleSide} />
      </mesh>

      {/* Embossed Center Emblem (Stylized Diamond / Star) */}
      <mesh position={[0, 0, thickness / 2 + 0.02]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <boxGeometry args={[radius * 0.45, radius * 0.45, 0.06]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.9} />
      </mesh>
      <mesh position={[0, 0, -thickness / 2 - 0.02]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <boxGeometry args={[radius * 0.45, radius * 0.45, 0.06]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.9} />
      </mesh>
    </group>
  );
};
