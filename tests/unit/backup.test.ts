import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { BACKUP_VERSION, collectBackupData, makeBackup, parseBackup, restoreBackup } from "@/lib/backup";
import { gamesRepo, lessonsRepo, metaRepo, questionsRepo, resetDBConnection, resultsRepo } from "@/lib/db";
import { builtinGames, seedQuestions } from "@/content/seed";
import { duplicatePlan, prepareLesson } from "@/lib/lessons/engine";
import { findLesson } from "@/content/curriculum";
import { APP_VERSION } from "@/lib/version";

async function wipe() {
  await resetDBConnection();
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase("heroes-world");
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
  });
}

const game = (id: string) => ({ ...builtinGames().find((g) => g.type === "quiz")!, id, builtin: false });
const result = (id: string) => ({ id, gameId: "g1", gameTitle: "x", type: "quiz" as const, grade: 1 as const, subject: "math" as const, startedAt: 5, durationMs: 1000, correct: 3, wrong: 1, score: 30 });
const lesson = () => duplicatePlan(prepareLesson(findLesson("g1m-u3-l3")!.lesson.id)!);

beforeEach(wipe);

describe("backup format v2", () => {
  it("app version matches package.json", () => {
    expect(APP_VERSION).toBe(JSON.parse(readFileSync("package.json", "utf8")).version);
  });

  it("round-trips games, questions, results, lessons, settings and curriculum titles", async () => {
    await gamesRepo.put(game("g1"));
    await questionsRepo.putMany(seedQuestions().slice(0, 4));
    await resultsRepo.add(result("r1"));
    const plan = lesson();
    await lessonsRepo.put(plan);
    await metaRepo.set("curriculum-titles", { "g1m-u1-l1": "عنوان مصحّح" });
    const b = makeBackup(await collectBackupData({ settings: { volume: 0.4, numerals: "hindi" } }), "portable");
    expect(b).toMatchObject({ app: "heroes-world", kind: "backup", version: BACKUP_VERSION, platform: "portable", appVersion: APP_VERSION, counts: { games: 1, questions: 4, results: 1, lessons: 1 } });
    const file = JSON.parse(JSON.stringify(b));

    await wipe();
    const parsed = parseBackup(file);
    expect(parsed.warnings).toEqual([]);
    expect(parsed.platform).toBe("portable");
    const r = await restoreBackup(parsed);
    expect(r).toMatchObject({ games: 1, questions: 4, results: 1, lessons: 1, settings: { volume: 0.4, numerals: "hindi" } });
    expect((await gamesRepo.get("g1"))?.title).toBe(game("g1").title);
    expect((await lessonsRepo.all())[0].id).toBe(plan.id);
    expect(await metaRepo.get("curriculum-titles")).toEqual({ "g1m-u1-l1": "عنوان مصحّح" });
    // a restored bank is not re-seeded with sample questions the teacher had deleted
    expect(await metaRepo.get("seeded")).toBe(true);
  });

  it("reads version 1 backups (no kind, settings or titles)", async () => {
    const v1 = { app: "heroes-world", version: 1, exportedAt: 1, games: [game("old")], questions: seedQuestions().slice(0, 2), results: [result("r9")] };
    const parsed = parseBackup(JSON.parse(JSON.stringify(v1)));
    expect(parsed.version).toBe(1);
    expect(parsed.platform).toBe("unknown");
    const r = await restoreBackup(parsed);
    expect(r).toMatchObject({ games: 1, questions: 2, results: 1, lessons: 0 });
  });

  it("keeps the version 1 layout so older copies of the app can read new files", () => {
    const b = makeBackup({ games: [game("g")], questions: [], results: [], lessons: [] }, "web");
    // the check used by version 1 of the app
    const v1IsBackup = (x: { app?: string; games?: unknown; questions?: unknown }) => x.app === "heroes-world" && Array.isArray(x.games) && Array.isArray(x.questions);
    expect(v1IsBackup(JSON.parse(JSON.stringify(b)))).toBe(true);
  });

  it("skips damaged records and reports them; rejects files that are not backups", () => {
    const bad = { app: "heroes-world", version: 2, games: [game("ok"), { id: "x", type: "nope" }], questions: [{ prompt: 1 }], results: [], lessons: [{ id: "l", segments: [] }] };
    const parsed = parseBackup(bad);
    expect(parsed.data.games.map((g) => g.id)).toEqual(["ok"]);
    expect(parsed.data.questions).toEqual([]);
    expect(parsed.data.lessons).toEqual([]);
    expect(parsed.warnings).toHaveLength(3);
    expect(() => parseBackup({ hello: 1 })).toThrow("ليس نسخة احتياطية");
    expect(() => parseBackup({ app: "heroes-world", kind: "game", version: 1, game: game("g") })).toThrow("ملف لعبة");
    expect(parseBackup({ ...bad, version: 9 }).warnings.at(-1)).toContain("إصدار أحدث");
  });

  it("merge keeps local data; replace empties it first", async () => {
    await gamesRepo.put(game("mine"));
    const incoming = parseBackup(JSON.parse(JSON.stringify(makeBackup({ games: [game("theirs")], questions: [], results: [], lessons: [] }, "desktop"))));
    await restoreBackup(incoming, "merge");
    expect((await gamesRepo.all()).map((g) => g.id).sort()).toEqual(["mine", "theirs"]);
    await restoreBackup(incoming, "replace");
    expect((await gamesRepo.all()).map((g) => g.id)).toEqual(["theirs"]);
  });

  it("only accepts known settings values", () => {
    const parsed = parseBackup({ app: "heroes-world", games: [], questions: [], settings: { volume: 7, muted: true, numerals: "roman", quality: "low" } });
    expect(parsed.data.settings).toEqual({ muted: true, quality: "low" });
  });
});
