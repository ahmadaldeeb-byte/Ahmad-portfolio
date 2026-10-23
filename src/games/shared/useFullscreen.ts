"use client";
import { useCallback, useEffect, useState, type RefObject } from "react";

export function useFullscreen(ref: RefObject<HTMLElement | null>) {
  const [active, setActive] = useState(false);
  const supported = typeof document !== "undefined" && !!document.fullscreenEnabled;

  useEffect(() => {
    const onChange = () => setActive(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const enter = useCallback(async () => {
    try {
      if (ref.current && !document.fullscreenElement && document.fullscreenEnabled) await ref.current.requestFullscreen({ navigationUI: "hide" });
    } catch {
      /* Some browsers refuse; the classroom layout still fills the window. */
    }
  }, [ref]);

  const exit = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      /* ignore */
    }
  }, []);

  return { active, supported, enter, exit, toggle: () => (active ? exit() : enter()) };
}
