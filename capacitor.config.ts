import type { CapacitorConfig } from "@capacitor/cli";

/*
 * Android app (Capacitor): the same static web release as the web and Windows
 * versions (`npm run build` → out/), packed inside the APK and served from the
 * device. No server, no internet needed; teacher data stays in the app's
 * storage on the device. Windows keeps its Electron shell (desktop/).
 */
const config: CapacitorConfig = {
  appId: "edu.heroesworld.app",
  appName: "عالم الأبطال",
  webDir: "out",
  android: {
    // Debug builds only: lets the automated tests drive the app's WebView.
    webContentsDebuggingEnabled: process.env.HEROES_ANDROID_DEBUG === "1",
  },
  plugins: {
    SystemBars: { insetsHandling: "css" },
  },
};

export default config;
