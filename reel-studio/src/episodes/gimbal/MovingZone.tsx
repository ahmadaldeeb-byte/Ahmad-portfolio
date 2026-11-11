import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {chain, project, RIG, rigState, viewAt} from './rig';
import type {GimbalProps} from './storyboard';

// camera block + bracket + tilt motor (rest pose), carried by the tilt link
const BOX = {x: [-0.95, 1.85], y: [0.5, 1.9], z: [-0.5, 1.2]};
const CORNERS = BOX.x.flatMap((x) => BOX.y.flatMap((y) => BOX.z.map((z) => new THREE.Vector3(x, y, z))));
type Pt = {x: number; y: number};
const hull = (pts: Pt[]) => {
  const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: Pt[] = [];
  const up: Pt[] = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of [...p].reverse()) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
};

/** 2D stand-in for the model in TextMotionPreviewVO: live silhouette of the camera block, the handle and
 *  the hand (same chain + camera as the reel), so labels can be checked against the moving parts. */
export const MovingZone: React.FC<GimbalProps> = (p) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  if ((p.cueFrames as Record<string, number>).reveal === undefined) return null;
  const s = rigState(frame, p);
  const C = chain(s);
  const v = viewAt(frame, p);
  const pr = (pt: THREE.Vector3) => project(pt, v, width, height);
  const block = hull(CORNERS.map((c) => pr(c.clone().applyMatrix4(C.tilt))));
  const grip = pr(new THREE.Vector3(0, -3.3, 0).applyMatrix4(C.handle));
  const top = pr(new THREE.Vector3(0, -0.4, 0).applyMatrix4(C.handle));
  const wrist = pr(RIG.pivot);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={width} height={height}>
        <polygon points={block.map((q) => `${q.x},${q.y}`).join(' ')} fill="rgba(127,155,184,0.28)" stroke="#7f9bb8" strokeWidth={2} />
        <line x1={grip.x} y1={grip.y} x2={top.x} y2={top.y} stroke="#e8ecf2" strokeWidth={60} strokeLinecap="round" opacity={0.18} />
        <circle cx={wrist.x} cy={wrist.y} r={46} fill="rgba(201,154,124,0.25)" />
      </svg>
    </AbsoluteFill>
  );
};
