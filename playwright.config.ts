import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";

const preinstalled = "/opt/pw-browsers/chromium";
const executablePath = process.env.PW_CHROMIUM ?? (fs.existsSync(preinstalled) ? preinstalled : undefined);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3100",
    locale: "ar",
    screenshot: "only-on-failure",
    launchOptions: {
      executablePath,
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"],
    },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1600, height: 900 } }, grepInvert: /@touch/ },
    { name: "smartboard", use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1080 } }, grep: /@screens/ },
    { name: "tablet", use: { ...devices["Desktop Chrome"], viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: false }, grep: /@touch|@screens/ },
    { name: "phone", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, hasTouch: true }, grep: /@screens/ },
  ],
  webServer: {
    // The static web release (`npm run build` → out/), served like a production static host.
    command: "node scripts/serve-static.mjs out 3100",
    url: "http://localhost:3100",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
