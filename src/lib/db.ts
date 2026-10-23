import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { GameConfig, GameResult, Question } from "./types";

interface HeroesDB extends DBSchema {
  games: { key: string; value: GameConfig; indexes: { byUpdated: number } };
  questions: { key: string; value: Question; indexes: { byGrade: number; bySubject: string } };
  results: { key: string; value: GameResult; indexes: { byStarted: number } };
  meta: { key: string; value: { key: string; value: unknown } };
}

const DB_NAME = "heroes-world";
const DB_VERSION = 1;
let dbPromise: Promise<IDBPDatabase<HeroesDB>> | null = null;

export function getDB() {
  if (typeof indexedDB === "undefined") throw new Error("المتصفح لا يدعم التخزين المحلي (IndexedDB).");
  dbPromise ??= openDB<HeroesDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const games = db.createObjectStore("games", { keyPath: "id" });
      games.createIndex("byUpdated", "updatedAt");
      const qs = db.createObjectStore("questions", { keyPath: "id" });
      qs.createIndex("byGrade", "grade");
      qs.createIndex("bySubject", "subject");
      const results = db.createObjectStore("results", { keyPath: "id" });
      results.createIndex("byStarted", "startedAt");
      db.createObjectStore("meta", { keyPath: "key" });
    },
  });
  return dbPromise;
}

/** Test helper: closes and forgets the connection. */
export async function resetDBConnection() {
  if (dbPromise) (await dbPromise).close();
  dbPromise = null;
}

export const gamesRepo = {
  async all() {
    const db = await getDB();
    return (await db.getAll("games")).sort((a, b) => b.updatedAt - a.updatedAt);
  },
  async get(id: string) {
    return (await getDB()).get("games", id);
  },
  async put(game: GameConfig) {
    await (await getDB()).put("games", game);
    return game;
  },
  async remove(id: string) {
    await (await getDB()).delete("games", id);
  },
};

export const questionsRepo = {
  async all() {
    const db = await getDB();
    return (await db.getAll("questions")).sort((a, b) => b.updatedAt - a.updatedAt);
  },
  async put(q: Question) {
    await (await getDB()).put("questions", q);
    return q;
  },
  async putMany(list: Question[]) {
    const db = await getDB();
    const tx = db.transaction("questions", "readwrite");
    await Promise.all([...list.map((q) => tx.store.put(q)), tx.done]);
  },
  async remove(id: string) {
    await (await getDB()).delete("questions", id);
  },
  async count() {
    return (await getDB()).count("questions");
  },
};

export const resultsRepo = {
  async all() {
    const db = await getDB();
    return (await db.getAll("results")).sort((a, b) => b.startedAt - a.startedAt);
  },
  async add(r: GameResult) {
    await (await getDB()).put("results", r);
  },
  async clear() {
    await (await getDB()).clear("results");
  },
};

export const metaRepo = {
  async get<T>(key: string): Promise<T | undefined> {
    return (await (await getDB()).get("meta", key))?.value as T | undefined;
  },
  async set(key: string, value: unknown) {
    await (await getDB()).put("meta", { key, value });
  },
};

export interface Backup {
  app: "heroes-world";
  version: 1;
  exportedAt: number;
  games: GameConfig[];
  questions: Question[];
  results: GameResult[];
}

export async function exportBackup(): Promise<Backup> {
  const [games, questions, results] = await Promise.all([gamesRepo.all(), questionsRepo.all(), resultsRepo.all()]);
  return { app: "heroes-world", version: 1, exportedAt: Date.now(), games, questions, results };
}

export function isBackup(x: unknown): x is Backup {
  const b = x as Backup;
  return !!b && b.app === "heroes-world" && Array.isArray(b.games) && Array.isArray(b.questions);
}

/** Restores a backup by merging records (same id → overwritten). */
export async function importBackup(b: Backup) {
  const db = await getDB();
  const tx = db.transaction(["games", "questions", "results"], "readwrite");
  const ops: Promise<unknown>[] = [];
  for (const g of b.games) ops.push(tx.objectStore("games").put(g));
  for (const q of b.questions) ops.push(tx.objectStore("questions").put(q));
  for (const r of b.results ?? []) ops.push(tx.objectStore("results").put(r));
  await Promise.all([...ops, tx.done]);
  return { games: b.games.length, questions: b.questions.length, results: b.results?.length ?? 0 };
}
