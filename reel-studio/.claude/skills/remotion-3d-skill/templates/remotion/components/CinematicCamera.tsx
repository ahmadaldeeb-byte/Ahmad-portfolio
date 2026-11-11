import React, { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { useThree } from '@react-three/fiber';
import { deterministicNoise1D } from '@3d-assets/core';

export type CameraMode =
  | 'static'
  | 'orbit'
  | 'pushIn'
  | 'tracking'
  | 'handheldDrift';

export interface CinematicCameraProps {
  mode?: CameraMode;
  position?: [number, number, number];
  target?: [number, number, number];
  fov?: number;
  orbitSpeed?: number;
  orbitRadius?: number;
  pushInDistance?: number;
  shakeIntensity?: number;
}

export const CinematicCamera: React.FC<CinematicCameraProps> = ({
  mode = 'static',
  position = [0, 5, 12],
  target = [0, 1.5, 0],
  fov = 40,
  orbitSpeed = 0.2,
  orbitRadius = 12,
  pushInDistance = 4,
  shakeIntensity = 0.05,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { camera } = useThree();

  useLayoutEffect(() => {
    let camX = position[0];
    let camY = position[1];
    let camZ = position[2];

    const progress = frame / durationInFrames;
    const timeSec = frame / fps;

    if (mode === 'orbit') {
      const angle = timeSec * orbitSpeed * Math.PI * 2;
      camX = Math.sin(angle) * orbitRadius;
      camZ = Math.cos(angle) * orbitRadius;
    } else if (mode === 'pushIn') {
      camZ = position[2] - pushInDistance * progress;
    } else if (mode === 'handheldDrift') {
      const noiseX = deterministicNoise1D(timeSec * 0.8, 42) * shakeIntensity;
      const noiseY = deterministicNoise1D(timeSec * 0.8, 142) * shakeIntensity;
      camX += noiseX;
      camY += noiseY;
    }

    camera.position.set(camX, camY, camZ);
    camera.lookAt(new THREE.Vector3(...target));
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      (camera as THREE.PerspectiveCamera).fov = fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, frame, fps, durationInFrames, mode, position, target, fov, orbitSpeed, orbitRadius, pushInDistance, shakeIntensity]);

  return null;
};
