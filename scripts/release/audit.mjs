#!/usr/bin/env node
/*
 * Release audit: counts and checks the built-in curricula with the app's own
 * code (the same modules the app runs), and prints a Markdown report.
 *   node scripts/release/audit.mjs [report.md]
 * Exit code 1 when something a teacher relies on is missing or wrong:
 * a lesson without a guide, games or a valid ready lesson; a question without
 * a source; a game that cannot be played; a wrong math answer.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const jiti = createJiti(import.meta.url, { alias: { "@": path.join(root, "src") }, interopDefault: true });
const { BUNDLED, CATALOG } = await jiti.import(path.join(root, "src/content/catalog.ts"));
const { builtinPlan, validatePlan, totalMinutes, playableItems } = await jiti.import(path.join(root, "src/lib/lessons/engine.ts"));
const { validateGame, preparePlayable, toPlayable, evaluateArithmetic } = await jiti.import(path.join(root, "src/lib/questions.ts"));
const { gameMetaFor } = await jiti.import(path.join(root, "src/lib/constants.ts"));

const problems = [];
const strip = (s) => s.replace(/[⁦-⁩]/g, "").replace(/−/g, "-");
const oral = (title) => /أَسْتَمِعُ|أَتَحَدَّثُ/.test(title);

/** Re-checks an answer the way a teacher would: «a + ؟ = c», «a - b = ؟», «… = 10 + ؟». */
function mathAnswerOk(q) {
  if (q.kind === "arithmetic") return evaluateArithmetic(q.prompt) !== null;
  if (q.kind !== "mcq") return true;
  const ans = q.choices[q.correctIndex];
  if (!/^\d+$/.test(ans ?? "")) return true;
  const p = strip(q.prompt).replace(/\(.*?\)/g, "");
  const re = /(\d+|؟)\s*([+-])\s*(\d+|؟)\s*=\s*(\d+|؟)(?:\s*\+\s*(\d+|؟))?/g;
  for (const m of p.matchAll(re)) {
    const [, a, op, b, c, e] = m;
    if (![a, b, c, e].includes("؟")) continue;
    const v = (x) => (x === "؟" ? Number(ans) : Number(x));
    const lhs = op === "+" ? v(a) + v(b) : v(a) - v(b);
    if (lhs !== v(c) + (e ? v(e) : 0)) return false;
  }
  return true;
}

const lines = ["# تقرير فحص اكتمال المحتوى", "", `التاريخ: ${new Date().toISOString().slice(0, 10)}`, ""];
for (const plan of BUNDLED) {
  const { book, questions, games } = plan;
  const lessons = book.units.flatMap((u) => u.lessons);
  const fromBook = questions.filter((q) => q.origin === "textbook").length;
  let guides = 0, plans = 0, checked = 0;
  for (const u of book.units)
    for (const l of u.lessons) {
      const where = `${book.imported.title} › ${u.title} › ${l.title}`;
      const qs = questions.filter((q) => q.lessonId === l.id);
      const gs = games.filter((g) => g.lessonId === l.id);
      if (l.guide?.objectives?.length && l.guide.explanation && l.guide.warmup) guides++;
      else problems.push(`${where}: لا يوجد دليل كامل (أهداف، شرح، نشاط تمهيدي).`);
      if (qs.length < (oral(l.title) ? 6 : 10)) problems.push(`${where}: ${qs.length} أسئلة فقط.`);
      for (const q of qs) {
        if (!["textbook", "generated"].includes(q.origin)) problems.push(`${where}: سؤال بلا مصدر (${q.id}).`);
        if (q.origin === "textbook" && !(q.page > 0)) problems.push(`${where}: سؤال من الكتاب بلا رقم صفحة (${q.id}).`);
        if (["mcq", "truefalse", "arithmetic"].includes(q.kind) && !toPlayable(q)) problems.push(`${where}: سؤال لا يمكن عرضه (${q.id}).`);
        if (book.subject === "math") {
          checked++;
          if (!mathAnswerOk(q)) problems.push(`${where}: إجابة خاطئة (${q.id}: ${strip(q.prompt)}).`);
        }
      }
      if (!gs.length) problems.push(`${where}: لا توجد لعبة جاهزة.`);
      for (const g of gs) {
        const issues = validateGame(g);
        const meta = gameMetaFor(g.type, g.subject);
        if (issues.length) problems.push(`${where}: لعبة «${g.title}»: ${issues[0].message}`);
        // Choice games play prepared questions; memory and word maker play their own kinds (pairs, ordering).
        else if (!meta.generated && preparePlayable(g).length === 0 && !g.questions.some((q) => meta.kinds.includes(q.kind) && ["match", "order"].includes(q.kind)))
          problems.push(`${where}: لعبة «${g.title}» بلا أسئلة قابلة للعب.`);
      }
      const p = builtinPlan(l.id);
      const pErr = p ? validatePlan(p) : ["لا توجد حصة جاهزة"];
      if (!p || pErr.length || totalMinutes(p) !== 15 || !gs.some((g) => g.id === p.segments[1].game.gameId) || !playableItems(p.segments[2].items ?? []).length)
        problems.push(`${where}: الحصة الجاهزة غير صالحة (${pErr[0] ?? "مدة أو لعبة أو أسئلة التحدي"}).`);
      else plans++;
    }
  lines.push(
    `## ${book.imported.title}`,
    "",
    `| البند | العدد |`,
    `|---|---|`,
    `| الوحدات | ${book.units.length} |`,
    `| الدروس | ${lessons.length} |`,
    `| دروس بدليل كامل (أهداف، شرح، أمثلة، نشاط تمهيدي) | ${guides} |`,
    `| الأسئلة | ${questions.length} (📘 من الكتاب ${fromBook}، ✨ مولّدة ${questions.length - fromBook}) |`,
    `| الألعاب الجاهزة | ${games.length} |`,
    `| الحصص الجاهزة الصالحة (١٥ دقيقة) | ${plans} |`,
    ...(book.subject === "math" ? [`| أسئلة رياضيات أُعيد التحقق من إجاباتها | ${checked} |`] : []),
    "",
    "الوحدات:",
    "",
    ...book.units.map((u) => `- ${u.number}. ${u.title} — ${u.lessons.length} دروس`),
    "",
  );
}
const provisional = CATALOG.filter((b) => !b.bundled);
lines.push("## خارج الكتب المدمجة", "", ...provisional.map((b) => `- ${b.source.name}: ${b.units.length} وحدات للفصل الثاني من فهرس مؤقت (لا يوجد كتاب مدرسي بعد؛ بلا حصص جاهزة).`), "");
lines.push("## النتيجة", "", problems.length ? `❌ ${problems.length} مشكلة:` : "✅ لا توجد مشكلات: كل الدروس كاملة، وكل الألعاب والحصص الجاهزة صالحة، وكل إجابات الرياضيات صحيحة.", ...problems.map((p) => `- ${p}`), "");

const report = lines.join("\n");
if (process.argv[2]) fs.writeFileSync(process.argv[2], report);
console.log(report);
process.exit(problems.length ? 1 : 0);
