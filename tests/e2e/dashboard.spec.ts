import { expect, test } from "@playwright/test";
import { freshStart } from "./helpers";

test.describe("dashboard", () => {
  test("Arabic RTL home with grade → subject → games flow", async ({ page }) => {
    await freshStart(page);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.getByText("جاهز لحصة مليئة بالمرح والتعلم؟")).toBeVisible();
    await page.getByRole("button", { name: /الصف الثاني/ }).click();
    await page.getByRole("button", { name: /العلوم/ }).click();
    await expect(page).toHaveURL(/grade=2&subject=science/);
    await expect(page.getByRole("heading", { name: /ألعاب العلوم — الصف الثاني/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "العب الآن" })).toHaveCount(19);
    await expect(page.getByRole("link", { name: "تخصيص اللعبة" })).toHaveCount(19);
    await expect(page.getByText("قيد التطوير")).toHaveCount(0);
    // Browser back returns to subjects
    await page.goBack();
    await expect(page.getByRole("heading", { name: /الصف الثاني: اختر المادة/ })).toBeVisible();
  });

  test("no English text in the dashboard interface", async ({ page }) => {
    await freshStart(page);
    for (const path of ["/", "/library", "/create", "/my-games", "/grades", "/results", "/settings"]) {
      await page.goto(path);
      await page.waitForTimeout(400);
      const latin = await page.evaluate(() => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const found: string[] = [];
        while (walker.nextNode()) {
          const n = walker.currentNode as Text;
          const el = n.parentElement;
          if (!el || el.closest(".ltr-content, script, style, [aria-hidden=true], svg")) continue;
          if (/[A-Za-z]{2,}/.test(n.data) && el.offsetParent !== null) found.push(n.data.trim());
        }
        return found;
      });
      expect(latin, path).toEqual([]);
    }
  });

  test("every sidebar link opens a working page", async ({ page }) => {
    await freshStart(page);
    const links = ["مكتبة الألعاب", "إنشاء لعبة جديدة", "بنك الأسئلة", "ألعابي المحفوظة", "الصفوف الدراسية", "نتائج الألعاب", "الإعدادات", "الرئيسية"];
    for (const name of links) {
      await page.getByRole("navigation", { name: "القائمة الرئيسية" }).getByRole("link", { name }).click();
      await expect(page.locator("main h1").first()).toBeVisible();
    }
  });

  test("question bank: add, search, filter, delete", async ({ page }) => {
    await freshStart(page);
    await page.goto("/bank");
    await expect(page.getByText(/\d+ سؤالًا/).first()).toBeVisible();
    await page.getByRole("button", { name: "سؤال جديد" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "حفظ السؤال" }).click();
    await expect(dialog.getByRole("alert")).toContainText("نص السؤال فارغ");
    await dialog.getByPlaceholder("اكتب السؤال هنا...").fill("ما لون الموزة الناضجة؟");
    await dialog.getByPlaceholder("الخيار 1").fill("أصفر");
    await dialog.getByPlaceholder("الخيار 2").fill("أزرق");
    await dialog.getByPlaceholder("الخيار 3").fill("أسود");
    await dialog.getByPlaceholder("الخيار 4").fill("بنفسجي");
    await dialog.getByPlaceholder("مثال: الجمع").fill("الفواكه");
    await dialog.getByRole("button", { name: "حفظ السؤال" }).click();
    await expect(dialog).toBeHidden();
    await page.getByPlaceholder("ابحث في نص السؤال أو الإجابات...").fill("الموزة الناضجة");
    await expect(page.getByText("ما لون الموزة الناضجة؟")).toBeVisible();
    await expect(page.getByText("1 سؤالًا")).toBeVisible();
    await page.getByLabel("نوع السؤال").selectOption("truefalse");
    await expect(page.getByText("لا توجد أسئلة مطابقة")).toBeVisible();
    await page.getByLabel("نوع السؤال").selectOption("all");
    await page.getByRole("button", { name: "حذف السؤال" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "حذف" }).click();
    await expect(page.getByText("لا توجد أسئلة مطابقة")).toBeVisible();
  });

  test("settings: mute, reduced motion and numerals persist", async ({ page }) => {
    await freshStart(page);
    await page.goto("/settings");
    await page.getByRole("switch", { name: "كتم الصوت" }).click();
    await page.getByRole("switch", { name: "تقليل الحركة" }).click();
    await page.getByRole("radio", { name: "١ ٢ ٣" }).click();
    await page.reload();
    await expect(page.getByRole("switch", { name: "كتم الصوت" })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("switch", { name: "تقليل الحركة" })).toHaveAttribute("aria-checked", "true");
    await expect(page.locator("html")).toHaveAttribute("data-reduced-motion", "true");
    await expect(page.getByText("الصوت مكتوم")).toBeVisible();
    await expect(page.getByText("على هذا المتصفح فقط")).toBeVisible();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: /تصدير نسخة احتياطية/ }).click();
    expect((await download).suggestedFilename()).toMatch(/\.json$/);
  });
});
