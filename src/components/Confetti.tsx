"use client";
import { useEffect, useRef } from "react";
import { useSettings } from "@/store/settings";

const COLORS = ["#4361EE", "#7950F2", "#FFD43B", "#40C057", "#FF6B9A", "#FF922B"];

/** Lightweight canvas confetti burst. Cleans up its animation frame on unmount. */
export function Confetti({ fire, pieces = 160 }: { fire: number; pieces?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useSettings((s) => s.reducedMotion);

  useEffect(() => {
    if (!fire || reduced) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    resize();
    const w = canvas.width;
    const h = canvas.height;
    const parts = Array.from({ length: pieces }, () => ({
      x: w / 2 + (Math.random() - 0.5) * w * 0.3,
      y: h * 0.45,
      vx: (Math.random() - 0.5) * 22 * dpr,
      vy: (-Math.random() * 20 - 8) * dpr,
      size: (6 + Math.random() * 8) * dpr,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: Math.random() < 0.3 ? 1 : 0,
    }));
    let raf = 0;
    const start = performance.now();
    const frame = (now: number) => {
      const t = now - start;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.vy += 0.5 * dpr;
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - t / 3200);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      if (t < 3300) raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, w, h);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [fire, pieces, reduced]);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[70] size-full" aria-hidden />;
}
