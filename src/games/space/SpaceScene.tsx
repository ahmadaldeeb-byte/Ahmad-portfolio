"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useSettings } from "@/store/settings";

const COLORS = ["#4DABF7", "#FF922B", "#40C057", "#E64980", "#FAB005", "#7950F2", "#20C997", "#FA5252"];
const GAP = 7;

/** Planets in a row; the ship flies to planet `target` (one per right answer). */
function Scene({ target, planets }: { target: number; planets: number }) {
  const { camera } = useThree();
  const reduced = useSettings((s) => s.reducedMotion);
  const ship = useRef<THREE.Group>(null);
  const flame = useRef<THREE.Mesh>(null);
  const x = useRef(0);
  const stars = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(900 * 3);
    for (let i = 0; i < 900; i++) {
      p[i * 3] = Math.random() * (planets * GAP + 60) - 30;
      p[i * 3 + 1] = (Math.random() - 0.5) * 50;
      p[i * 3 + 2] = -8 - Math.random() * 40;
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return g;
  }, [planets]);
  useEffect(() => () => stars.dispose(), [stars]);

  useFrame((state, raw) => {
    const dt = Math.min(raw, 1 / 20);
    const goal = target * GAP;
    const speed = reduced ? 1 : Math.min(1, dt * 2.2);
    x.current += (goal - x.current) * speed;
    const moving = Math.abs(goal - x.current) > 0.05;
    if (ship.current) {
      // Hover above the current planet, bob gently and lean forward while flying.
      ship.current.position.set(x.current, 1.9 + Math.sin(state.clock.elapsedTime * 2) * 0.12, 0);
      ship.current.rotation.z = moving ? -0.35 : 0;
    }
    if (flame.current) flame.current.scale.setScalar(moving ? 1.3 + Math.sin(state.clock.elapsedTime * 30) * 0.2 : 0.4);
    camera.position.set(x.current + 1.5, 2.2, 9);
    camera.lookAt(x.current + 1.5, 0.8, 0);
  });

  return (
    <>
      <color attach="background" args={["#14143A"]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 8, 6]} intensity={1.8} />
      <points geometry={stars}>
        <pointsMaterial color="#ffffff" size={0.14} />
      </points>
      {Array.from({ length: planets }, (_, k) => (
        <group key={k} position={[k * GAP, -0.6, 0]}>
          <mesh>
            <sphereGeometry args={[k === planets - 1 ? 1.6 : 1.1 + (k % 3) * 0.15, 32, 24]} />
            <meshToonMaterial color={k === planets - 1 ? "#FFD43B" : COLORS[k % COLORS.length]} />
          </mesh>
          {k % 3 === 1 && (
            <mesh rotation={[1.2, 0, 0.3]}>
              <torusGeometry args={[1.8, 0.12, 8, 40]} />
              <meshToonMaterial color="#F1F3F5" />
            </mesh>
          )}
        </group>
      ))}
      <group ref={ship} rotation={[0, 0, 0]}>
        {/* body points along +x (the flight direction) */}
        <mesh rotation={[0, 0, -Math.PI / 2]}>
          <cylinderGeometry args={[0.32, 0.36, 1.4, 18]} />
          <meshToonMaterial color="#F8F9FA" />
        </mesh>
        <mesh position={[0.95, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.32, 0.6, 18]} />
          <meshToonMaterial color="#FA5252" />
        </mesh>
        <mesh position={[0.2, 0, 0.34]}>
          <circleGeometry args={[0.15, 16]} />
          <meshBasicMaterial color="#4DABF7" />
        </mesh>
        <mesh position={[-0.55, 0.36, 0]}>
          <boxGeometry args={[0.4, 0.3, 0.06]} />
          <meshToonMaterial color="#4361EE" />
        </mesh>
        <mesh position={[-0.55, -0.36, 0]}>
          <boxGeometry args={[0.4, 0.3, 0.06]} />
          <meshToonMaterial color="#4361EE" />
        </mesh>
        <mesh ref={flame} position={[-0.95, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.24, 0.7, 14]} />
          <meshBasicMaterial color="#FF922B" transparent opacity={0.9} />
        </mesh>
      </group>
    </>
  );
}

export default function SpaceScene({ target, planets }: { target: number; planets: number }) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ fov: 45, position: [1.5, 2.2, 9] }}>
      <Scene target={target} planets={planets} />
    </Canvas>
  );
}
