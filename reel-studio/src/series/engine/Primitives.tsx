import React from 'react';
import * as THREE from 'three';

/** Thin glowing rod between two points (light rays, axis lines). */
export const Ray: React.FC<{from: THREE.Vector3; to: THREE.Vector3; r?: number; color?: string; opacity?: number; progress?: number; onTop?: boolean}> = ({
  from,
  to,
  r = 0.008,
  color = '#ffd27a',
  opacity = 1,
  progress = 1,
  onTop = false,
}) => {
  const end = from.clone().lerp(to, Math.max(0, Math.min(1, progress)));
  const dir = end.clone().sub(from);
  const len = dir.length();
  if (len < 1e-5 || opacity <= 0.001) return null;
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return (
    <mesh position={from.clone().add(end).multiplyScalar(0.5)} quaternion={q} renderOrder={onTop ? 10 : 0}>
      <cylinderGeometry args={[r, r, len, 8]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthTest={!onTop} toneMapped={false} />
    </mesh>
  );
};

/** Textured quad (archive photo on a plate, projected image…). */
export const ImagePlane: React.FC<{tex: THREE.Texture | null; position: [number, number, number]; size: [number, number]; rotation?: [number, number, number]; opacity?: number; flip?: boolean}> = ({
  tex,
  position,
  size,
  rotation = [0, 0, 0],
  opacity = 1,
  flip = false,
}) =>
  tex && opacity > 0.001 ? (
    <mesh position={position} rotation={rotation} scale={flip ? [-1, -1, 1] : [1, 1, 1]}>
      <planeGeometry args={size} />
      <meshStandardMaterial map={tex} transparent opacity={opacity} roughness={0.55} metalness={0.25} side={THREE.DoubleSide} />
    </mesh>
  ) : null;
