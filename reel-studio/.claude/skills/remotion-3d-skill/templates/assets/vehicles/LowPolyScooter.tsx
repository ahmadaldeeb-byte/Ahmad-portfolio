import React from 'react';
import * as THREE from 'three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { deterministicBob } from '@3d-assets/core';
import { LowPolyCharacter } from '../characters/LowPolyCharacter';

export const lowPolyScooterPropsSchema = z.object({
  bodyColor: z.string().default('#0284c7'), // Vibrant sky blue
  speed: z.number().default(2.8),
  startPosition: z.tuple([z.number(), z.number(), z.number()]).default([-10, 0.25, -1.2]),
  direction: z.number().default(1),
  scale: z.number().default(0.75),
  riderVariant: z.enum(['casual', 'worker']).default('casual'),
});

export type LowPolyScooterProps = z.input<typeof lowPolyScooterPropsSchema>;

export const LowPolyScooter: React.FC<LowPolyScooterProps> = ({
  bodyColor = '#0284c7',
  speed = 2.8,
  startPosition = [-10, 0.25, -1.2],
  direction = 1,
  scale = 0.75,
  riderVariant = 'casual',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const time = frame / fps;
  const currentX = startPosition[0] + direction * speed * time;

  const wheelRadius = 0.2;
  const wheelAngle = (currentX / wheelRadius) * (direction >= 0 ? -1 : 1);

  // Subtle motor vibration and gentle cornering tilt
  const vibration = deterministicBob(frame, fps, 16, 0.015);
  const tiltZ = Math.sin(time * 3) * 0.02;

  return (
    <group
      position={[currentX, startPosition[1] + vibration, startPosition[2]]}
      rotation={[0, direction >= 0 ? 0 : Math.PI, tiltZ]}
      scale={[scale, scale, scale]}
    >
      {/* Scooter Main Body & Floorboard */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[1.4, 0.2, 0.35]} />
        <meshStandardMaterial color={bodyColor} roughness={0.3} flatShading />
      </mesh>

      {/* Front Leg Shield */}
      <mesh position={[0.48, 0.55, 0]} rotation={[0, 0, -0.3]} castShadow>
        <boxGeometry args={[0.12, 0.65, 0.42]} />
        <meshStandardMaterial color={bodyColor} roughness={0.3} flatShading />
      </mesh>

      {/* Headlight Housing */}
      <mesh position={[0.58, 0.88, 0]} castShadow>
        <boxGeometry args={[0.22, 0.2, 0.24]} />
        <meshStandardMaterial color={bodyColor} roughness={0.3} flatShading />
      </mesh>
      {/* Headlight Bulb (Glow) */}
      <mesh position={[0.7, 0.88, 0]}>
        <circleGeometry args={[0.08, 12]} />
        <meshStandardMaterial color="#ffffff" emissive="#fef08a" emissiveIntensity={2.0} />
      </mesh>

      {/* Handlebar Grips */}
      <mesh position={[0.54, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.55, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>

      {/* Scooter Seat (Dark leather) */}
      <mesh position={[-0.15, 0.42, 0]} castShadow>
        <boxGeometry args={[0.65, 0.16, 0.28]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>

      {/* Rear Tail Section & Taillight */}
      <mesh position={[-0.55, 0.35, 0]} castShadow>
        <boxGeometry args={[0.35, 0.28, 0.28]} />
        <meshStandardMaterial color={bodyColor} roughness={0.3} flatShading />
      </mesh>
      <mesh position={[-0.73, 0.36, 0]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[0.05, 8]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.5} />
      </mesh>

      {/* Front Wheel */}
      <group position={[0.55, 0.05, 0]} rotation={[0, 0, wheelAngle]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.09, 14]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
      </group>

      {/* Rear Wheel */}
      <group position={[-0.45, 0.05, 0]} rotation={[0, 0, wheelAngle]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.09, 14]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
      </group>

      {/* Seated Rider (LowPolyCharacter in ride posture) */}
      <LowPolyCharacter
        variant={riderVariant === 'worker' ? 'worker' : 'casual'}
        action="ride"
        position={[-0.12, 0.45, 0]}
        scale={0.88}
        rotationY={Math.PI / 2}
      />
    </group>
  );
};
