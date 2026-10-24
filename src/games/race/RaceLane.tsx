"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useSettings } from "@/store/settings";

/** Track length in world units; identical for both teams. */
export const LANE_LENGTH = 70;
const CURBS = 2 * Math.ceil((LANE_LENGTH + 12) / 1.2);

function useChecker() {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 8; x++) {
        g.fillStyle = (x + y) % 2 ? "#ffffff" : "#25304B";
        g.fillRect(x * 8, y * 8, 8, 8);
      }
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

/** Low-poly race car driving towards -z. */
function Car({ color, speedRef }: { color: string; speedRef: React.RefObject<number> }) {
  const wheels = useRef<THREE.Group[]>([]);
  const body = useRef<THREE.Group>(null);
  const darker = useMemo(() => new THREE.Color(color).multiplyScalar(0.65), [color]);
  useFrame((_, dt) => {
    const v = speedRef.current ?? 0;
    for (const w of wheels.current) if (w) w.rotation.y -= (v * dt) / 0.34;
    if (body.current) body.current.rotation.x = THREE.MathUtils.lerp(body.current.rotation.x, THREE.MathUtils.clamp(v * 0.01, 0, 0.09), 0.15);
  });
  return (
    <group rotation={[0, Math.PI / 2, 0]}>
      <group ref={body} position={[0, 0.55, 0]}>
        <mesh>
          <boxGeometry args={[2.4, 0.5, 1.35]} />
          <meshToonMaterial color={color} />
        </mesh>
        <mesh position={[-0.2, 0.42, 0]}>
          <boxGeometry args={[1.1, 0.42, 1.1]} />
          <meshToonMaterial color={darker} />
        </mesh>
        <mesh position={[0.37, 0.42, 0]}>
          <boxGeometry args={[0.05, 0.34, 0.95]} />
          <meshToonMaterial color="#BDE0FE" />
        </mesh>
        <mesh position={[-1.2, 0.35, 0]}>
          <boxGeometry args={[0.18, 0.08, 1.5]} />
          <meshToonMaterial color={darker} />
        </mesh>
        {[0.4, -0.4].map((z) => (
          <mesh key={z} position={[1.21, 0.05, z]}>
            <boxGeometry args={[0.04, 0.14, 0.26]} />
            <meshBasicMaterial color="#FFF3BF" />
          </mesh>
        ))}
      </group>
      {[
        [0.8, 0.72],
        [-0.8, 0.72],
        [0.8, -0.72],
        [-0.8, -0.72],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0.34, z]} rotation={[Math.PI / 2, 0, 0]}>
          <group ref={(g) => { if (g) wheels.current[i] = g; }}>
            <mesh>
              <cylinderGeometry args={[0.34, 0.34, 0.26, 14]} />
              <meshToonMaterial color="#25304B" />
            </mesh>
            <mesh position={[0.16, 0, 0]}>
              <boxGeometry args={[0.14, 0.3, 0.1]} />
              <meshToonMaterial color="#F1F3F5" />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

/** Thin streaks that fly past while the car accelerates (a light, cheap stand-in for motion blur). */
function SpeedLines({ carZ, speedRef }: { carZ: React.RefObject<number>; speedRef: React.RefObject<number> }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const seeds = useMemo(() => Array.from({ length: 26 }, (_, i) => ({ x: (i % 2 ? 1 : -1) * (1.8 + ((i * 7) % 10) / 4), y: 0.4 + ((i * 13) % 10) / 4, o: (i * 37) % 30 })), []);
  const d = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    if (!ref.current || !mat.current) return;
    const v = speedRef.current ?? 0;
    mat.current.opacity = THREE.MathUtils.clamp((v - 4) / 20, 0, 0.55);
    seeds.forEach((s, i) => {
      const z = (carZ.current ?? 0) + 4 - ((s.o + clock.elapsedTime * 60) % 30);
      d.position.set(s.x, s.y, z);
      d.scale.set(1, 1, 1 + v / 6);
      d.updateMatrix();
      ref.current!.setMatrixAt(i, d.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, seeds.length]} frustumCulled={false}>
      <boxGeometry args={[0.04, 0.04, 1.6]} />
      <meshBasicMaterial ref={mat} color="#ffffff" transparent opacity={0} depthWrite={false} />
    </instancedMesh>
  );
}

function Track({ color }: { color: string }) {
  const checker = useChecker();
  const trees = useRef<THREE.InstancedMesh>(null);
  const curbs = useRef<THREE.InstancedMesh>(null);
  const flag = useRef<THREE.Mesh>(null);
  useEffect(() => {
    const d = new THREE.Object3D();
    for (let i = 0; i < 30; i++) {
      d.position.set((i % 2 ? 1 : -1) * (6 + ((i * 7) % 5)), 1.3, 6 - i * 3.2);
      d.scale.setScalar(0.8 + ((i * 3) % 5) / 8);
      d.updateMatrix();
      trees.current!.setMatrixAt(i, d.matrix);
    }
    trees.current!.instanceMatrix.needsUpdate = true;
    // Racing curbs: alternating team colour and white along both edges.
    const team = new THREE.Color(color);
    const white = new THREE.Color("#ffffff");
    for (let i = 0; i < CURBS; i++) {
      const side = i % 2 ? 1 : -1;
      const k = Math.floor(i / 2);
      d.position.set(side * 2.75, 0.06, 6 - k * 1.2);
      d.scale.setScalar(1);
      d.updateMatrix();
      curbs.current!.setMatrixAt(i, d.matrix);
      curbs.current!.setColorAt(i, k % 2 ? team : white);
    }
    curbs.current!.instanceMatrix.needsUpdate = true;
    if (curbs.current!.instanceColor) curbs.current!.instanceColor.needsUpdate = true;
  }, [color]);
  useFrame(({ clock }) => {
    // Waving finish banner.
    if (flag.current) flag.current.rotation.x = Math.sin(clock.elapsedTime * 3) * 0.12;
  });
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -LANE_LENGTH / 2]}>
        <planeGeometry args={[80, LANE_LENGTH + 80]} />
        <meshToonMaterial color="#8CE99A" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -LANE_LENGTH / 2 + 4]}>
        <planeGeometry args={[5, LANE_LENGTH + 20]} />
        <meshToonMaterial color="#5C677D" />
      </mesh>
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 4 - i * 6]}>
          <planeGeometry args={[0.18, 2.4]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
      {/* Start and finish lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 1.6]}>
        <planeGeometry args={[5, 0.3]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, -LANE_LENGTH]}>
        <planeGeometry args={[5, 1.4]} />
        <meshBasicMaterial map={checker} />
      </mesh>
      {[-2.9, 2.9].map((x) => (
        <mesh key={x} position={[x, 2, -LANE_LENGTH]}>
          <boxGeometry args={[0.3, 4, 0.3]} />
          <meshToonMaterial color={color} />
        </mesh>
      ))}
      <mesh ref={flag} position={[0, 3.9, -LANE_LENGTH]}>
        <boxGeometry args={[6.1, 0.9, 0.2]} />
        <meshBasicMaterial map={checker} />
      </mesh>
      <instancedMesh ref={trees} args={[undefined, undefined, 30]}>
        <coneGeometry args={[0.9, 2.2, 7]} />
        <meshToonMaterial color="#2F9E44" />
      </instancedMesh>
      <instancedMesh ref={curbs} args={[undefined, undefined, CURBS]}>
        <boxGeometry args={[0.5, 0.12, 1.2]} />
        <meshToonMaterial />
      </instancedMesh>
    </group>
  );
}

function Rig({ color, progress }: { color: string; progress: number }) {
  const { camera } = useThree();
  const reduced = useSettings((s) => s.reducedMotion);
  const z = useRef(0);
  const v = useRef(0);
  const car = useRef<THREE.Group>(null);
  useFrame((_, raw) => {
    const dt = Math.min(raw, 1 / 20);
    const target = -progress * LANE_LENGTH;
    if (reduced) {
      v.current = (z.current - target) * 3;
      z.current = target;
    } else {
      // Damped spring: a burst of acceleration after each correct answer, then a smooth stop.
      const a = (z.current - target) * 7 - v.current * 3.6;
      v.current += a * dt;
      z.current -= v.current * dt;
    }
    if (car.current) car.current.position.z = z.current;
    const cam = camera as THREE.PerspectiveCamera;
    const speed = Math.abs(v.current);
    cam.position.set(0, 3.1, z.current + 7.5);
    cam.lookAt(0, 0.8, z.current - 9);
    const fov = 55 + (reduced ? 0 : Math.min(speed * 0.6, 12));
    if (Math.abs(cam.fov - fov) > 0.05) {
      cam.fov = THREE.MathUtils.lerp(cam.fov, fov, 0.2);
      cam.updateProjectionMatrix();
    }
  });
  return (
    <>
      <Track color={color} />
      <group ref={car}>
        <Car color={color} speedRef={v} />
      </group>
      <SpeedLines carZ={z} speedRef={v} />
    </>
  );
}

/** One team's independent 3D race view. */
export default function RaceLane({ color, progress }: { color: string; progress: number }) {
  const quality = useSettings((s) => s.quality);
  return (
    <Canvas
      // Two views render at once, so resolution is capped to keep both smooth.
      dpr={quality === "high" ? [1, 1.5] : 1}
      camera={{ fov: 55, near: 0.3, far: 160, position: [0, 3.1, 7.5] }}
      gl={{ antialias: quality === "high", powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#BDE0FE"]} />
      <fog attach="fog" args={["#BDE0FE", 30, 95]} />
      <hemisphereLight args={["#ffffff", "#8CE99A", 1.7]} />
      <directionalLight position={[6, 12, 8]} intensity={1.5} />
      <Rig color={color} progress={progress} />
    </Canvas>
  );
}
