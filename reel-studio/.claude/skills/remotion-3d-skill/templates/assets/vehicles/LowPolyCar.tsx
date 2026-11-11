import React from 'react';
import * as THREE from 'three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { deterministicBob } from '@3d-assets/core';

export const lowPolyCarPropsSchema = z.object({
  variant: z.enum(['taxi', 'sedan', 'van']).default('taxi'),
  color: z.string().default('#facc15'), // Yellow for taxi
  speed: z.number().default(3.5), // Units per second
  startPosition: z.tuple([z.number(), z.number(), z.number()]).default([-12, 0.35, 1.2]),
  direction: z.number().default(1), // 1 for +X, -1 for -X
  scale: z.number().default(0.85),
});

export type LowPolyCarProps = z.input<typeof lowPolyCarPropsSchema>;

export const LowPolyCar: React.FC<LowPolyCarProps> = ({
  variant = 'taxi',
  color = '#facc15',
  speed = 3.5,
  startPosition = [-12, 0.35, 1.2],
  direction = 1,
  scale = 0.85,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const time = frame / fps;
  const currentX = startPosition[0] + direction * speed * time;

  // Wheel rotation calculation based on distance traveled
  const wheelRadius = 0.22;
  const wheelAngle = (currentX / wheelRadius) * (direction >= 0 ? -1 : 1);

  // Subtle driving suspension vibration
  const vibration = deterministicBob(frame, fps, 12, 0.012);

  return (
    <group
      position={[currentX, startPosition[1] + vibration, startPosition[2]]}
      rotation={[0, direction >= 0 ? 0 : Math.PI, 0]}
      scale={[scale, scale, scale]}
    >
      {/* Lower Car Chassis Body */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.35, 1.05]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} flatShading />
      </mesh>

      {/* Cabin & Windows */}
      <mesh position={[-0.1, 0.62, 0]} castShadow>
        <boxGeometry args={[1.2, 0.42, 0.95]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} flatShading />
      </mesh>
      {/* Front Windshield (Glass) */}
      <mesh position={[0.51, 0.62, 0]} rotation={[0, 0, -0.2]}>
        <planeGeometry args={[0.02, 0.4]} />
        <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.8} />
      </mesh>
      {/* Side Windows */}
      <mesh position={[-0.1, 0.62, 0.48]}>
        <planeGeometry args={[1.0, 0.28]} />
        <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.8} />
      </mesh>
      <mesh position={[-0.1, 0.62, -0.48]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.0, 0.28]} />
        <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.8} />
      </mesh>

      {/* Taxi Roof Sign */}
      {variant === 'taxi' && (
        <group position={[-0.1, 0.9, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.35, 0.12, 0.18]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} emissive="#fef08a" emissiveIntensity={0.5} />
          </mesh>
        </group>
      )}

      {/* Headlights (Warm White Glow) */}
      <mesh position={[1.11, 0.28, 0.35]}>
        <circleGeometry args={[0.09, 12]} />
        <meshStandardMaterial color="#ffffff" emissive="#fef08a" emissiveIntensity={1.8} />
      </mesh>
      <mesh position={[1.11, 0.28, -0.35]}>
        <circleGeometry args={[0.09, 12]} />
        <meshStandardMaterial color="#ffffff" emissive="#fef08a" emissiveIntensity={1.8} />
      </mesh>

      {/* Taillights (Red) */}
      <mesh position={[-1.11, 0.28, 0.35]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[0.07, 10]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[-1.11, 0.28, -0.35]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[0.07, 10]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.5} />
      </mesh>

      {/* 4 Wheels (with deterministic spin) */}
      {/* Front Right Wheel */}
      <group position={[0.68, 0.05, 0.54]} rotation={[0, 0, wheelAngle]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.14, 16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
        {/* Hubcap */}
        <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.1, 10]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>

      {/* Front Left Wheel */}
      <group position={[0.68, 0.05, -0.54]} rotation={[0, 0, wheelAngle]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.14, 16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0, -0.08]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.1, 10]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>

      {/* Rear Right Wheel */}
      <group position={[-0.68, 0.05, 0.54]} rotation={[0, 0, wheelAngle]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.14, 16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.1, 10]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>

      {/* Rear Left Wheel */}
      <group position={[-0.68, 0.05, -0.54]} rotation={[0, 0, wheelAngle]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.14, 16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0, -0.08]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.1, 10]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>
    </group>
  );
};
