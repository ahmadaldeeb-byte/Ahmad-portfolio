import * as THREE from 'three';
import {Easing, interpolate} from 'remotion';
import type {CutawayProps} from './schema';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const io = Easing.inOut(Easing.cubic);

export type CutawayState = {reveal: number; action: number; focusGlow: number};

/** Frame-driven state shared by the 3D model and the text overlay. */
export const cutawayState = (f: number, p: CutawayProps): CutawayState => {
  const a0 = p.actionFrom;
  const r = p.actionFrames;
  return {
    reveal: interpolate(f, [p.revealFrom, p.revealFrom + 22], [0, 1], {...clamp, easing: io}),
    action: interpolate(f, [a0, a0 + r, a0 + r + 20, a0 + 2 * r + 20], [0, 1, 1, 0], {...clamp, easing: io}),
    focusGlow: interpolate(f, [p.revealFrom, p.revealFrom + 12], [0, 1], clamp),
  };
};

export const cutawayView = (f: number, total: number, p: CutawayProps) => {
  const t = interpolate(f, [0, total], [0, 1], {...clamp, easing: Easing.inOut(Easing.sin)});
  return {
    position: new THREE.Vector3(...p.cameraFrom).lerp(new THREE.Vector3(...p.cameraTo), t),
    target: new THREE.Vector3(...p.target),
    fov: p.fov,
  };
};

export const projectView = (pt: THREE.Vector3, v: ReturnType<typeof cutawayView>, width: number, height: number) => {
  const cam = new THREE.PerspectiveCamera(v.fov, width / height, 0.1, 200);
  cam.position.copy(v.position);
  cam.lookAt(v.target);
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  const n = pt.clone().project(cam);
  return {x: ((n.x + 1) / 2) * width, y: ((1 - n.y) / 2) * height};
};
