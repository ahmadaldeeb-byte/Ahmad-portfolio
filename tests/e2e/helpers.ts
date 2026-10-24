import { expect, type Page } from "@playwright/test";

/** Solves "a op b = ؟" prompts shown by the games. */
export function solve(prompt: string): string {
  const toWestern = (s: string) => s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  const m = /(\d+)\s*([+\-×÷])\s*(\d+)/.exec(toWestern(prompt));
  if (!m) throw new Error(`cannot solve: ${prompt}`);
  const a = Number(m[1]);
  const b = Number(m[3]);
  return String(m[2] === "+" ? a + b : m[2] === "-" ? a - b : m[2] === "×" ? a * b : a / b);
}

/** Fresh browser storage for each test. */
export async function freshStart(page: Page) {
  await page.goto("/");
  await page.evaluate(async () => {
    localStorage.clear();
    await new Promise<void>((r) => {
      const req = indexedDB.deleteDatabase("heroes-world");
      req.onsuccess = req.onerror = req.onblocked = () => r();
    });
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "مرحبًا بك في عالم الأبطال!" })).toBeVisible();
}

/** Creates a game through the wizard with arithmetic questions. */
export async function createArithmeticGame(page: Page, opts: { type: string; title: string; exprs: string[] }) {
  await page.goto("/create");
  await page.getByRole("button", { name: /الصف الأول/ }).click();
  await page.getByRole("button", { name: /الرياضيات/ }).click();
  await page.getByPlaceholder("اكتب عنوان الدرس").fill("الجمع");
  await page.getByPlaceholder("مثال: سباق الجمع الكبير").fill(opts.title);
  await page.getByRole("button", { name: "التالي", exact: true }).click();
  await page.getByRole("button", { name: new RegExp(opts.type) }).first().click();
  await page.getByRole("button", { name: "التالي", exact: true }).click();
  for (const e of opts.exprs) {
    await page.getByRole("button", { name: "سؤال جديد" }).click();
    await page.getByRole("radio", { name: "عملية حسابية" }).last().click();
    await page.getByPlaceholder("7 + 5").last().fill(e);
  }
  await page.getByRole("button", { name: "التالي", exact: true }).click(); // time & points
  await page.getByRole("button", { name: "التالي", exact: true }).click(); // preview
  await expect(page.getByText("كل شيء جاهز!")).toBeVisible();
  await page.getByRole("button", { name: "التالي", exact: true }).click(); // save & play
  await page.getByRole("button", { name: "ابدأ اللعب" }).click();
  await page.waitForURL(/\/play\?id=/);
}
