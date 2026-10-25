/*
 * Checks the real Windows build (run on a Windows machine / CI runner):
 *   HEROES_EXE=dist-desktop\win-unpacked\HeroesWorld.exe     → the packaged app, portable mode
 *   HEROES_INSTALLED_EXE=<install dir>\HeroesWorld.exe       → after a silent install of HeroesWorld-Setup.exe
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { _electron, expect, test } from "@playwright/test";

const ORIGIN = "app://heroes";
const heading = "مرحبًا بك في عالم الأبطال!";

test("packaged app: starts offline, keeps data in its folder, writes snapshots", async () => {
  const exe = process.env.HEROES_EXE;
  test.skip(!exe, "set HEROES_EXE to the packaged HeroesWorld.exe");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "heroes-packaged-"));
  const env = { ...process.env, HEROES_DATA_DIR: dir, HEROES_PORTABLE: "1" };
  let app = await _electron.launch({ executablePath: exe!, env });
  let page = await app.firstWindow();
  await expect(page.getByRole("heading", { name: heading })).toBeVisible({ timeout: 60_000 });
  expect(await page.evaluate(() => (window as unknown as { heroesDesktop: { platform: string } }).heroesDesktop.platform)).toBe("portable");
  await page.goto(`${ORIGIN}/settings/`);
  await page.getByRole("radio", { name: "١ ٢ ٣" }).click();
  await expect.poll(() => (fs.existsSync(path.join(dir, "backups")) ? fs.readdirSync(path.join(dir, "backups")).length : 0), { timeout: 20_000 }).toBeGreaterThan(0);
  await page.goto(`${ORIGIN}/play/?id=builtin_space_1_math`);
  await page.getByRole("button", { name: "ابدأ اللعب" }).click();
  await expect(page.getByTestId("space-stage")).toBeVisible();
  await app.close();

  app = await _electron.launch({ executablePath: exe!, env });
  page = await app.firstWindow();
  await expect(page.getByRole("heading", { name: heading })).toBeVisible({ timeout: 60_000 });
  await page.goto(`${ORIGIN}/settings/`);
  await expect(page.getByRole("radio", { name: "١ ٢ ٣" })).toHaveAttribute("aria-checked", "true"); // the setting survived the restart
  await app.close();
});

test("installed app: data goes to %APPDATA%\\HeroesWorld", async () => {
  const exe = process.env.HEROES_INSTALLED_EXE;
  test.skip(!exe, "set HEROES_INSTALLED_EXE after installing HeroesWorld-Setup.exe");
  const { HEROES_DATA_DIR: _a, HEROES_PORTABLE: _b, PORTABLE_EXECUTABLE_DIR: _c, ...env } = process.env;
  const app = await _electron.launch({ executablePath: exe!, env: env as Record<string, string> });
  const page = await app.firstWindow();
  await expect(page.getByRole("heading", { name: heading })).toBeVisible({ timeout: 60_000 });
  const info = await page.evaluate(() => (window as unknown as { heroesDesktop: { platform: string; dataDir: string } }).heroesDesktop);
  expect(info.platform).toBe("desktop");
  expect(info.dataDir.toLowerCase()).toBe(path.join(process.env.APPDATA ?? "", "HeroesWorld").toLowerCase());
  await expect.poll(() => fs.existsSync(path.join(info.dataDir, "backups")), { timeout: 20_000 }).toBe(true);
  await app.close();
});
