import { beforeEach, describe, expect, it } from "vitest";
import { gamesRepo, questionsRepo, resetDBConnection, resultsRepo } from "@/lib/db";
import { collectBackupData, makeBackup, parseBackup, restoreBackup } from "@/lib/backup";
import { gameToFile, parseGameFile, parseQuestionsFile, questionsToFile } from "@/lib/transfer";
import { builtinGames, seedQuestions } from "@/content/seed";
import { useData } from "@/store/data";

async function wipe() {
  await resetDBConnection();
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase("heroes-world");
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}

beforeEach(async () => {
  await wipe();
  useData.setState({ ready: false, games: [], questions: [], results: [] });
});

describe("IndexedDB repositories", () => {
  it("saves and retrieves a game", async () => {
    const g = { ...builtinGames()[0], id: "g1", builtin: false };
    await gamesRepo.put(g);
    await resetDBConnection(); // simulate a page reload
    const back = await gamesRepo.get("g1");
    expect(back?.title).toBe(g.title);
    expect(back?.questions.length).toBe(g.questions.length);
  });

  it("exports and restores a full backup", async () => {
    await questionsRepo.putMany(seedQuestions().slice(0, 5));
    await gamesRepo.put({ ...builtinGames()[1], id: "g2", builtin: false });
    await resultsRepo.add({ id: "r1", gameId: "g2", gameTitle: "x", type: "race", grade: 1, subject: "math", startedAt: 1, durationMs: 1000, correct: 3, wrong: 1, score: 30 });
    const backup = JSON.parse(JSON.stringify(makeBackup(await collectBackupData(), "web")));
    await wipe();
    expect(await gamesRepo.all()).toHaveLength(0);
    const r = await restoreBackup(parseBackup(backup));
    expect(r).toMatchObject({ games: 1, questions: 5, results: 1, lessons: 0 });
    expect((await gamesRepo.all())[0].id).toBe("g2");
    expect(await questionsRepo.count()).toBe(5);
  });
});

describe("data store", () => {
  it("seeds the question bank once and persists teacher games across reloads", async () => {
    await useData.getState().load();
    const seeded = useData.getState().questions.length;
    expect(seeded).toBe(seedQuestions().length);

    const src = useData.getState().builtins[0];
    const copy = await useData.getState().duplicateGame(src.id);
    expect(copy?.builtin).toBe(false);
    await useData.getState().saveGame({ ...copy!, title: "لعبتي" });
    await useData.getState().deleteQuestion(useData.getState().questions[0].id);

    // Reload from disk
    await resetDBConnection();
    await useData.getState().refresh();
    const s = useData.getState();
    expect(s.games).toHaveLength(1);
    expect(s.games[0].title).toBe("لعبتي");
    expect(s.questions).toHaveLength(seeded - 1); // the deleted seed question is not re-seeded
  });
});

describe("import / export files", () => {
  it("imports a game with a fresh id so nothing is overwritten", () => {
    const g = builtinGames()[0];
    const imported = parseGameFile(JSON.parse(JSON.stringify(gameToFile(g))));
    expect(imported.id).not.toBe(g.id);
    expect(imported.builtin).toBe(false);
    expect(imported.questions).toHaveLength(g.questions.length);
    expect(() => parseGameFile({ hello: 1 })).toThrow();
  });
  it("imports questions from an export or a plain array", () => {
    const qs = seedQuestions().slice(0, 3);
    expect(parseQuestionsFile(questionsToFile(qs))).toHaveLength(3);
    expect(parseQuestionsFile(qs)).toHaveLength(3);
    expect(() => parseQuestionsFile({ nope: true })).toThrow();
  });
});
