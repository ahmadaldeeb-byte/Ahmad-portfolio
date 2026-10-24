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

test.describe("first real textbook lesson: Grade 1 math, unit 2, lesson 4 «مقارنة الأعداد»", () => {
  const REAL = path.join(__dirname, "../../curricula/grade1-math-comparing-numbers.json");

  test("preview, import into a fresh profile, play the three games, reject a second import, keep existing data", async ({ page }) => {
    await freshStart(page);
    // Existing teacher data that must survive the import.
    await page.goto("/create?from=builtin_quiz_1_math");
    await page.getByRole("button", { name: "الدرس" }).first().click();
    await page.getByPlaceholder("مثال: سباق الجمع الكبير").fill("لعبة المعلم الموجودة");
    await page.getByRole("button", { name: /الحفظ والتشغيل/ }).click();
    await page.getByRole("button", { name: "حفظ والعودة" }).click();
    await page.waitForURL((u) => !u.pathname.startsWith("/create"));

    await page.getByRole("link", { name: "📚 استيراد منهج" }).first().click();
    await expect(page.getByRole("heading", { name: "📚 استيراد منهج" })).toBeVisible();
    await page.getByTestId("curriculum-input").setInputFiles(REAL);
    await expect(page.getByTestId("import-summary")).toContainText("15 سؤالًا (10 من الكتاب، 5 مولّدة) • 3 لعبة");
    await expect(page.getByLabel("عنوان الوحدة 2")).toHaveValue("مُقارَنَةُ الْأَعْدادِ وَتَرْتيبُها");
    const lesson = page.getByTestId("import-lesson-u2-l4");
    await expect(lesson.getByLabel("عنوان الدرس")).toHaveValue("مُقارَنَةُ الْأَعْدادِ");
    await lesson.getByRole("button", { name: "فتح الدرس" }).click();
    await expect(lesson.getByTestId("import-question")).toHaveCount(15);
    await expect(lesson.getByText(/📘 من الكتاب ص5[01]/)).toHaveCount(10);
    await expect(lesson.getByText("✨ مولّد — راجعه")).toHaveCount(5);
    for (const name of ["من بطل المعرفة؟", "بالونات المعرفة", "سباق الأذكياء"]) await expect(lesson.getByRole("button", { name, pressed: true })).toBeVisible();

    await page.getByRole("button", { name: "استيراد", exact: true }).click();
    await expect(page.getByText(/تم استيراد المنهج: 1 درسًا و15 سؤالًا و3 لعبة/)).toBeVisible();
    await page.getByTestId("curriculum-input").setInputFiles(REAL);
    await expect(page.getByTestId("import-duplicate")).toBeVisible();
    await page.getByRole("button", { name: "إلغاء", exact: true }).click();

    // The lesson in «المنهاج والدروس» with its three games.
    await page.getByRole("link", { name: "عرض في المنهاج" }).click();
    await page.getByText("مُقارَنَةُ الْأَعْدادِ وَتَرْتيبُها").click();
    await page.getByRole("button", { name: "مُقارَنَةُ الْأَعْدادِ", exact: true }).click();
    const games = page.locator("[data-testid='lesson-imp_jo-g1-math-s1-2026__u2-l4']").getByRole("link", { name: "العب الآن" });
    await expect(games).toHaveCount(3);
    const hrefs = await games.evaluateAll((els) => els.map((e) => e.getAttribute("href")!));

    // Quiz: a comparison question shows left-to-right and the right symbol is accepted.
    await page.goto(hrefs.find((h) => h.includes("__quiz"))!);
    await page.getByRole("button", { name: "ابدأ اللعب" }).click();
    await expect(page.getByText("سهل (11)")).toBeVisible(); // difficulties from the file
    await page.getByRole("button", { name: "انطلق!" }).click();
    const prompt = page.getByTestId("question-prompt");
    await expect(prompt).toBeVisible({ timeout: 15_000 });
    if (/^\s*\d+ ؟ \d+\s*$/.test((await prompt.textContent())!)) await expect(prompt).toHaveAttribute("dir", "ltr");
    // Balloons (Phaser) and the split-screen race start with the lesson's questions.
    await page.goto(hrefs.find((h) => h.includes("__balloons"))!);
    await page.getByRole("button", { name: "ابدأ اللعب" }).click();
    await expect(page.getByTestId("balloon-stage").locator("canvas")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("balloon-question")).toBeVisible();
    await page.goto(hrefs.find((h) => h.includes("__race"))!);
    await page.getByRole("button", { name: "ابدأ اللعب" }).click();
    await page.getByRole("radio", { name: "دقيقة واحدة" }).click();
    await page.getByRole("button", { name: "ابدأ السباق" }).click();
    await expect(page.getByTestId("race-question-red")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("race-question-blue")).toBeVisible();

    // Existing teacher data is untouched.
    await page.goto("/my-games/");
    await expect(page.getByText("لعبة المعلم الموجودة")).toBeVisible();
  });
});

test("full Grade 1 math book (semester 1): replaces the first test import, 17 lessons with playable games", async ({ page }) => {
  const TEST = path.join(__dirname, "../../curricula/grade1-math-comparing-numbers.json");
  const FULL = path.join(__dirname, "../../curricula/jo-g1-math-s1-2026.json");
  await freshStart(page);
  await page.getByRole("link", { name: "📚 استيراد منهج" }).first().click();
  await expect(page.getByRole("heading", { name: "📚 استيراد منهج" })).toBeVisible();
  await page.getByTestId("curriculum-input").setInputFiles(TEST);
  await page.getByRole("button", { name: "استيراد", exact: true }).click();
  await expect(page.getByText(/تم استيراد المنهج/)).toBeVisible();

  // Same book: refused until the test import is removed.
  await page.getByTestId("curriculum-input").setInputFiles(FULL);
  await expect(page.getByTestId("import-summary")).toContainText("144 سؤالًا (104 من الكتاب، 40 مولّدة) • 35 لعبة");
  await expect(page.getByTestId("import-duplicate")).toBeVisible();
  await page.getByRole("button", { name: "إلغاء", exact: true }).click();
  await page.getByRole("button", { name: "حذف المنهج المستورد" }).click();
  await page.getByRole("button", { name: "حذف", exact: true }).click();
  await page.getByTestId("curriculum-input").setInputFiles(FULL);
  await page.getByRole("button", { name: "استيراد", exact: true }).click();
  await expect(page.getByText(/تم استيراد المنهج: 17 درسًا و144 سؤالًا و35 لعبة/)).toBeVisible();

  // Grade 1 math now offers the built-in index and the imported book.
  await page.getByRole("link", { name: "عرض في المنهاج" }).click();
  await page.getByText("الْأَعْدادُ ضِمْنَ مَنْزِلَتَيْنِ").click();
  await page.getByRole("button", { name: "الْعَشَراتُ", exact: true }).click();
  const lesson = page.locator("[data-testid='lesson-imp_jo-g1-math-s1-2026__u1-l1']");
  await expect(lesson.getByRole("link", { name: "العب الآن" })).toHaveCount(2);
  // The factory game (generated tasks) and the number train (numbers up to 99) start.
  const href = (await lesson.getByRole("link", { name: "العب الآن" }).first().getAttribute("href"))!;
  await page.goto(href);
  await page.getByRole("button", { name: "ابدأ اللعب" }).click();
  await expect(page.getByTestId("factory")).toBeVisible({ timeout: 15_000 });
  await page.goto("/play/?id=imp_jo-g1-math-s1-2026__u2-l3__train");
  await page.getByRole("button", { name: "ابدأ اللعب" }).click();
  await expect(page.getByTestId("classroom")).toBeVisible();
});
