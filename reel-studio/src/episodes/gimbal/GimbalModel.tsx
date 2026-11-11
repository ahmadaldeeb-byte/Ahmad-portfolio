// Simplified 3-axis handheld gimbal from primitives (original geometry), built as a joint chain
// handle → pan → roll → tilt. Each link is a group whose world matrix comes from rig.chain(), the same
// matrices the label anchors use. Cutaway pattern from remotion-3d-skill's <StructuralCutaway />:
// context parts go translucent (depthWrite off), the part being explained turns solid orange.
import React from 'react';
import * as THREE from 'three';
import {chain, RIG, type RigState} from './rig';

export const PALETTE = {
  graphite: '#2a2d33',
  graphiteLight: '#3a3e46',
  metal: '#9aa3ad',
  rubber: '#16181c',
  skin: '#c99a7c',
  focus: '#ff8a1f',
  focusGlow: '#ffb15c',
  copper: '#d9824b',
  ghost: '#7f9bb8',
  level: '#5ef0c4',
  hand: '#e8ecf2',
};

/** Material: `ghost` fades to an x-ray, `focus` turns it orange and glowing. */
const Mat: React.FC<{color: string; ghost?: number; focus?: number; metalness?: number; roughness?: number}> = ({color, ghost = 0, focus = 0, metalness = 0.35, roughness = 0.45}) => {
  const g = ghost * (1 - focus);
  const opacity = 1 - g * 0.78;
  const c = new THREE.Color(color).lerp(new THREE.Color(PALETTE.ghost), g * 0.55).lerp(new THREE.Color(PALETTE.focus), focus * 0.55);
  return (
    <meshStandardMaterial
      color={c}
      metalness={metalness}
      roughness={roughness}
      transparent={opacity < 0.999}
      opacity={opacity}
      depthWrite={opacity > 0.999}
      emissive={PALETTE.focus}
      emissiveIntensity={focus * 0.55}
    />
  );
};

const Link: React.FC<{m: THREE.Matrix4; children: React.ReactNode}> = ({m, children}) => (
  <group matrixAutoUpdate={false} matrix={m}>
    {children}
  </group>
);

/** Thin rod between two world points (overlay: drawn on top). */
const Rod: React.FC<{from: THREE.Vector3; to: THREE.Vector3; r: number; color: string; opacity?: number}> = ({from, to, r, color, opacity = 1}) => {
  const dir = to.clone().sub(from);
  const len = dir.length();
  if (len < 1e-4 || opacity <= 0.001) return null;
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return (
    <mesh position={from.clone().add(to).multiplyScalar(0.5)} quaternion={q} renderOrder={10}>
      <cylinderGeometry args={[r, r, len, 10]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthTest={false} />
    </mesh>
  );
};

const Dashed: React.FC<{from: THREE.Vector3; to: THREE.Vector3; r: number; color: string; opacity?: number; dash?: number}> = ({from, to, r, color, opacity = 1, dash = 0.2}) => {
  if (opacity <= 0.001) return null;
  const len = from.distanceTo(to);
  const dir = to.clone().sub(from).normalize();
  const n = Math.floor(len / (dash * 2));
  return (
    <>
      {Array.from({length: n + 1}, (_, i) => {
        const a = i * dash * 2;
        const b = Math.min(a + dash, len);
        return b > a ? <Rod key={i} from={from.clone().addScaledVector(dir, a)} to={from.clone().addScaledVector(dir, b)} r={r} color={color} opacity={opacity} /> : null;
      })}
    </>
  );
};

/** Angle arc: rotates `ref` about `axis` through `sweep` rad around `centre` (all world space), arrowhead at the end. */
const AxisArc: React.FC<{centre: THREE.Vector3; axis: THREE.Vector3; ref: THREE.Vector3; radius: number; sweep: number; color: string; opacity: number}> = ({
  centre,
  axis,
  ref,
  radius,
  sweep,
  color,
  opacity,
}) => {
  if (opacity <= 0.001 || Math.abs(sweep) < 0.03) return null;
  const ax = axis.clone().normalize();
  const r0 = ref.clone().sub(ax.clone().multiplyScalar(ref.dot(ax))).normalize().multiplyScalar(radius);
  const pts = Array.from({length: 24}, (_, i) => centre.clone().add(r0.clone().applyAxisAngle(ax, (sweep * i) / 23)));
  const tip = pts[pts.length - 1];
  const tangent = tip.clone().sub(pts[pts.length - 2]).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
  return (
    <group renderOrder={10}>
      <mesh>
        <tubeGeometry args={[new THREE.CatmullRomCurve3(pts), 32, 0.035, 8, false]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} depthTest={false} />
      </mesh>
      <mesh position={tip} quaternion={q}>
        <coneGeometry args={[0.11, 0.26, 16]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} depthTest={false} />
      </mesh>
    </group>
  );
};

/** Generic brushless motor: housing + rotor cap with a tick mark (so rotation reads). Axis = local Y. */
const Motor: React.FC<{r: number; h: number; rotor: number; ghost: number; focus: number}> = ({r, h, rotor, ghost, focus}) => (
  <group>
    <mesh>
      <cylinderGeometry args={[r, r, h, 36]} />
      <Mat color={PALETTE.graphiteLight} ghost={ghost} focus={focus} />
    </mesh>
    <group rotation={[0, rotor, 0]}>
      <mesh position={[0, h / 2 + 0.03, 0]}>
        <cylinderGeometry args={[r * 0.82, r * 0.82, 0.06, 36]} />
        <Mat color={PALETTE.graphite} ghost={ghost} focus={focus} />
      </mesh>
      <mesh position={[r * 0.5, h / 2 + 0.07, 0]}>
        <boxGeometry args={[r * 0.7, 0.03, 0.06]} />
        <meshBasicMaterial color={focus > 0.05 ? PALETTE.focusGlow : PALETTE.metal} />
      </mesh>
    </group>
  </group>
);

const Hand: React.FC = () => (
  <group position={[0, -2.15, 0]}>
    <mesh position={[0, 0, -0.42]} scale={[1, 1.15, 0.6]}>
      <sphereGeometry args={[0.5, 24, 16]} />
      <meshStandardMaterial color={PALETTE.skin} roughness={0.7} />
    </mesh>
    {[0.36, 0.12, -0.12, -0.36].map((y, i) => (
      <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.4, 0.105, 12, 24, Math.PI * 1.25]} />
        <meshStandardMaterial color={PALETTE.skin} roughness={0.7} />
      </mesh>
    ))}
    <mesh position={[0.32, 0.62, -0.05]} rotation={[0.3, 0, -0.5]}>
      <capsuleGeometry args={[0.1, 0.36, 6, 12]} />
      <meshStandardMaterial color={PALETTE.skin} roughness={0.7} />
    </mesh>
    <mesh position={[0, -0.75, -0.5]} rotation={[0.35, 0, 0]}>
      <cylinderGeometry args={[0.36, 0.42, 1.1, 20]} />
      <meshStandardMaterial color={PALETTE.skin} roughness={0.75} />
    </mesh>
  </group>
);

/** Tilt motor stator (on the roll arm): opens at the reveal to show copper windings. */
const TiltStator: React.FC<{reveal: number; focus: number}> = ({reveal, focus}) => (
  <group position={RIG.tiltMotor} rotation={[0, 0, Math.PI / 2]}>
    <mesh position={[0, 0.08, 0]}>
      <cylinderGeometry args={[0.44, 0.44, 0.16, 40]} />
      <Mat color={PALETTE.graphiteLight} ghost={reveal} focus={focus * 0.7} />
    </mesh>
    {Array.from({length: 12}, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return (
        <mesh key={i} position={[Math.cos(a) * 0.27, -0.05, Math.sin(a) * 0.27]} rotation={[0, -a, 0]}>
          <boxGeometry args={[0.12, 0.2, 0.07]} />
          <meshStandardMaterial color={PALETTE.copper} metalness={0.7} roughness={0.35} emissive={PALETTE.focus} emissiveIntensity={focus * 0.3} />
        </mesh>
      );
    })}
    <mesh>
      <cylinderGeometry args={[0.075, 0.075, 0.7, 16]} />
      <meshStandardMaterial color={PALETTE.focus} emissive={PALETTE.focus} emissiveIntensity={0.3 + focus} />
    </mesh>
  </group>
);

/** Tilt rotor (turns with the camera): magnets + cap that slides off and turns translucent. */
const TiltRotor: React.FC<{reveal: number; focus: number}> = ({reveal, focus}) => {
  const out = reveal * 0.55;
  return (
    <group position={RIG.tiltMotor} rotation={[0, 0, Math.PI / 2]}>
      {Array.from({length: 14}, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.4, -0.05, Math.sin(a) * 0.4]} rotation={[0, -a, 0]}>
            <boxGeometry args={[0.05, 0.2, 0.12]} />
            <meshStandardMaterial color={i % 2 ? '#c8ccd2' : '#5a6270'} metalness={0.8} roughness={0.3} />
          </mesh>
        );
      })}
      <mesh position={[0, -0.12 - out, 0]}>
        <cylinderGeometry args={[0.46, 0.46, 0.14, 40]} />
        <meshStandardMaterial color={PALETTE.graphite} metalness={0.4} roughness={0.4} transparent opacity={1 - reveal * 0.8} depthWrite={reveal < 0.01} emissive={PALETTE.focus} emissiveIntensity={focus * 0.6} />
      </mesh>
      <mesh position={[0.3, -0.2 - out, 0]}>
        <boxGeometry args={[0.18, 0.03, 0.05]} />
        <meshBasicMaterial color={PALETTE.focusGlow} />
      </mesh>
    </group>
  );
};

const Camera: React.FC<{reveal: number; imu: number; imuPulse: number; ring: number}> = ({reveal, imu, imuPulse, ring}) => (
  <group position={RIG.cameraCentre}>
    <mesh position={[-0.05, 0, 0]}>
      <boxGeometry args={[1.7, 1.05, 0.8]} />
      <Mat color="#1d2026" ghost={reveal * 0.25} metalness={0.25} roughness={0.55} />
    </mesh>
    <mesh position={[-0.72, 0.05, 0.42]}>
      <boxGeometry args={[0.3, 0.85, 0.18]} />
      <meshStandardMaterial color={PALETTE.rubber} roughness={0.9} />
    </mesh>
    <mesh position={[-0.62, 0.58, 0.1]}>
      <cylinderGeometry args={[0.1, 0.1, 0.08, 20]} />
      <meshStandardMaterial color={PALETTE.metal} metalness={0.8} roughness={0.3} />
    </mesh>
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
    {/* bracket */}
    <mesh position={[1.0, 0, 0]}>
      <boxGeometry args={[0.12, 0.7, 0.6]} />
      <Mat color={PALETTE.metal} ghost={reveal * 0.3} metalness={0.7} roughness={0.3} />
    </mesh>
    <mesh position={[0.45, -0.6, 0]}>
      <boxGeometry args={[1.2, 0.1, 0.6]} />
      <Mat color={PALETTE.metal} ghost={reveal * 0.3} metalness={0.7} roughness={0.3} />
    </mesh>
    {/* IMU on the plate */}
    <mesh position={RIG.imu.clone().sub(RIG.cameraCentre)}>
      <boxGeometry args={[0.2 + imu * 0.08, 0.06, 0.2 + imu * 0.08]} />
      <meshStandardMaterial color="#1f6d4f" emissive={PALETTE.level} emissiveIntensity={0.15 + imuPulse * 2.2 + imu * 0.8} />
    </mesh>
    {/* sensing rings while the sensor is being explained */}
    {imu > 0.01
      ? [0, 1, 2].map((k) => {
          const ph = (ring + k / 3) % 1;
          return (
            <mesh key={k} position={RIG.imu.clone().sub(RIG.cameraCentre).add(new THREE.Vector3(0, 0.05, 0))} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.14 + ph * 0.5, 0.165 + ph * 0.5, 32]} />
              <meshBasicMaterial color={PALETTE.level} transparent opacity={imu * 0.8 * (1 - ph)} side={THREE.DoubleSide} depthTest={false} />
            </mesh>
          );
        })
      : null}
  </group>
);

export const GimbalModel: React.FC<{s: RigState}> = ({s}) => {
  const C = chain(s);
  const r = s.reveal;
  const P = RIG.pivot;
  const X = new THREE.Vector3(1, 0, 0);
  const Y = new THREE.Vector3(0, 1, 0);
  const Z = new THREE.Vector3(0, 0, 1);
  const at = (m: THREE.Matrix4, v: THREE.Vector3) => v.clone().applyMatrix4(m);
  const dir = (m: THREE.Matrix4, v: THREE.Vector3) => v.clone().transformDirection(m);
  const lens = at(C.tilt, new THREE.Vector3(0.05, 1.2, 1.15));
  const camFwd = dir(C.tilt, Z);
  const camRight = dir(C.tilt, X);
  const camCentre = at(C.tilt, RIG.cameraCentre);
  return (
    <group>
      {/* handle link */}
      <Link m={C.handle}>
        <Hand />
        <mesh position={[0, -2.0, 0]}>
          <cylinderGeometry args={[0.33, 0.36, 2.5, 32]} />
          <Mat color={PALETTE.graphite} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.85, 0.3]}>
          <cylinderGeometry args={[0.07, 0.07, 0.08, 16]} />
          <meshStandardMaterial color={PALETTE.metal} />
        </mesh>
        {/* pan motor stator */}
        <mesh position={[0, -0.62, 0]}>
          <cylinderGeometry args={[0.45, 0.45, 0.26, 36]} />
          <Mat color={PALETTE.graphiteLight} ghost={r} focus={s.focus.pan} />
        </mesh>
      </Link>

      {/* pan link: rotor, pan arm, roll motor stator */}
      <Link m={C.pan}>
        <group position={[0, -0.36, 0]}>
          <Motor r={0.45} h={0.22} rotor={0} ghost={r} focus={s.focus.pan} />
        </group>
        <mesh position={[0, -0.32, -0.55]}>
          <boxGeometry args={[0.3, 0.2, 1.0]} />
          <Mat color={PALETTE.graphiteLight} ghost={r} focus={s.focus.pan * 0.3} />
        </mesh>
        <mesh position={[0, 0.4, -1.0]}>
          <boxGeometry args={[0.28, 1.6, 0.22]} />
          <Mat color={PALETTE.graphiteLight} ghost={r} />
        </mesh>
        <mesh position={[0, 1.2, -1.12]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.18, 36]} />
          <Mat color={PALETTE.graphiteLight} ghost={r} focus={s.focus.roll} />
        </mesh>
      </Link>

      {/* roll link: roll rotor, roll arm, tilt stator */}
      <Link m={C.roll}>
        <group position={[0, 1.2, -0.95]} rotation={[Math.PI / 2, 0, 0]}>
          <Motor r={0.4} h={0.16} rotor={0} ghost={r} focus={s.focus.roll} />
        </group>
        <mesh position={[0.62, 1.2, -1.0]}>
          <boxGeometry args={[1.25, 0.24, 0.22]} />
          <Mat color={PALETTE.graphiteLight} ghost={r} focus={s.focus.roll * 0.3} />
        </mesh>
        <mesh position={[1.42, 1.2, -0.5]}>
          <boxGeometry args={[0.2, 0.24, 1.0]} />
          <Mat color={PALETTE.graphiteLight} ghost={r} />
        </mesh>
        <TiltStator reveal={r} focus={s.focus.tilt} />
      </Link>

      {/* tilt link: rotor + camera */}
      <Link m={C.tilt}>
        <TiltRotor reveal={r} focus={s.focus.tilt} />
        <Camera reveal={r} imu={s.focus.imu} imuPulse={s.imuPulse} ring={s.imuRing} />
      </Link>

      {/* ── overlays (world space) ── */}
      {/* axis lines */}
      <Rod from={at(C.roll, new THREE.Vector3(2.15, 1.2, 0))} to={at(C.roll, new THREE.Vector3(2.15 - 3.3 * s.axis.tilt, 1.2, 0))} r={0.03} color={PALETTE.focus} opacity={Math.min(1, s.axis.tilt * 2)} />
      <Rod from={at(C.pan, new THREE.Vector3(0, 1.2, -1.6))} to={at(C.pan, new THREE.Vector3(0, 1.2, -1.6 + 3.6 * s.axis.roll))} r={0.03} color={PALETTE.focus} opacity={Math.min(1, s.axis.roll * 2)} />
      <Rod from={at(C.handle, new THREE.Vector3(0, -1.0, 0))} to={at(C.handle, new THREE.Vector3(0, -1.0 + 3.4 * s.axis.pan, 0))} r={0.03} color={PALETTE.focus} opacity={Math.min(1, s.axis.pan * 2)} />

      {/* hand angle (white) vs motor correction (orange), per axis */}
      <AxisArc centre={P.clone().add(new THREE.Vector3(0.45, 0, 0))} axis={X} ref={Y} radius={1.15} sweep={s.hand.pitch} color={PALETTE.hand} opacity={s.arcs.pitch * 0.9} />
      <AxisArc centre={at(C.roll, RIG.tiltMotor).add(dir(C.roll, X).multiplyScalar(0.45))} axis={dir(C.roll, X)} ref={dir(C.roll, Y)} radius={0.72} sweep={s.motor.tilt} color={PALETTE.focus} opacity={s.arcs.pitch} />
      <AxisArc centre={P.clone().add(new THREE.Vector3(0, 0, 0.5))} axis={Z} ref={Y} radius={1.15} sweep={s.hand.roll} color={PALETTE.hand} opacity={s.arcs.roll * 0.9} />
      <AxisArc centre={at(C.pan, new THREE.Vector3(0, 1.2, -0.75))} axis={dir(C.pan, Z)} ref={dir(C.pan, Y)} radius={0.62} sweep={s.motor.roll} color={PALETTE.focus} opacity={s.arcs.roll} />
      <AxisArc centre={at(C.handle, new THREE.Vector3(0, -0.85, 0))} axis={dir(C.handle, Y)} ref={dir(C.handle, Z)} radius={0.95} sweep={s.hand.yaw} color={PALETTE.hand} opacity={s.arcs.yaw * 0.9} />
      <AxisArc centre={camCentre.clone().add(new THREE.Vector3(0, 0.75, 0))} axis={Y} ref={Z} radius={0.95} sweep={Math.atan2(camFwd.x, camFwd.z)} color={PALETTE.focus} opacity={s.arcs.yaw} />

      {/* camera direction (stays level) and horizon (stays straight) */}
      <Dashed from={lens.clone().addScaledVector(camFwd, 0.1)} to={lens.clone().addScaledVector(camFwd, 3.2)} r={0.022} color={PALETTE.level} opacity={s.level.forward} dash={0.18} />
      <Dashed from={camCentre.clone().addScaledVector(camRight, -2.4).addScaledVector(camFwd, 1.25)} to={camCentre.clone().addScaledVector(camRight, 2.4).addScaledVector(camFwd, 1.25)} r={0.022} color={PALETTE.level} opacity={s.level.horizon} dash={0.18} />
    </group>
  );
};
