"use client";
import { Canvas, type CanvasProps } from "@react-three/fiber";
import { Component, useState, type ReactNode } from "react";

/** True when the browser can create a WebGL context (some old or remote PCs cannot). */
function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function NoWebGL() {
  return (
    <div className="grid size-full place-items-center rounded-3xl bg-gradient-to-b from-[#D0EBFF] to-[#E7F5FF] p-3 text-center" role="img" aria-label="الرسوم ثلاثية الأبعاد غير متاحة" data-testid="no-webgl">
      <span className="text-sm font-bold text-hero-muted">
        <span className="block text-4xl" aria-hidden>🎮</span>
        الرسوم ثلاثية الأبعاد غير متاحة على هذا الجهاز، واللعبة تعمل بدونها.
      </span>
    </div>
  );
}

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <NoWebGL /> : this.props.children;
  }
}

/**
 * The 3D canvas used by the games. When WebGL is missing or fails, only the
 * 3D picture is replaced by a short note; the game itself keeps working.
 */
export function SafeCanvas(props: CanvasProps) {
  const [ok] = useState(webglAvailable);
  if (!ok) return <NoWebGL />;
  return (
    <Boundary>
      <Canvas {...props} />
    </Boundary>
  );
}
