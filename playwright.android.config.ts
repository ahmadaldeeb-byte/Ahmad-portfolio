import { defineConfig } from "@playwright/test";

/** Android app tests: an emulator (or USB device) with the debug APK installed. See tests/android/. */
export default defineConfig({
  testDir: "tests/android",
  timeout: 180_000,
  expect: { timeout: 20_000 },
  workers: 1,
  reporter: [["list"]],
});
