"use client";
import { useEffect, useRef, useState } from "react";
import { sound } from "@/lib/audio";

/**
 * Pausable countdown in whole seconds. Restarts whenever `resetKey` changes.
 * Calls `onExpire` once when it reaches zero. `seconds = 0` disables it.
 */
export function useCountdown(seconds: number, running: boolean, resetKey: unknown, onExpire: () => void) {
  const [remaining, setRemaining] = useState(seconds);
  const expired = useRef(false);
  const elapsed = useRef(0);
  const cb = useRef(onExpire);
  cb.current = onExpire;

  useEffect(() => {
    elapsed.current = 0;
    expired.current = false;
    setRemaining(seconds);
  }, [resetKey, seconds]);

  useEffect(() => {
    if (!running || seconds <= 0) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      elapsed.current += now - last;
      last = now;
      const left = Math.max(0, Math.ceil(seconds - elapsed.current / 1000));
      setRemaining((prev) => {
        if (left !== prev && left > 0 && left <= 5) sound.play("tick");
        return left;
      });
      if (left === 0 && !expired.current) {
        expired.current = true;
        sound.play("timeup");
        cb.current();
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [running, seconds, resetKey]);

  return seconds > 0 ? remaining : null;
}
