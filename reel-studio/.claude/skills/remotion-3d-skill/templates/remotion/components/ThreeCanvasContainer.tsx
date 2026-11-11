import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useVideoConfig } from 'remotion';
import * as THREE from 'three';

export interface ThreeCanvasContainerProps {
  children: React.ReactNode;
  shadows?: boolean;
  clearColor?: string;
}

export const ThreeCanvasContainer: React.FC<ThreeCanvasContainerProps> = ({
  children,
  shadows = true,
  clearColor = '#e8dfd5', // Default warm neutral matching diorama reference
}) => {
  const { width, height } = useVideoConfig();

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ThreeCanvas
        width={width}
        height={height}
        shadows={shadows}
        linear={false}
        camera={{ position: [0, 6, 12], fov: 42 }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.shadowMap.enabled = shadows;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          scene.background = new THREE.Color(clearColor);
        }}
      >
        {children}
      </ThreeCanvas>
    </div>
  );
};
