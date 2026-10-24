import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { freshStart } from "./helpers";

const SAMPLE = path.join(__dirname, "../fixtures/curriculum-sample.json");

test.describe("📚 استيراد منهج", () => {
  test("upload → validate → edit preview → import → lessons with playable games; no duplicates; undo", async ({ page }) => {
    await freshStart(page);
    await page.getByRole("link", { name: "📚 استيراد منهج" }).first().click();
    await expect(page.getByRole("heading", { name: "📚 استيراد منهج" })).toBeVisible();
    await page.getByTestId("curriculum-input").setInputFiles(SAMPLE);

    await expect(page.getByTestId("import-title")).toHaveText("منهج تجريبي — اللغة العربية للصف الثاني");
    await expect(page.getByTestId("import-summary")).toContainText("2 درسًا");
    await expect(page.getByTestId("import-summary")).toContainText("3 من الكتاب، 3 مولّدة");

    // Edit in the preview: a lesson title, a question, and switch a game on.
    const l1 = page.getByTestId("import-lesson-u1-l1");
    await l1.getByLabel("عنوان الدرس").fill("الأضداد (معدّل)");
    await l1.getByRole("button", { name: "فتح الدرس" }).click();
    await expect(l1.getByTestId("import-question")).toHaveCount(4);
    await expect(l1.getByText("📘 من الكتاب ص8").first()).toBeVisible();
    await expect(l1.getByText("✨ مولّد — راجعه").first()).toBeVisible();
    await l1.getByLabel("نص السؤال").first().fill("ما عكس كلمة «كبير»؟");
    await l1.getByTestId("import-games").getByRole("button", { name: "عجلة الأبطال" }).click();
    await expect(page.getByTestId("import-summary")).toContainText("4 لعبة");

    // A wrong edit blocks the import until it is fixed.
    await l1.getByLabel("نص السؤال").first().fill("");
    await expect(page.getByRole("button", { name: "استيراد", exact: true })).toBeDisabled();
    await expect(page.getByTestId("import-issues")).toContainText("نص السؤال فارغ");
    await l1.getByLabel("نص السؤال").first().fill("ما عكس كلمة «كبير»؟");

    await page.getByRole("button", { name: "استيراد", exact: true }).click();
    await expect(page.getByText(/تم استيراد المنهج: 2 درسًا و6 سؤالًا و4 لعبة/)).toBeVisible();
    await expect(page.getByTestId("imported-list")).toContainText("منهج تجريبي");

    // The same file again is refused.
    await page.getByTestId("curriculum-input").setInputFiles(SAMPLE);
    await expect(page.getByTestId("import-duplicate")).toBeVisible();
    await expect(page.getByRole("button", { name: "استيراد", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "إلغاء", exact: true }).click();

    // Curriculum page: grade 2 Arabic now has the imported book with its lessons and games.
    await page.getByRole("link", { name: "عرض في المنهاج" }).click();
    await expect(page.getByText("الوحدة التجريبية الأولى")).toBeVisible();
    await page.getByText("الوحدة التجريبية الأولى").click();
    await page.getByRole("button", { name: /الأضداد \(معدّل\)/ }).click();
    const lesson = page.locator("[data-testid^='lesson-imp_sample-g2-arabic']").first();
    await expect(lesson.getByRole("link", { name: "العب الآن" })).toHaveCount(3);

    // A generated game plays the lesson's questions.
    await lesson.getByRole("link", { name: "العب الآن" }).first().click();
    await page.getByRole("button", { name: "ابدأ اللعب" }).click();
    await expect(page.getByTestId("classroom")).toBeVisible();
    await expect(page.getByText(/ما عكس كلمة «كبير»؟|ما عكس «حار»؟|عكس «طويل»|فوق|تحت/).first()).toBeVisible({ timeout: 15_000 });

    // The questions are in the bank, marked by origin; existing sample questions are untouched.
    await page.goto("/bank/");
    await expect(page.getByText("ما عكس كلمة «كبير»؟")).toBeVisible();

    // Undo the import.
    await page.goto("/import/");
    await page.getByRole("button", { name: "حذف المنهج المستورد" }).click();
    await page.getByRole("button", { name: "حذف", exact: true }).click();
    await expect(page.getByText("لم يُستورد أي منهج بعد")).toBeVisible();
    await page.goto("/bank/");
    await expect(page.getByText("ما عكس كلمة «كبير»؟")).toHaveCount(0);
  });

  test("a file with errors is explained and not imported", async ({ page }) => {
    await freshStart(page);
    // (an ASCII path: Chromium's file upload stumbles on the emoji in this test's output folder name)
    const bad = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "heroes-")), "bad.json");
    fs.writeFileSync(bad, JSON.stringify({ app: "heroes-world", kind: "curriculum", version: 1, curriculum: { id: "x", title: "x", grade: 7, subject: "math", textbook: { title: "x" }, units: [] } }));
    await page.getByRole("link", { name: "📚 استيراد منهج" }).first().click(); // in-app navigation: the page is interactive
    await expect(page.getByRole("heading", { name: "📚 استيراد منهج" })).toBeVisible();
    await page.getByTestId("curriculum-input").setInputFiles(bad);
    await expect(page.getByTestId("import-issues")).toContainText("الصف يجب أن يكون 1 أو 2 أو 3");
    await expect(page.getByRole("button", { name: "استيراد", exact: true })).toHaveCount(0);
  });
});
