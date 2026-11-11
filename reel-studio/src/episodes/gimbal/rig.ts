// Pure, frame-driven state of the gimbal: shared by the 3D scene and the 2D text overlay so that
// labels, numbers and arrows are always in sync with the model (no useFrame, no clocks).
import * as THREE from 'three';
import {Easing, interpolate} from 'remotion';
import {EASE} from '../../apple-motion/tokens';
import type {GimbalProps} from './storyboard';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
// same curve as apple-motion's Counter roll, so the on-screen number tracks the real angle
const roll = Easing.bezier(EASE.camera[0], EASE.camera[1], EASE.camera[2], EASE.camera[3]);
const io = Easing.inOut(Easing.cubic);
const DEG = Math.PI / 180;

/** World-space layout (units ≈ 10 cm). Pivot = the wrist, inside the grip. */
export const RIG = {
  pivot: new THREE.Vector3(0, -2.2, 0),
  tiltAxis: new THREE.Vector3(1.25, 1.2, 0), // centre of the tilt motor
  cameraCentre: new THREE.Vector3(0, 1.2, 0),
};

/** Handle pitch in degrees (+ = top of handle forward, toward the lens). */
export const handleTiltDeg = (f: number, p: Pick<GimbalProps, 'tiltFrom' | 'tiltRampFrames' | 'counterTo'>) => {
  const A = p.counterTo;
  const t0 = p.tiltFrom;
  const r = p.tiltRampFrames;
  // hook: small natural wobble (camera already steady)
  const wobble = interpolate(f, [0, 16, 34, 52, 62], [0, -4, 5, -2, 0], {...clamp, easing: io});
  if (f < t0) return wobble;
  // forward tilt to A (Counter-shaped ease), hold, back to -0.6A, home
  if (f < t0 + r) return interpolate(f, [t0, t0 + r], [0, A], {...clamp, easing: roll});
  if (f < t0 + r + 26) return A;
  if (f < t0 + 2 * r + 34) return interpolate(f, [t0 + r + 26, t0 + 2 * r + 34], [A, -0.6 * A], {...clamp, easing: io});
  return interpolate(f, [t0 + 2 * r + 34, t0 + 2 * r + 58], [-0.6 * A, 0], {...clamp, easing: io});
};

export type RigState = {
  handle: number; // rad
  motor: number; // rad, tilt-motor rotation relative to the arm
  cameraWorldPitch: number; // rad, what the viewer should see stay ~0
  reveal: number; // 0..1 x-ray / cutaway
  axisDraw: number; // 0..1 axis line grows through the camera
  arrows: number; // 0..1 visibility of angle arcs
  imuPulse: number; // 0..1 sensor flash
};

export const rigState = (f: number, p: GimbalProps): RigState => {
  const h = handleTiltDeg(f, p);
  const hLag = handleTiltDeg(f - p.correctionLagFrames, p);
  const motor = -hLag * DEG;
  const speed = Math.abs(handleTiltDeg(f, p) - handleTiltDeg(f - 1, p));
  return {
    handle: h * DEG,
    motor,
    cameraWorldPitch: h * DEG + motor,
    reveal: interpolate(f, [p.revealFrom, p.revealFrom + 22], [0, 1], {...clamp, easing: io}),
    axisDraw: interpolate(f, [p.revealFrom + 8, p.revealFrom + 26], [0, 1], {...clamp, easing: roll}),
    arrows:
      interpolate(f, [p.tiltFrom, p.tiltFrom + 6], [0, 1], clamp) *
      interpolate(f, [p.outroFrom + 10, p.outroFrom + 20], [1, 0], clamp),
    imuPulse: Math.min(1, speed / 1.2) * interpolate(f, [p.revealFrom, p.revealFrom + 10], [0, 1], clamp),
  };
};

/** Rotate a rest-pose world point by the handle pitch about the wrist pivot (X axis). */
export const withHandle = (pt: THREE.Vector3, handleRad: number) => {
  const v = pt.clone().sub(RIG.pivot);
  v.applyAxisAngle(new THREE.Vector3(1, 0, 0), handleRad);
  return v.add(RIG.pivot);
};

/** Camera choreography: slow oblique push-in. */
export const viewAt = (f: number, total: number) => {
  const t = interpolate(f, [0, total], [0, 1], {...clamp, easing: Easing.inOut(Easing.sin)});
  return {
    position: new THREE.Vector3(
      interpolate(t, [0, 1], [14.3, 12.9]),
      interpolate(t, [0, 1], [4.1, 3.3]),
      interpolate(t, [0, 1], [7.9, 6.8]),
    ),
    target: new THREE.Vector3(0.2, interpolate(t, [0, 1], [-0.9, -0.6]), 0),
    fov: 32,
  };
};

/** Project a world point to composition pixels with the same camera the ThreeCanvas uses. */
export const project = (pt: THREE.Vector3, f: number, total: number, width: number, height: number) => {
  const v = viewAt(f, total);
  const cam = new THREE.PerspectiveCamera(v.fov, width / height, 0.1, 100);
  cam.position.copy(v.position);
  cam.lookAt(v.target);
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  const n = pt.clone().project(cam);
  return {x: ((n.x + 1) / 2) * width, y: ((1 - n.y) / 2) * height};
};
