import { beforeEach, describe, expect, it } from "vitest";
import { collectBackupData, makeBackup, parseBackup, restoreBackup } from "@/lib/backup";
import { duplicateOf, fingerprint, planImport } from "@/lib/curriculum/import";
import { validateCurriculumFile, type CurriculumFile } from "@/lib/curriculum/schema";
import { curriculaRepo, gamesRepo, questionsRepo, resetDBConnection } from "@/lib/db";
import { validateGame } from "@/lib/questions";
import { useData } from "@/store/data";

async function wipe() {
  await resetDBConnection();
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase("heroes-world");
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
  });
  useData.setState({ ready: false, games: [], questions: [], results: [], curricula: [] });
}

function sample(): CurriculumFile {
  return {
    app: "heroes-world",
    kind: "curriculum",
    version: 1,
    curriculum: {
      id: "test-g2-ar",
      country: "الأردن",
      title: "اللغة العربية — تجربة",
      grade: 2,
      subject: "arabic",
      semester: 1,
      textbook: { title: "لغتنا العربية — كتاب تجريبي" },
      units: [
        {
          id: "u1",
          number: 1,
          title: "الوحدة الأولى",
          lessons: [
            {
              id: "u1-l1",
              title: "الدرس الأول",
              questions: [
                { id: "q1", origin: "textbook", page: 8, kind: "mcq", prompt: "ما عكس «كبير»؟", choices: ["صغير", "طويل", "جميل"], correctIndex: 0 },
                { id: "q2", origin: "textbook", page: 8, kind: "truefalse", prompt: "جمع «قلم» أقلام.", correctIndex: 0 },
                { id: "q3", origin: "generated", kind: "mcq", prompt: "ما مرادف «سعيد»؟", choices: ["فرحان", "حزين"], correctIndex: 0 },
                { id: "q4", origin: "generated", kind: "match", prompt: "طابق", pairs: [{ a: "كبير", b: "صغير" }, { a: "طويل", b: "قصير" }] },
                { id: "q5", origin: "textbook", page: 9, kind: "order", prompt: "رتّب", answer: "بَيْت" },
                { id: "q6", origin: "generated", kind: "order", prompt: "رتّب", answer: "شَمْس" },
              ],
            },
            {
              id: "u1-l2",
              title: "الدرس الثاني",
              questions: [{ id: "q7", origin: "textbook", kind: "truefalse", prompt: "الشمس تشرق صباحًا.", correctIndex: 0 }],
              games: [{ template: "rocket" }, { template: "train" }],
            },
          ],
        },
      ],
    },
  };
}

beforeEach(wipe);

describe("curriculum file validation", () => {
  it("accepts a well-formed file", () => {
    const r = validateCurriculumFile(sample());
    expect(r.file).not.toBeNull();
    expect(r.issues.filter((i) => i.level === "error")).toEqual([]);
  });

  it("rejects missing origin, duplicate ids, wrong answers and unknown templates", () => {
    const f = sample();
    const l = f.curriculum.units[0].lessons[0];
    (l.questions[0] as { origin?: string }).origin = undefined;
    l.questions[1].id = "q1";
    l.questions.push({ id: "m1", origin: "generated", kind: "mcq", prompt: "3 + 4 = ؟", choices: ["6", "7"], correctIndex: 0 });
    l.games = [{ template: "nope" as never }];
    const r = validateCurriculumFile(f);
    expect(r.file).toBeNull();
    const msgs = r.issues.map((i) => i.message).join(" | ");
    expect(msgs).toContain("حدّد مصدر السؤال");
    expect(msgs).toContain("مكرر");
    expect(msgs).toContain("الناتج الصحيح 7");
    expect(msgs).toContain("غير موجود");
  });

  it("is not a curriculum file", () => {
    expect(validateCurriculumFile({ app: "heroes-world", kind: "backup" }).file).toBeNull();
    expect(validateCurriculumFile(null).issues[0].message).toContain("ليس ملف منهج");
  });
});

describe("import plan", () => {
  it("builds lessons, keeps question origins and creates valid games linked to lessons", () => {
    const plan = planImport(validateCurriculumFile(sample()).file!);
    expect(plan.book.units[0].lessons.map((l) => l.title)).toEqual(["الدرس الأول", "الدرس الثاني"]);
    expect(plan.questions).toHaveLength(7);
    expect(plan.questions.filter((q) => q.origin === "textbook").map((q) => q.page)).toEqual([8, 8, 9, undefined]);
    const l1 = plan.book.units[0].lessons[0];
    // No games listed: quiz (3 choice questions), memory (pairs), word maker (2 ordering) are picked.
    expect(l1.games).toEqual(["quiz", "memory", "words"]);
    for (const g of plan.games) {
      expect(validateGame(g)).toEqual([]);
      expect(g.importId).toBe(plan.book.id);
      expect(plan.book.units.flatMap((u) => u.lessons).some((l) => l.id === g.lessonId)).toBe(true);
    }
    // Lesson 2: the rocket world plays bank questions in Arabic but needs 3; train is math-only → skipped with warnings.
    expect(plan.book.units[0].lessons[1].games).toEqual([]);
    expect(plan.issues.some((i) => i.where.includes("الدرس الثاني"))).toBe(true);
  });

  it("math lessons get generated-task games with the requested level", () => {
    const f = sample();
    f.curriculum.id = "test-g1-math";
    f.curriculum.subject = "math";
    f.curriculum.grade = 1;
    f.curriculum.units[0].lessons = [{ id: "a", title: "الجمع", questions: [], games: [{ template: "rocket", level: 2 }, { template: "train" }] }];
    const plan = planImport(validateCurriculumFile(f).file!);
    expect(plan.games.map((g) => g.type)).toEqual(["rocket", "train"]);
    expect(plan.games[0].settings.math?.level).toBe(2);
  });

  it("detects the same book by hash or by its titles", () => {
    const f = sample();
    const a = planImport(f);
    const renamed = { ...f, curriculum: { ...f.curriculum, id: "another-id" } };
    expect(duplicateOf(planImport(renamed), [a.book])).not.toBeNull(); // same titles
    expect(fingerprint({ ...f, curriculum: { ...f.curriculum, textbook: { title: "x", sha256: "ABC" } } })).toBe("sha256:abc");
  });
});

describe("saving an import", () => {
  it("adds new records only, can be undone, and travels in backups", async () => {
    await useData.getState().load();
    const before = useData.getState().questions.length;
    await useData.getState().saveGame({ ...useData.getState().builtins[0], id: "mine", title: "لعبتي" });

    const plan = planImport(validateCurriculumFile(sample()).file!);
    await useData.getState().importCurriculum(plan);
    let s = useData.getState();
    expect(s.curricula.map((b) => b.id)).toEqual([plan.book.id]);
    expect(s.questions.length).toBe(before + plan.questions.length);
    expect(s.games.map((g) => g.id)).toContain("mine");
    expect(s.games.filter((g) => g.importId === plan.book.id)).toHaveLength(plan.games.length);

    // backup → wipe → restore brings the curriculum back with its games and questions
    const backup = JSON.parse(JSON.stringify(makeBackup(await collectBackupData(), "web")));
    expect(backup.curricula).toHaveLength(1);
    await wipe();
    await restoreBackup(parseBackup(backup));
    expect((await curriculaRepo.all()).map((b) => b.id)).toEqual([plan.book.id]);
    expect((await gamesRepo.all()).filter((g) => g.importId).length).toBe(plan.games.length);

    // undo the import: only its own records go
    await useData.getState().refresh();
    await useData.getState().removeCurriculum(plan.book.id);
    s = useData.getState();
    expect(s.curricula).toEqual([]);
    expect((await questionsRepo.all()).some((q) => q.importId)).toBe(false);
    expect(s.games.map((g) => g.id)).toContain("mine");
  });
});
