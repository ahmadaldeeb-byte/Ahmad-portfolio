import React from 'react';
import * as THREE from 'three';
import { z } from 'zod';
import { Palette } from '@3d-assets/core';
import { Streetlamp, TrafficLight, FireHydrant } from '../urban/StreetProps';
import { LowPolyTree } from './DioramaStage';

export const urbanCityDioramaPropsSchema = z.object({
  width: z.number().default(16),
  depth: z.number().default(14),
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  showProps: z.boolean().default(true),
});

export type UrbanCityDioramaProps = z.input<typeof urbanCityDioramaPropsSchema>;

export const UrbanCityDiorama: React.FC<UrbanCityDioramaProps> = ({
  width = 16,
  depth = 14,
  position = [0, 0, 0],
  showProps = true,
}) => {
  const roadWidth = 4.2;
  const sidewalkDepth = 3.2;

  return (
    <group position={position}>
      {/* 1. Earth & Concrete Cutaway Foundation Slab */}
      <mesh position={[0, -1.0, 0]} receiveShadow>
        <boxGeometry args={[width, 1.8, depth]} />
        <meshStandardMaterial color={Palette.soilBrown} roughness={0.95} flatShading />
      </mesh>
      {/* Subsoil Dark Layer */}
      <mesh position={[0, -1.8, 0]} receiveShadow>
        <boxGeometry args={[width * 0.99, 0.4, depth * 0.99]} />
        <meshStandardMaterial color="#3e2712" roughness={0.95} flatShading />
      </mesh>

      {/* 2. Asphalt Road Plane */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, roadWidth]} />
        <meshStandardMaterial color="#1e293b" roughness={0.85} />
      </mesh>

      {/* Dashed Center Road Lines */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[-width / 2 + 1.2 + i * 2.0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.0, 0.12]} />
          <meshBasicMaterial color="#facc15" />
        </mesh>
      ))}

      {/* Crosswalk / Zebra Cross (Pedestrian crossing) */}
      <group position={[1.5, 0.025, 0]}>
        {Array.from({ length: 9 }).map((_, i) => (
          <mesh key={i} position={[0, 0, -roadWidth / 2 + 0.45 + i * 0.42]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.2, 0.24]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        ))}
      </group>

      {/* 3. North Sidewalk (Curb + Pavement) */}
      <mesh position={[0, 0.1, -roadWidth / 2 - sidewalkDepth / 2]} receiveShadow>
        <boxGeometry args={[width, 0.18, sidewalkDepth]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} flatShading />
      </mesh>

      {/* 4. South Sidewalk (Curb + Pavement) */}
      <mesh position={[0, 0.1, roadWidth / 2 + sidewalkDepth / 2]} receiveShadow>
        <boxGeometry args={[width, 0.18, sidewalkDepth]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} flatShading />
      </mesh>

      {/* 5. Street Props: Lamps, Traffic Light, Hydrant, Greenery */}
      {showProps && (
        <>
          {/* North Sidewalk Streetlamps */}
          <Streetlamp position={[-4.5, 0.19, -roadWidth / 2 - 0.35]} height={2.4} />
          <Streetlamp position={[4.5, 0.19, -roadWidth / 2 - 0.35]} height={2.4} />

          {/* South Sidewalk Streetlamp */}
          <Streetlamp position={[-1.2, 0.19, roadWidth / 2 + 0.35]} height={2.4} />

          {/* Traffic Light at Crosswalk */}
          <TrafficLight position={[2.4, 0.19, -roadWidth / 2 - 0.35]} activeColor="green" />

          {/* Fire Hydrant */}
          <FireHydrant position={[0.4, 0.19, roadWidth / 2 + 0.4]} />

          {/* Street Trees */}
          <LowPolyTree position={[-6.2, 0.19, -roadWidth / 2 - 0.7]} scale={0.9} />
          <LowPolyTree position={[6.0, 0.19, -roadWidth / 2 - 0.7]} scale={1.05} />
          <LowPolyTree position={[-5.0, 0.19, roadWidth / 2 + 0.7]} scale={0.85} />
          <LowPolyTree position={[5.2, 0.19, roadWidth / 2 + 0.7]} scale={0.95} />
        </>
      )}
    </group>
  );
};
