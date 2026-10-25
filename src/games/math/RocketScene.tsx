"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { SafeCanvas } from "@/components/SafeCanvas";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useSettings } from "@/store/settings";

const PLANET_COLORS = ["#40C057", "#FF922B", "#7950F2", "#20A4C9", "#E64980", "#FAB005"];

/** Rocket on its pad; `launch` increments to fly to the next planet. */
function Scene({ launch, fuel }: { launch: number; fuel: number }) {
  const { camera, scene } = useThree();
  const reduced = useSettings((s) => s.reducedMotion);
  const rocket = useRef<THREE.Group>(null);
  const flame = useRef<THREE.Mesh>(null);
  const planet = useRef<THREE.Mesh>(null);
  const stars = useRef<THREE.Points>(null);
  const t = useRef(-1); // seconds since launch; -1 = waiting on the pad
  const lastLaunch = useRef(launch);
  const bg = useMemo(() => new THREE.Color(), []);
  const starGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i++) {
      p[i * 3] = (Math.random() - 0.5) * 80;
      p[i * 3 + 1] = Math.random() * 120;
      p[i * 3 + 2] = -10 - Math.random() * 40;
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return g;
  }, []);
  useEffect(() => () => starGeo.dispose(), [starGeo]);
  const planetColor = PLANET_COLORS[launch % PLANET_COLORS.length];

  useFrame((_, raw) => {
    const dt = Math.min(raw, 1 / 20);
    if (launch !== lastLaunch.current) {
      lastLaunch.current = launch;
      t.current = 0;
    }
    let y = 0;
    let space = 0;
    if (t.current >= 0) {
      t.current += dt * (reduced ? 4 : 1);
      const k = t.current;
      // accelerate up, then glide into space and land on the new planet
      y = k < 2.4 ? 2 * k * k : 11.5 + (k - 2.4) * 6;
      space = Math.min(1, k / 2);
      if (k > 3.6) {
        t.current = -1;
        y = 0;
        space = 0;
      }
    }
    if (rocket.current) {
      rocket.current.position.y = y;
      rocket.current.rotation.y += dt * (t.current >= 0 ? 4 : 0.4);
    }
    if (flame.current) {
      const on = t.current >= 0;
      flame.current.visible = on || fuel > 0;
      flame.current.scale.y = on ? 1.4 + Math.sin(performance.now() / 40) * 0.3 : 0.25 + fuel * 0.08;
    }
    bg.set("#BDE0FE").lerp(new THREE.Color("#1B1464"), space);
    scene.background = bg;
    if (stars.current) (stars.current.material as THREE.PointsMaterial).opacity = space;
    if (planet.current) planet.current.position.y = t.current >= 0 ? 30 - Math.min(14, t.current * 5) : -3.6;
    camera.position.set(0, y + 3, 11);
    camera.lookAt(0, y + 1.6, 0);
  });

  return (
    <>
      <hemisphereLight args={["#ffffff", "#8CE99A", 1.6]} />
      <directionalLight position={[5, 10, 8]} intensity={1.6} />
      <points ref={stars} geometry={starGeo}>
        <pointsMaterial color="#ffffff" size={0.18} transparent opacity={0} />
      </points>
      {/* Current planet surface (its colour changes after each trip) */}
      <mesh ref={planet} position={[0, -3.6, -2]}>
        <sphereGeometry args={[4, 32, 24]} />
        <meshToonMaterial color={planetColor} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[1.4, 1.6, 0.3, 24]} />
        <meshToonMaterial color="#868E96" />
      </mesh>
      <group ref={rocket}>
        <group position={[0, 0.3, 0]}>
          <mesh position={[0, 1.6, 0]}>
            <cylinderGeometry args={[0.55, 0.6, 2.4, 20]} />
            <meshToonMaterial color="#F8F9FA" />
          </mesh>
          <mesh position={[0, 3.2, 0]}>
            <coneGeometry args={[0.55, 0.9, 20]} />
            <meshToonMaterial color="#FA5252" />
          </mesh>
          <mesh position={[0, 2.1, 0.55]}>
            <circleGeometry args={[0.24, 20]} />
            <meshBasicMaterial color="#4DABF7" />
          </mesh>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[Math.sin((i * Math.PI * 2) / 3) * 0.6, 0.6, Math.cos((i * Math.PI * 2) / 3) * 0.6]} rotation={[0, (i * Math.PI * 2) / 3, 0]}>
              <boxGeometry args={[0.08, 0.8, 0.5]} />
              <meshToonMaterial color="#4361EE" />
            </mesh>
          ))}
          <mesh ref={flame} position={[0, -0.2, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.4, 1.2, 16]} />
            <meshBasicMaterial color="#FF922B" transparent opacity={0.9} />
          </mesh>
        </group>
      </group>
    </>
  );
}

export default function RocketScene({ launch, fuel }: { launch: number; fuel: number }) {
  return (
    <SafeCanvas dpr={[1, 1.5]} camera={{ fov: 45, position: [0, 3, 11] }}>
      <Scene launch={launch} fuel={fuel} />
    </SafeCanvas>
  );
}
