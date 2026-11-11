// Simplified 3-axis handheld gimbal, built from primitives (original geometry).
// Cutaway pattern follows remotion-3d-skill's <StructuralCutaway />: the outer casing turns
// translucent (depthWrite off) while the internal part we are explaining is drawn solid and coloured.
import React from 'react';
import * as THREE from 'three';
import {RIG, type RigState} from './rig';

export const PALETTE = {
  graphite: '#2a2d33',
  graphiteLight: '#3a3e46',
  metal: '#9aa3ad',
  rubber: '#16181c',
  skin: '#c99a7c',
  focus: '#ff8a1f', // the part being explained
  focusGlow: '#ffb15c',
  copper: '#d9824b',
  ghost: '#7f9bb8',
  level: '#5ef0c4', // "camera direction stays level"
  handleAxis: '#e8ecf2',
};

type Role = 'context' | 'subject' | 'focus';

/** Material that fades context parts into an x-ray ghost as `reveal` goes 0 → 1. */
const PartMat: React.FC<{color: string; role: Role; reveal: number; metalness?: number; roughness?: number; emissive?: string; emissiveIntensity?: number}> = ({
  color,
  role,
  reveal,
  metalness = 0.35,
  roughness = 0.45,
  emissive,
  emissiveIntensity = 0,
}) => {
  const ghost = role === 'context' ? reveal : 0;
  const opacity = 1 - ghost * 0.78;
  const c = new THREE.Color(color).lerp(new THREE.Color(PALETTE.ghost), ghost * 0.55);
  return (
    <meshStandardMaterial
      color={c}
      metalness={metalness}
      roughness={roughness}
      transparent={opacity < 0.999}
      opacity={opacity}
      depthWrite={opacity > 0.999}
      emissive={emissive ?? '#000000'}
      emissiveIntensity={emissiveIntensity}
    />
  );
};

/** Thin rod between two points (used for axis lines and arrows). */
const Rod: React.FC<{from: THREE.Vector3; to: THREE.Vector3; r: number; color: string; opacity?: number}> = ({from, to, r, color, opacity = 1}) => {
  const dir = to.clone().sub(from);
  const len = dir.length();
  if (len < 1e-4 || opacity <= 0.001) return null;
  const mid = from.clone().add(to).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return (
    <mesh position={mid} quaternion={q}>
      <cylinderGeometry args={[r, r, len, 10]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthTest={false} />
    </mesh>
  );
};

/** Dashed rod: alternating segments along from→to, drawn up to `progress`. */
const DashedRod: React.FC<{from: THREE.Vector3; to: THREE.Vector3; r: number; color: string; progress?: number; opacity?: number; dash?: number}> = ({
  from,
  to,
  r,
  color,
  progress = 1,
  opacity = 1,
  dash = 0.22,
}) => {
  const len = from.distanceTo(to) * progress;
  const n = Math.floor(len / (dash * 2));
  const dir = to.clone().sub(from).normalize();
  return (
    <>
      {Array.from({length: n + 1}, (_, i) => {
        const a = i * dash * 2;
        const b = Math.min(a + dash, len);
        if (b <= a) return null;
        return <Rod key={i} from={from.clone().addScaledVector(dir, a)} to={from.clone().addScaledVector(dir, b)} r={r} color={color} opacity={opacity} />;
      })}
    </>
  );
};

/**
 * Angle arc in the Y–Z plane (pitch), centred on `centre`, from vertical/horizontal reference `startRad`
 * sweeping `sweepRad`; arrowhead shows the direction.
 */
const PitchArc: React.FC<{centre: THREE.Vector3; radius: number; startRad: number; sweepRad: number; color: string; opacity: number}> = ({
  centre,
  radius,
  startRad,
  sweepRad,
  color,
  opacity,
}) => {
  if (opacity <= 0.001 || Math.abs(sweepRad) < 0.02) return null;
  const s = sweepRad >= 0 ? startRad : startRad + sweepRad;
  const len = Math.abs(sweepRad);
  const end = startRad + sweepRad;
  // ring lies in local XY; rotate so local X -> world -Z ... we want angle measured in world Z–Y plane
  // with angle 0 = +Z (lens direction) and +90° = up.  rotation.y = -PI/2 maps local +X -> world +Z.
  const tip = new THREE.Vector3(0, Math.sin(end) * radius, Math.cos(end) * radius);
  const tangent = new THREE.Vector3(0, Math.cos(end), -Math.sin(end)).multiplyScalar(Math.sign(sweepRad));
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent.normalize());
  return (
    <group position={centre}>
      <mesh rotation={[0, -Math.PI / 2, 0]}>
        <ringGeometry args={[radius - 0.035, radius + 0.035, 48, 1, s, len]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} depthTest={false} />
      </mesh>
      <mesh position={tip} quaternion={q}>
        <coneGeometry args={[0.11, 0.26, 16]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} depthTest={false} />
      </mesh>
    </group>
  );
};

/** Low-poly hand gripping the handle (fingers wrap toward the lens side). */
const Hand: React.FC = () => (
  <group position={[0, -2.15, 0]}>
    {/* palm behind the grip */}
    <mesh position={[0, 0, -0.42]} scale={[1, 1.15, 0.6]}>
      <sphereGeometry args={[0.5, 24, 16]} />
      <meshStandardMaterial color={PALETTE.skin} roughness={0.7} />
    </mesh>
    {/* four fingers wrapping round the front */}
    {[0.36, 0.12, -0.12, -0.36].map((y, i) => (
      <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.4, 0.105, 12, 24, Math.PI * 1.25]} />
        <meshStandardMaterial color={PALETTE.skin} roughness={0.7} />
      </mesh>
    ))}
    {/* thumb resting on top */}
    <mesh position={[0.32, 0.62, -0.05]} rotation={[0.3, 0, -0.5]}>
      <capsuleGeometry args={[0.1, 0.36, 6, 12]} />
      <meshStandardMaterial color={PALETTE.skin} roughness={0.7} />
    </mesh>
    {/* forearm leaving frame */}
    <mesh position={[0, -0.75, -0.5]} rotation={[0.35, 0, 0]}>
      <cylinderGeometry args={[0.36, 0.42, 1.1, 20]} />
      <meshStandardMaterial color={PALETTE.skin} roughness={0.75} />
    </mesh>
  </group>
);

/** The tilt motor: closed housing that opens (cap slides out along the axis) to show stator + rotor. */
const TiltMotor: React.FC<{reveal: number; rotorRad: number; glow: number}> = ({reveal, rotorRad, glow}) => {
  const capOut = reveal * 0.55;
  return (
    <group position={RIG.tiltAxis}>
      {/* fixed side (stator) — attached to the roll arm */}
      <group rotation={[0, 0, Math.PI / 2]}>
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.44, 0.44, 0.16, 40]} />
          <PartMat color={PALETTE.graphiteLight} role="subject" reveal={reveal} emissive={PALETTE.focus} emissiveIntensity={reveal * 0.45} />
        </mesh>
        {/* stator teeth with copper windings */}
        {Array.from({length: 12}, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.27, -0.05, Math.sin(a) * 0.27]} rotation={[0, -a, 0]}>
              <boxGeometry args={[0.12, 0.2, 0.07]} />
              <meshStandardMaterial color={PALETTE.copper} metalness={0.7} roughness={0.35} emissive={PALETTE.focus} emissiveIntensity={glow * 0.25} />
            </mesh>
          );
        })}
      </group>
      {/* rotating side (rotor bell + magnets) — turns with the camera plate */}
      <group rotation={[rotorRad, 0, 0]}>
        <group rotation={[0, 0, Math.PI / 2]}>
          {Array.from({length: 14}, (_, i) => {
            const a = (i / 14) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 0.4, -0.05, Math.sin(a) * 0.4]} rotation={[0, -a, 0]}>
                <boxGeometry args={[0.05, 0.2, 0.12]} />
                <meshStandardMaterial color={i % 2 ? '#c8ccd2' : '#5a6270'} metalness={0.8} roughness={0.3} />
              </mesh>
            );
          })}
          {/* outer cap: opaque before the reveal, slides outward (+X) and turns translucent */}
          <mesh position={[0, -0.12 - capOut, 0]}>
            <cylinderGeometry args={[0.46, 0.46, 0.14, 40]} />
            <meshStandardMaterial
              color={PALETTE.graphite}
              metalness={0.4}
              roughness={0.4}
              transparent
              opacity={1 - reveal * 0.8}
              depthWrite={reveal < 0.01}
              emissive={PALETTE.focus}
              emissiveIntensity={reveal * 0.6}
            />
          </mesh>
          {/* tick mark on the rotor so its rotation is readable */}
          <mesh position={[0.3, -0.2 - capOut, 0]}>
            <boxGeometry args={[0.18, 0.03, 0.05]} />
            <meshBasicMaterial color={PALETTE.focusGlow} />
          </mesh>
        </group>
      </group>
      {/* the shaft: glowing core of the axis */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.075, 0.075, 0.7, 16]} />
        <meshStandardMaterial color={PALETTE.focus} emissive={PALETTE.focus} emissiveIntensity={0.4 + glow} metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  );
};

/** Camera body + bracket. Everything here rotates with the tilt motor about the tilt axis. */
const CameraBody: React.FC<{reveal: number; imuPulse: number}> = ({reveal, imuPulse}) => (
  <group>
    {/* body */}
    <mesh position={[-0.05, 0, 0]}>
      <boxGeometry args={[1.7, 1.05, 0.8]} />
      <PartMat color="#1d2026" role="subject" reveal={reveal} metalness={0.25} roughness={0.55} />
    </mesh>
    {/* grip bump + shutter */}
    <mesh position={[-0.72, 0.05, 0.42]}>
      <boxGeometry args={[0.3, 0.85, 0.18]} />
      <meshStandardMaterial color={PALETTE.rubber} roughness={0.9} />
    </mesh>
    <mesh position={[-0.62, 0.58, 0.1]}>
      <cylinderGeometry args={[0.1, 0.1, 0.08, 20]} />
      <meshStandardMaterial color={PALETTE.metal} metalness={0.8} roughness={0.3} />
    </mesh>
    {/* lens */}
    <mesh position={[0.05, 0, 0.75]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.36, 0.33, 0.75, 36]} />
      <meshStandardMaterial color="#111317" metalness={0.5} roughness={0.35} />
    </mesh>
    <mesh position={[0.05, 0, 0.88]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.345, 0.025, 10, 40]} />
      <meshStandardMaterial color={PALETTE.metal} metalness={0.9} roughness={0.2} />
    </mesh>
    <mesh position={[0.05, 0, 1.13]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.28, 0.28, 0.02, 36]} />
      <meshStandardMaterial color="#2b4a7a" metalness={0.9} roughness={0.05} emissive="#1b3d6e" emissiveIntensity={0.3} />
    </mesh>
    {/* L-bracket from the tilt motor rotor to the camera */}
    <mesh position={[1.0, 0, 0]}>
      <boxGeometry args={[0.12, 0.7, 0.6]} />
      <PartMat color={PALETTE.metal} role="subject" reveal={reveal} metalness={0.7} roughness={0.3} />
    </mesh>
    <mesh position={[0.45, -0.6, 0]}>
      <boxGeometry args={[1.2, 0.1, 0.6]} />
      <PartMat color={PALETTE.metal} role="subject" reveal={reveal} metalness={0.7} roughness={0.3} />
    </mesh>
    {/* IMU sensor on the plate: flashes when it detects the wrist moving */}
    <mesh position={[0.75, -0.52, 0.18]}>
      <boxGeometry args={[0.2, 0.06, 0.2]} />
      <meshStandardMaterial color="#1f6d4f" emissive={PALETTE.level} emissiveIntensity={0.15 + imuPulse * 2.2} />
    </mesh>
  </group>
);

export const GimbalModel: React.FC<{s: RigState}> = ({s}) => {
  const r = s.reveal;
  const glow = r * 0.6 + Math.min(1, Math.abs(s.motor) * 4) * 0.6 * s.arrows;
  const P = RIG.pivot;
  const T = RIG.tiltAxis;
  const C = RIG.cameraCentre;
  return (
    <group>
      {/* everything held by the wrist pivots with the handle */}
      <group position={P} rotation={[s.handle, 0, 0]}>
        <group position={P.clone().negate()}>
          <Hand />
          {/* handle */}
          <mesh position={[0, -2.0, 0]}>
            <cylinderGeometry args={[0.33, 0.36, 2.5, 32]} />
            <PartMat color={PALETTE.graphite} role="subject" reveal={r} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.85, 0.3]}>
            <cylinderGeometry args={[0.07, 0.07, 0.08, 16]} />
            <meshStandardMaterial color={PALETTE.metal} />
          </mesh>
          {/* pan motor (vertical axis) */}
          <mesh position={[0, -0.5, 0]}>
            <cylinderGeometry args={[0.45, 0.45, 0.5, 36]} />
            <PartMat color={PALETTE.graphiteLight} role="context" reveal={r} />
          </mesh>
          {/* pan arm: up behind the camera */}
          <mesh position={[0, -0.35, -0.55]}>
            <boxGeometry args={[0.3, 0.2, 1.0]} />
            <PartMat color={PALETTE.graphiteLight} role="context" reveal={r} />
          </mesh>
          <mesh position={[0, 0.4, -1.0]}>
            <boxGeometry args={[0.28, 1.6, 0.22]} />
            <PartMat color={PALETTE.graphiteLight} role="context" reveal={r} />
          </mesh>
          {/* roll motor (axis along the lens) */}
          <mesh position={[0, 1.2, -1.0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 0.34, 36]} />
            <PartMat color={PALETTE.graphiteLight} role="context" reveal={r} />
          </mesh>
          {/* roll arm: sideways, then forward to the tilt motor */}
          <mesh position={[0.62, 1.2, -1.0]}>
            <boxGeometry args={[1.25, 0.24, 0.22]} />
            <PartMat color={PALETTE.graphiteLight} role="context" reveal={r} />
          </mesh>
          <mesh position={[1.42, 1.2, -0.5]}>
            <boxGeometry args={[0.2, 0.24, 1.0]} />
            <PartMat color={PALETTE.graphiteLight} role="context" reveal={r} />
          </mesh>

          <TiltMotor reveal={r} rotorRad={s.motor} glow={glow} />

          {/* camera rotates about the tilt axis by the motor angle */}
          <group position={C} rotation={[s.motor, 0, 0]}>
            <CameraBody reveal={r} imuPulse={s.imuPulse} />
          </group>

          {/* handle axis (dashed): shows how much the wrist tilts */}
          <DashedRod from={new THREE.Vector3(0, -3.6, 0)} to={new THREE.Vector3(0, 0.0, 0)} r={0.018} color={PALETTE.handleAxis} opacity={0.55 * s.arrows} />
          {/* tilt axis line, drawn through the camera at the reveal */}
          <Rod
            from={new THREE.Vector3(T.x + 0.9, T.y, T.z)}
            to={new THREE.Vector3(T.x + 0.9 - 3.3 * s.axisDraw, T.y, T.z)}
            r={0.03}
            color={PALETTE.focus}
            opacity={Math.min(1, s.axisDraw * 2)}
          />
          {/* motor correction arc: rotates opposite to the wrist */}
          <PitchArc centre={new THREE.Vector3(T.x + 0.45, T.y, T.z)} radius={0.72} startRad={Math.PI / 2 + s.handle} sweepRad={s.motor} color={PALETTE.focus} opacity={s.arrows} />
        </group>
      </group>

      {/* world-fixed references (not attached to the hand) */}
      {/* wrist arc: angle between true vertical and the handle */}
      <PitchArc centre={P.clone().add(new THREE.Vector3(0.45, 0, 0))} radius={1.15} startRad={Math.PI / 2} sweepRad={s.handle} color={PALETTE.handleAxis} opacity={s.arrows * 0.9} />
      {/* lens direction: stays level because the motor cancels the wrist */}
      <LensLevel s={s} />
    </group>
  );
};

/** Level line out of the lens (world space, follows the camera position but not the wrist angle). */
const LensLevel: React.FC<{s: RigState}> = ({s}) => {
  const lensCentre = new THREE.Vector3(0.05, 1.2, 1.15);
  // lens tip in world: rotate around tilt axis by motor, then around pivot by handle
  const local = lensCentre.clone().sub(RIG.cameraCentre).applyAxisAngle(new THREE.Vector3(1, 0, 0), s.motor).add(RIG.cameraCentre);
  const world = local.sub(RIG.pivot).applyAxisAngle(new THREE.Vector3(1, 0, 0), s.handle).add(RIG.pivot);
  const dir = new THREE.Vector3(0, Math.sin(-s.cameraWorldPitch), Math.cos(s.cameraWorldPitch));
  return (
    <DashedRod from={world.clone().addScaledVector(dir, 0.1)} to={world.clone().addScaledVector(dir, 3.2)} r={0.022} color={PALETTE.level} opacity={s.arrows} dash={0.18} />
  );
};
