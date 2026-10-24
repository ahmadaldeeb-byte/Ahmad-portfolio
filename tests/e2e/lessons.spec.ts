import { expect, test, type Page } from "@playwright/test";
import { freshStart } from "./helpers";

/** Reads the train strip (reading order) and returns the first missing number. */
async function stripAnswer(page: Page, selector: string) {
  const cells = (await page.locator(selector).allTextContents()).map((t) => t.trim());
  const i = cells.indexOf("؟");
  const n = cells.map(Number);
  return String(i > 0 && !Number.isNaN(n[i - 1]) ? n[i - 1] + 1 : n[i + 1] - 1);
}
const trainAnswer = (page: Page) => stripAnswer(page, '[aria-label="عربات القطار"] [data-testid^="train-"]');

async function answerTrain(page: Page, count: number, opts: { wrongFirst?: boolean; dragSecond?: boolean } = {}) {
  for (let i = 0; i < count; i++) {
    await expect(page.getByTestId("train-progress")).toHaveText(`${i + 1} / ${count}`, { timeout: 15_000 });
    await expect(page.getByTestId("train-tile").first()).toBeEnabled({ timeout: 15_000 });
    const ans = await trainAnswer(page);
    const tiles = page.getByTestId("train-tile");
    if (i === 0 && opts.wrongFirst) {
      const wrong = tiles.filter({ hasNotText: new RegExp(`^${ans}$`) });
      await wrong.first().click();
      await expect(page.getByText("حاول مرة أخرى!").first()).toBeVisible();
      await wrong.nth(1).click();
      await expect(page.getByTestId("train-hint")).toBeVisible(); // hint offered after two tries
    }
    const tile = tiles.filter({ hasText: new RegExp(`^${ans}$`) });
    if (i === 1 && opts.dragSecond) {
      const from = (await tile.boundingBox())!;
      const to = (await page.getByTestId("train-slot").first().boundingBox())!;
      await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
      await page.mouse.down();
      await page.mouse.move(from.x + 40, from.y - 40, { steps: 5 });
      await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
      await page.mouse.up();
    } else await tile.click();
    await expect(page.getByTestId("train-slot").first()).toHaveText(ans);
  }
}

test.describe("curriculum & number train", () => {
  test("curriculum index: source status, lessons, linked games, title correction", async ({ page }) => {
    await freshStart(page);
    await page.goto("/curriculum");
    await expect(page.getByTestId("curriculum-source")).toContainText("فهرس مؤقت غير متحقَّق منه");
    await page.getByRole("button", { name: /مُقارَنَةُ الْأَعْدادِ وَتَرْتيبُها/ }).click();
    const lesson = page.getByTestId("lesson-g1m-u3-l3");
    await lesson.getByRole("button", { name: /السّابِقُ/ }).click();
    await expect(lesson.getByRole("heading", { name: /قطار الأرقام/ })).toBeVisible();
    await expect(lesson.getByRole("button", { name: "حضّر حصة لهذا الدرس" })).toBeVisible();
    // Comparing numbers now links the playable crocodile game.
    await page.getByTestId("lesson-g1m-u3-l4").getByRole("button").first().click();
    await expect(page.getByTestId("lesson-g1m-u3-l4").getByRole("heading", { name: /التمساح الجائع/ })).toBeVisible();
    await expect(page.getByTestId("lesson-g1m-u3-l4")).not.toContainText("قيد التطوير");
    // Teacher corrects a title; it persists after reload.
    await lesson.getByRole("button", { name: "تعديل عنوان الدرس" }).click();
    await page.getByRole("textbox", { name: "عنوان الدرس" }).fill("العدد السابق والعدد التالي");
    await page.getByRole("button", { name: "حفظ", exact: true }).click();
    await expect(lesson).toContainText("عدّله المعلم");
    await page.reload();
    await page.getByRole("button", { name: /مُقارَنَةُ الْأَعْدادِ وَتَرْتيبُها/ }).click();
    await expect(page.getByTestId("lesson-g1m-u3-l3")).toContainText("عدّله المعلم");
  });

  test("number train: wrong try without deduction, hint, drag & drop, tap, results", async ({ page }) => {
    await freshStart(page);
    await page.goto("/create?from=builtin_train_1_math");
    await page.getByRole("radio", { name: "السابق فقط" }).click();
    await page.getByRole("radio", { name: "5", exact: true }).click();
    await page.getByRole("button", { name: /الحفظ والتشغيل/ }).click();
    await page.getByRole("button", { name: "ابدأ اللعب" }).click();
    await page.waitForURL(/\/play\/?\?id=/);
    await page.getByRole("button", { name: "ابدأ اللعب" }).click();
    await expect(page.getByTestId("train-station")).toContainText("محطة السابق");
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("train-prompt")).toHaveText(/^ما العدد السابق للعدد \d+؟$/);
    await answerTrain(page, 5, { wrongFirst: true, dragSecond: true });
    const results = page.getByTestId("results");
    await expect(results).toBeVisible({ timeout: 15_000 });
    await expect(results).toContainText("45"); // 5 (after a mistake, no deduction) + 4 × 10
    await expect(results).toContainText("80٪");
  });
});

test.describe("lesson preparation", () => {
  test("prepare, edit, save and run a full 15-minute lesson", async ({ page }) => {
    test.setTimeout(240_000);
    await freshStart(page);
    await page.getByRole("link", { name: "حضّر حصتك الآن ✨" }).first().click();
    await page.getByRole("button", { name: "الصف الأول" }).click();
    await page.getByRole("button", { name: "الرياضيات" }).click();
    await page.getByRole("button", { name: "الفصل الأول" }).click();
    await page.getByRole("button", { name: /مُقارَنَةُ الْأَعْدادِ/ }).click();
    await page.getByRole("button", { name: /السّابِقُ وَالْعَدَدُ التّالي/ }).click();
    await page.getByRole("button", { name: "إنشاء الحصة" }).click();
    await page.waitForURL(/\/lessons\/edit\/?\?id=/);
    await expect(page.getByTestId("lesson-total")).toHaveText("15 دقيقة");
    await expect(page.getByTestId("seg-minutes-warmup")).toHaveText("3 د");
    await expect(page.getByTestId("seg-minutes-main")).toHaveText("7 د");
    await expect(page.getByTestId("seg-minutes-challenge")).toHaveText("5 د");
    // Edit durations
    await page.getByRole("button", { name: "زيادة دقيقة" }).click();
    await expect(page.getByTestId("lesson-total")).toHaveText("16 دقيقة");
    await page.getByRole("button", { name: "إنقاص دقيقة" }).click();
    await expect(page.getByTestId("lesson-total")).toHaveText("15 دقيقة");
    // Challenge between two teams
    await page.getByRole("tab", { name: /التحدي الختامي/ }).click();
    await expect(page.getByTestId("challenge-question-row")).toHaveCount(5);
    await page.getByRole("radio", { name: "فريقان" }).click();
    await expect(page.getByText("محفوظة تلقائيًا")).toBeVisible();
    // Saved and listed after reload
    await page.goto("/lessons");
    await page.reload();
    await expect(page.getByRole("heading", { name: /حصة: العدد السابق/ })).toBeVisible();
    await page.getByRole("link", { name: "ابدأ الحصة" }).click();

    // Runner
    await page.getByRole("button", { name: "ابدأ الحصة الآن" }).click();
    await expect(page.getByTestId("stage-intro").last()).toHaveText("التمهيد");
    await expect(page.getByTestId("stage-timer")).toBeVisible();
    // 1) Warm-up: three questions on the number line
    for (let i = 0; i < 3; i++) {
      const prompt = (await page.getByTestId("warmup-prompt").textContent())!;
      const n = Number(/(\d+)/.exec(prompt)![1]);
      const ans = String(prompt.includes("قبل") ? n - 1 : n + 1);
      await page.getByTestId("warmup-choice").filter({ hasText: new RegExp(`^${ans}$`) }).click();
      await page.getByRole("button", { name: i < 2 ? "السؤال التالي" : "أحسنتم! انتهى التمهيد" }).click();
    }
    await expect(page.getByTestId("stage-done")).toBeVisible();
    // Pause / resume freezes the clock
    await page.getByRole("button", { name: "إيقاف مؤقت" }).click();
    await expect(page.getByText("الحصة متوقفة مؤقتًا")).toBeVisible();
    await page.getByRole("button", { name: "متابعة" }).click();
    await page.getByTestId("stage-done").getByRole("button", { name: "الانتقال للمرحلة التالية" }).click();
    // 2) Main game: number train, six questions
    await expect(page.getByTestId("stage-intro").last()).toHaveText("اللعبة الرئيسية");
    await answerTrainLesson(page, 6);
    await expect(page.getByTestId("stage-done")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("stage-done").getByRole("button", { name: "الانتقال للمرحلة التالية" }).click();
    // 3) Closing challenge between two teams
    await expect(page.getByTestId("stage-intro").last()).toHaveText("التحدي الختامي");
    for (let i = 0; i < 5; i++) {
      const ans = await stripAnswer(page, '[data-testid="challenge-car"]');
      const choice = page.getByTestId("challenge-choice");
      if (i === 2) await choice.filter({ hasNotText: new RegExp(`^${ans}$`) }).first().click(); // one mistake
      else await choice.filter({ hasText: new RegExp(`^${ans}$`) }).click();
      await page.getByRole("button", { name: i < 4 ? "السؤال التالي" : "إعلان النتيجة" }).click();
    }
    await expect(page.getByTestId("challenge-results")).toContainText(/فاز الفريق|تعادل/);
    await expect(page.getByTestId("skills-review")).toContainText("العدد الناقص");
    await page.getByRole("button", { name: "إنهاء التحدي" }).click();
    await page.getByTestId("stage-done").getByRole("button", { name: "إنهاء الحصة" }).click();
    await expect(page.getByTestId("lesson-summary")).toContainText("أحسنتم يا أبطال!");
    await expect(page.getByTestId("lesson-summary")).toContainText("مهارات تحتاج إلى مراجعة");
    // Results recorded
    await page.getByRole("button", { name: "تحضير الحصص" }).click();
    await page.goto("/results");
    await expect(page.getByText(/التحدي الختامي/).first()).toBeVisible();
  });

  test("teacher can move on mid-activity; duplicate and delete lessons", async ({ page }) => {
    await freshStart(page);
    await page.goto("/lessons/new?lesson=g1m-u3-l3");
    await page.getByRole("button", { name: "إنشاء الحصة" }).click();
    await page.waitForURL(/\/lessons\/edit/);
    await page.getByRole("button", { name: "ابدأ الحصة الآن" }).click();
    await page.waitForURL(/\/lesson-run/);
    await page.getByRole("button", { name: "ابدأ الحصة الآن" }).click();
    await expect(page.getByTestId("warmup")).toBeVisible();
    await page.getByRole("button", { name: "الانتقال للمرحلة التالية" }).click(); // floating button (large screens)
    await expect(page.getByTestId("stage-intro").last()).toHaveText("اللعبة الرئيسية");
    await page.getByRole("button", { name: "المرحلة السابقة" }).click();
    await expect(page.getByTestId("stage-intro").last()).toHaveText("التمهيد");
    await page.getByRole("button", { name: "المرحلة التالية", exact: true }).click(); // toolbar button
    await expect(page.getByTestId("stage-intro").last()).toHaveText("اللعبة الرئيسية");
    await page.getByRole("button", { name: "المرحلة السابقة" }).click();
    await expect(page.getByTestId("stage-intro").last()).toHaveText("التمهيد");
    await page.getByRole("button", { name: "إنهاء الحصة" }).click();
    await expect(page.getByTestId("lesson-summary")).toContainText("لم يكتمل");
    await page.goto("/lessons");
    await page.getByRole("button", { name: "نسخ الحصة" }).click();
    await expect(page.locator("li h3")).toHaveCount(2);
    await page.getByRole("button", { name: "حذف الحصة" }).first().click();
    await page.getByRole("dialog").getByRole("button", { name: "حذف" }).click();
    await expect(page.locator("li h3")).toHaveCount(1);
  });
});

async function answerTrainLesson(page: Page, count: number) {
  for (let i = 0; i < count; i++) {
    await expect(page.getByTestId("train-progress")).toHaveText(`${i + 1} / ${count}`, { timeout: 15_000 });
    await expect(page.getByTestId("train-tile").first()).toBeEnabled({ timeout: 15_000 });
    const ans = await trainAnswer(page);
    await page.getByTestId("train-tile").filter({ hasText: new RegExp(`^${ans}$`) }).click();
  }
}
