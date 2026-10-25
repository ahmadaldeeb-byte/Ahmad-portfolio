import { expect, test, type Page } from "@playwright/test";
import { createArithmeticGame, freshStart, solve } from "./helpers";

type Side = "red" | "blue";
const EXPRS = ["1 + 1", "2 + 2", "3 + 3", "4 + 4", "5 + 1", "6 + 2", "7 + 1", "2 + 5"];

async function setupRace(page: Page, opts: { minutes?: string; custom?: string; steps: string }) {
  await freshStart(page);
  await createArithmeticGame(page, { type: "سباق الأذكياء", title: "سباق الفريقين", exprs: EXPRS });
  await page.getByRole("button", { name: "ابدأ اللعب" }).click();
  await expect(page.getByTestId("race-setup")).toBeVisible();
  if (opts.custom) {
    await page.getByRole("radio", { name: "مدة مخصصة" }).click();
    await page.getByLabel("عدد دقائق السباق").fill(opts.custom);
  } else await page.getByRole("radio", { name: opts.minutes ?? "دقيقة واحدة" }).click();
  await page.getByRole("group", { name: "خط النهاية" }).getByRole("radio", { name: opts.steps, exact: true }).click();
  await page.getByRole("button", { name: "ابدأ السباق" }).click();
  await expect(page.getByTestId("race-countdown")).toBeVisible();
  await expect(page.getByTestId("race-choice-red").first()).toBeEnabled({ timeout: 8000 });
  await expect(page.getByTestId("race-choice-blue").first()).toBeEnabled();
}

const steps = (page: Page, side: Side) => page.getByTestId(`race-progress-${side}`).getAttribute("data-steps").then(Number);

/** The correct choice button for a side (questions are «a + b = ؟»). */
async function correctButton(page: Page, side: Side) {
  const ans = solve((await page.getByTestId(`race-question-${side}`).textContent())!);
  return page.getByTestId(`race-choice-${side}`).filter({ hasText: new RegExp(`^${ans}$`) });
}
async function wrongButton(page: Page, side: Side) {
  const ans = solve((await page.getByTestId(`race-question-${side}`).textContent())!);
  return page.getByTestId(`race-choice-${side}`).filter({ hasNotText: new RegExp(`^${ans}$`) }).first();
}
/** Waits until a side can answer again, then answers. */
async function answer(page: Page, side: Side, right = true) {
  await expect(page.getByTestId(`race-choice-${side}`).first()).toBeEnabled({ timeout: 5000 });
  const btn = right ? await correctButton(page, side) : await wrongButton(page, side);
  await btn.dispatchEvent("pointerdown");
}

test.describe("split-screen smart race", () => {
  test("simultaneous answers, independent sides, wrong answers don't move, red wins at the line", async ({ page }) => {
    await setupRace(page, { minutes: "3 دقائق", steps: "4" });
    await expect(page.getByTestId("race-timer")).toContainText(/2:5\d|3:00/);
    // Red on the right, blue on the left.
    const red = (await page.getByTestId("race-side-red").boundingBox())!;
    const blue = (await page.getByTestId("race-side-blue").boundingBox())!;
    expect(red.x).toBeGreaterThan(blue.x);
    expect(Math.abs(red.width - blue.width)).toBeLessThan(2);
    await expect(page.getByTestId("race-side-red").locator("canvas")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("race-side-blue").locator("canvas")).toBeVisible();

    // Both teams answer in the very same instant.
    const r = await correctButton(page, "red");
    const b = await correctButton(page, "blue");
    const rh = await r.elementHandle();
    const bh = await b.elementHandle();
    await page.evaluate(([x, y]) => {
      for (const el of [x, y]) el!.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" }));
    }, [rh, bh]);
    await expect.poll(() => steps(page, "red")).toBe(1);
    await expect.poll(() => steps(page, "blue")).toBe(1);

    // Blue answers wrong: blue does not move, red keeps playing meanwhile.
    await answer(page, "blue", false);
    await expect(page.getByTestId("race-side-blue")).toContainText("حاول مرة أخرى!");
    await answer(page, "red");
    await expect.poll(() => steps(page, "red")).toBe(2);
    expect(await steps(page, "blue")).toBe(1);

    // Red answers while blue continues.
    await answer(page, "blue");
    await answer(page, "red");
    await answer(page, "red");
    await expect(page.getByTestId("race-winner")).toHaveText("الفريق الأحمر هو البطل!");
    // Frozen: nobody can answer any more.
    await expect(page.getByTestId("race-choice-blue").first()).toBeDisabled();
    const frozenBlue = await steps(page, "blue");
    await page.waitForTimeout(500);
    expect(await steps(page, "blue")).toBe(frozenBlue);
    await page.getByRole("button", { name: "عرض النتائج" }).click();
    await expect(page.getByTestId("results")).toContainText("فاز الفريق الأحمر!");
  });

  test("blue team victory", async ({ page }) => {
    await setupRace(page, { steps: "4" });
    for (let i = 0; i < 4; i++) await answer(page, "blue");
    await expect(page.getByTestId("race-winner")).toHaveText("الفريق الأزرق هو البطل!");
  });

  test("time runs out: draw, and pause freezes the clock", async ({ page }) => {
    test.setTimeout(120_000);
    await setupRace(page, { custom: "0.5", steps: "10" });
    await answer(page, "red");
    await answer(page, "blue");
    await expect.poll(() => steps(page, "blue")).toBe(1);
    // Pause / resume
    await page.getByRole("button", { name: "إيقاف مؤقت" }).click();
    const t1 = await page.getByTestId("race-timer").textContent();
    await page.waitForTimeout(2500);
    expect(await page.getByTestId("race-timer").textContent()).toBe(t1);
    await page.getByRole("button", { name: "متابعة" }).click();
    await expect(page.getByTestId("race-winner")).toHaveText("تعادل بين الفريقين!", { timeout: 40_000 });
  });

  test("time runs out: the team with more progress wins; restart returns to setup", async ({ page }) => {
    test.setTimeout(120_000);
    await setupRace(page, { custom: "0.5", steps: "10" });
    await answer(page, "red");
    await answer(page, "red");
    await answer(page, "blue");
    await expect(page.getByTestId("race-winner")).toHaveText("الفريق الأحمر هو البطل!", { timeout: 40_000 });
    await expect(page.getByTestId("race-winner").locator("xpath=following-sibling::p")).toContainText("انتهى الوقت");
    await page.getByRole("button", { name: "إعادة تشغيل اللعبة" }).click();
    await expect(page.getByTestId("race-setup")).toBeVisible();
  });
});

test.describe("race multi-touch @touch", () => {
  test("two fingers on both sides at once both count", async ({ page }) => {
    await freshStart(page);
    await createArithmeticGame(page, { type: "سباق الأذكياء", title: "لمس", exprs: EXPRS });
    await page.getByRole("button", { name: "ابدأ اللعب" }).tap();
    await page.getByRole("button", { name: "ابدأ السباق" }).tap();
    await expect(page.getByTestId("race-choice-red").first()).toBeEnabled({ timeout: 8000 });
    const r = (await (await correctButton(page, "red")).boundingBox())!;
    const b = (await (await correctButton(page, "blue")).boundingBox())!;
    const cdp = await page.context().newCDPSession(page);
    const points = [
      { x: r.x + r.width / 2, y: r.y + r.height / 2, id: 1 },
      { x: b.x + b.width / 2, y: b.y + b.height / 2, id: 2 },
    ];
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: points });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(() => steps(page, "red")).toBe(1);
    await expect.poll(() => steps(page, "blue")).toBe(1);
  });
});

test.describe("race smartboard @screens", () => {
  test("two equal 3D views fill the screen without overflow", async ({ page }) => {
    await freshStart(page);
    await page.goto("/play?id=builtin_race_1_math");
    await page.getByRole("button", { name: "ابدأ اللعب" }).click();
    await page.getByRole("button", { name: "ابدأ السباق" }).click();
    const canvases = page.locator("[data-testid^=race-side-] canvas");
    await expect(canvases).toHaveCount(2, { timeout: 20_000 });
    // The views size themselves on the next frame; wait for the layout to settle.
    await expect
      .poll(async () => {
        const [a, c] = [(await canvases.nth(0).boundingBox())!, (await canvases.nth(1).boundingBox())!];
        return Math.abs(a.width - c.width) < 2 && a.width > 100;
      })
      .toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    const small = await page.evaluate(() =>
      [...document.querySelectorAll("[data-testid^=race-choice-]")].filter((el) => el.getBoundingClientRect().height < 56).length,
    );
    expect(small).toBe(0);
  });
});
