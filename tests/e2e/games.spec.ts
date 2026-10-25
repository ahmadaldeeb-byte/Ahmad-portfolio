import { expect, test, type Page } from "@playwright/test";
import { createArithmeticGame, freshStart, solve } from "./helpers";

async function startClassroom(page: Page) {
  await page.getByRole("button", { name: "ابدأ اللعب" }).click();
  await expect(page.getByTestId("classroom")).toBeVisible();
}

test.describe("games", () => {
  test("wheel: fair spin, question, scoring, pause, results", async ({ page }) => {
    await freshStart(page);
    await page.goto("/play?id=builtin_wheel_1_math");
    await startClassroom(page);
    // Fullscreen classroom mode
    await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
    await expect(page.locator("aside")).toHaveCount(0); // dashboard chrome hidden

    const remaining = page.getByText("الأسئلة المتبقية").locator("xpath=following-sibling::p");
    const before = Number(await remaining.textContent());
    await page.getByRole("button", { name: "دوّر العجلة" }).last().click();
    await expect(page.getByText("العجلة تدور...")).toBeVisible();
    await expect(page.getByTestId("wheel-result")).toBeVisible({ timeout: 15_000 });

    // Question overlay opens with the selected question; answer it.
    const overlay = page.getByTestId("question-prompt");
    await expect(overlay).toBeVisible({ timeout: 5000 });
    const prompt = (await overlay.textContent()) ?? "";
    let expected: string | null = null;
    try {
      expected = solve(prompt);
    } catch {
      expected = null; // not an arithmetic question
    }
    if (expected) await page.getByRole("button", { name: expected, exact: true }).click();
    else await page.getByTestId("choice").first().click();
    await expect(page.getByRole("status").filter({ hasText: /!/ })).toBeVisible();
    if (expected) await expect(page.getByText(/^(أحسنت!|إجابة رائعة!|أنت بطل!|ممتاز!|رائع جدًا!|لقد نجحت!|رائع يا بطل!|إجابة صحيحة!)$/)).toBeVisible();

    await page.getByRole("button", { name: "دوّر مرة أخرى" }).click();
    await expect(remaining).toHaveText(String(before - 1)); // used question removed

    // Pause / resume
    await page.getByRole("button", { name: "إيقاف مؤقت" }).click();
    await expect(page.getByText("استراحة قصيرة")).toBeVisible();
    await page.getByRole("button", { name: "متابعة" }).click();
    await expect(page.getByText("استراحة قصيرة")).toBeHidden();

    // Mute from the classroom HUD
    await page.getByRole("button", { name: "كتم الصوت" }).click();
    await expect(page.getByRole("button", { name: "تشغيل الصوت" })).toBeVisible();

    await page.getByRole("button", { name: "إنهاء اللعبة وعرض النتائج" }).click();
    await expect(page.getByTestId("results")).toBeVisible();
    if (expected) await expect(page.getByTestId("results")).toContainText("10");

    // Back to the dashboard leaves fullscreen
    await page.getByRole("button", { name: "لوحة التحكم", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false);
    await page.goto("/results");
    await expect(page.getByText("عجلة الأبطال — الرياضيات").first()).toBeVisible();
  });

  test("wheel with student names", async ({ page }) => {
    await freshStart(page);
    await page.goto("/create?from=builtin_wheel_1_arabic");
    await page.getByRole("button", { name: /الوقت والنقاط/ }).click();
    await page.getByRole("radio", { name: "أسماء الطلاب" }).click();
    await page.getByPlaceholder(/سارة/).fill("سارة\nعمر\nليان");
    await page.getByRole("button", { name: /الحفظ والتشغيل/ }).click();
    await page.getByRole("button", { name: "ابدأ اللعب" }).click();
    await page.waitForURL(/\/play\/?\?id=/);
    await startClassroom(page);
    const picked = new Set<string>();
    for (let i = 0; i < 3; i++) {
      await page.getByRole("button", { name: "دوّر العجلة" }).last().click();
      const r = page.getByTestId("wheel-result");
      await expect(r).toBeVisible({ timeout: 15_000 });
      picked.add((await r.textContent())!);
      await page.getByRole("button", { name: /دوّر مرة أخرى|إنهاء$/ }).first().click();
    }
    expect([...picked].sort()).toEqual(["سارة", "عمر", "ليان"].sort()); // each name exactly once
    await expect(page.getByTestId("results")).toContainText("انتهت الجولة!");
  });

  test("balloons (Phaser): canvas pointer pop, wrong feedback and results", async ({ page }) => {
    await freshStart(page);
    await createArithmeticGame(page, { type: "بالونات المعرفة", title: "بالونات تجريبية", exprs: ["5 + 2", "6 + 3"] });
    await startClassroom(page);
    const stage = page.getByTestId("balloon-stage");
    await expect(stage.locator(":scope > canvas")).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(2200); // balloons float in

    // Q1: click the correct balloon on the canvas itself.
    const prompt1 = (await page.getByTestId("balloon-question").textContent())!;
    const answer1 = solve(prompt1);
    const choices = await page.locator('[aria-label="الإجابات"] button').allTextContents();
    const idx = choices.indexOf(answer1);
    expect(idx).toBeGreaterThanOrEqual(0);
    const box = (await stage.boundingBox())!;
    const n = choices.length;
    const x = box.x + box.width - (box.width / n) * (idx + 0.5);
    const y = box.y + box.height * (n > 2 ? (idx % 2 ? 0.58 : 0.5) : 0.54) - 8;
    await page.mouse.click(x, y);
    await expect(page.getByText(/^(أحسنت!|إجابة رائعة!|أنت بطل!|ممتاز!|رائع جدًا!|لقد نجحت!|رائع يا بطل!|إجابة صحيحة!)$/)).toBeVisible();

    // Q2: pick a wrong answer first (keyboard-accessible buttons), then the right one.
    await expect(page.getByTestId("balloon-question")).not.toHaveText(prompt1, { timeout: 6000 });
    const prompt2 = (await page.getByTestId("balloon-question").textContent())!;
    const answer2 = solve(prompt2);
    const buttons = page.locator('[aria-label="الإجابات"] button');
    const labels = await buttons.allTextContents();
    // Wrong answer via the number keys (1-4)...
    await page.keyboard.press(String(labels.findIndex((t) => t !== answer2) + 1));
    await expect(page.getByText("حاول مرة أخرى!")).toBeVisible();
    // ...then the right one via the focusable accessible button.
    await buttons.filter({ hasText: new RegExp(`^${answer2}$`) }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("results")).toBeVisible({ timeout: 8000 });
    const results = page.getByTestId("results");
    await expect(results).toContainText("15"); // 10 + half points 5
    await expect(results).toContainText("50٪");
  });

  test("restart and exit work from the classroom HUD", async ({ page }) => {
    await freshStart(page);
    await page.goto("/play?id=builtin_balloons_3_math");
    await startClassroom(page);
    await expect(page.getByTestId("balloon-stage").locator(":scope > canvas")).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: "إعادة تشغيل اللعبة" }).click();
    await expect(page.getByTestId("balloon-stage").locator(":scope > canvas")).toHaveCount(1, { timeout: 20_000 });
    await page.getByRole("button", { name: "العودة إلى لوحة التحكم" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("invalid game link shows a friendly message", async ({ page }) => {
    await page.goto("/play?id=nope");
    await expect(page.getByText("لم نعثر على هذه اللعبة")).toBeVisible();
  });
});

test.describe("touch @touch", () => {
  test("balloon pops with a finger tap", async ({ page }) => {
    await freshStart(page);
    await createArithmeticGame(page, { type: "بالونات المعرفة", title: "لمس", exprs: ["1 + 2", "2 + 5"] });
    await page.getByRole("button", { name: "ابدأ اللعب" }).tap();
    const stage = page.getByTestId("balloon-stage");
    await expect(stage.locator(":scope > canvas")).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(2200);
    const answer = solve((await page.getByTestId("balloon-question").textContent())!);
    const choices = await page.locator('[aria-label="الإجابات"] button').allTextContents();
    const idx = choices.indexOf(answer);
    const box = (await stage.boundingBox())!;
    const n = choices.length;
    await page.touchscreen.tap(box.x + box.width - (box.width / n) * (idx + 0.5), box.y + box.height * (n > 2 ? (idx % 2 ? 0.58 : 0.5) : 0.54) - 8);
    await expect(page.getByText(/^(أحسنت!|إجابة رائعة!|أنت بطل!|ممتاز!|رائع جدًا!|لقد نجحت!|رائع يا بطل!|إجابة صحيحة!)$/)).toBeVisible();
  });
});

test.describe("train touch @touch", () => {
  test("number train answers with finger taps", async ({ page }) => {
    await freshStart(page);
    await page.goto("/play?id=builtin_train_1_math");
    await page.getByRole("button", { name: "ابدأ اللعب" }).tap();
    await expect(page.getByTestId("train-tile").first()).toBeEnabled({ timeout: 20_000 });
    const cells = (await page.locator('[aria-label="عربات القطار"] [data-testid^="train-"]').allTextContents()).map((t) => t.trim());
    const i = cells.indexOf("؟");
    const n = cells.map(Number);
    const ans = String(i > 0 && !Number.isNaN(n[i - 1]) ? n[i - 1] + 1 : n[i + 1] - 1);
    await page.getByTestId("train-tile").filter({ hasText: new RegExp(`^${ans}$`) }).tap();
    await expect(page.getByTestId("train-slot").first()).toHaveText(ans);
  });
});

test.describe("screens @screens", () => {
  test("layout fits without horizontal scrolling and targets are touch-sized", async ({ page }) => {
    await freshStart(page);
    for (const path of ["/", "/library", "/create", "/bank", "/settings", "/curriculum", "/lessons", "/lessons/new?lesson=g1m-u3-l3", "/play?id=builtin_race_1_math", "/play?id=builtin_train_1_math", "/play?id=builtin_market_1_math", "/play?id=builtin_clock_1_math"]) {
      await page.goto(path);
      await page.waitForTimeout(500);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(1);
      const small = await page.evaluate(() =>
        [...document.querySelectorAll("button, a")]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            const s = getComputedStyle(el);
            return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && !el.classList.contains("sr-only") && (r.height < 40 || r.width < 40);
          })
          .map((el) => (el.textContent || el.getAttribute("aria-label") || "").trim()),
      );
      expect(small, path).toEqual([]);
    }
  });
});
