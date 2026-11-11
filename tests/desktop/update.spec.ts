/*
 * The real update path on Windows (run by .github/workflows/windows-release.yml):
 * the released installer is installed, the teacher's data is created, the app
 * updates itself from a local feed holding the next version, and the data must
 * still be there afterwards.
 *   HEROES_INSTALLED_EXE  installed HeroesWorld.exe
 *   HEROES_UPDATE_URL     http://127.0.0.1:<port>/ serving latest.yml + the new installer
 *   HEROES_NEXT_VERSION   the version the feed offers
 *   HEROES_UPDATE_PHASE   "before" (create data, update) or "after" (check the data)
 */
import fs from "node:fs";
import path from "node:path";
import { _electron, expect, test, type Page } from "@playwright/test";

const ORIGIN = "app://heroes";
const exe = process.env.HEROES_INSTALLED_EXE;
const phase = process.env.HEROES_UPDATE_PHASE;
const next = process.env.HEROES_NEXT_VERSION ?? "";
const SAMPLE = path.join(__dirname, "../fixtures/curriculum-sample.json");
const GAME = "لعبة المعلم قبل التحديث";
const QUESTION = "سؤال عدّله المعلم قبل التحديث";

function cleanEnv(extra: Record<string, string> = {}) {
  const { HEROES_DATA_DIR: _a, HEROES_PORTABLE: _b, PORTABLE_EXECUTABLE_DIR: _c, ...env } = process.env;
  return { ...(env as Record<string, string>), ...extra };
}

async function open(extra: Record<string, string> = {}) {
  const app = await _electron.launch({ executablePath: exe!, env: cleanEnv(extra) });
  const page = await app.firstWindow();
  await expect(page.getByRole("heading", { name: "مرحبًا بك في عالم الأبطال!" })).toBeVisible({ timeout: 60_000 });
  return { app, page };
}

const state = (page: Page) => page.getByTestId("update-status");

test("update from the installed version keeps all teacher data", async () => {
  test.skip(!exe || phase !== "before", "Windows CI: HEROES_INSTALLED_EXE and HEROES_UPDATE_PHASE=before");
  test.setTimeout(600_000);
  const { app, page } = await open({ HEROES_UPDATE_URL: process.env.HEROES_UPDATE_URL! });

  // 1. A saved game.
  await page.goto(`${ORIGIN}/create/?from=builtin_quiz_1_math`);
  await page.getByRole("button", { name: "الدرس" }).first().click();
  await page.getByPlaceholder("مثال: سباق الجمع الكبير").fill(GAME);
  await page.getByRole("button", { name: /الحفظ والتشغيل/ }).click();
  await page.getByRole("button", { name: "حفظ والعودة" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/create"));
  // 2. An edited bank question (a textbook one).
  await page.goto(`${ORIGIN}/bank/?grade=1&subject=math&lessonId=imp_jo-g1-math-s1-2026__u3-l1`);
  await page.getByRole("button", { name: "تعديل السؤال" }).first().click();
  await page.getByPlaceholder("اكتب السؤال هنا...").fill(QUESTION);
  await page.getByRole("button", { name: "حفظ السؤال" }).click();
  await expect(page.getByText(QUESTION)).toBeVisible();
  // 3. A customised lesson (copy of a ready lesson).
  await page.goto(`${ORIGIN}/lessons/edit/?id=plan_imp_jo-g1-math-s1-2026__u4-l1`);
  await page.getByRole("button", { name: "زيادة دقيقة" }).click();
  await expect(page).toHaveURL(/id=ls_/);
  // 4. An imported curriculum.
  await page.goto(`${ORIGIN}/import/`);
  await page.getByTestId("curriculum-input").setInputFiles(SAMPLE);
  await page.getByRole("button", { name: "استيراد", exact: true }).click();
  await expect(page.getByText(/تم استيراد المنهج/)).toBeVisible();
  // 5. A setting.
  await page.goto(`${ORIGIN}/settings/`);
  await page.getByRole("radio", { name: "١ ٢ ٣" }).click();

  // The update: check → available → download with progress → confirm → restart.
  await expect(page.getByTestId("update-version")).toContainText(JSON.parse(fs.readFileSync(path.join(__dirname, "../../package.json"), "utf8")).version);
  await page.evaluate(() => {
    const w = window as unknown as { __updateStates: string[]; heroesDesktop: { updates: { onStatus: (f: (s: { state: string; percent?: number }) => void) => void } } };
    w.__updateStates = [];
    w.heroesDesktop.updates.onStatus((s) => w.__updateStates.push(`${s.state}:${s.percent ?? ""}`));
  });
  await page.getByRole("button", { name: "فحص التحديثات الآن" }).click();
  await expect(state(page)).toHaveAttribute("data-state", "available", { timeout: 60_000 });
  await expect(state(page)).toContainText(next);
  await page.getByRole("button", { name: "تنزيل التحديث" }).click();
  await expect(state(page)).toHaveAttribute("data-state", "downloaded", { timeout: 300_000 });
  const seen = await page.evaluate(() => (window as unknown as { __updateStates: string[] }).__updateStates);
  expect(seen.some((s) => s.startsWith("downloading:"))).toBe(true);
  await page.goto(`${ORIGIN}/`);
  await expect(page.getByTestId("update-notice")).toContainText(next); // the dashboard shows it too
  await page.goto(`${ORIGIN}/settings/`);
  await page.getByRole("button", { name: "إعادة التشغيل وتثبيت التحديث" }).click();
  await expect(page.getByRole("dialog")).toContainText("لن يُحذف شيء");
  const closed = app.waitForEvent("close", { timeout: 120_000 });
  await page.getByRole("button", { name: "أعد التشغيل وثبّت" }).click();
  await closed;
});

test("after the update: new version, same data, a backup made before the new version opened it", async () => {
  test.skip(!exe || phase !== "after", "Windows CI: HEROES_INSTALLED_EXE and HEROES_UPDATE_PHASE=after");
  const { app, page } = await open();
  await page.goto(`${ORIGIN}/settings/`);
  await expect(page.getByTestId("update-version")).toContainText(next);
  await expect(page.getByRole("radio", { name: "١ ٢ ٣" })).toHaveAttribute("aria-checked", "true");
  await page.goto(`${ORIGIN}/my-games/`);
  await expect(page.getByText(GAME)).toBeVisible();
  await page.goto(`${ORIGIN}/bank/?grade=1&subject=math&lessonId=imp_jo-g1-math-s1-2026__u3-l1`);
  await expect(page.getByText(QUESTION)).toBeVisible();
  await page.goto(`${ORIGIN}/lessons/`);
  await expect(page.getByText("(نسختي)")).toBeVisible();
  await page.goto(`${ORIGIN}/import/`);
  await expect(page.getByTestId("imported-list")).toContainText("منهج تجريبي");
  const dataDir = path.join(process.env.APPDATA ?? "", "HeroesWorld");
  const before = fs.readdirSync(path.join(dataDir, "backups")).filter((f) => f.startsWith(`before-${next}-from-`));
  expect(before.length).toBe(1);
  expect(fs.existsSync(path.join(dataDir, "backups", before[0], "IndexedDB"))).toBe(true);
  await app.close();
});

test("update server unreachable: a clear message, and the app keeps working", async () => {
  test.skip(!exe || phase !== "after", "Windows CI: HEROES_INSTALLED_EXE and HEROES_UPDATE_PHASE=after");
  const { app, page } = await open({ HEROES_UPDATE_URL: "http://127.0.0.1:9/" });
  await page.goto(`${ORIGIN}/settings/`);
  await page.getByRole("button", { name: "فحص التحديثات الآن" }).click();
  await expect(state(page)).toHaveAttribute("data-state", /unreachable|offline/, { timeout: 60_000 });
  await expect(state(page)).toContainText(/تعذّر الوصول إلى خادم التحديثات|لا يوجد اتصال بالإنترنت/);
  await page.goto(`${ORIGIN}/lesson-run/?id=plan_imp_jo-g1-arabic-s1-2026__u1-l6`);
  await page.getByRole("button", { name: "ابدأ الحصة الآن" }).click();
  await expect(page.getByTestId("warmup-prompt")).toBeVisible({ timeout: 15_000 });
  await app.close();
});
