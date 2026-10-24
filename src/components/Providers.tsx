"use client";
import { MotionConfig } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { registerOfflineCache } from "@/lib/offline";
import { useData } from "@/store/data";
import { useSettings } from "@/store/settings";
import { DesktopSync } from "./DesktopSync";
import { Toaster } from "./Toast";

export function Providers({ children }: { children: ReactNode }) {
  const reduced = useSettings((s) => s.reducedMotion);
  const load = useData((s) => s.load);

  useEffect(() => {
    void load();
    registerOfflineCache();
  }, [load]);

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reduced);
  }, [reduced]);

  return (
    <MotionConfig reducedMotion={reduced ? "always" : "user"}>
      {children}
      <DesktopSync />
      <Toaster />
    </MotionConfig>
  );
}
