import { expect, test, type Page } from "@playwright/test";
import { freshStart } from "./helpers";

const MATH_UNITS = ["الْوَحْدَةُ التَّمْهيدِيَّةُ: الْأَعْدادُ حَتّى 10", "الْأَعْدادُ ضِمْنَ مَنْزِلَتَيْنِ", "مُقارَنَةُ الْأَعْدادِ وَتَرْتيبُها", "الْجَمْعُ", "الطَّرْحُ", "مُعالَجَةُ الْبَياناتِ"];

async function openLesson(page: Page, subject: "math" | "arabic", unit: string, lesson: string) {
  await page.goto(`/curriculum/?grade=1&subject=${subject}`);
  await page.getByText(unit, { exact: true }).click();
  await page.getByRole("button", { name: lesson, exact: true }).click();
  return page.getByTestId("lesson-panel");
}

/** Answers every question of a warm-up or challenge (any choice reveals the right one). */
async function answerAll(page: Page, kind: "warmup" | "challenge") {
  for (let i = 0; i < 10; i++) {
    await page.getByTestId(`${kind}-choice`).first().click();
    const next = page.getByRole("button", { name: /السؤال التالي|انتهى التمهيد|إعلان النتيجة/ });
    const label = await next.textContent();
    await next.click();
    if (!/السؤال التالي/.test(label ?? "")) return;
  }
}

test("Grade 1 math semester 1: all units of the book with their lessons, explanation, games and a ready lesson that runs", async ({ page }) => {
  await freshStart(page);
  await page.goto("/curriculum/?grade=1&subject=math");
  for (const u of MATH_UNITS) await expect(page.getByText(u, { exact: true })).toBeVisible();
  await expect(page.getByTestId("curriculum-source")).toContainText("متحقَّق منه");

  const panel = await openLesson(page, "math", "الْجَمْعُ", "مُكَوِّناتُ الْعَدَدِ 10");
  await expect(panel.getByTestId("lesson-guide")).toContainText("الأهداف التعليمية");
  await expect(panel.getByTestId("lesson-guide")).toContainText("صفحات الكتاب 64–65");
  await panel.getByRole("tab", { name: "🎮 الألعاب الجاهزة" }).click();
  await expect(panel.getByRole("link", { name: "العب الآن" })).toHaveCount(2);
  await panel.getByRole("tab", { name: "✏️ تعديل المحتوى" }).click();
  await expect(panel.getByTestId("lesson-edit")).toContainText("أسئلة الدرس في بنك الأسئلة: 12");
  await panel.getByRole("tab", { name: "✨ الحصة الجاهزة" }).click();
  await panel.getByRole("link", { name: "تشغيل الحصة" }).click();

  // The ready lesson: warm-up → main game → closing challenge → summary.
  await page.getByRole("button", { name: "ابدأ الحصة الآن" }).click();
  await expect(page.getByTestId("warmup-instructions")).toBeVisible({ timeout: 10_000 });
  await answerAll(page, "warmup");
  await expect(page.getByTestId("stage-done")).toBeVisible();
  await page.getByRole("button", { name: "الانتقال للمرحلة التالية" }).click();
  await expect(page.getByTestId("stage-intro")).toHaveText("اللعبة الرئيسية");
  await page.getByRole("button", { name: "المرحلة التالية" }).click();
  await expect(page.getByTestId("challenge")).toBeVisible({ timeout: 10_000 });
  await answerAll(page, "challenge");
  await expect(page.getByTestId("challenge-results")).toContainText("الإجابات الصحيحة");
  await page.getByRole("button", { name: "إنهاء التحدي" }).click();
  await page.getByTestId("stage-done").getByRole("button", { name: "إنهاء الحصة" }).click();
  await expect(page.getByTestId("lesson-summary")).toBeVisible();
});

test("the main game of a ready lesson is the lesson's ready game", async ({ page }) => {
  await freshStart(page);
  await page.goto("/lesson-run/?id=plan_imp_jo-g1-arabic-s1-2026__u1-l6&stage=1");
  await page.getByRole("button", { name: "ابدأ الحصة الآن" }).click();
  // Word maker with the lesson's words (letters to put in order).
  await expect(page.locator("[data-testid=words-tile]").first()).toBeVisible({ timeout: 15_000 });
});

test("editing a ready lesson saves the teacher's own copy; the original stays; the copy reopens after a reload", async ({ page }) => {
  await freshStart(page);
  await page.goto("/lessons/edit/?id=plan_imp_jo-g1-math-s1-2026__u4-l1");
  await expect(page.getByTestId("builtin-plan-note")).toBeVisible();
  await expect(page.getByTestId("seg-minutes-warmup")).toHaveText("3 د");
  await page.getByRole("button", { name: "زيادة دقيقة" }).click();
  await expect(page).toHaveURL(/lessons\/edit\/\?id=ls_/);
  await expect(page.getByTestId("builtin-plan-note")).toHaveCount(0);
  await expect(page.getByTestId("seg-minutes-warmup")).toHaveText("4 د");
  // Change the main game and a challenge question, then reload.
  await page.getByRole("tab", { name: /التحدي الختامي/ }).click();
  await page.getByLabel("نص السؤال 1").fill("سؤال المعلم: 9 - 4 = ؟");
  await page.getByRole("tab", { name: /اللعبة الرئيسية/ }).click();
  await page.getByRole("button", { name: /من بطل المعرفة؟/ }).click();
  await page.waitForTimeout(900);
  const url = page.url();
  await page.reload();
  await expect(page.getByTestId("seg-minutes-warmup")).toHaveText("4 د");
  await page.getByRole("tab", { name: /التحدي الختامي/ }).click();
  await expect(page.getByLabel("نص السؤال 1")).toHaveValue("سؤال المعلم: 9 - 4 = ؟");

  // The original is unchanged; the copy is in «تحضير الحصص» and in the lesson's ready-lesson tab.
  await page.goto("/lessons/edit/?id=plan_imp_jo-g1-math-s1-2026__u4-l1");
  await expect(page.getByTestId("seg-minutes-warmup")).toHaveText("3 د");
  await page.goto("/lessons/");
  await expect(page.getByText("حصة: الطرح باستعمال خط الأعداد (نسختي)")).toBeVisible();
  const panel = await openLesson(page, "math", "الطَّرْحُ", "الطَّرْحُ بِاسْتِعْمالِ خَطِّ الْأَعْدادِ");
  await panel.getByRole("tab", { name: "✨ الحصة الجاهزة" }).click();
  await panel.getByRole("link", { name: "فتح" }).click();
  await expect(page).toHaveURL(url);
});

test("«حضّر حصتك» finds the ready lesson of every textbook lesson (Arabic)", async ({ page }) => {
  await freshStart(page);
  await page.goto("/lessons/new/");
  await page.getByRole("button", { name: "الصف الأول", exact: true }).click();
  await page.getByRole("button", { name: /اللغة العربية/ }).click();
  await page.getByRole("button", { name: "الفصل الأول" }).click();
  await page.getByRole("button", { name: /الْوَحْدَةُ الثّانِيَةُ/ }).click();
  await page.getByRole("button", { name: /تَنْوينُ الضَّمِّ/ }).click();
  const ready = page.getByTestId("ready-plan");
  await expect(ready).toContainText("المدة: 15 دقيقة");
  await ready.getByRole("link", { name: "ابدأ الحصة الآن" }).click();
  await page.getByRole("button", { name: "ابدأ الحصة الآن" }).click();
  await expect(page.getByTestId("warmup-prompt")).toBeVisible({ timeout: 10_000 });
});

test("the textbook content is there after reloads, without duplicates, and the bank shows each lesson's questions with their source", async ({ page }) => {
  await freshStart(page);
  await page.goto("/bank/?grade=1&subject=math&lessonId=imp_jo-g1-math-s1-2026__u5-l2");
  await expect(page.getByText("11 سؤالًا")).toBeVisible();
  await expect(page.getByText("📘 من الكتاب ص95").first()).toBeVisible();
  await expect(page.getByText("✨ مولّد").first()).toBeVisible();
  await page.goto("/bank/");
  const total = await page.getByText(/^\d+ سؤالًا$/).textContent();
  for (let i = 0; i < 2; i++) {
    await page.reload();
    await expect(page.getByText(/^\d+ سؤالًا$/)).toHaveText(total!);
  }
  await page.goto("/curriculum/?grade=1&subject=arabic");
  await expect(page.getByText("الْوَحْدَةُ الْخامِسَةُ: لُعْبَتي الْمُفَضَّلَةُ")).toBeVisible();
});
