"use client";
import { MotionConfig } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { registerOfflineCache } from "@/lib/offline";
import { useData } from "@/store/data";
import { useSettings } from "@/store/settings";
import { DesktopSync } from "./DesktopSync";
import { Toaster } from "./Toast";
import { useRouter } from "next/navigation";
import { isAndroid } from "@/lib/platform";

export function Providers({ children }: { children: ReactNode }) {
  const reduced = useSettings((s) => s.reducedMotion);
  const load = useData((s) => s.load);

  useEffect(() => {
    void load();
    registerOfflineCache();
  }, [load]);

  // Android app: the WebView answers every page address with the home page file, so open the page that was asked for.
  const router = useRouter();
  useEffect(() => {
    const w = window as unknown as { __heroesEntry?: string };
    const entry = w.__heroesEntry;
    delete w.__heroesEntry;
    if (isAndroid() && entry && !/^\/(\?|$)/.test(entry)) router.replace(entry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
