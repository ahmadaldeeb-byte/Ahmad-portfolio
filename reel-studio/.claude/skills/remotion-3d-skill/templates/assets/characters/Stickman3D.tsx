import React from 'react';
import * as THREE from 'three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { deterministicBob } from '@3d-assets/core';

export const stickman3DPropsSchema = z.object({
  action: z.enum(['idle', 'walk', 'wave', 'point', 'jump']).default('idle'),
  color: z.string().default('#ffffff'),
  headColor: z.string().default('#ffffff'),
  limbThickness: z.number().default(0.06),
  scale: z.number().default(1),
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  rotationY: z.number().default(0),
});

export type Stickman3DProps = z.input<typeof stickman3DPropsSchema>;

export const Stickman3D: React.FC<Stickman3DProps> = ({
  action = 'idle',
  color = '#ffffff',
  headColor = '#ffffff',
  limbThickness = 0.06,
  scale = 1,
  position = [0, 0, 0],
  rotationY = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  const bob = deterministicBob(frame, fps, 1.5, 0.05);
  const walkPhase = Math.sin(time * 6);
  const legAngle = action === 'walk' ? walkPhase * 0.5 : 0;
  const armAngleL = action === 'walk' ? -walkPhase * 0.4 : 0;
  const armAngleR = action === 'walk' ? walkPhase * 0.4 : 0;
  const waveAngle = action === 'wave' ? Math.sin(time * 8) * 0.4 : 0;

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={[scale, scale, scale]}>
      <group position={[0, bob, 0]}>
        {/* Head */}
        <mesh position={[0, 1.8, 0]} castShadow>
          <sphereGeometry args={[0.22, 24, 24]} />
          <meshStandardMaterial color={headColor} roughness={0.4} />
        </mesh>

        {/* Torso Spine */}
        <mesh position={[0, 1.25, 0]} castShadow>
          <cylinderGeometry args={[limbThickness, limbThickness, 0.8, 12]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>

        {/* Left Arm */}
        <group position={[-0.2, 1.55, 0]} rotation={[armAngleL, 0, 0.2]}>
          <mesh position={[0, -0.3, 0]} castShadow>
            <cylinderGeometry args={[limbThickness * 0.9, limbThickness * 0.9, 0.6, 12]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
        </group>

        {/* Right Arm */}
        <group
          position={[0.2, 1.55, 0]}
          rotation={[
            action === 'point' ? -1.4 : action === 'wave' ? -2.4 : armAngleR,
            0,
            action === 'wave' ? 0.3 + waveAngle : action === 'point' ? -0.2 : -0.2,
          ]}
        >
          <mesh position={[0, -0.3, 0]} castShadow>
            <cylinderGeometry args={[limbThickness * 0.9, limbThickness * 0.9, 0.6, 12]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
        </group>

        {/* Left Leg */}
        <group position={[-0.15, 0.85, 0]} rotation={[legAngle, 0, 0]}>
          <mesh position={[0, -0.4, 0]} castShadow>
            <cylinderGeometry args={[limbThickness, limbThickness, 0.8, 12]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
        </group>

        {/* Right Leg */}
        <group position={[0.15, 0.85, 0]} rotation={[-legAngle, 0, 0]}>
          <mesh position={[0, -0.4, 0]} castShadow>
            <cylinderGeometry args={[limbThickness, limbThickness, 0.8, 12]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
        </group>
      </group>
    </group>
  );
};
