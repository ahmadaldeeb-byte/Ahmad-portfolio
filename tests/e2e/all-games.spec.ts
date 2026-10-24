import { expect, test, type Page } from "@playwright/test";
import { freshStart } from "./helpers";

const N = 4;
const western = (s: string) => s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
const nums = (s: string) => (western(s).match(/\d+/g) ?? []).map(Number);

/** Opens a ready-made math game for a grade in the wizard, picks a level and 4 tasks, then starts it. */
async function openMath(page: Page, type: string, grade: 2 | 3, level: string) {
  await freshStart(page);
  await page.goto(`/create?from=builtin_${type}_${grade}_math`);
  await page.getByRole("group", { name: "المستوى" }).getByRole("radio", { name: level, exact: true }).click();
  await page.getByRole("group", { name: "عدد المهام" }).getByRole("radio", { name: "عدد مخصص" }).click();
  await page.getByLabel("عدد المهام المخصص").fill(String(N));
  await page.getByRole("button", { name: /الحفظ والتشغيل/ }).click();
  await page.getByRole("button", { name: "ابدأ اللعب" }).click();
  await page.waitForURL(/\/play\?id=/);
  await page.getByRole("button", { name: "ابدأ اللعب" }).click();
}

/** Opens a ready-made game straight from the library. */
async function openBuiltin(page: Page, id: string) {
  await freshStart(page);
  await page.goto(`/play?id=${id}`);
  await page.getByRole("button", { name: "ابدأ اللعب" }).click();
}

async function waitTask(page: Page, i: number, total = N) {
  await expect(page.getByTestId("math-progress")).toHaveText(`${i + 1} / ${total}`, { timeout: 12_000 });
  await expect(page.locator("[data-task]")).toHaveCount(1);
  await expect(page.locator(`[data-task="${i}"]`)).toBeVisible();
  await page.waitForTimeout(350);
}

/** Learning mode allows retries: try the choices until the right one turns green. */
async function tryChoices(page: Page, testId = "math-choice") {
  const btns = page.locator(`[data-task] [data-testid=${testId}]`);
  await expect(btns.first()).toBeVisible();
  const n = await btns.count();
  for (let k = 0; k < n; k++) {
    const b = btns.nth(k);
    if (!(await b.isEnabled())) continue;
    await b.click();
    await page.waitForTimeout(120);
    if ((await page.locator(`[data-task] [data-testid=${testId}].bg-hero-green, [data-task] [data-testid=${testId}].border-hero-green`).count()) > 0) return;
  }
  throw new Error("no choice was correct");
}

const visible = (page: Page, id: string) => page.locator(`[data-task] [data-testid="${id}"]`).isVisible();

/** Solves whatever task the current math game shows. */
async function solveTask(page: Page, i: number) {
  const prompt = (await page.getByTestId("math-prompt").textContent())!;
  if (await visible(page, "island")) {
    // Add fruits one by one until «تحقق» accepts the count.
    const fruits = page.getByTestId("island-fruit");
    for (let k = 0; k < 24; k++) {
      await fruits.first().click();
      await page.getByRole("button", { name: "تحقق" }).click();
      await page.waitForTimeout(150);
      if (await page.locator("[data-task] button:has-text('تحقق')").isDisabled()) break;
    }
    // Groups of the asked size are shown in the basket.
    return;
  }
  if (await visible(page, "apple-share")) {
    const baskets = page.getByTestId("apple-share-basket");
    const share = await baskets.count();
    // Tap every apple where it hangs, bottom row first (taken apples fall downwards).
    const spots = await page.getByTestId("apple").evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }));
    for (const p of spots.sort((a, b) => b.y - a.y)) await page.mouse.click(p.x, p.y);
    await expect(page.getByTestId("apple-equation")).toBeVisible();
    const counts = await baskets.evaluateAll((els) => els.map((e) => Number(e.getAttribute("data-count"))));
    expect(new Set(counts).size).toBe(1); // shared equally
    expect(counts.length).toBe(share);
    return tryChoices(page);
  }
  if (await visible(page, "apple-basket")) {
    const take = nums(prompt)[1];
    for (let k = 0; k < take; k++) await page.getByTestId("apple").first().click();
    return tryChoices(page);
  }
  if ((await visible(page, "factory")) && (await visible(page, "factory-target"))) {
    const target = western((await page.getByTestId("factory-target").textContent())!);
    const machines = page.getByTestId("factory-machine");
    const digits = target.padStart(await machines.count(), "0").split("").map(Number);
    for (let k = 0; k < digits.length; k++) for (let c = 0; c < digits[k]; c++) await machines.nth(k).click();
    await page.getByRole("button", { name: "تحقق" }).click();
    return;
  }
  if (await visible(page, "clock-set")) {
    const [h, m] = nums(prompt.split("الساعة")[1]);
    for (let k = 0; k < 13; k++) {
      if (nums((await page.getByTestId("clock-value").textContent())!)[0] === h) break;
      await page.getByRole("button", { name: "ساعة إلى الأمام" }).click();
    }
    const plus = page.getByRole("button", { name: /دقائق إلى الأمام/ });
    for (let k = 0; k < 60; k++) {
      if (nums((await page.getByTestId("clock-value").textContent())!)[1] === m) break;
      await plus.click();
    }
    await expect(page.getByTestId("clock-face")).toHaveAttribute("data-time", `${h}:${String(m).padStart(2, "0")}`);
    await page.getByRole("button", { name: "تحقق" }).click();
    return;
  }
  if (await visible(page, "market-pay")) {
    let left = Number(await page.getByTestId("market-price").getAttribute("data-price"));
    const coins = await page.getByTestId("market-coin").evaluateAll((els) => els.map((e) => Number(e.getAttribute("data-value"))));
    for (const v of [...coins].sort((a, b) => b - a))
      while (left >= v) {
        await page.locator(`[data-testid=market-coin][data-value="${v}"]`).click();
        left -= v;
      }
    await page.getByRole("button", { name: "ادفع" }).click();
    return;
  }
  if (await visible(page, "pizza-serve")) {
    const cuts = page.getByTestId("pizza-cut");
    for (let k = 0; k < (await cuts.count()); k++) {
      if (await page.getByTestId("pizza-part").first().isVisible().catch(() => false)) break;
      await cuts.nth(k).click();
      await page.waitForTimeout(150);
    }
    await page.getByTestId("pizza-part").first().click();
    return;
  }
  if (await visible(page, "measure-mass")) await page.getByTestId("balance-place").click();
  if ((await visible(page, "measure-mass")) || (await visible(page, "measure-length"))) return tryChoices(page, "measure-item");
  if ((await page.locator("[data-task] [data-testid=croc-symbol]").count()) > 0) return tryChoices(page, "croc-symbol");
  void i;
  return tryChoices(page);
}

async function playMath(page: Page) {
  for (let i = 0; i < N; i++) {
    await waitTask(page, i);
    await solveTask(page, i);
  }
  await expect(page.getByTestId("results")).toBeVisible({ timeout: 15_000 });
}

const RUNS: [type: string, grade: 2 | 3, level: string, check?: (page: Page) => Promise<void>][] = [
  ["island", 2, "مجموعات من ٢"],
  ["island", 3, "القسمة بالتوزيع"],
  ["crocodile", 2, "مقارنة نواتج الجمع", async (p) => expect(p.getByTestId("croc-group-a")).toContainText("+")],
  ["crocodile", 3, "الأعداد حتى ٩٩٩٩"],
  ["rocket", 2, "منزلتان + آحاد مع حمل"],
  ["rocket", 3, "أربع منازل", async (p) => expect(nums((await p.getByTestId("math-prompt").textContent())!)[0]).toBeGreaterThanOrEqual(1000)],
  ["appleBasket", 2, "الطرح ضمن ٢٠"],
  ["appleBasket", 3, "القسمة حتى ٦", async (p) => expect(p.getByTestId("apple-share")).toBeVisible()],
  ["factory", 2, "الأعداد حتى ٩٩٩", async (p) => expect(p.locator("[data-task] th", { hasText: "مئات" })).toBeVisible()],
  ["factory", 3, "الآلاف والمئات"],
  ["pirates", 2, "منزلتان مع استلاف"],
  ["pirates", 3, "الاستلاف عبر الأصفار"],
  ["shapes", 2, "خصائص المجسمات"],
  ["shapes", 3, "المحيط", async (p) => expect(p.locator("[data-testid=shape-perimeter]")).toBeVisible()],
  ["pizza", 2, "تقديم الكسور"],
  ["pizza", 3, "مقارنة الكسور"],
  ["market", 2, "الباقي من الدينار"],
  ["market", 3, "الدفع والباقي"],
  ["clock", 2, "ضبط ربع الساعة"],
  ["clock", 3, "الزمن المنقضي"],
  ["measure", 2, "الوحدة المناسبة"],
  ["measure", 3, "تحويل الوحدات"],
];

test.describe("math games — grades 2 and 3", () => {
  for (const [type, grade, level, check] of RUNS)
    test(`${type} — grade ${grade} — ${level}`, async ({ page }) => {
      await openMath(page, type, grade, level);
      await waitTask(page, 0);
      if (check) await check(page);
      await playMath(page);
    });

  test("سباق الجمع للصف الثالث uses four-digit sums", async ({ page }) => {
    await freshStart(page);
    await page.goto("/create?from=builtin_raceAdd_3_math");
    await page.getByRole("group", { name: "المستوى" }).getByRole("radio", { name: "عددان من أربع منازل" }).click();
    await page.getByRole("button", { name: /الحفظ والتشغيل/ }).click();
    await page.getByRole("button", { name: "ابدأ اللعب" }).click();
    await page.waitForURL(/\/play\?id=/);
    await page.getByRole("button", { name: "ابدأ اللعب" }).click();
    await page.waitForTimeout(4500); // 3-2-1 countdown
    const text = await page.locator("[data-testid=classroom]").textContent();
    expect(nums(text!).some((n) => n >= 1000)).toBe(true);
  });
});

test.describe("game worlds with question-bank questions", () => {
  for (const [id, stage] of [
    ["builtin_rocket_1_arabic", "rocket-fuel"],
    ["builtin_pirates_2_science", "pirate-map"],
    ["builtin_pizza_3_english", "world-stage"],
  ] as const)
    test(`${id} plays the bank to the end`, async ({ page }) => {
      await openBuiltin(page, id);
      const total = nums((await page.getByTestId("math-progress").textContent())!)[1];
      expect(total).toBeGreaterThanOrEqual(3);
      await expect(page.getByTestId(stage)).toBeVisible();
      for (let i = 0; i < total; i++) {
        await waitTask(page, i, total);
        await tryChoices(page);
      }
      await expect(page.getByTestId("results")).toBeVisible({ timeout: 15_000 });
    });

  test("every world starts and moves on after a right answer", async ({ page }) => {
    await freshStart(page);
    for (const type of ["island", "crocodile", "appleBasket", "factory", "shapes", "market", "clock", "measure"]) {
      await page.goto(`/play?id=builtin_${type}_2_arabic`);
      await expect(page.getByRole("heading", { level: 2 }).first()).not.toHaveText(/الجمع|الأرقام/);
      await page.getByRole("button", { name: "ابدأ اللعب" }).click();
      const total = nums((await page.getByTestId("math-progress").textContent())!)[1];
      await waitTask(page, 0, total);
      await expect(page.getByTestId("bank-question")).toBeVisible();
      await tryChoices(page);
      await waitTask(page, 1, total);
      await expect(page.locator("[data-built]").first()).not.toHaveAttribute("data-built", "0");
    }
  });
});

test.describe("memory, words, numbers, puzzle and space", () => {
  test("ذاكرة الأبطال: a wrong pair flips back, matched pairs stay", async ({ page }) => {
    await openBuiltin(page, "builtin_memory_1_arabic");
    const cards = page.getByTestId("memory-card");
    await expect(cards).toHaveCount(16);
    const pairs = await cards.evaluateAll((els) => els.map((e) => Number(e.getAttribute("data-pair"))));
    // a mismatch first
    const a = 0;
    const b = pairs.findIndex((p, k) => k !== a && p !== pairs[a]);
    await cards.nth(a).click();
    await cards.nth(b).click();
    await page.waitForTimeout(1400);
    await expect(cards.nth(a)).toHaveAttribute("data-up", "false");
    for (let p = 0; p < 8; p++) {
      const [x, y] = pairs.flatMap((v, k) => (v === p ? [k] : []));
      await cards.nth(x).click();
      await cards.nth(y).click();
      await expect(cards.nth(x)).toHaveAttribute("data-up", "true");
      await page.waitForTimeout(600);
    }
    await expect(page.getByTestId("results")).toBeVisible({ timeout: 15_000 });
  });

  test("صانع الكلمات: letters keep their harakat; sentences order words", async ({ page }) => {
    const ANSWERS = ["قَلَم", "بَيْت", "وَلَد", "مَدْرَسة", "حَديقة", "ذهب الولد إلى المدرسة"];
    for (const id of ["builtin_words_1_arabic", "builtin_words_2_arabic"]) {
      await openBuiltin(page, id);
      const total = nums((await page.getByTestId("math-progress").textContent())!)[1];
      for (let i = 0; i < total; i++) {
        await waitTask(page, i, total);
        const tiles = page.locator("[data-task] [data-testid=words-tile]");
        const texts = await tiles.allTextContents();
        const answer = ANSWERS.find((w) => [...(/\s/.test(w) ? w.split(" ") : w.match(/.[ً-ْ]*/gu)!)].sort().join("|") === [...texts].sort().join("|"))!;
        expect(answer, texts.join(",")).toBeDefined();
        const parts = /\s/.test(answer) ? answer.split(" ") : answer.match(/.[ً-ْ]*/gu)!;
        if (i === 0) {
          // a wrong order is refused and the tiles come back
          for (let k = texts.length - 1; k >= 0; k--) await tiles.nth(k).click();
          const lucky = [...texts].reverse().join(/\s/.test(answer) ? " " : "") === answer;
          await page.getByRole("button", { name: "تحقق" }).click();
          if (lucky) continue;
          await expect(tiles.first()).toBeEnabled();
        }
        const used = new Set<number>();
        for (const part of parts) {
          const k = texts.findIndex((t, j) => t === part && !used.has(j));
          used.add(k);
          await tiles.nth(k).click();
        }
        await expect(page.getByTestId("words-built")).toContainText(/\s/.test(answer) ? parts[0] : answer);
        await page.getByRole("button", { name: "تحقق" }).click();
      }
      await expect(page.getByTestId("results")).toBeVisible({ timeout: 15_000 });
    }
  });

  test("أبطال الأرقام: the hero moves along the path", async ({ page }) => {
    await openBuiltin(page, "builtin_numbers_1_math");
    const total = nums((await page.getByTestId("math-progress").textContent())!)[1];
    for (let i = 0; i < total; i++) {
      await waitTask(page, i, total);
      await expect(page.getByTestId("numbers-path")).toHaveAttribute("data-step", String(i));
      await tryChoices(page);
    }
    await expect(page.getByTestId("results")).toBeVisible({ timeout: 15_000 });
  });

  test("أبطال الألغاز: win a piece, a wrong place costs nothing, the right place completes it", async ({ page }) => {
    await openBuiltin(page, "builtin_puzzle_1_science");
    const total = nums((await page.getByTestId("math-progress").textContent())!)[1];
    for (let i = 0; i < total; i++) {
      await waitTask(page, i, total);
      const btns = page.locator("[data-task] [data-testid=math-choice]");
      const n = await btns.count();
      for (let k = 0; k < n && !(await page.getByTestId("puzzle-piece").isVisible()); k++) {
        if (await btns.nth(k).isEnabled()) await btns.nth(k).click();
        await page.waitForTimeout(150);
      }
      const slot = Number(await page.getByTestId("puzzle-piece").getAttribute("data-slot"));
      const slots = page.locator("[data-task] [data-testid=puzzle-slot]");
      if (i === 0) {
        await slots.nth((slot + 1) % (await slots.count())).click();
        await expect(page.getByTestId("puzzle-piece")).toBeVisible();
      }
      await slots.nth(slot).click();
      await expect(slots.nth(slot)).toHaveAttribute("data-placed", "true");
    }
    await expect(page.getByTestId("results")).toBeVisible({ timeout: 15_000 });
  });

  test("رحلة إلى النجوم: the 3D ship flies one planet per right answer", async ({ page }) => {
    await openBuiltin(page, "builtin_space_1_english");
    await expect(page.getByTestId("space-stage").locator("canvas")).toBeVisible({ timeout: 20_000 });
    const total = nums((await page.getByTestId("math-progress").textContent())!)[1];
    for (let i = 0; i < total; i++) {
      await waitTask(page, i, total);
      await expect(page.getByTestId("space-stage")).toHaveAttribute("data-planet", String(i));
      await tryChoices(page);
    }
    await expect(page.getByTestId("results")).toBeVisible({ timeout: 15_000 });
  });
});

test("new games and levels fit phone and smartboard screens @screens", async ({ page }) => {
  for (const id of ["builtin_memory_2_english", "builtin_factory_3_math", "builtin_puzzle_1_arabic", "builtin_rocket_2_science"]) {
    await openBuiltin(page, id);
    await page.waitForTimeout(800);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, id).toBeLessThanOrEqual(1);
  }
});
