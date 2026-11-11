/**
 * Pure deterministic frame clock utilities for Remotion 3D scenes.
 * Guarantees zero frame-drift and frame-accurate playback.
 */

export interface FrameContext {
  frame: number;
  fps: number;
  durationInFrames: number;
}

/**
 * Returns normalized progress [0..1] of the scene or segment.
 */
export const getProgress = (
  frame: number,
  startFrame: number = 0,
  durationInFrames: number
): number => {
  if (durationInFrames <= 0) return 0;
  const relativeFrame = frame - startFrame;
  if (relativeFrame <= 0) return 0;
  if (relativeFrame >= durationInFrames) return 1;
  return relativeFrame / durationInFrames;
};

/**
 * Calculates continuous, deterministic rotation angle in radians.
 * @param frame Current Remotion frame
 * @param fps Current frames per second
 * @param speedRevsPerSec Full 360-degree rotations per second
 */
export const deterministicRotation = (
  frame: number,
  fps: number,
  speedRevsPerSec: number = 0.5
): number => {
  const seconds = frame / fps;
  return seconds * speedRevsPerSec * Math.PI * 2;
};

/**
 * Deterministic oscillation / bobbing between -amplitude and +amplitude.
 */
export const deterministicBob = (
  frame: number,
  fps: number,
  frequencyHz: number = 1,
  amplitude: number = 0.1
): number => {
  const seconds = frame / fps;
  return Math.sin(seconds * frequencyHz * Math.PI * 2) * amplitude;
};
