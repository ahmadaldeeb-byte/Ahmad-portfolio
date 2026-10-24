import { expect, test, type Page } from "@playwright/test";
import { freshStart, solve } from "./helpers";

const N = 4;
const W = (s: string) => Number(s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)));
const nums = (s: string) => (s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).match(/\d+/g) ?? []).map(Number);

/** Opens a ready-made Grade 1 game in the wizard, sets level and 4 tasks, then starts it. */
async function open(page: Page, type: string, level?: string) {
  await freshStart(page);
  await page.goto(`/create?from=builtin_${type}_1_math`);
  if (level) await page.getByRole("group", { name: "المستوى" }).getByRole("radio", { name: level }).click();
  if (type !== "raceAdd") await page.getByRole("group", { name: "عدد المهام" }).getByRole("radio", { name: "عدد مخصص" }).click();
  if (type !== "raceAdd") await page.getByLabel("عدد المهام المخصص").fill(String(N));
  await page.getByRole("button", { name: /الحفظ والتشغيل/ }).click();
  await page.getByRole("button", { name: "ابدأ اللعب" }).click();
  await page.waitForURL(/\/play\?id=/);
  await page.getByRole("button", { name: "ابدأ اللعب" }).click();
}

async function waitTask(page: Page, i: number) {
  await expect(page.getByTestId("math-progress")).toHaveText(`${i + 1} / ${N}`, { timeout: 10_000 });
  // The previous task animates out first; act only on the new one.
  await expect(page.locator("[data-task]")).toHaveCount(1);
  await expect(page.locator(`[data-task="${i}"]`)).toBeVisible();
  await page.waitForTimeout(350); // let the slide-in animation settle before measuring positions
}

/** Learning mode allows retries: try the choices until the right one turns green. */
async function tryChoices(page: Page, testId = "math-choice") {
  const btns = page.getByTestId(testId);
  await expect(btns.first()).toBeVisible();
  const n = await btns.count();
  for (let k = 0; k < n; k++) {
    const b = btns.nth(k);
    if (!(await b.isEnabled())) continue;
    await b.click();
    await page.waitForTimeout(120);
    if ((await page.locator(`[data-testid=${testId}].bg-hero-green, [data-testid=${testId}].border-hero-green`).count()) > 0) return;
  }
  throw new Error("no choice was correct");
}

async function playAll(page: Page, each: (i: number) => Promise<void>) {
  for (let i = 0; i < N; i++) {
    await waitTask(page, i);
    await each(i);
  }
  await expect(page.getByTestId("results")).toBeVisible({ timeout: 15_000 });
}

test.describe("Grade 1 math games", () => {
  test("جزيرة الأرقام: collect by tap and drag, wrong count is retried", async ({ page }) => {
    await open(page, "island");
    await playAll(page, async (i) => {
      // «اجمع تفاحتين (اثنان)» has no digit: read the number word in brackets.
      const WORDS = ["صفر", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر", "عشرون"];
      const word = /\(([^)]+)\)/.exec((await page.getByTestId("math-prompt").textContent())!)![1];
      const target = WORDS.indexOf(word);
      const fruits = page.getByTestId("island-fruit");
      if (i === 0) {
        // too many first → friendly correction, then fix it
        for (let k = 0; k < target + 1; k++) await fruits.first().click();
        await page.getByRole("button", { name: "تحقق" }).click();
        await expect(page.getByText("هذا أكثر من المطلوب! أعد بعضها.").first()).toBeVisible();
        await page.getByTestId("island-basket").getByRole("button").first().click();
      } else if (i === 1) {
        // drag the first fruit into the basket
        const from = (await fruits.first().boundingBox())!;
        const to = (await page.getByTestId("island-basket").boundingBox())!;
        await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
        await page.mouse.down();
        await page.mouse.move(from.x + 50, from.y, { steps: 4 });
        await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
        await page.mouse.up();
        await expect(page.getByTestId("island-count")).toHaveText("1");
        for (let k = 1; k < target; k++) await fruits.first().click();
      } else for (let k = 0; k < target; k++) await fruits.first().click();
      await expect(page.getByTestId("island-count")).toHaveText(String(target));
      await page.getByRole("button", { name: "تحقق" }).click();
      if (i < N - 1) await expect(page.getByText("أحسنت! لقد جمعت العدد الصحيح").first()).toBeVisible();
    });
  });

  test("التمساح الجائع: groups and > < = symbols", async ({ page }) => {
    await open(page, "crocodile", "المجموعات والرموز");
    await playAll(page, async () => {
      const prompt = (await page.getByTestId("math-prompt").textContent())!;
      const a = nums((await page.getByTestId("croc-group-a").getAttribute("aria-label")) ?? (await page.getByTestId("croc-group-a").textContent())!)[0];
      const b = nums((await page.getByTestId("croc-group-b").getAttribute("aria-label")) ?? (await page.getByTestId("croc-group-b").textContent())!)[0];
      if (prompt.includes("الرمز")) {
        const s = a > b ? ">" : a < b ? "<" : "=";
        await page.getByTestId("croc-symbol").filter({ hasText: s }).click();
        await expect(page.getByTestId("croc-slot")).toHaveText(s);
      } else {
        const side = prompt.includes("الأكبر") === a > b ? "a" : "b";
        await page.getByTestId(`croc-group-${side}`).click();
      }
    });
  });

  test("صاروخ الجمع: fuel fills and the rocket launches after five", async ({ page }) => {
    test.setTimeout(90_000);
    await freshStart(page);
    await page.goto("/play?id=builtin_rocket_1_math"); // 8 tasks
    await page.getByRole("button", { name: "ابدأ اللعب" }).click();
    for (let i = 0; i < 5; i++) {
      await expect(page.getByTestId("math-progress")).toHaveText(`${i + 1} / 8`, { timeout: 10_000 });
      const sum = nums((await page.getByTestId("math-prompt").textContent())!).reduce((x, y) => x + y, 0);
      await page.getByTestId("math-choice").filter({ hasText: new RegExp(`^${sum}$`) }).click();
      if (i < 4) await expect(page.getByTestId("rocket-fuel")).toHaveAttribute("data-fuel", String(i + 1));
    }
    await expect(page.getByTestId("rocket-fuel")).toHaveAttribute("data-fuel", "5");
    await expect(page.getByTestId("rocket-planet")).toContainText("الكوكب 2", { timeout: 6000 });
    await expect(page.getByTestId("math-progress")).toHaveText("6 / 8", { timeout: 10_000 });
    await expect(page.getByTestId("rocket-fuel")).toHaveAttribute("data-fuel", "0");
  });

  test("سلة التفاح: take apples to the basket, then count what is left", async ({ page }) => {
    await open(page, "appleBasket");
    await playAll(page, async () => {
      const [total, take] = nums((await page.getByTestId("math-prompt").textContent())!);
      for (let k = 0; k < take; k++) await page.getByTestId("apple").first().click();
      await expect(page.getByTestId("apple-equation")).toBeVisible();
      await page.getByTestId("math-choice").filter({ hasText: new RegExp(`^${total - take}$`) }).click();
    });
  });

  test("مصنع الأعداد: build with tens and ones; read built numbers", async ({ page }) => {
    await open(page, "factory", "الأعداد حتى ٥٠");
    await playAll(page, async () => {
      if (await page.getByTestId("factory-target").isVisible()) {
        const target = W((await page.getByTestId("factory-target").textContent())!);
        const [tensBtn, onesBtn] = [page.getByTestId("factory-machine").nth(0), page.getByTestId("factory-machine").nth(1)];
        for (let k = 0; k < Math.floor(target / 10); k++) await tensBtn.click();
        for (let k = 0; k < target % 10; k++) await onesBtn.click();
        await expect(page.getByTestId("factory-rod")).toHaveCount(Math.floor(target / 10));
        await page.getByRole("button", { name: "تحقق" }).click();
      } else {
        const v = (await page.getByTestId("factory-rod").count()) * 10 + (await page.getByTestId("factory-cube").count());
        await page.getByTestId("math-choice").filter({ hasText: new RegExp(`^${v}$`) }).click();
      }
    });
  });

  test("سباق الجمع: split-screen addition race", async ({ page }) => {
    await open(page, "raceAdd", "عددان من منزلتين");
    await page.getByRole("group", { name: "خط النهاية" }).getByRole("radio", { name: "4", exact: true }).click();
    await page.getByRole("button", { name: "ابدأ السباق" }).click();
    for (let i = 0; i < 4; i++) {
      await expect(page.getByTestId("race-choice-red").first()).toBeEnabled({ timeout: 8000 });
      const ans = solve((await page.getByTestId("race-question-red").textContent())!);
      await page.getByTestId("race-choice-red").filter({ hasText: new RegExp(`^${ans}$`) }).dispatchEvent("pointerdown");
    }
    await expect(page.getByTestId("race-winner")).toHaveText("الفريق الأحمر هو البطل!");
  });

  test("كنز القراصنة: keys open the doors to the treasure", async ({ page }) => {
    await open(page, "pirates", "طرح العشرات والمنزلتين");
    await playAll(page, async (i) => {
      const [a, b] = nums((await page.getByTestId("math-prompt").textContent())!);
      await page.getByTestId("math-choice").filter({ hasText: new RegExp(`^${a - b}$`) }).click();
      await expect(page.getByTestId("pirate-map")).toHaveAttribute("data-open", String(i + 1));
    });
  });

  test("مدينة الأشكال: patterns, buildings and sides build the city", async ({ page }) => {
    await open(page, "shapes", "الأنماط والبناء");
    await playAll(page, async (i) => {
      await tryChoices(page);
      await expect(page.getByTestId("shape-city")).toHaveAttribute("data-built", String(i + 1));
    });
  });

  test("مطعم البيتزا: cut equal parts and serve a half or a quarter", async ({ page }) => {
    await open(page, "pizza", "النصف والربع");
    await playAll(page, async () => {
      if (await page.getByTestId("pizza-serve").isVisible()) {
        const half = (await page.getByTestId("math-prompt").textContent())!.includes("نصف");
        await page.getByTestId("pizza-cut").filter({ hasText: "قطعتان غير متساويتين" }).click();
        await expect(page.getByText("الأجزاء غير متساوية!").first()).toBeVisible();
        await page.getByTestId("pizza-cut").filter({ hasText: half ? "قطعتان متساويتان" : "٤ قطع متساوية" }).click();
        await page.getByTestId("pizza-part").first().click({ force: true });
      } else await tryChoices(page);
    });
  });

  test("السوق الصغير: pay the exact price with Jordanian coins", async ({ page }) => {
    await open(page, "market", "حتى ٣٠ قرشًا");
    await playAll(page, async () => {
      if (await page.getByTestId("market-pay").isVisible()) {
        let price = Number(await page.getByTestId("market-price").getAttribute("data-price"));
        const values = (await page.getByTestId("market-coin").evaluateAll((els) => els.map((e) => Number((e as HTMLElement).dataset.value)))).sort((x, y) => y - x);
        // overpay once, take it back
        await page.getByTestId("market-coin").filter({ has: page.locator(`[aria-label]`) }).first().click();
        await page.getByTestId("market-tray-coin").first().click();
        for (const v of values)
          while (price >= v) {
            await page.locator(`[data-testid=market-coin][data-value="${v}"]`).click();
            price -= v;
          }
        await page.getByRole("button", { name: "ادفع" }).click();
        await expect(page.getByText("تمّ الشراء! شكرًا لك 🛍️").first()).toBeVisible();
      } else await tryChoices(page);
    });
  });

  test("ساعة المغامرات: read the clock and set half hours", async ({ page }) => {
    await open(page, "clock", "نصف الساعة");
    await playAll(page, async () => {
      if (await page.getByTestId("clock-set").isVisible()) {
        const [h, m] = nums((await page.getByTestId("math-prompt").textContent())!).slice(-2);
        for (let k = 0; k < 13 && !(await page.getByTestId("clock-value").textContent())!.startsWith(`${h}:`); k++)
          await page.getByRole("button", { name: "ساعة إلى الأمام" }).click();
        if (m === 30) await page.getByRole("button", { name: "اجعلها والنصف" }).click();
        await expect(page.getByTestId("clock-face")).toHaveAttribute("data-time", `${h}:${m === 30 ? "30" : "00"}`);
        await page.getByRole("button", { name: "تحقق" }).click();
      } else await tryChoices(page);
    });
  });

  test("مختبر القياس: lengths, balance, capacity and units", async ({ page }) => {
    await open(page, "measure", "السعات ووحدات غير قياسية");
    await playAll(page, async () => {
      if (await page.getByTestId("measure-mass").isVisible()) {
        await page.getByTestId("balance-place").click();
        await expect(page.getByTestId("balance-beam")).not.toHaveAttribute("data-tilt", "0");
      }
      if (await page.getByTestId("measure-units").isVisible()) return tryChoices(page);
      if (await page.getByTestId("measure-capacity").isVisible()) await page.getByRole("button", { name: /نملأ الأوعية/ }).click();
      await tryChoices(page, "measure-item");
    });
  });
});

test.describe("math games touch @touch", () => {
  test("finger taps work in the island and the factory", async ({ page }) => {
    await freshStart(page);
    await page.goto("/play?id=builtin_island_1_math");
    await page.getByRole("button", { name: "ابدأ اللعب" }).tap();
    await expect(page.locator('[data-task="0"]')).toBeVisible();
    await page.waitForTimeout(400);
    await page.getByTestId("island-fruit").first().tap();
    await expect(page.getByTestId("island-count")).toHaveText("1");
    await page.goto("/play?id=builtin_factory_1_math");
    await page.getByRole("button", { name: "ابدأ اللعب" }).tap();
    await page.waitForTimeout(400);
    await page.getByTestId("factory-machine").first().tap();
    await expect(page.getByTestId("factory-rod")).toHaveCount(1);
  });
});
