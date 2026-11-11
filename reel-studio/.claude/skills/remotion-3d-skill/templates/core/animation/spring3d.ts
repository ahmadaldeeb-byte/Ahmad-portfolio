import { spring, SpringConfig } from 'remotion';
import { Vector3Tuple, springVector3 } from './interpolations';

export interface Spring3DOptions {
  frame: number;
  fps: number;
  delay?: number;
  durationInFrames?: number;
  config?: Partial<SpringConfig>;
}

export const getSpringProgress = ({
  frame,
  fps,
  delay = 0,
  durationInFrames,
  config = { damping: 12, stiffness: 100, mass: 0.8 },
}: Spring3DOptions): number => {
  return spring({
    frame: frame - delay,
    fps,
    durationInFrames,
    config,
  });
};

export const springScale3D = (
  options: Spring3DOptions,
  fromScale: number = 0,
  toScale: number = 1
): Vector3Tuple => {
  const p = getSpringProgress(options);
  const s = fromScale + (toScale - fromScale) * p;
  return [s, s, s];
};

export const springPosition3D = (
  options: Spring3DOptions,
  fromPos: Vector3Tuple,
  toPos: Vector3Tuple
): Vector3Tuple => {
  const p = getSpringProgress(options);
  return springVector3(p, fromPos, toPos);
};
