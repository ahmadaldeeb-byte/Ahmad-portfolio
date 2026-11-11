import React from 'react';
import * as THREE from 'three';
import { useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { z } from 'zod';

export const technicalCallout3DPropsSchema = z.object({
  title: z.string().default('CALLOUT'),
  subtitle: z.string().optional(),
  anchorPosition: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  badgeOffset: z.tuple([z.number(), z.number(), z.number()]).default([1.5, 1.2, 0]),
  startFrame: z.number().default(10),
  badgeColor: z.string().default('#2563eb'), // Blue badge matching reference
  textColor: z.string().default('#ffffff'),
});

export type TechnicalCallout3DProps = z.input<typeof technicalCallout3DPropsSchema>;

export const TechnicalCallout3D: React.FC<TechnicalCallout3DProps> = ({
  title = 'CALLOUT',
  subtitle,
  anchorPosition = [0, 0, 0],
  badgeOffset = [1.5, 1.2, 0],
  startFrame = 10,
  badgeColor = '#2563eb',
  textColor = '#ffffff',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Deterministic spring pop-in
  const popProgress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  if (popProgress <= 0.01) return null;

  const targetBadgePos: [number, number, number] = [
    anchorPosition[0] + badgeOffset[0],
    anchorPosition[1] + badgeOffset[1],
    anchorPosition[2] + badgeOffset[2],
  ];

  // Midpoint elbow for leader line
  const midX = (anchorPosition[0] + targetBadgePos[0]) / 2;
  const midY = targetBadgePos[1];
  const midZ = (anchorPosition[2] + targetBadgePos[2]) / 2;

  // Build line geometry points
  const points = [
    new THREE.Vector3(...anchorPosition),
    new THREE.Vector3(midX, midY, midZ),
    new THREE.Vector3(...targetBadgePos),
  ];
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <group scale={[popProgress, popProgress, popProgress]}>
      {/* Anchor Ring at target object */}
      <mesh position={anchorPosition}>
        <ringGeometry args={[0.06, 0.09, 24]} />
        <meshBasicMaterial color={badgeColor} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={anchorPosition}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Leader Line */}
      <primitive
        object={new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: '#1e293b', linewidth: 2 }))}
      />

      {/* Floating 3D Badge Box */}
      <group position={targetBadgePos}>
        {/* Outer Border / Glow Frame */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[1.6, 0.55, 0.06]} />
          <meshStandardMaterial color={badgeColor} roughness={0.3} metalness={0.2} />
        </mesh>
        {/* White Inner Plaque */}
        <mesh position={[0, 0, 0.032]}>
          <planeGeometry args={[1.5, 0.45]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>
    </group>
  );
};
