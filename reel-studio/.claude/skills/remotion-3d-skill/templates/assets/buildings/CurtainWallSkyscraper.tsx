import React from 'react';
import * as THREE from 'three';
import { z } from 'zod';

export const curtainWallSkyscraperPropsSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  height: z.number().default(22),
  width: z.number().default(3.8),
  depth: z.number().default(3.4),
  glassColor: z.string().default('#c2d6d0'), // Translucent mint/seafoam glass
  glassOpacity: z.number().default(0.55),
  floorCount: z.number().default(28),
  showPlaza: z.boolean().default(true),
  showBlueBarrier: z.boolean().default(true),
});

export type CurtainWallSkyscraperProps = z.input<typeof curtainWallSkyscraperPropsSchema>;

export const CurtainWallSkyscraper: React.FC<CurtainWallSkyscraperProps> = ({
  position = [0, 0, 0],
  height = 22,
  width = 3.8,
  depth = 3.4,
  glassColor = '#c2d6d0',
  glassOpacity = 0.55,
  floorCount = 28,
  showPlaza = true,
  showBlueBarrier = true,
}) => {
  const floorHeight = height / floorCount;

  return (
    <group position={position}>
      {/* 1. Ground Entrance Plaza & Perimeter Blue Construction Barrier */}
      {showPlaza && (
        <group position={[0, 0.05, 0]}>
          {/* Concrete Base Pavement */}
          <mesh receiveShadow>
            <boxGeometry args={[width + 3.2, 0.1, depth + 3.2]} />
            <meshStandardMaterial color="#ded9c8" roughness={0.8} />
          </mesh>

          {/* Blue Boundary / Perimeter Barrier (Iconic element from reference) */}
          {showBlueBarrier && (
            <group position={[0, 0.22, 0]}>
              {/* Front barrier with entrance gap */}
              <mesh position={[-(width + 2.8) / 4 - 0.4, 0, (depth + 2.8) / 2]}>
                <boxGeometry args={[(width + 2.8) / 2 - 0.8, 0.38, 0.08]} />
                <meshStandardMaterial color="#1d4ed8" roughness={0.4} />
              </mesh>
              <mesh position={[(width + 2.8) / 4 + 0.4, 0, (depth + 2.8) / 2]}>
                <boxGeometry args={[(width + 2.8) / 2 - 0.8, 0.38, 0.08]} />
                <meshStandardMaterial color="#1d4ed8" roughness={0.4} />
              </mesh>

              {/* Back barrier */}
              <mesh position={[0, 0, -(depth + 2.8) / 2]}>
                <boxGeometry args={[width + 2.8, 0.38, 0.08]} />
                <meshStandardMaterial color="#1d4ed8" roughness={0.4} />
              </mesh>

              {/* Left barrier */}
              <mesh position={[-(width + 2.8) / 2, 0, 0]}>
                <boxGeometry args={[0.08, 0.38, depth + 2.8]} />
                <meshStandardMaterial color="#1d4ed8" roughness={0.4} />
              </mesh>

              {/* Right barrier */}
              <mesh position={[(width + 2.8) / 2, 0, 0]}>
                <boxGeometry args={[0.08, 0.38, depth + 2.8]} />
                <meshStandardMaterial color="#1d4ed8" roughness={0.4} />
              </mesh>
            </group>
          )}

          {/* Ground Floor Entrance Portal & Glass Canopy (Matching Reference #1) */}
          <mesh position={[0, 0.75, depth / 2 + 0.1]} castShadow>
            <boxGeometry args={[1.6, 1.25, 0.25]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.4} />
          </mesh>
          {/* Glass Doorway */}
          <mesh position={[0, 0.65, depth / 2 + 0.23]}>
            <planeGeometry args={[1.0, 1.05]} />
            <meshPhysicalMaterial color="#334155" roughness={0.1} metalness={0.8} />
          </mesh>
          {/* Modern Slim Glass Canopy */}
          <mesh position={[0, 1.42, depth / 2 + 0.55]} castShadow>
            <boxGeometry args={[2.2, 0.06, 1.0]} />
            <meshPhysicalMaterial color="#c2d6d0" roughness={0.2} transparent opacity={0.7} />
          </mesh>
        </group>
      )}

      {/* 2. Internal Structural Skeletons (Visible through glass) */}
      {/* Central Concrete Core */}
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width * 0.45, height * 0.99, depth * 0.45]} />
        <meshStandardMaterial color="#d1d5db" roughness={0.9} />
      </mesh>

      {/* Internal Floor Slabs Stacked Layer by Layer */}
      {Array.from({ length: floorCount }).map((_, i) => (
        <mesh key={i} position={[0, (i + 0.5) * floorHeight, 0]}>
          <boxGeometry args={[width * 0.96, 0.08, depth * 0.96]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.7} />
        </mesh>
      ))}

      {/* 4 Corner Vertical Columns */}
      {[
        [-width * 0.46, -depth * 0.46],
        [width * 0.46, -depth * 0.46],
        [-width * 0.46, depth * 0.46],
        [width * 0.46, depth * 0.46],
      ].map(([cx, cz], ci) => (
        <mesh key={ci} position={[cx, height / 2, cz]}>
          <boxGeometry args={[0.14, height, 0.14]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
      ))}

      {/* 3. Outer Glass Curtain Wall (Semi-transparent with mullion grid) */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshPhysicalMaterial
          color={glassColor}
          roughness={0.12}
          transmission={0.45}
          opacity={glassOpacity}
          transparent
          ior={1.42}
          reflectivity={0.65}
        />
      </mesh>

      {/* Exterior Mullion Grid Lines on Front & Back Facades */}
      {Array.from({ length: floorCount + 1 }).map((_, fi) => (
        <group key={fi}>
          {/* Front horizontal mullion line */}
          <mesh position={[0, fi * floorHeight, depth / 2 + 0.01]}>
            <planeGeometry args={[width, 0.04]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          {/* Back horizontal mullion line */}
          <mesh position={[0, fi * floorHeight, -depth / 2 - 0.01]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[width, 0.04]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}

      {/* Vertical Mullion Ribbons */}
      {[-width * 0.25, 0, width * 0.25].map((mx, mi) => (
        <group key={mi}>
          <mesh position={[mx, height / 2, depth / 2 + 0.01]}>
            <planeGeometry args={[0.035, height]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[mx, height / 2, -depth / 2 - 0.01]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.035, height]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}

      {/* 4. Rooftop Mechanical Penthouse & Crown */}
      <mesh position={[0, height + 0.6, 0]} castShadow>
        <boxGeometry args={[width * 0.6, 1.2, depth * 0.6]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
      </mesh>
      {/* Glass Parapet Border */}
      <mesh position={[0, height + 0.45, 0]}>
        <boxGeometry args={[width, 0.9, depth]} />
        <meshPhysicalMaterial
          color={glassColor}
          roughness={0.2}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  );
};
