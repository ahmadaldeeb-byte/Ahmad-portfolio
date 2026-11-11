// Frame-driven state of the 3-axis gimbal (pure functions, no clocks). Shared by the 3D model, the
// label anchors and the text preview, so text and model can never drift apart.
import * as THREE from 'three';
import {Easing, interpolate} from 'remotion';
import {EASE} from '../../apple-motion/tokens';
import type {CueFrames, GimbalProps} from './storyboard';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const roll = Easing.bezier(EASE.camera[0], EASE.camera[1], EASE.camera[2], EASE.camera[3]); // = Counter roll
const io = Easing.inOut(Easing.cubic);
const DEG = Math.PI / 180;
const ramp = (f: number, a: number, b: number, from: number, to: number, e = io) => interpolate(f, [a, b], [from, to], {...clamp, easing: e});
const win = (f: number, a: number, b: number, fade = 8) => (b <= a ? 0 : Math.min(ramp(f, a, a + fade, 0, 1, Easing.linear), ramp(f, b - fade, b, 1, 0, Easing.linear)));

/** Rest-pose layout (world units ≈ 10 cm). Joint chain: handle → pan → roll → tilt → camera. */
export const RIG = {
  pivot: new THREE.Vector3(0, -2.2, 0), // wrist
  panMotor: new THREE.Vector3(0, -0.5, 0), // axis: handle-frame Y through x=z=0
  rollMotor: new THREE.Vector3(0, 1.2, -1.0), // axis: Z through (0, 1.2)
  tiltMotor: new THREE.Vector3(1.25, 1.2, 0), // axis: X through (y=1.2, z=0)
  cameraCentre: new THREE.Vector3(0, 1.2, 0),
  imu: new THREE.Vector3(0.75, 0.68, 0.18),
};

type Cf = CueFrames;
const cf = (p: GimbalProps): Cf => p.cueFrames as Cf;

// ── hand attitude (degrees) ────────────────────────────────────────────────────────────────────────
const shake = (f: number, c: Cf, seed: number) => {
  const env = ramp(f, c.outro, c.outro + 10, 0, 1, Easing.linear);
  const t = f / 30;
  return env * 4 * (0.6 * Math.sin(t * 9.1 + seed) + 0.4 * Math.sin(t * 15.7 + seed * 2.3));
};

export const handPitch = (f: number, p: GimbalProps) => {
  const c = cf(p);
  const H = Math.max(40, c.reveal);
  const wobble = interpolate(f, [0, H * 0.26, H * 0.55, H * 0.84, H], [0, -4, 5, -2, 0], {...clamp, easing: io});
  const back0 = Math.max(c.tilt + p.tiltRampFrames + 20, c.roll - 30);
  const tilt = f < back0 ? ramp(f, c.tilt, c.tilt + p.tiltRampFrames, 0, p.tiltDeg, roll) : ramp(f, back0, back0 + 22, p.tiltDeg, 0);
  return wobble + tilt + shake(f, c, 0.7);
};

export const handRoll = (f: number, p: GimbalProps) => {
  const c = cf(p);
  const r = p.rollDeg;
  // «يمين وشمال» are spoken close together: the swing left waits until the swing right has landed
  const left = Math.max(c.rollLeft, c.rollRight + 22);
  const home = Math.max(left + 40, c.pan - 24);
  const v = f < left ? ramp(f, c.rollRight, c.rollRight + 18, 0, r) : f < home ? ramp(f, left, left + 26, r, -r) : ramp(f, home, home + 20, -r, 0);
  return v + shake(f, c, 2.1);
};

/** pan: the hand turns with jitter, the camera follows smoothly (follow mode). */
export const handYaw = (f: number, p: GimbalProps) => {
  const c = cf(p);
  const turn = f < c.payoff ? ramp(f, c.panMove, c.panMove + 34, 0, p.panDeg, Easing.out(Easing.cubic)) : ramp(f, c.payoff, c.payoff + 30, p.panDeg, 0);
  const jitter = win(f, c.panMove, c.panMove + 64, 6) * 3.2 * (Math.sin((f / 30) * 17) * 0.6 + Math.sin((f / 30) * 29 + 1) * 0.4);
  return turn + jitter + shake(f, c, 4.3) * 0.7;
};
const cameraYaw = (f: number, p: GimbalProps) => {
  const c = cf(p);
  return f < c.payoff ? ramp(f, c.panMove + 6, c.panMove + 60, 0, p.panDeg) : ramp(f, c.payoff, c.payoff + 34, p.panDeg, 0);
};

export type RigState = {
  hand: {pitch: number; roll: number; yaw: number}; // rad
  motor: {pan: number; roll: number; tilt: number}; // rad, joint angles
  reveal: number; // 0..1 x-ray
  focus: {tilt: number; roll: number; pan: number; imu: number}; // 0..1 orange highlight per part
  axis: {tilt: number; roll: number; pan: number}; // 0..1 axis line drawn
  arcs: {pitch: number; roll: number; yaw: number}; // 0..1 angle arcs visible
  level: {forward: number; horizon: number}; // 0..1 camera direction / horizon guides
  imuPulse: number;
  imuRing: number; // 0..1 phase of the sensing rings
};

export const rigState = (f: number, p: GimbalProps): RigState => {
  const c = cf(p);
  const L = p.correctionLagFrames;
  const pitch = handPitch(f, p);
  const rl = handRoll(f, p);
  const yaw = handYaw(f, p);
  const reveal = ramp(f, c.reveal, c.reveal + 22, 0, 1);
  const allOn = ramp(f, c.payoff, c.payoff + 12, 0, 1);
  const tiltF = Math.max(win(f, c.reveal, c.roll + 6, 12), allOn);
  const rollF = Math.max(win(f, c.roll, c.pan + 6, 12), allOn);
  const panF = Math.max(win(f, c.pan, c.payoff + 6, 12), allOn);
  const speed = Math.abs(pitch - handPitch(f - 1, p)) + Math.abs(rl - handRoll(f - 1, p)) + Math.abs(yaw - handYaw(f - 1, p));
  return {
    hand: {pitch: pitch * DEG, roll: rl * DEG, yaw: yaw * DEG},
    motor: {
      tilt: -handPitch(f - L, p) * DEG,
      roll: -handRoll(f - L, p) * DEG,
      pan: (cameraYaw(f, p) - handYaw(f - L, p)) * DEG,
    },
    reveal,
    focus: {tilt: tiltF, roll: rollF, pan: panF, imu: Math.max(win(f, c.sensor, c.tilt + p.tiltRampFrames + 10, 8), allOn * 0.6)},
    axis: {
      tilt: Math.max(ramp(f, c.reveal + 8, c.reveal + 26, 0, 1, roll) * win(f, 0, c.roll + 10, 1), allOn),
      roll: Math.max(ramp(f, c.roll, c.roll + 18, 0, 1, roll) * win(f, 0, c.pan + 10, 1), allOn),
      pan: Math.max(ramp(f, c.pan, c.pan + 18, 0, 1, roll) * win(f, 0, c.payoff + 10, 1), allOn),
    },
    arcs: {pitch: win(f, c.tilt, c.roll - 4), roll: win(f, c.rollRight, c.pan - 4), yaw: win(f, c.panMove, c.payoff + 20)},
    level: {forward: Math.max(win(f, c.tilt, c.roll - 4), win(f, c.panMove, c.payoff + 20)), horizon: Math.max(win(f, c.rollRight, c.pan - 4), allOn)},
    imuRing: (f / 22) % 1,
    imuPulse: Math.min(1, speed / 1.5) * ramp(f, c.reveal, c.reveal + 10, 0, 1, Easing.linear) + win(f, c.sensor, c.tilt, 6) * (0.5 + 0.5 * Math.sin(f * 0.9)),
  };
};

// ── joint chain as matrices (used by the model AND by label anchors) ─────────────────────────────────
const about = (pt: THREE.Vector3, rot: THREE.Matrix4) => new THREE.Matrix4().makeTranslation(pt.x, pt.y, pt.z).multiply(rot).multiply(new THREE.Matrix4().makeTranslation(-pt.x, -pt.y, -pt.z));

export type Chain = {handle: THREE.Matrix4; pan: THREE.Matrix4; roll: THREE.Matrix4; tilt: THREE.Matrix4};
/** World matrices of each link: handle (hand attitude about the wrist), then pan, roll, tilt joints. */
export const chain = (s: RigState): Chain => {
  const hand = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(s.hand.pitch, s.hand.yaw, s.hand.roll, 'YXZ'));
  const handle = about(RIG.pivot, hand);
  const pan = handle.clone().multiply(new THREE.Matrix4().makeRotationY(s.motor.pan));
  const roll = pan.clone().multiply(about(RIG.cameraCentre, new THREE.Matrix4().makeRotationZ(s.motor.roll)));
  const tilt = roll.clone().multiply(about(RIG.cameraCentre, new THREE.Matrix4().makeRotationX(s.motor.tilt)));
  return {handle, pan, roll, tilt};
};

// ── camera choreography: one view per beat, eased hand-offs on the cues ──────────────────────────────
type View = {position: THREE.Vector3; target: THREE.Vector3; fov: number};
const V = (p: [number, number, number], t: [number, number, number]): View => ({position: new THREE.Vector3(...p), target: new THREE.Vector3(...t), fov: 32});
const VIEWS = {
  hookStart: V([14.3, 4.1, 7.9], [0.2, -0.9, 0]),
  tilt: V([12.9, 3.3, 6.8], [0.2, -0.6, 0]),
  roll: V([4.6, 2.8, 18.0], [-0.1, -0.5, 0]), // front: the roll axis points at the viewer
  pan: V([6.5, 12.5, 8.5], [0, -0.3, 0]), // high: the pan axis points up
  payoff: V([13.6, 4.6, 9.4], [0.1, -0.7, 0]),
};
const lerpView = (a: View, b: View, t: number): View => ({position: a.position.clone().lerp(b.position, t), target: a.target.clone().lerp(b.target, t), fov: a.fov + (b.fov - a.fov) * t});

export const viewAt = (f: number, p: GimbalProps): View => {
  const c = cf(p);
  const keys: [number, View][] = [
    [0, VIEWS.hookStart],
    [c.roll - 14, VIEWS.tilt],
    [c.roll + 16, VIEWS.roll],
    [c.pan - 6, VIEWS.roll],
    [c.pan + 24, VIEWS.pan],
    [c.payoff - 4, VIEWS.pan],
    [c.payoff + 26, VIEWS.payoff],
  ];
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [fa, va] = keys[i];
    const [fb, vb] = keys[i + 1];
    if (f <= fb) {
      // the first segment is a slow push-in (sine), the others are cut-like eased moves
      const t = interpolate(f, [fa, fb], [0, 1], {...clamp, easing: i === 0 ? Easing.inOut(Easing.sin) : io});
      return lerpView(va, vb, t);
    }
  }
  return keys[keys.length - 1][1];
};

export const project = (pt: THREE.Vector3, v: View, width: number, height: number) => {
  const cam = new THREE.PerspectiveCamera(v.fov, width / height, 0.1, 100);
  cam.position.copy(v.position);
  cam.lookAt(v.target);
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  const n = pt.clone().project(cam);
  return {x: ((n.x + 1) / 2) * width, y: ((1 - n.y) / 2) * height};
};

/** Screen position of a rest-pose point attached to `link`, at frame f. */
export const anchorOn = (link: keyof Chain, local: THREE.Vector3, f: number, p: GimbalProps, width: number, height: number) =>
  project(local.clone().applyMatrix4(chain(rigState(f, p))[link]), viewAt(f, p), width, height);
