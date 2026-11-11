import fs from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { freshStart } from "./helpers";

/** Copies a ready-made game into «ألعابي» through the wizard and returns its title. */
async function makeGame(page: Page, title: string) {
  await page.goto("/create?from=builtin_quiz_1_math");
  await page.getByRole("button", { name: /^3\s*الدرس$|الدرس/ }).first().click();
  await page.getByPlaceholder("مثال: سباق الجمع الكبير").fill(title);
  await page.getByRole("button", { name: /الحفظ والتشغيل/ }).click();
  await page.getByRole("button", { name: "حفظ والعودة" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/create"));
  await page.goto("/my-games");
  await expect(page.getByText(title)).toBeVisible();
}

async function exportBackup(page: Page) {
  await page.goto("/settings");
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "تصدير نسخة احتياطية" }).click()]);
  expect(download.suggestedFilename()).toMatch(/^heroes-world-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const file = await download.path();
  return { file: file!, json: JSON.parse(fs.readFileSync(file!, "utf8")) };
}

test.describe("web release", () => {
  test("teacher data persists across reloads and browser restarts of the page", async ({ page }) => {
    await freshStart(page);
    await makeGame(page, "لعبة تبقى محفوظة");
    await page.reload();
    await expect(page.getByText("لعبة تبقى محفوظة")).toBeVisible();
    await page.goto("about:blank");
    await page.goto("/my-games");
    await expect(page.getByText("لعبة تبقى محفوظة")).toBeVisible();
  });

  test("backup v2: export, wipe, restore (merge), then replace with a safety copy", async ({ page }) => {
    await freshStart(page);
    await makeGame(page, "لعبة النسخة الاحتياطية");
    await page.goto("/settings");
    await page.getByRole("radio", { name: "١ ٢ ٣" }).click(); // a setting that travels with the backup
    const { file, json } = await exportBackup(page);
    expect(json).toMatchObject({ app: "heroes-world", kind: "backup", version: 2, platform: "web" });
    expect(json.games.map((g: { title: string }) => g.title)).toContain("لعبة النسخة الاحتياطية");
    expect(json.settings.numerals).toBe("hindi");
    await expect(page.getByTestId("platform-info")).toContainText("نسخة الويب");

    // A new browser profile (or another computer): restore into empty storage.
    await freshStart(page);
    await page.goto("/settings");
    await page.getByTestId("restore-input").setInputFiles(file);
    await expect(page.getByText(/تمت الاستعادة: 1 لعبة/)).toBeVisible();
    await page.goto("/my-games");
    await expect(page.getByText("لعبة النسخة الاحتياطية")).toBeVisible();

    // Replace: the current data is saved first, then replaced.
    await makeGame(page, "لعبة ستُستبدل");
    await page.goto("/settings");
    await page.getByRole("radio", { name: /استبدال بياناتي/ }).click();
    const [safety] = await Promise.all([page.waitForEvent("download"), page.getByTestId("restore-input").setInputFiles(file)]);
    expect(safety.suggestedFilename()).toMatch(/^heroes-world-before-restore-/);
    const safetyJson = JSON.parse(fs.readFileSync((await safety.path())!, "utf8"));
    expect(safetyJson.games.map((g: { title: string }) => g.title)).toContain("لعبة ستُستبدل");
    await expect(page.getByText(/تمت الاستعادة/)).toBeVisible();
    await page.goto("/my-games");
    await expect(page.getByText("لعبة النسخة الاحتياطية")).toBeVisible();
    await expect(page.getByText("لعبة ستُستبدل")).toHaveCount(0);
  });

  test("a single game file is refused as a backup with a helpful message", async ({ page }, info) => {
    await freshStart(page);
    const f = info.outputPath("game.json");
    fs.writeFileSync(f, JSON.stringify({ app: "heroes-world", kind: "game", version: 1, game: {} }));
    await page.goto("/settings");
    await page.getByTestId("restore-input").setInputFiles(f);
    await expect(page.getByText(/ملف لعبة أو أسئلة أو حصة مفردة/)).toBeVisible();
  });

  test("works offline after the first visit (service worker)", async ({ page, context }) => {
    await freshStart(page);
    await page.evaluate(() => localStorage.setItem("heroes-offline-cache", "on"));
    await page.reload();
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload(); // now controlled by the service worker
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    // wait until the whole release is cached
    await expect.poll(() => page.evaluate(async () => (await caches.keys()).some((k) => k.startsWith("heroes-world-")) && (await (await caches.open((await caches.keys())[0])).keys()).length > 100), { timeout: 30_000 }).toBe(true);

    await context.setOffline(true);
    await page.goto("/library/");
    await expect(page.getByRole("heading", { name: "مكتبة الألعاب" })).toBeVisible();
    await page.goto("/play/?id=builtin_quiz_2_science");
    await page.getByRole("button", { name: "ابدأ اللعب" }).click();
    await expect(page.getByTestId("classroom")).toBeVisible();
    // the 3D games' code is cached too
    await page.goto("/play/?id=builtin_space_1_arabic");
    await page.getByRole("button", { name: "ابدأ اللعب" }).click();
    await expect(page.getByTestId("space-stage").locator("canvas")).toBeVisible({ timeout: 20_000 });
    await context.setOffline(false);
  });

  test("a PC without WebGL still plays the 3D games (the picture is replaced by a note)", async ({ page }) => {
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        return /webgl/i.test(type) ? null : (orig as (...a: unknown[]) => unknown).call(this, type, ...rest);
      } as typeof orig;
    });
    await freshStart(page);
    await page.goto("/play/?id=builtin_rocket_1_math");
    await page.getByRole("button", { name: "ابدأ اللعب" }).click();
    await expect(page.getByTestId("no-webgl")).toBeVisible();
    await expect(page.getByTestId("math-choice").first()).toBeVisible();
    await expect(page.getByTestId("math-progress")).toHaveText(/^1 \/ /);
  });

  test("responsive on tablet and phone widths @screens", async ({ page }) => {
    await freshStart(page);
    for (const path of ["/", "/library/", "/settings/", "/create/"]) {
      await page.goto(path);
      await page.waitForTimeout(500);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, path).toBeLessThanOrEqual(1);
    }
  });
});
