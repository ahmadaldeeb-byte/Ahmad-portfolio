import React from 'react';
import * as THREE from 'three';
import { useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { z } from 'zod';
import { Palette } from '@3d-assets/core';

export const structuralCutawayPropsSchema = z.object({
  length: z.number().default(6),
  height: z.number().default(0.8),
  depth: z.number().default(0.8),
  showCutaway: z.boolean().default(true),
  deflectionAmount: z.number().default(0.2), // Sagging under load
  startSagFrame: z.number().default(15),
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 2, 0]),
  rebarColor: z.string().default(Palette.rebarBlue),
  stirrupColor: z.string().default(Palette.rebarRed),
});

export type StructuralCutawayProps = z.input<typeof structuralCutawayPropsSchema>;

export const StructuralCutaway: React.FC<StructuralCutawayProps> = ({
  length = 6,
  height = 0.8,
  depth = 0.8,
  showCutaway = true,
  deflectionAmount = 0.25,
  startSagFrame = 15,
  position = [0, 2, 0],
  rebarColor = Palette.rebarBlue,
  stirrupColor = Palette.rebarRed,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Deterministic spring load sag
  const sagProgress = spring({
    frame: frame - startSagFrame,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  const currentSag = deflectionAmount * Math.max(0, sagProgress);

  // Stirrup spacing along beam
  const stirrupCount = 10;
  const stirrupPositions = Array.from({ length: stirrupCount }, (_, i) => {
    return -length / 2 + 0.5 + (i * (length - 1)) / (stirrupCount - 1);
  });

  return (
    <group position={position}>
      {/* Outer Concrete Beam Structure */}
      {/* Support Pillar Left */}
      <mesh position={[-length / 2 - 0.25, -1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 2.4, depth * 1.2]} />
        <meshStandardMaterial color={Palette.concreteDark} roughness={0.8} />
      </mesh>
      {/* Support Pillar Right */}
      <mesh position={[length / 2 + 0.25, -1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 2.4, depth * 1.2]} />
        <meshStandardMaterial color={Palette.concreteDark} roughness={0.8} />
      </mesh>

      {/* Main Concrete Beam with Sagging deflection */}
      <group position={[0, -currentSag, 0]}>
        {/* Concrete outer casing (translucent or sliced when showCutaway is active) */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[length, height, depth]} />
          <meshPhysicalMaterial
            color={Palette.concreteGrey}
            roughness={0.8}
            transparent={showCutaway}
            opacity={showCutaway ? 0.45 : 1.0}
            transmission={showCutaway ? 0.3 : 0}
            depthWrite={!showCutaway}
          />
        </mesh>

        {/* Steel Reinforcement Rebar Structure (Visible inside cutaway) */}
        {showCutaway && (
          <group>
            {/* Top Rebars (Compression steel) */}
            <mesh position={[0, height * 0.3, depth * 0.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.025, 0.025, length * 0.96, 12]} />
              <meshStandardMaterial color={rebarColor} roughness={0.3} metalness={0.8} />
            </mesh>
            <mesh position={[0, height * 0.3, -depth * 0.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.025, 0.025, length * 0.96, 12]} />
              <meshStandardMaterial color={rebarColor} roughness={0.3} metalness={0.8} />
            </mesh>

            {/* Bottom Rebars (Tension steel) */}
            <mesh position={[0, -height * 0.3, depth * 0.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.035, 0.035, length * 0.96, 12]} />
              <meshStandardMaterial color={rebarColor} roughness={0.3} metalness={0.8} />
            </mesh>
            <mesh position={[0, -height * 0.3, -depth * 0.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.035, 0.035, length * 0.96, 12]} />
              <meshStandardMaterial color={rebarColor} roughness={0.3} metalness={0.8} />
            </mesh>

            {/* Transverse Stirrups (Sengkang) rings along the beam */}
            {stirrupPositions.map((pos, idx) => (
              <group key={idx} position={[pos, 0, 0]}>
                {/* Rectangular loop outline using thin cylinders */}
                {/* Top strut */}
                <mesh position={[0, height * 0.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.015, 0.015, depth * 0.65, 8]} />
                  <meshStandardMaterial color={stirrupColor} roughness={0.3} />
                </mesh>
                {/* Bottom strut */}
                <mesh position={[0, -height * 0.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.015, 0.015, depth * 0.65, 8]} />
                  <meshStandardMaterial color={stirrupColor} roughness={0.3} />
                </mesh>
                {/* Left vertical strut */}
                <mesh position={[0, 0, -depth * 0.32]}>
                  <cylinderGeometry args={[0.015, 0.015, height * 0.65, 8]} />
                  <meshStandardMaterial color={stirrupColor} roughness={0.3} />
                </mesh>
                {/* Right vertical strut */}
                <mesh position={[0, 0, depth * 0.32]}>
                  <cylinderGeometry args={[0.015, 0.015, height * 0.65, 8]} />
                  <meshStandardMaterial color={stirrupColor} roughness={0.3} />
                </mesh>
              </group>
            ))}
          </group>
        )}
      </group>
    </group>
  );
};
