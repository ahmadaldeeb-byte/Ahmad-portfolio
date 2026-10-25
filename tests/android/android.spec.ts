/*
 * The real Android app on an emulator (run by .github/workflows/android-beta.yml):
 * the debug APK built with HEROES_ANDROID_DEBUG=1 is installed, the network is
 * switched off, and the app's WebView is driven through Playwright's Android
 * support. Screenshots go to test-results/android/.
 */
import fs from "node:fs";
import { _android, expect, test, type AndroidDevice, type Page } from "@playwright/test";

const PKG = "edu.heroesworld.app";
const ORIGIN = "https://localhost";
const SHOTS = "test-results/android";
let device: AndroidDevice;

/** A fresh start of the app (closed first, so every test begins on the home page). */
async function open(): Promise<Page> {
  await device.shell(`am force-stop ${PKG}`);
  await new Promise((r) => setTimeout(r, 1000));
  await device.shell(`am start -n ${PKG}/.MainActivity`);
  const webview = await device.webView({ pkg: PKG }, { timeout: 60_000 });
  const page = await webview.page();
  await expect(page.getByRole("heading", { name: "مرحبًا بك في عالم الأبطال!" })).toBeVisible({ timeout: 60_000 });
  return page;
}

const restart = open;

/** Nothing sticks out sideways (no horizontal scrolling). */
async function fits(page: Page, what: string) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(over, `${what}: page wider than the screen`).toBeLessThanOrEqual(1);
}

async function shot(page: Page, name: string) {
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
}

async function rotate(landscape: boolean) {
  await device.shell("settings put system accelerometer_rotation 0");
  await device.shell(`settings put system user_rotation ${landscape ? 1 : 0}`);
  await new Promise((r) => setTimeout(r, 2500));
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  [device] = await _android.devices();
  expect(device, "an Android emulator or device").toBeTruthy();
  // No internet: the app must work fully offline.
  await device.shell("svc wifi disable");
  await device.shell("svc data disable");
  await rotate(false);
});

test.afterAll(async () => {
  await device?.shell("wm size reset");
  await device?.shell("wm density reset");
  await device?.close();
});

test("starts offline as the Android app, Arabic RTL, fits the phone screen", async () => {
  const page = await open();
  expect(await page.evaluate(() => document.documentElement.dir)).toBe("rtl");
  expect(page.url().startsWith(ORIGIN)).toBe(true);
  await fits(page, "home");
  await shot(page, "phone-home");
  await page.getByRole("link", { name: "الإعدادات" }).first().click();
  await expect(page.getByTestId("platform-info")).toContainText("تطبيق أندرويد");
  await expect(page.getByText("حذف التطبيق يحذفها")).toBeVisible();
});

test("curricula: math and Arabic units and lessons, explanation, games, ready lesson", async () => {
  const page = await open();
  await page.getByRole("link", { name: "المنهاج والدروس" }).first().click();
  for (const u of ["الْجَمْعُ", "الطَّرْحُ", "مُعالَجَةُ الْبَياناتِ"]) await expect(page.getByText(u, { exact: true })).toBeVisible();
  await page.getByText("الْجَمْعُ", { exact: true }).click();
  await page.getByRole("button", { name: "مُكَوِّناتُ الْعَدَدِ 10", exact: true }).click();
  await expect(page.getByTestId("lesson-guide")).toContainText("الأهداف التعليمية");
  await fits(page, "curriculum");
  await shot(page, "phone-curriculum");
  await page.getByRole("tab", { name: "✨ الحصة الجاهزة" }).click();
  await page.getByRole("link", { name: "تشغيل الحصة" }).click();
  await page.getByRole("button", { name: "ابدأ الحصة الآن" }).click();
  await expect(page.getByTestId("warmup-prompt")).toBeVisible({ timeout: 20_000 });
  await fits(page, "lesson run");
  await shot(page, "phone-lesson");
  // Arabic book.
  await page.goBack();
  await page.goto(`${ORIGIN}/`);
  await page.getByRole("link", { name: "المنهاج والدروس" }).first().click();
  await page.getByRole("radio", { name: "اللغة العربية" }).click();
  await expect(page.getByText("الْوَحْدَةُ الْخامِسَةُ: لُعْبَتي الْمُفَضَّلَةُ")).toBeVisible();
});

test("the Android back button goes back inside the app", async () => {
  const page = await open();
  await page.getByRole("link", { name: "المنهاج والدروس" }).first().click();
  await expect(page).toHaveURL(/curriculum/);
  await device.shell("input keyevent KEYCODE_BACK");
  await expect(page.getByRole("heading", { name: "مرحبًا بك في عالم الأبطال!" })).toBeVisible();
  expect((await device.shell("dumpsys window")).toString()).toContain(PKG);
});

test("games play with touch; the race asks to turn the phone, and fits in landscape", async () => {
  const page = await open();
  await page.goto(`${ORIGIN}/play/?id=builtin_quiz_1_math`);
  await page.getByRole("button", { name: "ابدأ اللعب" }).tap();
  await page.getByRole("button", { name: "انطلق!" }).tap();
  await expect(page.getByTestId("question-prompt")).toBeVisible({ timeout: 20_000 });
  await fits(page, "quiz");
  await shot(page, "phone-quiz");

  await page.goto(`${ORIGIN}/play/?id=builtin_race_1_math`);
  await expect(page.getByTestId("rotate-hint")).toBeVisible();
  await rotate(true);
  await expect(page.getByTestId("rotate-hint")).toBeHidden();
  await page.getByRole("button", { name: "ابدأ اللعب" }).tap();
  await page.getByRole("radio", { name: "دقيقة واحدة" }).tap();
  await page.getByRole("button", { name: "ابدأ السباق" }).tap();
  await expect(page.getByTestId("race-choice-red").first()).toBeEnabled({ timeout: 30_000 });
  await fits(page, "race landscape");
  await shot(page, "phone-landscape-race");
  await rotate(false);
});

test("teacher data: a saved game, an edited question and a customised lesson survive a restart", async () => {
  let page = await open();
  await page.goto(`${ORIGIN}/create/?from=builtin_quiz_1_math`);
  await page.getByRole("button", { name: "الدرس" }).first().tap();
  await page.getByPlaceholder("مثال: سباق الجمع الكبير").fill("لعبة على أندرويد");
  await page.getByRole("button", { name: /الحفظ والتشغيل/ }).tap();
  await page.getByRole("button", { name: "حفظ والعودة" }).tap();
  await page.waitForURL((u) => !u.pathname.startsWith("/create"));
  await page.goto(`${ORIGIN}/bank/?grade=1&subject=math&lessonId=imp_jo-g1-math-s1-2026__u3-l1`);
  await page.getByRole("button", { name: "تعديل السؤال" }).first().tap();
  await page.getByPlaceholder("اكتب السؤال هنا...").fill("سؤال عدّلته على أندرويد");
  await page.getByRole("button", { name: "حفظ السؤال" }).tap();
  await expect(page.getByText("سؤال عدّلته على أندرويد")).toBeVisible();
  await page.goto(`${ORIGIN}/lessons/edit/?id=plan_imp_jo-g1-math-s1-2026__u4-l1`);
  await page.getByRole("button", { name: "زيادة دقيقة" }).tap();
  await expect(page).toHaveURL(/id=ls_/);

  page = await restart();
  await page.goto(`${ORIGIN}/my-games/`);
  await expect(page.getByText("لعبة على أندرويد")).toBeVisible();
  await page.goto(`${ORIGIN}/bank/?grade=1&subject=math&lessonId=imp_jo-g1-math-s1-2026__u3-l1`);
  await expect(page.getByText("سؤال عدّلته على أندرويد")).toBeVisible();
  await page.goto(`${ORIGIN}/lessons/`);
  await expect(page.getByText("(نسختي)")).toBeVisible();
});

test("backup export opens the Android share sheet", async () => {
  const page = await open();
  await page.goto(`${ORIGIN}/settings/`);
  await page.getByRole("button", { name: "تصدير نسخة احتياطية" }).tap();
  await expect.poll(async () => (await device.shell("dumpsys activity activities")).toString().match(/Chooser|Resolver|Sharesheet/i) !== null, { timeout: 20_000 }).toBe(true);
  await device.shell("input keyevent KEYCODE_BACK");
});

test("tablet size: dashboard, curriculum and a game fit", async () => {
  await device.shell("wm size 1600x2560");
  await device.shell("wm density 320");
  const page = await restart();
  await fits(page, "tablet home");
  await shot(page, "tablet-home");
  await page.getByRole("link", { name: "المنهاج والدروس" }).first().click();
  await fits(page, "tablet curriculum");
  await page.goto(`${ORIGIN}/play/?id=builtin_balloons_1_math`);
  await page.getByRole("button", { name: "ابدأ اللعب" }).tap();
  await expect(page.getByTestId("balloon-stage").locator("canvas")).toBeVisible({ timeout: 30_000 });
  await fits(page, "tablet balloons");
  await shot(page, "tablet-balloons");
  await device.shell("wm size reset");
  await device.shell("wm density reset");
});
