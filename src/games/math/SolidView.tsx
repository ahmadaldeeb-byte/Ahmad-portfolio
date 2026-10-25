"use client";
import { useFrame } from "@react-three/fiber";
import { SafeCanvas } from "@/components/SafeCanvas";
import { useRef } from "react";
import type * as THREE from "three";
import type { Solid } from "@/lib/math/games";

function Spinning({ solid }: { solid: Solid }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.y += dt * 0.8;
      ref.current.rotation.x = 0.35;
    }
  });
  return (
    <mesh ref={ref}>
      {solid === "cube" && <boxGeometry args={[2, 2, 2]} />}
      {solid === "cylinder" && <cylinderGeometry args={[1, 1, 2.2, 32]} />}
      {solid === "cone" && <coneGeometry args={[1.2, 2.4, 32]} />}
      {solid === "sphere" && <sphereGeometry args={[1.3, 32, 24]} />}
      <meshToonMaterial color={{ cube: "#4361EE", cylinder: "#40C057", cone: "#FF922B", sphere: "#FF6B9A" }[solid]} />
    </mesh>
  );
}

/** A real 3D solid the class can look at from every side. */
export default function SolidView({ solid }: { solid: Solid }) {
  return (
    <SafeCanvas dpr={[1, 1.5]} camera={{ position: [0, 0.6, 5.5], fov: 40 }} aria-label="مجسم ثلاثي الأبعاد">
      <hemisphereLight args={["#ffffff", "#c5d0ff", 1.7]} />
      <directionalLight position={[3, 5, 4]} intensity={1.8} />
      <Spinning solid={solid} />
    </SafeCanvas>
  );
}
