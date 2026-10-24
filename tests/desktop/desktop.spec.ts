import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { _electron, chromium, expect, test, type ElectronApplication, type Page } from "@playwright/test";

const ROOT = path.resolve(__dirname, "../..");
const ORIGIN = "app://heroes";
const electronPath = require(path.join(ROOT, "node_modules/electron")) as unknown as string;

async function launch(dataDir: string, portable = true) {
  const app = await _electron.launch({
    executablePath: electronPath,
    // Linux CI has no GPU: draw WebGL in software, as the web tests do.
    args: [ROOT, "--no-sandbox", "--use-angle=swiftshader"],
    env: { ...process.env, HEROES_DATA_DIR: dataDir, HEROES_PORTABLE: portable ? "1" : "0" },
  });
  const page = await app.firstWindow();
  await expect(page.getByRole("heading", { name: "مرحبًا بك في عالم الأبطال!" })).toBeVisible();
  return { app, page };
}

const tmp = (name: string) => fs.mkdtempSync(path.join(os.tmpdir(), `heroes-${name}-`));
const snapshots = (dir: string) => (fs.existsSync(path.join(dir, "backups")) ? fs.readdirSync(path.join(dir, "backups")).filter((f) => /^heroes-world-auto-\d+\.json$/.test(f)).sort() : []);

/** Saves a ready-made game into «ألعابي» under a new title (same steps as a teacher). */
async function makeGame(page: Page, title: string, origin = ORIGIN) {
  await page.goto(`${origin}/create/?from=builtin_quiz_1_math`);
  await page.getByRole("button", { name: "الدرس" }).first().click();
  await page.getByPlaceholder("مثال: سباق الجمع الكبير").fill(title);
  await page.getByRole("button", { name: /الحفظ والتشغيل/ }).click();
  await page.getByRole("button", { name: "حفظ والعودة" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/create"));
  await page.goto(`${origin}/my-games/`);
  await expect(page.getByText(title)).toBeVisible();
}

/** Answers the native "Save as" dialog with a fixed path. */
async function answerSaveDialog(app: ElectronApplication, filePath: string) {
  await app.evaluate(({ dialog }, fp) => {
    dialog.showSaveDialog = (async () => ({ canceled: false, filePath: fp })) as typeof dialog.showSaveDialog;
  }, filePath);
}

test.describe("Windows app shell (Electron)", () => {
  test("portable: offline app, data folder next to the program, persistence across restarts", async () => {
    const dir = tmp("portable");
    let { app, page } = await launch(dir);
    expect(page.url()).toBe(`${ORIGIN}/`);
    const bridge = await page.evaluate(() => ({ ...window.heroesDesktop, saveFile: undefined }));
    expect(bridge).toMatchObject({ platform: "portable", dataDir: dir, writable: true });
    // Chromium's own storage is inside the data folder, not the user profile.
    expect(fs.existsSync(path.join(dir, "app"))).toBe(true);

    // Nothing leaves the computer.
    const online = await page.evaluate(() => fetch("https://example.com").then(() => "reached", () => "blocked"));
    expect(online).toBe("blocked");

    await page.goto(`${ORIGIN}/settings/`);
    await expect(page.getByTestId("platform-info")).toContainText("النسخة المحمولة (USB)");
    await expect(page.getByTestId("platform-info")).toContainText(dir);

    await makeGame(page, "لعبة على الذاكرة");
    await app.close();

    ({ app, page } = await launch(dir));
    await page.goto(`${ORIGIN}/my-games/`);
    await expect(page.getByText("لعبة على الذاكرة")).toBeVisible();
    await app.close();
  });

  test("automatic snapshots: written after changes, capped, and offered back when storage is lost", async () => {
    const dir = tmp("snap");
    let { app, page } = await launch(dir);
    await makeGame(page, "لعبة محفوظة تلقائيًا");
    await expect.poll(() => snapshots(dir).length, { timeout: 10_000 }).toBeGreaterThan(0);
    const latest = JSON.parse(fs.readFileSync(path.join(dir, "backups", snapshots(dir).at(-1)!), "utf8"));
    expect(latest).toMatchObject({ app: "heroes-world", kind: "backup", version: 2, platform: "portable" });
    expect(latest.games.map((g: { title: string }) => g.title)).toContain("لعبة محفوظة تلقائيًا");

    // Many changes keep only the latest 10 snapshots.
    await page.goto(`${ORIGIN}/settings/`);
    for (let k = 0; k < 12; k++) {
      await page.getByRole("radio", { name: k % 2 ? "1 2 3" : "١ ٢ ٣" }).click();
      await page.waitForTimeout(1700);
    }
    expect(snapshots(dir).length).toBeLessThanOrEqual(10);
    await app.close();

    // The browser storage is wiped (or damaged): the snapshot brings the data back.
    fs.rmSync(path.join(dir, "app"), { recursive: true, force: true });
    ({ app, page } = await launch(dir));
    await expect(page.getByTestId("snapshot-offer")).toBeVisible();
    await page.getByRole("button", { name: "استعادة بياناتي" }).click();
    await expect(page.getByText(/تمت الاستعادة: 1 لعبة/)).toBeVisible();
    await page.goto(`${ORIGIN}/my-games/`);
    await expect(page.getByText("لعبة محفوظة تلقائيًا")).toBeVisible();
    await app.close();
  });

  test("backups move between the desktop and web versions in both directions", async () => {
    // A web server with the same static release, and a normal browser.
    const port = 3170;
    const server: ChildProcess = spawn(process.execPath, [path.join(ROOT, "scripts/serve-static.mjs"), path.join(ROOT, "out"), String(port)], { stdio: "ignore" });
    const preinstalled = "/opt/pw-browsers/chromium";
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? (fs.existsSync(preinstalled) ? preinstalled : undefined) });
    try {
      const web = await (await browser.newContext({ acceptDownloads: true })).newPage();
      const webOrigin = `http://localhost:${port}`;
      await expect.poll(async () => (await fetch(webOrigin).catch(() => null))?.status ?? 0).toBe(200);
      await web.goto(`${webOrigin}/`);
      await makeGame(web, "لعبة من الويب", webOrigin);
      await web.goto(`${webOrigin}/settings/`);
      const [download] = await Promise.all([web.waitForEvent("download"), web.getByRole("button", { name: "تصدير نسخة احتياطية" }).click()]);
      const webFile = path.join(tmp("web"), download.suggestedFilename());
      await download.saveAs(webFile);

      // web → desktop (installed)
      const dir = tmp("installed");
      const { app, page } = await launch(dir, false);
      await page.goto(`${ORIGIN}/settings/`);
      await expect(page.getByTestId("platform-info")).toContainText("نسخة ويندوز المثبّتة");
      await page.getByTestId("restore-input").setInputFiles(webFile);
      await expect(page.getByText(/تمت الاستعادة: 1 لعبة/)).toBeVisible();
      await makeGame(page, "لعبة من ويندوز");

      // desktop → web, through the native "Save as" dialog
      const deskFile = path.join(tmp("desk"), "from-desktop.json");
      await answerSaveDialog(app, deskFile);
      await page.goto(`${ORIGIN}/settings/`);
      await page.getByRole("button", { name: "تصدير نسخة احتياطية" }).click();
      await expect.poll(() => fs.existsSync(deskFile)).toBe(true);
      expect(JSON.parse(fs.readFileSync(deskFile, "utf8"))).toMatchObject({ kind: "backup", platform: "desktop" });
      await app.close();

      const web2 = await (await browser.newContext()).newPage();
      await web2.goto(`${webOrigin}/settings/`);
      await web2.getByTestId("restore-input").setInputFiles(deskFile);
      await expect(web2.getByText(/تمت الاستعادة: 2 لعبة/)).toBeVisible();
      await web2.goto(`${webOrigin}/my-games/`);
      await expect(web2.getByText("لعبة من ويندوز")).toBeVisible();
      await expect(web2.getByText("لعبة من الويب")).toBeVisible();
    } finally {
      await browser.close();
      server.kill();
    }
  });

  test("a data folder that cannot be written is reported to the teacher", async () => {
    const parent = tmp("ro");
    const blocker = path.join(parent, "not-a-folder");
    fs.writeFileSync(blocker, "x"); // a file where the data folder should be: nothing can be created inside it
    const { app, page } = await launch(path.join(blocker, "HeroesWorld-Data"));
    expect(await page.evaluate(() => window.heroesDesktop!.writable)).toBe(false);
    await page.goto(`${ORIGIN}/settings/`);
    await expect(page.getByText("لا يمكن الكتابة في هذا المجلد")).toBeVisible();
    await app.close();
  });

  test("games run in the app: Smart Race split screen, Phaser balloons, 3D space, memory", async () => {
    const { app, page } = await launch(tmp("games"));
    // Smart Race: two independent lanes with a shared timer.
    await page.goto(`${ORIGIN}/play/?id=builtin_race_1_math`);
    await page.getByRole("button", { name: "ابدأ اللعب" }).click();
    await page.getByRole("radio", { name: "دقيقة واحدة" }).click();
    await page.getByRole("button", { name: "ابدأ السباق" }).click();
    await expect(page.getByTestId("race-choice-red").first()).toBeEnabled({ timeout: 10_000 });
    await expect(page.getByTestId("race-choice-blue").first()).toBeEnabled();
    const timer = page.getByTestId("race-timer");
    const t0 = await timer.textContent();
    // Red answers; blue's question and buttons are untouched (independent controls).
    const blueQ = await page.getByTestId("race-question-blue").textContent();
    await page.getByTestId("race-choice-red").first().dispatchEvent("pointerdown");
    await expect(page.getByTestId("race-question-blue")).toHaveText(blueQ!);
    await expect(page.getByTestId("race-choice-blue").first()).toBeEnabled();
    await page.getByTestId("race-choice-blue").first().dispatchEvent("pointerdown");
    // One shared timer keeps running for both teams.
    await expect.poll(() => timer.textContent(), { timeout: 5000 }).not.toBe(t0);
    expect(await page.getByTestId("race-progress-red").getAttribute("data-steps")).not.toBeNull();
    expect(await page.getByTestId("race-progress-blue").getAttribute("data-steps")).not.toBeNull();

    await page.goto(`${ORIGIN}/play/?id=builtin_balloons_1_math`);
    await page.getByRole("button", { name: "ابدأ اللعب" }).click();
    await expect(page.getByTestId("balloon-stage").locator("canvas")).toBeVisible({ timeout: 20_000 });

    await page.goto(`${ORIGIN}/play/?id=builtin_space_1_science`);
    await page.getByRole("button", { name: "ابدأ اللعب" }).click();
    await expect(page.getByTestId("space-stage").locator("canvas")).toBeVisible({ timeout: 20_000 });

    await page.goto(`${ORIGIN}/play/?id=builtin_memory_1_arabic`);
    await page.getByRole("button", { name: "ابدأ اللعب" }).click();
    await expect(page.getByTestId("memory-card")).toHaveCount(16);
    // F11 toggles fullscreen for the smartboard.
    await page.keyboard.press("F11");
    await expect.poll(() => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isFullScreen())).toBe(true);
    await page.keyboard.press("F11");
    await app.close();
  });
});

declare global {
  interface Window {
    heroesDesktop?: import("../../src/lib/platform").DesktopBridge;
  }
}
