import React, {useLayoutEffect} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';

export type V3 = [number, number, number];
export type CamKey = {f: number; pos: V3; target: V3; fov?: number};
export type View = {position: THREE.Vector3; target: THREE.Vector3; fov: number};

const io = Easing.inOut(Easing.cubic);
/** Camera along keyframes (absolute frames), eased between keys, holding before the first / after the last. */
export const viewAt = (keys: CamKey[], f: number): View => {
  const k = [...keys].sort((a, b) => a.f - b.f);
  const mk = (c: CamKey): View => ({position: new THREE.Vector3(...c.pos), target: new THREE.Vector3(...c.target), fov: c.fov ?? 35});
  if (f <= k[0].f) return mk(k[0]);
  for (let i = 0; i < k.length - 1; i++) {
    if (f <= k[i + 1].f) {
      const t = interpolate(f, [k[i].f, k[i + 1].f], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: io});
      const a = mk(k[i]);
      const b = mk(k[i + 1]);
      return {position: a.position.lerp(b.position, t), target: a.target.lerp(b.target, t), fov: a.fov + (b.fov - a.fov) * t};
    }
  }
  return mk(k[k.length - 1]);
};

export const project = (pt: THREE.Vector3 | V3, v: View, width: number, height: number) => {
  const cam = new THREE.PerspectiveCamera(v.fov, width / height, 0.01, 500);
  cam.position.copy(v.position);
  cam.lookAt(v.target);
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  const n = (Array.isArray(pt) ? new THREE.Vector3(...pt) : pt.clone()).project(cam);
  return {x: ((n.x + 1) / 2) * width, y: ((1 - n.y) / 2) * height};
};

const FrameCamera: React.FC<{keys: CamKey[]; frameOffset: number}> = ({keys, frameOffset}) => {
  const frame = useCurrentFrame() + frameOffset;
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const v = viewAt(keys, frame);
  useLayoutEffect(() => {
    camera.position.copy(v.position);
    camera.fov = v.fov;
    camera.near = 0.01;
    camera.far = 500;
    camera.lookAt(v.target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  });
  return null;
};

/** Neutral studio reflections so metals (silver, pewter, brass) read as metal instead of black. */
const Env: React.FC<{intensity?: number}> = ({intensity = 0.4}) => {
  const {gl, scene} = useThree();
  useLayoutEffect(() => {
    if (scene.environment) return;
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = intensity;
    pm.dispose();
  }, [gl, scene, intensity]);
  return null;
};

/** WebGL stage with frame-driven camera. `frameOffset` = absolute frame of this Sequence's start, so camera
 *  keys can be written in episode (absolute) frames. */
export const Stage3D: React.FC<{keys: CamKey[]; frameOffset: number; background?: string; children: React.ReactNode}> = ({keys, frameOffset, background, children}) => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: background ?? 'radial-gradient(120% 80% at 50% 40%, #1d2230 0%, #0b0d12 65%, #050609 100%)'}}>
      <ThreeCanvas width={width} height={height} linear={false} gl={{antialias: true, alpha: true}}>
        <FrameCamera keys={keys} frameOffset={frameOffset} />
        <Env />
        {children}
      </ThreeCanvas>
      {/* legibility scrims behind the top (hook/labels) and bottom (facts) text bands */}
      <AbsoluteFill style={{pointerEvents: 'none', background: 'linear-gradient(rgba(5,6,9,0.55) 0%, rgba(5,6,9,0) 30%, rgba(5,6,9,0) 58%, rgba(5,6,9,0.6) 88%)'}} />
    </AbsoluteFill>
  );
};
