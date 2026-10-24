import { defineConfig } from "@playwright/test";

/**
 * Desktop (Electron) tests: they launch the real app shell from desktop/main.cjs
 * with the static release in out/ (run `npm run build` first). On Linux CI run
 * them under a virtual display: `xvfb-run -a npm run test:desktop`.
 */
export default defineConfig({
  testDir: "tests/desktop",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: [["list"]],
});
