import React, {useLayoutEffect} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {ArabicHook, ArabicNumber, PartLabel} from '../../text/ArabicMotion';
import {SafeGuides} from '../../text/SafeGuides';
import {cutawayState, cutawayView, projectView, type CutawayState} from './rig';
import type {CutawayProps} from './schema';

export type CutawayModel = React.FC<{s: CutawayState}>;

const FrameCamera: React.FC<{p: CutawayProps}> = ({p}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const camera = useThree((st) => st.camera) as THREE.PerspectiveCamera;
  const v = cutawayView(frame, durationInFrames, p);
  useLayoutEffect(() => {
    camera.position.copy(v.position);
    camera.fov = v.fov;
    camera.lookAt(v.target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  });
  return null;
};

const Scene: React.FC<{p: CutawayProps; Model: CutawayModel}> = ({p, Model}) => {
  const frame = useCurrentFrame();
  return (
    <>
      <FrameCamera p={p} />
      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#dfe8ff', '#20242c', 0.6]} />
      <directionalLight position={[6, 8, 6]} intensity={2.2} />
      <directionalLight position={[-6, 3, -4]} intensity={0.9} color="#9fb8ff" />
      <Model s={cutawayState(frame, p)} />
    </>
  );
};

/** All Arabic text of a cutaway episode (shared by the reel and its text preview). */
export const CutawayTextLayer: React.FC<CutawayProps> = (p) => {
  const {width, height, durationInFrames} = useVideoConfig();
  const anchor = (local: number) =>
    projectView(new THREE.Vector3(...p.labelAnchor), cutawayView(local + p.labelFrom, durationInFrames, p), width, height);
  return (
    <AbsoluteFill>
      <ArabicHook font={p.font} from={p.hookFrom} durationInFrames={p.hookFrames} lines={p.hook} capHeightPct={p.hookCapPct} y={p.hookY} />
      <PartLabel font={p.font} from={p.labelFrom} durationInFrames={p.labelFrames} text={p.label} capHeightPct={p.labelCapPct} x={p.labelX} y={p.labelY} anchor={anchor} width={width} height={height} />
      <ArabicNumber font={p.font} from={p.counterFrom} durationInFrames={p.counterFrames} to={p.counterTo} suffix={p.counterSuffix} caption={p.counterCaption} capHeightPct={p.counterCapPct} x={p.counterX} y={p.counterY} rollFrames={p.actionFrames} />
      <ArabicHook font={p.font} from={p.outroFrom} durationInFrames={p.outroFrames} lines={p.outro} capHeightPct={p.hookCapPct * 0.85} y={p.hookY} />
    </AbsoluteFill>
  );
};

const BG = 'radial-gradient(120% 80% at 50% 42%, #1c2230 0%, #0b0d12 62%, #050609 100%)';

export const makeCutawayReel = (Model: CutawayModel): React.FC<CutawayProps> => (p) => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: BG}}>
      <ThreeCanvas width={width} height={height} linear={false} gl={{antialias: true, alpha: true}}>
        <Scene p={p} Model={Model} />
      </ThreeCanvas>
      <CutawayTextLayer {...p} />
      {p.showGuides ? <SafeGuides /> : null}
    </AbsoluteFill>
  );
};

/** Text-only preview (no WebGL): safe zones + the live label anchor. */
export const CutawayTextPreview: React.FC<CutawayProps> = (p) => {
  const frame = useCurrentFrame();
  const {width, height, durationInFrames} = useVideoConfig();
  const a = projectView(new THREE.Vector3(...p.labelAnchor), cutawayView(frame, durationInFrames, p), width, height);
  return (
    <AbsoluteFill style={{background: BG}}>
      <svg width={width} height={height} style={{position: 'absolute'}}>
        <circle cx={a.x} cy={a.y} r={22} fill="rgba(255,138,31,0.25)" stroke="#ff8a1f" strokeWidth={2} />
      </svg>
      <CutawayTextLayer {...p} />
      {p.showGuides ? <SafeGuides /> : null}
    </AbsoluteFill>
  );
};
