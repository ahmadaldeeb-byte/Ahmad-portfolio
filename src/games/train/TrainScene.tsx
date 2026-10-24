"use client";
import { PerformanceMonitor } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { SafeCanvas } from "@/components/SafeCanvas";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useSettings } from "@/store/settings";

export type TrainPhase = "intro" | "question" | "travel";

export interface TrainSceneProps {
  /** Plate labels in reading order ("" = empty slot shown as ؟). */
  labels: string[];
  /** Plates to highlight as just filled (success glow). */
  filled: number[];
  /** Changes whenever a wrong answer should shake a wagon. */
  shake: { index: number; key: number } | null;
  phase: TrainPhase;
  /** Increases by one per question; drives the scenery so a new station arrives. */
  leg: number;
  stationName: string;
}

const CAR_GAP = 2.7;
const LEG = 80; // distance travelled between stations
const COLORS = ["#4361EE", "#40C057", "#FF6B9A", "#FFD43B", "#7950F2"];

function makePlate(text: string, empty: boolean, glow: boolean) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 192;
  const g = c.getContext("2d")!;
  g.fillStyle = glow ? "#D3F9D8" : empty ? "#FFF4E6" : "#FFFFFF";
  g.strokeStyle = glow ? "#2F9E44" : empty ? "#E8590C" : "#25304B";
  g.lineWidth = 14;
  g.beginPath();
  g.roundRect(10, 10, 236, 172, 34);
  g.fill();
  g.stroke();
  g.fillStyle = empty ? "#E8590C" : "#25304B";
  const size = text.length > 2 ? 92 : 124;
  g.font = `800 ${size}px Cairo, Tajawal, sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.direction = "ltr";
  g.fillText(empty ? "؟" : text, 128, 104);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function Plate({ text, glow }: { text: string; glow: boolean }) {
  const empty = text === "";
  const tex = useMemo(() => makePlate(text, empty, glow), [text, empty, glow]);
  useEffect(() => () => tex.dispose(), [tex]);
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current && empty) ref.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 4) * 0.04);
    else if (ref.current) ref.current.scale.setScalar(THREE.MathUtils.lerp(ref.current.scale.x, 1, 0.1));
  });
  return (
    <mesh ref={ref} position={[0, 1.95, 0.72]}>
      <planeGeometry args={[1.9, 1.42]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

function Wheels({ speed, x }: { speed: React.RefObject<number>; x: number[] }) {
  const refs = useRef<THREE.Group[]>([]);
  useFrame((_, dt) => refs.current.forEach((w) => w && (w.rotation.y += (speed.current ?? 0) * dt * 3)));
  return (
    <>
      {x.flatMap((px, i) =>
        [-1, 1].map((side) => (
          <group key={`${i}${side}`} position={[px, 0.42, side * 0.62]} rotation={[Math.PI / 2, 0, 0]}>
            <group ref={(g) => { if (g) refs.current[i * 2 + (side > 0 ? 1 : 0)] = g; }}>
              <mesh>
                <cylinderGeometry args={[0.38, 0.38, 0.2, 16]} />
                <meshToonMaterial color="#25304B" />
              </mesh>
              <mesh position={[0.18, side * 0.11, 0]}>
                <boxGeometry args={[0.2, 0.04, 0.1]} />
                <meshToonMaterial color="#FFD43B" />
              </mesh>
            </group>
          </group>
        )),
      )}
    </>
  );
}

function Wagon({ index, text, glow, shake, color }: { index: number; text: string; glow: boolean; shake: { index: number; key: number } | null; color: string }) {
  const ref = useRef<THREE.Group>(null);
  const shakeT = useRef(0);
  useEffect(() => {
    if (shake && shake.index === index) shakeT.current = 0.6;
  }, [shake, index]);
  useFrame((_, dt) => {
    if (!ref.current) return;
    shakeT.current = Math.max(0, shakeT.current - dt);
    ref.current.rotation.z = shakeT.current > 0 ? Math.sin(shakeT.current * 40) * 0.06 * shakeT.current : 0;
    ref.current.position.y = glow ? THREE.MathUtils.lerp(ref.current.position.y, 0.12, 0.2) : THREE.MathUtils.lerp(ref.current.position.y, 0, 0.15);
  });
  return (
    <group position={[-index * CAR_GAP, 0, 0]}>
      <group ref={ref}>
        <mesh position={[0, 0.95, 0]} castShadow>
          <boxGeometry args={[2.2, 0.9, 1.3]} />
          <meshToonMaterial color={color} />
        </mesh>
        <mesh position={[0, 0.48, 0]}>
          <boxGeometry args={[2.35, 0.14, 1.4]} />
          <meshToonMaterial color="#25304B" />
        </mesh>
        <Plate text={text} glow={glow} />
      </group>
      <mesh position={[CAR_GAP / 2, 0.6, 0]}>
        <boxGeometry args={[0.5, 0.08, 0.08]} />
        <meshToonMaterial color="#495057" />
      </mesh>
    </group>
  );
}

function Locomotive({ x, moving }: { x: number; moving: React.RefObject<number> }) {
  const smoke = useRef<THREE.InstancedMesh>(null);
  const puffs = useMemo(() => Array.from({ length: 18 }, () => ({ x: 0, y: -50, z: 0, life: 0, s: 0 })), []);
  const timer = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const reduced = useSettings((s) => s.reducedMotion);
  useFrame((_, dt) => {
    if (!smoke.current) return;
    const speed = moving.current ?? 0;
    timer.current -= dt;
    if (!reduced && timer.current <= 0) {
      timer.current = speed > 1 ? 0.08 : 0.45;
      const p = puffs.find((q) => q.life <= 0);
      if (p) Object.assign(p, { x: x - 0.55, y: 2.55, z: 0, life: 1, s: 0.22 + Math.random() * 0.12 });
    }
    puffs.forEach((p, i) => {
      if (p.life > 0) {
        p.life -= dt * 0.7;
        p.y += dt * 0.9;
        p.x += dt * (0.3 + speed * 0.5);
      }
      dummy.position.set(p.x, p.life > 0 ? p.y : -50, p.z);
      dummy.scale.setScalar(p.s * (2.6 - p.life * 1.4));
      dummy.updateMatrix();
      smoke.current!.setMatrixAt(i, dummy.matrix);
    });
    smoke.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      <group position={[x, 0, 0]}>
        <mesh position={[0.25, 1.05, 0]} castShadow>
          <boxGeometry args={[1.4, 1.1, 1.3]} />
          <meshToonMaterial color="#FA5252" />
        </mesh>
        <mesh position={[0.25, 1.85, 0]}>
          <boxGeometry args={[1.55, 0.18, 1.45]} />
          <meshToonMaterial color="#25304B" />
        </mesh>
        <mesh position={[-0.75, 0.95, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.55, 0.55, 1.4, 18]} />
          <meshToonMaterial color="#E03131" />
        </mesh>
        <mesh position={[-0.55, 1.75, 0]}>
          <cylinderGeometry args={[0.16, 0.24, 0.65, 12]} />
          <meshToonMaterial color="#25304B" />
        </mesh>
        <mesh position={[-1.47, 0.95, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.3, 0.3, 0.06, 18]} />
          <meshBasicMaterial color="#FFE066" />
        </mesh>
        {/* driver */}
        <mesh position={[0.35, 1.45, 0.45]}>
          <sphereGeometry args={[0.24, 16, 12]} />
          <meshToonMaterial color="#F5C29A" />
        </mesh>
        <mesh position={[0.35, 1.66, 0.45]}>
          <cylinderGeometry args={[0.26, 0.26, 0.1, 16]} />
          <meshToonMaterial color="#4361EE" />
        </mesh>
        <mesh position={[0.55, 0.48, 0]}>
          <boxGeometry args={[2.6, 0.14, 1.4]} />
          <meshToonMaterial color="#25304B" />
        </mesh>
      </group>
      <instancedMesh ref={smoke} args={[undefined, undefined, 18]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshToonMaterial color="#F1F3F5" transparent opacity={0.85} />
      </instancedMesh>
    </>
  );
}

/** Scenery that scrolls past while the train travels between stations. */
function World({ dist, stationName }: { dist: React.RefObject<number>; stationName: string }) {
  const trees = useRef<THREE.InstancedMesh>(null);
  const trunks = useRef<THREE.InstancedMesh>(null);
  const sleepers = useRef<THREE.InstancedMesh>(null);
  const station = useRef<THREE.Group>(null);
  const hills = useRef<THREE.Group>(null);
  const clouds = useRef<THREE.Group>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const treeSeeds = useMemo(() => Array.from({ length: 26 }, (_, i) => ({ base: (i * 37) % LEG, z: -3.2 - ((i * 13) % 9), s: 0.8 + ((i * 7) % 5) / 6 })), []);
  const sign = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 128;
    const g = c.getContext("2d")!;
    g.fillStyle = "#FFFFFF";
    g.beginPath();
    g.roundRect(4, 4, 504, 120, 26);
    g.fill();
    g.fillStyle = "#25304B";
    g.font = "800 62px Cairo, Tajawal, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.direction = "rtl";
    g.fillText(stationName, 256, 68);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [stationName]);
  useEffect(() => () => sign.dispose(), [sign]);
  const wrap = (v: number) => ((((v + LEG / 2) % LEG) + LEG) % LEG) - LEG / 2;

  useFrame(() => {
    const d = dist.current ?? 0;
    if (trees.current && trunks.current) {
      treeSeeds.forEach((t, i) => {
        const x = wrap(t.base + d) - 4;
        dummy.position.set(x, 1.3 * t.s, t.z);
        dummy.scale.setScalar(t.s);
        dummy.updateMatrix();
        trees.current!.setMatrixAt(i, dummy.matrix);
        dummy.position.set(x, 0.35 * t.s, t.z);
        dummy.updateMatrix();
        trunks.current!.setMatrixAt(i, dummy.matrix);
      });
      trees.current.instanceMatrix.needsUpdate = true;
      trunks.current.instanceMatrix.needsUpdate = true;
    }
    if (sleepers.current) {
      for (let i = 0; i < 60; i++) {
        dummy.position.set(wrap(i * (LEG / 60) + d), 0.05, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        sleepers.current.setMatrixAt(i, dummy.matrix);
      }
      sleepers.current.instanceMatrix.needsUpdate = true;
    }
    if (station.current) station.current.position.x = wrap(d) - 4;
    if (hills.current) hills.current.position.x = wrap(d * 0.25);
    if (clouds.current) clouds.current.position.x = wrap(d * 0.1 + performance.now() / 4000);
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -10]}>
        <planeGeometry args={[400, 60]} />
        <meshToonMaterial color="#8CE99A" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, 0]}>
        <planeGeometry args={[400, 2.6]} />
        <meshToonMaterial color="#D9C9A8" />
      </mesh>
      {[-0.62, 0.62].map((z) => (
        <mesh key={z} position={[0, 0.16, z]}>
          <boxGeometry args={[400, 0.1, 0.1]} />
          <meshToonMaterial color="#868E96" />
        </mesh>
      ))}
      <instancedMesh ref={sleepers} args={[undefined, undefined, 60]}>
        <boxGeometry args={[0.3, 0.1, 1.8]} />
        <meshToonMaterial color="#8B5E3C" />
      </instancedMesh>
      <instancedMesh ref={trees} args={[undefined, undefined, treeSeeds.length]}>
        <coneGeometry args={[0.8, 1.9, 7]} />
        <meshToonMaterial color="#2F9E44" />
      </instancedMesh>
      <instancedMesh ref={trunks} args={[undefined, undefined, treeSeeds.length]}>
        <cylinderGeometry args={[0.13, 0.18, 0.7, 6]} />
        <meshToonMaterial color="#8B5E3C" />
      </instancedMesh>
      <group ref={station}>
        <mesh position={[0, 0.35, -2.3]}>
          <boxGeometry args={[14, 0.7, 2]} />
          <meshToonMaterial color="#DEE2E6" />
        </mesh>
        <mesh position={[0, 3.1, -3]}>
          <boxGeometry args={[12, 0.25, 1.6]} />
          <meshToonMaterial color="#FF922B" />
        </mesh>
        {[-5.5, 5.5].map((x) => (
          <mesh key={x} position={[x, 1.7, -3]}>
            <cylinderGeometry args={[0.12, 0.12, 2.8, 8]} />
            <meshToonMaterial color="#25304B" />
          </mesh>
        ))}
        <mesh position={[0, 3.75, -2.9]}>
          <planeGeometry args={[4.4, 1.1]} />
          <meshBasicMaterial map={sign} transparent toneMapped={false} />
        </mesh>
      </group>
      <group ref={hills}>
        {[-60, -35, -12, 10, 32, 55].map((x, i) => (
          <mesh key={x} position={[x, 0, -34]}>
            <coneGeometry args={[9 + (i % 3) * 2, 10 + (i % 2) * 5, 6]} />
            <meshToonMaterial color={i % 2 ? "#74C0FC" : "#91A7FF"} />
          </mesh>
        ))}
      </group>
      <group ref={clouds}>
        {[-40, -15, 8, 30].map((x, i) => (
          <group key={x} position={[x, 9 + (i % 2) * 2, -22]}>
            {[0, 1.6, -1.5].map((o, k) => (
              <mesh key={k} position={[o, k === 0 ? 0.4 : 0, 0]}>
                <sphereGeometry args={[k === 0 ? 1.6 : 1.2, 12, 10]} />
                <meshToonMaterial color="#FFFFFF" />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}

function Rig({ props, carsWidth }: { props: TrainSceneProps; carsWidth: number }) {
  const { camera, size } = useThree();
  const reduced = useSettings((s) => s.reducedMotion);
  const dist = useRef(props.leg * LEG);
  const speed = useRef(0);
  const look = useRef(new THREE.Vector3(-carsWidth / 2, 1.5, 0));
  const started = useRef(false);

  useEffect(() => {
    if (!started.current) {
      // Opening wide shot.
      camera.position.set(14, 16, 40);
      started.current = true;
    }
  }, [camera]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    const target = props.leg * LEG;
    // Travel: accelerate towards the next station and brake smoothly.
    const remaining = target - dist.current;
    const desired = props.phase === "travel" ? Math.min(28, Math.max(2.5, remaining * 1.1)) : 0;
    speed.current = reduced ? desired : THREE.MathUtils.damp(speed.current, desired, 2.5, dt);
    if (props.phase === "travel") dist.current = Math.min(target, dist.current + speed.current * dt);
    else dist.current = target;

    const portrait = size.height > size.width;
    const center = -carsWidth / 2 + 0.6;
    const close = props.phase === "question";
    const z = (portrait ? 1.8 : 1) * (close ? 6 + carsWidth * 0.42 : 12 + carsWidth * 0.5);
    const want = new THREE.Vector3(center + (close ? 0 : 2), close ? 2.6 : 5, z);
    const k = props.phase === "intro" ? 0.9 : 2.2;
    if (reduced) camera.position.copy(want);
    else {
      camera.position.x = THREE.MathUtils.damp(camera.position.x, want.x, k, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, want.y, k, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, want.z, k, dt);
    }
    look.current.lerp(new THREE.Vector3(center, close ? 1.4 : 1.3, 0), 0.08);
    camera.lookAt(look.current);
  });

  const wheelX = useMemo(() => {
    const xs: number[] = [];
    props.labels.forEach((_, i) => xs.push(-i * CAR_GAP + 0.6, -i * CAR_GAP - 0.6));
    const lx = -props.labels.length * CAR_GAP;
    xs.push(lx + 0.6, lx - 0.4);
    return xs;
  }, [props.labels]);

  return (
    <>
      <World dist={dist} stationName={props.stationName} />
      {props.labels.map((t, i) => (
        <Wagon key={i} index={i} text={t} glow={props.filled.includes(i)} shake={props.shake} color={COLORS[i % COLORS.length]} />
      ))}
      <Locomotive x={-props.labels.length * CAR_GAP} moving={speed} />
      <Wheels speed={speed} x={wheelX} />
    </>
  );
}

export default function TrainScene(props: TrainSceneProps) {
  const quality = useSettings((s) => s.quality);
  const [dpr, setDpr] = useState(quality === "low" ? 1 : 1.5);
  return (
    <SafeCanvas
      dpr={quality === "high" ? [1, 2] : quality === "low" ? 1 : dpr}
      camera={{ fov: 40, near: 0.5, far: 260, position: [14, 16, 40] }}
      gl={{ antialias: quality !== "low", powerPreference: "high-performance" }}
    >
      {quality === "auto" && <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} flipflops={3} onFallback={() => setDpr(1)} />}
      <color attach="background" args={["#BDE0FE"]} />
      <fog attach="fog" args={["#BDE0FE", 40, 110]} />
      <hemisphereLight args={["#ffffff", "#8CE99A", 1.7]} />
      <directionalLight position={[10, 20, 14]} intensity={1.6} />
      <Rig props={props} carsWidth={props.labels.length * CAR_GAP} />
    </SafeCanvas>
  );
}
