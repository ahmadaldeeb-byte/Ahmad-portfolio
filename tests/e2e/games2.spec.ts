import { expect, test } from "@playwright/test";
import { createArithmeticGame, freshStart, solve } from "./helpers";

const PRAISE = /^(أحسنت!|إجابة رائعة!|أنت بطل!|ممتاز!|رائع جدًا!|لقد نجحت!|سرقة ناجحة!)$/;

async function prompt(page: import("@playwright/test").Page) {
  return (await page.getByTestId("question-prompt").textContent())!;
}

test.describe("phase 4 games", () => {
  test("quiz: progress, speed bonus, results and retry", async ({ page }) => {
    await freshStart(page);
    await createArithmeticGame(page, { type: "من بطل المعرفة؟", title: "مسابقة تجريبية", exprs: ["1 + 1", "2 + 2", "3 + 3"] });
    await page.getByRole("button", { name: "ابدأ اللعب" }).click();
    let prev = "";
    for (let i = 0; i < 3; i++) {
      await expect(page.getByTestId("quiz-progress")).toHaveText(`السؤال ${i + 1} من 3`);
      // Wait for the previous question's exit animation to finish.
      await expect(page.getByTestId("question-prompt")).toHaveCount(1);
      await expect(page.getByTestId("question-prompt")).not.toHaveText(prev);
      prev = await prompt(page);
      await page.getByRole("button", { name: solve(prev), exact: true }).click();
      await expect(page.getByText(PRAISE).first()).toBeVisible();
      await page.getByRole("button", { name: i < 2 ? "السؤال التالي" : "النتائج" }).click();
    }
    const results = page.getByTestId("results");
    await expect(results).toBeVisible();
    await expect(results).toContainText("100٪");
    // 3 × (10 + speed bonus of nearly 5) → more than 30 points
    const score = Number((await results.locator("span.tabular-nums").first().textContent())!.trim());
    expect(score).toBeGreaterThan(30);
    expect(score).toBeLessThanOrEqual(45);
    await page.getByRole("button", { name: "العب مرة أخرى" }).click();
    await expect(page.getByTestId("quiz-progress")).toHaveText("السؤال 1 من 3");
  });

  test("quiz: difficulty level picker filters questions", async ({ page }) => {
    await freshStart(page);
    await page.goto("/play?id=builtin_quiz_1_math");
    await page.getByRole("button", { name: "ابدأ اللعب" }).click();
    await expect(page.getByText("اختر مستوى الصعوبة")).toBeVisible();
    await page.getByRole("radio", { name: /^متوسط/ }).click();
    await page.getByRole("button", { name: "انطلق!" }).click();
    await expect(page.getByTestId("quiz-progress")).toHaveText(/السؤال 1 من 3/);
  });

  test("team battle: turns, steal for half points, winner", async ({ page }) => {
    await freshStart(page);
    await createArithmeticGame(page, { type: "معركة الأبطال", title: "معركة تجريبية", exprs: ["1 + 1", "2 + 2", "3 + 3", "4 + 4"] });
    await page.getByRole("button", { name: "ابدأ اللعب" }).click();
    const red = page.getByTestId("team-0");
    const blue = page.getByTestId("team-1");

    // Q1: red answers wrong, blue steals (+5)
    await expect(red).toContainText("دوره الآن");
    let ans = solve(await prompt(page));
    await page.getByTestId("choice").filter({ hasNotText: new RegExp(`^${ans}$`) }).first().click();
    await expect(page.getByText("الفرصة للفريق الآخر!")).toBeVisible();
    await expect(blue).toContainText("فرصة سرقة!");
    await page.getByRole("button", { name: ans, exact: true }).click();
    await expect(page.getByText("سرقة ناجحة!")).toBeVisible();
    await expect(blue).toContainText("5");
    await page.getByRole("button", { name: "السؤال التالي" }).click();

    // Q2: blue starts and answers right (+10 → 15)
    await expect(blue).toContainText("دوره الآن");
    await page.getByRole("button", { name: solve(await prompt(page)), exact: true }).click();
    await page.getByRole("button", { name: "السؤال التالي" }).click();

    // Q3: red right (+10)
    await page.getByRole("button", { name: solve(await prompt(page)), exact: true }).click();
    await page.getByRole("button", { name: "السؤال التالي" }).click();

    // Q4: blue wrong, red wrong on the steal
    ans = solve(await prompt(page));
    const wrong = page.getByTestId("choice").filter({ hasNotText: new RegExp(`^${ans}$`) });
    await wrong.first().click();
    await expect(red).toContainText("فرصة سرقة!");
    await expect(page.getByTestId("choice").filter({ hasNotText: new RegExp(`^${ans}$`) }).first()).toBeDisabled();
    await wrong.nth(1).click();
    await page.getByRole("button", { name: "إعلان الفائز" }).click();
    await expect(page.getByTestId("teams-winner")).toHaveText("فاز الفريق الأزرق!");
    await page.getByRole("button", { name: "عرض النتائج" }).click();
    await expect(page.getByTestId("results")).toContainText("فاز الفريق الأزرق!");
  });
});
