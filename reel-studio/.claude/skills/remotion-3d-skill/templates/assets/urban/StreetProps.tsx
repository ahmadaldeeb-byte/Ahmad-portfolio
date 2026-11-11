import React from 'react';
import * as THREE from 'three';
import { z } from 'zod';

export const streetlampPropsSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  height: z.number().default(2.2),
  poleColor: z.string().default('#334155'), // Dark slate
  lightColor: z.string().default('#fef08a'), // Warm yellow
  isOn: z.boolean().default(true),
});

export type StreetlampProps = z.input<typeof streetlampPropsSchema>;

export const Streetlamp: React.FC<StreetlampProps> = ({
  position = [0, 0, 0],
  height = 2.2,
  poleColor = '#334155',
  lightColor = '#fef08a',
  isOn = true,
}) => {
  return (
    <group position={position}>
      {/* Base & Pole */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.16, 8]} />
        <meshStandardMaterial color={poleColor} roughness={0.7} />
      </mesh>
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.045, height, 8]} />
        <meshStandardMaterial color={poleColor} roughness={0.7} />
      </mesh>

      {/* Curved Arm & Fixture */}
      <mesh position={[0.2, height - 0.05, 0]} rotation={[0, 0, -Math.PI / 3]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 0.45, 8]} />
        <meshStandardMaterial color={poleColor} roughness={0.7} />
      </mesh>
      <mesh position={[0.42, height - 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.06, 0.14, 8]} />
        <meshStandardMaterial color={poleColor} roughness={0.7} />
      </mesh>

      {/* Lantern Glow */}
      <mesh position={[0.42, height - 0.22, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial
          color={lightColor}
          emissive={lightColor}
          emissiveIntensity={isOn ? 1.5 : 0}
        />
      </mesh>
    </group>
  );
};

export const trafficLightPropsSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  height: z.number().default(2.5),
  activeColor: z.enum(['red', 'yellow', 'green']).default('green'),
});

export type TrafficLightProps = z.input<typeof trafficLightPropsSchema>;

export const TrafficLight: React.FC<TrafficLightProps> = ({
  position = [0, 0, 0],
  height = 2.5,
  activeColor = 'green',
}) => {
  return (
    <group position={position}>
      {/* Post */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, height, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>

      {/* Signal Box */}
      <mesh position={[0, height - 0.35, 0]} castShadow>
        <boxGeometry args={[0.22, 0.6, 0.2]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>

      {/* Red Light */}
      <mesh position={[0, height - 0.18, 0.105]}>
        <circleGeometry args={[0.06, 12]} />
        <meshBasicMaterial color={activeColor === 'red' ? '#ef4444' : '#450a0a'} />
      </mesh>

      {/* Yellow Light */}
      <mesh position={[0, height - 0.35, 0.105]}>
        <circleGeometry args={[0.06, 12]} />
        <meshBasicMaterial color={activeColor === 'yellow' ? '#f59e0b' : '#451a03'} />
      </mesh>

      {/* Green Light */}
      <mesh position={[0, height - 0.52, 0.105]}>
        <circleGeometry args={[0.06, 12]} />
        <meshBasicMaterial color={activeColor === 'green' ? '#22c55e' : '#052e16'} />
      </mesh>
    </group>
  );
};

export const FireHydrant: React.FC<{ position?: [number, number, number] }> = ({
  position = [0, 0, 0],
}) => {
  return (
    <group position={position}>
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.32, 10]} />
        <meshStandardMaterial color="#dc2626" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.34, 0]} castShadow>
        <sphereGeometry args={[0.085, 10, 8]} />
        <meshStandardMaterial color="#dc2626" roughness={0.4} />
      </mesh>
      {/* Side caps */}
      <mesh position={[0.08, 0.2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.08, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      <mesh position={[-0.08, 0.2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.08, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
    </group>
  );
};
