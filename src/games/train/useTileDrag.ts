"use client";
import { useCallback, useRef, useState } from "react";

/**
 * Pointer-based drag for answer tiles (mouse, pen and touch). A short press is
 * a tap; dragging onto an element with `data-slot` drops the value there.
 */
export function useTileDrag(onDrop: (value: number, slot: number | null) => void) {
  const [ghost, setGhost] = useState<{ value: number; label: string; x: number; y: number } | null>(null);
  const start = useRef<{ x: number; y: number; value: number; label: string; dragging: boolean } | null>(null);

  const bind = useCallback(
    (value: number, label: string) => ({
      onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        start.current = { x: e.clientX, y: e.clientY, value, label, dragging: false };
      },
      onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
        const s = start.current;
        if (!s) return;
        if (!s.dragging && Math.hypot(e.clientX - s.x, e.clientY - s.y) > 10) s.dragging = true;
        if (s.dragging) setGhost({ value: s.value, label: s.label, x: e.clientX, y: e.clientY });
      },
      onPointerUp: (e: React.PointerEvent<HTMLElement>) => {
        const s = start.current;
        start.current = null;
        setGhost(null);
        if (!s) return;
        if (!s.dragging) return onDrop(s.value, null); // tap
        const hit = document.elementsFromPoint(e.clientX, e.clientY).find((el) => (el as HTMLElement).dataset?.slot !== undefined) as HTMLElement | undefined;
        if (hit) onDrop(s.value, Number(hit.dataset.slot));
      },
      onPointerCancel: () => {
        start.current = null;
        setGhost(null);
      },
    }),
    [onDrop],
  );

  return { bind, ghost };
}
