"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useSettings } from "@/store/settings";

export const LANE_WIDTH = 3.2;
export const TRACK_START = 0;
export const TRACK_END = 60;

export interface RaceCar {
  color: string;
  /** 0..1 progress towards the finish line. */
  progress: number;
}

function laneZ(i: number, count: number) {
  return (i - (count - 1) / 2) * LANE_WIDTH;
}

function useCheckerTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext("2d")!;
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 8; x++) {
        ctx.fillStyle = (x + y) % 2 ? "#ffffff" : "#25304B";
        ctx.fillRect(x * 8, y * 8, 8, 8);
      }
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }, []);
}

/** Low-poly cartoon car. Movement uses a damped spring so it accelerates and settles naturally. */
function Car({ color, progress, z, reduced }: { color: string; progress: number; z: number; reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const wheels = useRef<THREE.Group[]>([]);
  const dust = useRef<THREE.InstancedMesh>(null);
  const state = useRef({ x: TRACK_START, v: 0, puffs: Array.from({ length: 14 }, () => ({ x: 0, y: -10, z: 0, life: 0, s: 0 })), next: 0 });
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const darker = useMemo(() => new THREE.Color(color).multiplyScalar(0.7), [color]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    const s = state.current;
    const target = TRACK_START + progress * (TRACK_END - TRACK_START);
    if (reduced) {
      s.v = (target - s.x) * 3;
      s.x += s.v * dt;
    } else {
      const accel = (target - s.x) * 9 - s.v * 4.2;
      s.v += accel * dt;
      s.x += s.v * dt;
    }
    if (group.current) group.current.position.set(s.x, 0, z);
    if (body.current) {
      // Nose lifts while accelerating, bob while moving.
      body.current.rotation.z = THREE.MathUtils.lerp(body.current.rotation.z, THREE.MathUtils.clamp(s.v * 0.012, -0.08, 0.12), 0.15);
      body.current.position.y = 0.55 + (Math.abs(s.v) > 0.3 ? Math.sin(performance.now() / 60) * 0.03 : 0);
    }
    for (const w of wheels.current) if (w) w.rotation.y -= (s.v * dt) / 0.32;

    // Light dust puffs behind the car while it moves.
    if (dust.current) {
      if (!reduced && Math.abs(s.v) > 1.2) {
        s.next -= dt;
        if (s.next <= 0) {
          s.next = 0.04;
          const p = s.puffs.find((q) => q.life <= 0);
          if (p) Object.assign(p, { x: s.x - 1.5, y: 0.25, z: z + (Math.random() - 0.5) * 0.8, life: 1, s: 0.25 + Math.random() * 0.2 });
        }
      }
      s.puffs.forEach((p, i) => {
        if (p.life > 0) {
          p.life -= dt * 1.6;
          p.y += dt * 0.6;
          p.x -= dt * 0.8;
        }
        const k = Math.max(0, p.life);
        dummy.position.set(p.x, k > 0 ? p.y : -10, p.z);
        dummy.scale.setScalar(p.s * (1.8 - k));
        dummy.updateMatrix();
        dust.current!.setMatrixAt(i, dummy.matrix);
      });
      dust.current.instanceMatrix.needsUpdate = true;
    }
  });

  const wheelPos: [number, number, number][] = [
    [0.8, 0.32, 0.72],
    [-0.8, 0.32, 0.72],
    [0.8, 0.32, -0.72],
    [-0.8, 0.32, -0.72],
  ];

  return (
    <>
      <group ref={group}>
        <group ref={body} position={[0, 0.55, 0]}>
          <mesh castShadow>
            <boxGeometry args={[2.3, 0.5, 1.3]} />
            <meshStandardMaterial color={color} roughness={0.4} />
          </mesh>
          <mesh position={[-0.15, 0.42, 0]} castShadow>
            <boxGeometry args={[1.1, 0.42, 1.1]} />
            <meshStandardMaterial color={darker} roughness={0.4} />
          </mesh>
          <mesh position={[0.42, 0.42, 0]}>
            <boxGeometry args={[0.05, 0.34, 0.95]} />
            <meshStandardMaterial color="#BDE0FE" roughness={0.1} />
          </mesh>
          <mesh position={[1.16, 0.05, 0.4]}>
            <boxGeometry args={[0.04, 0.14, 0.24]} />
            <meshStandardMaterial color="#FFF3BF" emissive="#FFD43B" emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[1.16, 0.05, -0.4]}>
            <boxGeometry args={[0.04, 0.14, 0.24]} />
            <meshStandardMaterial color="#FFF3BF" emissive="#FFD43B" emissiveIntensity={0.6} />
          </mesh>
        </group>
        {wheelPos.map((p, i) => (
          <group key={i} position={p} rotation={[Math.PI / 2, 0, 0]}>
            <group
              ref={(g) => {
                if (g) wheels.current[i] = g;
              }}
            >
              <mesh>
                <cylinderGeometry args={[0.32, 0.32, 0.26, 14]} />
                <meshStandardMaterial color="#25304B" roughness={0.8} />
              </mesh>
              <mesh position={[0.16, 0, 0]}>
                <boxGeometry args={[0.14, 0.3, 0.1]} />
                <meshStandardMaterial color="#F1F3F5" />
              </mesh>
            </group>
          </group>
        ))}
      </group>
      <instancedMesh ref={dust} args={[undefined, undefined, 14]} frustumCulled={false}>
        <sphereGeometry args={[0.5, 6, 5]} />
        <meshStandardMaterial color="#D9C9A8" transparent opacity={0.55} depthWrite={false} />
      </instancedMesh>
    </>
  );
}

/** Roadside trees in a single instanced draw call per part. */
function Scenery({ width }: { width: number }) {
  const count = 34;
  const trunks = useRef<THREE.InstancedMesh>(null);
  const crowns = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const d = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const side = i % 2 ? 1 : -1;
      const x = -12 + (i / 2) * 5 + ((i * 37) % 7) * 0.3;
      const z = side * (width / 2 + 2.5 + ((i * 13) % 5) * 0.8);
      const s = 0.8 + ((i * 29) % 10) / 20;
      d.position.set(x, 0.6 * s, z);
      d.scale.setScalar(s);
      d.updateMatrix();
      trunks.current!.setMatrixAt(i, d.matrix);
      d.position.set(x, 1.7 * s, z);
      d.updateMatrix();
      crowns.current!.setMatrixAt(i, d.matrix);
    }
    trunks.current!.instanceMatrix.needsUpdate = true;
    crowns.current!.instanceMatrix.needsUpdate = true;
  }, [width]);
  return (
    <>
      <instancedMesh ref={trunks} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[0.15, 0.2, 1.2, 6]} />
        <meshStandardMaterial color="#8B5E3C" />
      </instancedMesh>
      <instancedMesh ref={crowns} args={[undefined, undefined, count]}>
        <coneGeometry args={[0.9, 1.8, 7]} />
        <meshStandardMaterial color="#2F9E44" flatShading />
      </instancedMesh>
    </>
  );
}

/** Camera glides along with the leading cars. */
function FollowCamera({ cars, reduced }: { cars: RaceCar[]; reduced: boolean }) {
  const { camera, size } = useThree();
  const focus = useRef(TRACK_START);
  useFrame((_, dt) => {
    const lead = Math.max(...cars.map((c) => c.progress));
    const avg = cars.reduce((a, c) => a + c.progress, 0) / cars.length;
    const target = TRACK_START + ((lead + avg) / 2) * (TRACK_END - TRACK_START) + 4;
    focus.current = reduced ? target : THREE.MathUtils.damp(focus.current, target, 2.2, dt);
    const portrait = size.height > size.width;
    const dist = (portrait ? 26 : 15) + cars.length * 1.5;
    // Viewed from the -z side so the race runs right-to-left, matching Arabic reading direction.
    camera.position.set(focus.current - 8, dist * 0.62, -dist);
    camera.lookAt(focus.current + 2, 0, 0);
  });
  return null;
}

function Track({ lanes }: { lanes: number }) {
  const checker = useCheckerTexture();
  const width = lanes * LANE_WIDTH + 1;
  const length = TRACK_END - TRACK_START + 40;
  const mid = (TRACK_START + TRACK_END) / 2;
  useEffect(() => () => checker.dispose(), [checker]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[mid, -0.01, 0]} receiveShadow>
        <planeGeometry args={[length + 60, 80]} />
        <meshStandardMaterial color="#8CE99A" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[mid, 0, 0]} receiveShadow>
        <planeGeometry args={[length, width]} />
        <meshStandardMaterial color="#5C677D" />
      </mesh>
      {Array.from({ length: lanes + 1 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[mid, 0.01, (i - lanes / 2) * LANE_WIDTH]}>
          <planeGeometry args={[length, i === 0 || i === lanes ? 0.25 : 0.12]} />
          <meshBasicMaterial color={i === 0 || i === lanes ? "#FFD43B" : "#ffffff"} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[TRACK_START - 0.4, 0.015, 0]}>
        <planeGeometry args={[0.4, width]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[TRACK_END + 1.4, 0.015, 0]}>
        <planeGeometry args={[1.6, width]} />
        <meshBasicMaterial map={checker} />
      </mesh>
      {/* Finish arch */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[TRACK_END + 1.4, 2, s * (width / 2 + 0.3)]}>
          <boxGeometry args={[0.3, 4, 0.3]} />
          <meshStandardMaterial color="#FA5252" />
        </mesh>
      ))}
      <mesh position={[TRACK_END + 1.4, 4.1, 0]}>
        <boxGeometry args={[0.3, 0.8, width + 0.9]} />
        <meshStandardMaterial map={checker} />
      </mesh>
      <Scenery width={width} />
    </group>
  );
}

export default function RaceScene({ cars }: { cars: RaceCar[] }) {
  const quality = useSettings((s) => s.quality);
  const reduced = useSettings((s) => s.reducedMotion);
  const [dpr, setDpr] = useState(quality === "low" ? 1 : 1.5);
  const shadows = quality === "high";

  return (
    <Canvas
      dpr={quality === "high" ? [1, 2] : quality === "low" ? 1 : dpr}
      shadows={shadows}
      camera={{ fov: 45, near: 0.5, far: 220, position: [-10, 12, -18] }}
      gl={{ antialias: quality !== "low", powerPreference: "high-performance" }}
      frameloop="always"
    >
      {quality === "auto" && (
        <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} flipflops={3} onFallback={() => setDpr(1)} />
      )}
      <color attach="background" args={["#BDE0FE"]} />
      <fog attach="fog" args={["#BDE0FE", 45, 120]} />
      <hemisphereLight args={["#ffffff", "#8CE99A", 1.6]} />
      <directionalLight
        position={[20, 30, 10]}
        intensity={1.8}
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <Track lanes={cars.length} />
      {cars.map((c, i) => (
        <Car key={i} color={c.color} progress={c.progress} z={laneZ(i, cars.length)} reduced={reduced} />
      ))}
      <FollowCamera cars={cars} reduced={reduced} />
    </Canvas>
  );
}
