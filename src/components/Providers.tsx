"use client";
import { MotionConfig } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { useData } from "@/store/data";
import { useSettings } from "@/store/settings";
import { Toaster } from "./Toast";

export function Providers({ children }: { children: ReactNode }) {
  const reduced = useSettings((s) => s.reducedMotion);
  const load = useData((s) => s.load);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reduced);
  }, [reduced]);

  return (
    <MotionConfig reducedMotion={reduced ? "always" : "user"}>
      {children}
      <Toaster />
    </MotionConfig>
  );
}
