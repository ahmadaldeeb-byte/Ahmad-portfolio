/**
 * Deterministic pseudo-random number and noise generator.
 * Eliminates Math.random() in render loops to guarantee frame-accuracy.
 */

// Simple deterministic integer hash (MurmurHash3-inspired)
export const hashInt = (x: number, seed: number = 0): number => {
  let h = (x ^ seed) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
};

/**
 * Returns deterministic float in range [0, 1) based on integer index and seed.
 */
export const deterministicRandom = (index: number, seed: number = 42): number => {
  return hashInt(index, seed) / 0xffffffff;
};

/**
 * Deterministic smooth 1D Perlin-like pseudo-noise taking continuous frame value.
 */
export const deterministicNoise1D = (t: number, seed: number = 0): number => {
  const i0 = Math.floor(t);
  const i1 = i0 + 1;
  const f = t - i0;

  // Smoothstep s-curve
  const smooth = f * f * (3 - 2 * f);

  const r0 = (hashInt(i0, seed) / 0xffffffff) * 2 - 1;
  const r1 = (hashInt(i1, seed) / 0xffffffff) * 2 - 1;

  return r0 + (r1 - r0) * smooth;
};

/**
 * Deterministic 3D noise vector for particle turbulence or organic motion.
 */
export const deterministicNoise3D = (
  frame: number,
  fps: number,
  particleIndex: number,
  frequency: number = 0.5
): [number, number, number] => {
  const t = (frame / fps) * frequency;
  const nx = deterministicNoise1D(t + particleIndex * 3.1415, 101);
  const ny = deterministicNoise1D(t + particleIndex * 7.7182, 202);
  const nz = deterministicNoise1D(t + particleIndex * 13.914, 303);
  return [nx, ny, nz];
};
