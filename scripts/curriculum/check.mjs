#!/usr/bin/env node
/*
 * Checks a curriculum JSON file with exactly the same rules as the app's
 * «📚 استيراد منهج» page, and prints what the import would create.
 *   node scripts/curriculum/check.mjs curricula/jo-g1-math-s1.json
 * Exit code 1 when the file has errors.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const jiti = createJiti(import.meta.url, { alias: { "@": path.join(root, "src") }, interopDefault: true });
const { validateCurriculumFile } = await jiti.import(path.join(root, "src/lib/curriculum/schema.ts"));
const { planImport } = await jiti.import(path.join(root, "src/lib/curriculum/import.ts"));

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/curriculum/check.mjs <curriculum.json>");
  process.exit(2);
}
const raw = JSON.parse(fs.readFileSync(file, "utf8"));
const { file: ok, issues } = validateCurriculumFile(raw);
const errors = issues.filter((i) => i.level === "error");
for (const i of issues) console.log(`${i.level === "error" ? "✗ خطأ" : "! تنبيه"} — ${i.where}: ${i.message}`);
if (!ok) {
  console.log(`\n${errors.length} خطأ. صحّح الملف ثم أعد الفحص.`);
  process.exit(1);
}
const plan = planImport(ok);
for (const i of plan.issues) console.log(`! تنبيه — ${i.where}: ${i.message}`);
const qs = plan.questions;
const c = ok.curriculum;
console.log(`\n✓ الملف صالح: ${c.title}`);
console.log(`  الوحدات ${plan.book.units.length} • الدروس ${plan.book.imported.counts.lessons} • الأسئلة ${qs.length} (من الكتاب ${qs.filter((q) => q.origin === "textbook").length}، مولّدة ${qs.filter((q) => q.origin === "generated").length}) • الألعاب ${plan.games.length}`);
for (const u of plan.book.units) {
  console.log(`  ${u.number}. ${u.title}`);
  for (const l of u.lessons) console.log(`     - ${l.title}  [${qs.filter((q) => q.lessonId === l.id).length} سؤالًا؛ ألعاب: ${l.games.join(", ") || "—"}]`);
}
