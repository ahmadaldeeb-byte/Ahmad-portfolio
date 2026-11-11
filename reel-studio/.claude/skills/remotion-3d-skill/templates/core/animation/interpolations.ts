import { interpolate, Easing } from 'remotion';

export type Vector3Tuple = [number, number, number];

/**
 * Deterministically interpolates between two 3D vectors.
 */
export const lerpVector3 = (
  from: Vector3Tuple,
  to: Vector3Tuple,
  alpha: number
): Vector3Tuple => {
  const clamped = Math.max(0, Math.min(1, alpha));
  return [
    from[0] + (to[0] - from[0]) * clamped,
    from[1] + (to[1] - from[1]) * clamped,
    from[2] + (to[2] - from[2]) * clamped,
  ];
};

/**
 * Keyframe sequencer for 3D coordinates.
 */
export interface Vector3Keyframe {
  frame: number;
  value: Vector3Tuple;
  easing?: (t: number) => number;
}

export const interpolateKeyframeVector3 = (
  frame: number,
  keyframes: Vector3Keyframe[]
): Vector3Tuple => {
  if (keyframes.length === 0) return [0, 0, 0];
  if (keyframes.length === 1) return keyframes[0].value;

  if (frame <= keyframes[0].frame) return keyframes[0].value;
  if (frame >= keyframes[keyframes.length - 1].frame) {
    return keyframes[keyframes.length - 1].value;
  }

  // Find surrounding segment
  for (let i = 0; i < keyframes.length - 1; i++) {
    const kfStart = keyframes[i];
    const kfEnd = keyframes[i + 1];

    if (frame >= kfStart.frame && frame <= kfEnd.frame) {
      const segmentProgress = (frame - kfStart.frame) / (kfEnd.frame - kfStart.frame);
      const easedProgress = kfStart.easing ? kfStart.easing(segmentProgress) : segmentProgress;
      return lerpVector3(kfStart.value, kfEnd.value, easedProgress);
    }
  }

  return keyframes[0].value;
};

/**
 * Remotion spring helper for 3D Vector scale/position.
 */
export const springVector3 = (
  progress: number,
  from: Vector3Tuple,
  to: Vector3Tuple
): Vector3Tuple => {
  return [
    from[0] + (to[0] - from[0]) * progress,
    from[1] + (to[1] - from[1]) * progress,
    from[2] + (to[2] - from[2]) * progress,
  ];
};
