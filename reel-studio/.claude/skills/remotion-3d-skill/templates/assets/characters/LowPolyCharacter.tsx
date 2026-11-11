import React from 'react';
import * as THREE from 'three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { deterministicBob } from '@3d-assets/core';

export const lowPolyCharacterPropsSchema = z.object({
  variant: z.enum(['casual', 'worker', 'scooterRider']).default('casual'),
  action: z.enum(['idle', 'walk', 'wave', 'point', 'ride']).default('idle'),
  scale: z.number().default(1),
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  rotationY: z.number().default(0),
  vestColor: z.string().default('#f97316'), // Safety orange
  hairColor: z.string().default('#4a2e18'), // Dark brown
  skinColor: z.string().default('#f5c396'), // Warm skin tone
  pantsColor: z.string().default('#334155'), // Slate navy
});

export type LowPolyCharacterProps = z.input<typeof lowPolyCharacterPropsSchema>;

export const LowPolyCharacter: React.FC<LowPolyCharacterProps> = ({
  variant = 'casual',
  action = 'idle',
  scale = 1,
  position = [0, 0, 0],
  rotationY = 0,
  vestColor = '#f97316',
  hairColor = '#4a2e18',
  skinColor = '#f5c396',
  pantsColor = '#334155',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Deterministic frame calculations
  const time = frame / fps;

  // Idle breath bobbing
  const breathY = deterministicBob(frame, fps, 1.2, 0.03);

  // Walk cycle calculation
  const walkSpeed = 6;
  const legAngle = action === 'walk' ? Math.sin(time * walkSpeed) * 0.45 : 0;
  const armAngleL = action === 'walk' ? -Math.sin(time * walkSpeed) * 0.35 : 0;
  const armAngleR = action === 'walk' ? Math.sin(time * walkSpeed) * 0.35 : 0;

  // Wave calculation
  const waveAngle = action === 'wave' ? Math.sin(time * 8) * 0.35 : 0;

  // Pointing pose
  const isPointing = action === 'point';
  const isRiding = action === 'ride' || variant === 'scooterRider';

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={[scale, scale, scale]}>
      {/* Root body with breath bobbing */}
      <group position={[0, breathY, 0]}>
        {/* Head */}
        <group position={[0, 1.7, 0]}>
          {/* Face */}
          <mesh castShadow>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshStandardMaterial color={skinColor} roughness={0.6} />
          </mesh>

          {/* Eyes */}
          <mesh position={[0.07, 0.04, 0.2]} castShadow>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshBasicMaterial color="#1e293b" />
          </mesh>
          <mesh position={[-0.07, 0.04, 0.2]} castShadow>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshBasicMaterial color="#1e293b" />
          </mesh>

          {/* Hair */}
          <mesh position={[0, 0.08, -0.04]} castShadow>
            <sphereGeometry args={[0.23, 12, 12]} />
            <meshStandardMaterial color={hairColor} roughness={0.8} flatShading />
          </mesh>
          {/* Hair Bun / Cap */}
          <mesh position={[0, 0.26, -0.08]} castShadow>
            <sphereGeometry args={[0.1, 10, 10]} />
            <meshStandardMaterial color={hairColor} roughness={0.8} flatShading />
          </mesh>

          {/* Construction Hardhat (Worker variant) */}
          {variant === 'worker' && (
            <group position={[0, 0.12, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.26, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#eab308" roughness={0.3} metalness={0.1} />
              </mesh>
              <mesh position={[0, -0.02, 0.08]} castShadow>
                <cylinderGeometry args={[0.3, 0.3, 0.03, 16]} />
                <meshStandardMaterial color="#eab308" roughness={0.3} />
              </mesh>
            </group>
          )}
        </group>

        {/* Torso */}
        <group position={[0, 1.15, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.42, 0.65, 0.26]} />
            <meshStandardMaterial
              color={variant === 'worker' ? vestColor : '#ea580c'}
              roughness={0.7}
              flatShading
            />
          </mesh>

          {/* Reflective Safety Stripes for Worker */}
          {variant === 'worker' && (
            <>
              <mesh position={[0, 0.1, 0.132]}>
                <planeGeometry args={[0.42, 0.06]} />
                <meshStandardMaterial color="#ffffff" roughness={0.2} />
              </mesh>
              <mesh position={[0, -0.12, 0.132]}>
                <planeGeometry args={[0.42, 0.06]} />
                <meshStandardMaterial color="#ffffff" roughness={0.2} />
              </mesh>
            </>
          )}
        </group>

        {/* Left Arm */}
        <group
          position={[-0.28, 1.4, 0]}
          rotation={[isRiding ? 0.7 : armAngleL, 0, isRiding ? -0.2 : 0.1]}
        >
          <mesh position={[0, -0.25, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 0.45, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.6} />
          </mesh>
        </group>

        {/* Right Arm (Posing: Wave / Point / Idle / Ride) */}
        <group
          position={[0.28, 1.4, 0]}
          rotation={[
            isPointing ? -1.3 : action === 'wave' ? -2.4 : isRiding ? 0.7 : armAngleR,
            0,
            action === 'wave' ? 0.5 + waveAngle : isPointing ? -0.2 : isRiding ? 0.2 : -0.1,
          ]}
        >
          <mesh position={[0, -0.25, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 0.45, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.6} />
          </mesh>
        </group>

        {/* Legs & Hips */}
        <group position={[0, 0.8, 0]}>
          {/* Left Leg */}
          <group
            position={[-0.12, 0, 0]}
            rotation={[isRiding ? 1.2 : legAngle, 0, 0]}
          >
            <mesh position={[0, -0.4, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.065, 0.75, 8]} />
              <meshStandardMaterial color={pantsColor} roughness={0.8} />
            </mesh>
            {/* Shoe */}
            <mesh position={[0, -0.78, 0.05]} castShadow>
              <boxGeometry args={[0.11, 0.08, 0.2]} />
              <meshStandardMaterial color="#1e293b" roughness={0.9} />
            </mesh>
          </group>

          {/* Right Leg */}
          <group
            position={[0.12, 0, 0]}
            rotation={[isRiding ? 1.2 : -legAngle, 0, 0]}
          >
            <mesh position={[0, -0.4, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.065, 0.75, 8]} />
              <meshStandardMaterial color={pantsColor} roughness={0.8} />
            </mesh>
            {/* Shoe */}
            <mesh position={[0, -0.78, 0.05]} castShadow>
              <boxGeometry args={[0.11, 0.08, 0.2]} />
              <meshStandardMaterial color="#1e293b" roughness={0.9} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};
