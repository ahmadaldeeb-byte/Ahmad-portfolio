import React, {useLayoutEffect} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {GimbalModel} from './GimbalModel';
import {GimbalTextLayer} from './GimbalTextLayer';
import {rigState, viewAt} from './rig';
import type {GimbalProps} from './storyboard';
import {SafeGuides} from '../../text/SafeGuides';

/** Drives the default R3F camera from frame-derived values (same numbers `project()` uses for labels). */
const FrameCamera: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const camera = useThree((st) => st.camera) as THREE.PerspectiveCamera;
  const v = viewAt(frame, durationInFrames);
  useLayoutEffect(() => {
    camera.position.copy(v.position);
    camera.fov = v.fov;
    camera.near = 0.1;
    camera.far = 100;
    camera.lookAt(v.target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  });
  return null;
};

const Scene: React.FC<GimbalProps> = (p) => {
  const frame = useCurrentFrame();
  const s = rigState(frame, p);
  return (
    <>
      <FrameCamera />
      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#dfe8ff', '#20242c', 0.6]} />
      <directionalLight position={[6, 8, 6]} intensity={2.2} />
      <directionalLight position={[-6, 3, -4]} intensity={0.9} color="#9fb8ff" />
      <pointLight position={[2.6, 1.2, 0.5]} intensity={6 * s.reveal} distance={3} color="#ff9a40" />
      <GimbalModel s={s} />
    </>
  );
};

export const GimbalTiltReel: React.FC<GimbalProps> = (p) => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: 'radial-gradient(120% 80% at 50% 42%, #1c2230 0%, #0b0d12 62%, #050609 100%)'}}>
      <ThreeCanvas width={width} height={height} linear={false} gl={{antialias: true, alpha: true}}>
        <Scene {...p} />
      </ThreeCanvas>
      <GimbalTextLayer {...p} />
      {p.showGuides ? <SafeGuides /> : null}
    </AbsoluteFill>
  );
};
