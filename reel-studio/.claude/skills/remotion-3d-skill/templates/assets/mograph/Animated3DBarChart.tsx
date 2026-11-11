import React from 'react';
import * as THREE from 'three';
import { useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { z } from 'zod';

export const animated3DBarChartPropsSchema = z.object({
  values: z.array(z.number()).default([4, 7, 5, 9, 12]),
  colors: z.array(z.string()).default(['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#fb7185']),
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  staggerDelay: z.number().default(4), // frames between each bar
  barWidth: z.number().default(0.7),
  spacing: z.number().default(1.1),
});

export type Animated3DBarChartProps = z.input<typeof animated3DBarChartPropsSchema>;

export const Animated3DBarChart: React.FC<Animated3DBarChartProps> = ({
  values = [4, 7, 5, 9, 12],
  colors = ['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#fb7185'],
  position = [0, 0, 0],
  staggerDelay = 4,
  barWidth = 0.7,
  spacing = 1.1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const totalWidth = (values.length - 1) * spacing;
  const startX = -totalWidth / 2;

  return (
    <group position={position}>
      {/* Base Grid Platform */}
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <boxGeometry args={[totalWidth + 2, 0.12, 2.5]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>

      {/* 3D Bars */}
      {values.map((val, idx) => {
        const barColor = colors[idx % colors.length];
        const barDelay = idx * staggerDelay;

        // Deterministic spring height growth
        const growthProgress = spring({
          frame: frame - barDelay,
          fps,
          config: { damping: 14, stiffness: 100 },
        });

        const targetHeight = Math.max(0.1, val * 0.35);
        const currentHeight = targetHeight * growthProgress;
        const posX = startX + idx * spacing;

        return (
          <group key={idx} position={[posX, 0, 0]}>
            {/* The rising bar */}
            <mesh position={[0, currentHeight / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[barWidth, Math.max(0.01, currentHeight), barWidth]} />
              <meshStandardMaterial
                color={barColor}
                roughness={0.25}
                metalness={0.3}
                emissive={barColor}
                emissiveIntensity={0.15}
              />
            </mesh>

            {/* Glowing Cap Indicator */}
            <mesh position={[0, currentHeight + 0.04, 0]}>
              <boxGeometry args={[barWidth * 0.9, 0.05, barWidth * 0.9]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
