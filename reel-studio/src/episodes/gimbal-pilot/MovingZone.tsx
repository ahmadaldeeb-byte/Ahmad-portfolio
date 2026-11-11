import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {project, RIG, rigState, withHandle} from './rig';
import type {GimbalProps} from './storyboard';

// camera block + bracket + tilt motor (rest pose, world units); rotates with handle and motor
const BOX = {x: [-0.95, 1.85], y: [0.5, 1.9], z: [-0.5, 1.2]};
const corners = () => {
  const out: THREE.Vector3[] = [];
  for (const x of BOX.x) for (const y of BOX.y) for (const z of BOX.z) out.push(new THREE.Vector3(x, y, z));
  return out;
};
const hull = (pts: {x: number; y: number}[]) => {
  const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: {x: number; y: number}, a: {x: number; y: number}, b: {x: number; y: number}) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: typeof p = [], up: typeof p = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of [...p].reverse()) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
};

/** 2D stand-in for the 3D model in TextMotionPreview: the live silhouette of the moving block (camera +
 *  tilt motor), the area it sweeps over the whole episode, the handle, and the label anchor. Same
 *  projection as the reel, so a label that clears these shapes here clears the model in the render. */
export const MovingZone: React.FC<GimbalProps> = (p) => {
  const frame = useCurrentFrame();
  const {width, height, durationInFrames} = useVideoConfig();
  const shape = (f: number) => {
    const s = rigState(f, p);
    return hull(
      corners().map((c) => {
        const local = c.clone().sub(RIG.cameraCentre).applyAxisAngle(new THREE.Vector3(1, 0, 0), s.motor).add(RIG.cameraCentre);
        return project(withHandle(local, s.handle), f, durationInFrames, width, height);
      }),
    );
  };
  const swept = useMemo(() => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let f = 0; f < durationInFrames; f += 3) for (const q of shape(f)) { x0 = Math.min(x0, q.x); y0 = Math.min(y0, q.y); x1 = Math.max(x1, q.x); y1 = Math.max(y1, q.y); }
    return {x0, y0, x1, y1};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p, durationInFrames, width, height]);
  const s = rigState(frame, p);
  const now = shape(frame);
  const a = project(withHandle(RIG.tiltAxis.clone().setX(RIG.tiltAxis.x + 0.5), s.handle), frame, durationInFrames, width, height);
  const grip = project(withHandle(new THREE.Vector3(0, -3.3, 0), s.handle), frame, durationInFrames, width, height);
  const top = project(withHandle(new THREE.Vector3(0, -0.3, 0), s.handle), frame, durationInFrames, width, height);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={width} height={height}>
        <rect x={swept.x0} y={swept.y0} width={swept.x1 - swept.x0} height={swept.y1 - swept.y0} fill="rgba(127,155,184,0.06)" stroke="rgba(127,155,184,0.5)" strokeWidth={2} strokeDasharray="10 8" />
        <polygon points={now.map((q) => `${q.x},${q.y}`).join(' ')} fill="rgba(127,155,184,0.28)" stroke="#7f9bb8" strokeWidth={2} />
        <line x1={grip.x} y1={grip.y} x2={top.x} y2={top.y} stroke="#e8ecf2" strokeWidth={60} strokeLinecap="round" opacity={0.18} />
        <circle cx={a.x} cy={a.y} r={22} fill="rgba(255,138,31,0.25)" stroke="#ff8a1f" strokeWidth={2} />
      </svg>
      <div style={{position: 'absolute', left: Math.max(16, swept.x0 + 12), top: swept.y1 + 8, color: 'rgba(127,155,184,0.9)', fontFamily: 'monospace', fontSize: 24}}>
        swept area · camera + tilt motor
      </div>
    </AbsoluteFill>
  );
};
