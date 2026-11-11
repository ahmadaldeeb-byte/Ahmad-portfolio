import { randomInt } from "./utils";

/**
 * Wheel geometry: segment i spans [i*seg, (i+1)*seg) degrees, measured clockwise
 * from the pointer at the top (12 o'clock). The wheel rotates clockwise by `rotation`.
 */
export function segmentAngle(count: number) {
  return 360 / count;
}

/** Which segment sits under the top pointer for a given total rotation (degrees). */
export function segmentAtPointer(rotation: number, count: number): number {
  const seg = segmentAngle(count);
  // Rotating the wheel clockwise by r brings the point at angle (360 - r) under the pointer.
  const a = (((360 - (rotation % 360)) % 360) + 360) % 360;
  return Math.min(count - 1, Math.floor(a / seg));
}

/**
 * Plans a spin: the winner is chosen first with an unbiased RNG, then a final
 * rotation is computed that lands the pointer inside that segment (avoiding
 * the edges), after several full turns.
 */
export function planSpin(currentRotation: number, count: number, rng: (n: number) => number = randomInt) {
  if (count < 1) throw new Error("wheel needs at least one segment");
  const winner = rng(count);
  const seg = segmentAngle(count);
  // Random offset within the middle 70% of the segment.
  const within = seg * (0.15 + (rng(1000) / 1000) * 0.7);
  const targetAngle = winner * seg + within; // angle that must be under the pointer
  const targetMod = (360 - targetAngle + 360) % 360; // rotation mod 360 that achieves it
  const currentMod = ((currentRotation % 360) + 360) % 360;
  let delta = targetMod - currentMod;
  if (delta < 0) delta += 360;
  const turns = 5 + rng(3); // 5..7 full turns
  return { winner, rotation: currentRotation + turns * 360 + delta };
}

/** Easing used for the spin: fast start, long natural slowdown. */
export function spinEase(t: number) {
  return 1 - Math.pow(1 - t, 4);
}
