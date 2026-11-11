import React from 'react';
import * as THREE from 'three';
import { z } from 'zod';

export const miniatureHousePropsSchema = z.object({
  variant: z.enum(['cottage', 'townhouse', 'apartment', 'villa']).default('cottage'),
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  rotationY: z.number().default(0),
  scale: z.number().default(1),
  wallColor: z.string().default('#faf7f0'),
  roofColor: z.string().default('#d2543e'), // Authentic terracotta from reference
});

export type MiniatureHouseProps = z.input<typeof miniatureHousePropsSchema>;

export const MiniatureHouse: React.FC<MiniatureHouseProps> = ({
  variant = 'cottage',
  position = [0, 0, 0],
  rotationY = 0,
  scale = 1,
  wallColor = '#faf7f0',
  roofColor = '#d2543e',
}) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={[scale, scale, scale]}>
      {variant === 'cottage' && (
        <group>
          {/* Main Walls */}
          <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.9, 0.55, 0.7]} />
            <meshStandardMaterial color={wallColor} roughness={0.8} flatShading />
          </mesh>
          {/* Hipped Terracotta Roof */}
          <mesh position={[0, 0.72, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[0.72, 0.45, 4]} />
            <meshStandardMaterial color={roofColor} roughness={0.7} flatShading />
          </mesh>
          {/* Tiny Door */}
          <mesh position={[0, 0.16, 0.355]}>
            <planeGeometry args={[0.15, 0.28]} />
            <meshStandardMaterial color="#475569" roughness={0.6} />
          </mesh>
          {/* Tiny Windows */}
          <mesh position={[-0.24, 0.3, 0.355]}>
            <planeGeometry args={[0.14, 0.14]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0.24, 0.3, 0.355]}>
            <planeGeometry args={[0.14, 0.14]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </group>
      )}

      {variant === 'townhouse' && (
        <group>
          {/* 2-Story Walls */}
          <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.85, 1.0, 0.75]} />
            <meshStandardMaterial color={wallColor} roughness={0.8} flatShading />
          </mesh>
          {/* Terracotta Gabled Roof */}
          <mesh position={[0, 1.18, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[0.68, 0.48, 4]} />
            <meshStandardMaterial color={roofColor} roughness={0.7} flatShading />
          </mesh>
          {/* Door */}
          <mesh position={[0, 0.18, 0.38]}>
            <planeGeometry args={[0.16, 0.32]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          {/* Upper Floor Windows */}
          <mesh position={[-0.22, 0.7, 0.38]}>
            <planeGeometry args={[0.15, 0.2]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0.22, 0.7, 0.38]}>
            <planeGeometry args={[0.15, 0.2]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </group>
      )}

      {variant === 'apartment' && (
        <group>
          {/* 3-Story Miniature Apartment Block */}
          <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.0, 1.3, 0.8]} />
            <meshStandardMaterial color={wallColor} roughness={0.8} flatShading />
          </mesh>
          {/* Flat Roof Trim */}
          <mesh position={[0, 1.32, 0]} castShadow>
            <boxGeometry args={[1.05, 0.08, 0.85]} />
            <meshStandardMaterial color="#b43f2c" roughness={0.7} />
          </mesh>
          {/* Rows of Dot Windows */}
          {[-0.28, 0, 0.28].map((x, xi) =>
            [0.35, 0.75, 1.05].map((y, yi) => (
              <mesh key={`${xi}-${yi}`} position={[x, y, 0.405]}>
                <planeGeometry args={[0.12, 0.15]} />
                <meshStandardMaterial color="#1e293b" />
              </mesh>
            ))
          )}
        </group>
      )}

      {variant === 'villa' && (
        <group>
          {/* L-Shaped Body */}
          <mesh position={[-0.2, 0.32, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.8, 0.6, 0.8]} />
            <meshStandardMaterial color={wallColor} roughness={0.8} flatShading />
          </mesh>
          <mesh position={[0.3, 0.28, 0.1]} castShadow receiveShadow>
            <boxGeometry args={[0.6, 0.55, 0.6]} />
            <meshStandardMaterial color={wallColor} roughness={0.8} flatShading />
          </mesh>
          {/* Pitched Roofs */}
          <mesh position={[-0.2, 0.78, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[0.65, 0.45, 4]} />
            <meshStandardMaterial color={roofColor} roughness={0.7} flatShading />
          </mesh>
          <mesh position={[0.3, 0.68, 0.1]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[0.5, 0.38, 4]} />
            <meshStandardMaterial color={roofColor} roughness={0.7} flatShading />
          </mesh>
        </group>
      )}
    </group>
  );
};
