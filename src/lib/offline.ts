import { desktop, isAndroid } from "./platform";

/**
 * Web release only: registers the offline cache (out/sw.js, generated at build
 * time) so the platform keeps working without internet after the first visit.
 * Skipped in the Windows and Android apps (everything is already local), in development,
 * and under test automation unless a test asks for it.
 */
export function registerOfflineCache() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || desktop() || isAndroid()) return;
  if (process.env.NODE_ENV !== "production" || !window.isSecureContext) return;
  let forced = false;
  try {
    forced = localStorage.getItem("heroes-offline-cache") === "on";
  } catch {
    /* storage blocked */
  }
  if (navigator.webdriver && !forced) return;
  void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
}
