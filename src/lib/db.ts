import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { CurriculumBook } from "@/content/curriculum/types";
import type { LessonPlan } from "./lessons/types";
import type { GameConfig, GameResult, Question } from "./types";

interface HeroesDB extends DBSchema {
  games: { key: string; value: GameConfig; indexes: { byUpdated: number } };
  questions: { key: string; value: Question; indexes: { byGrade: number; bySubject: string } };
  results: { key: string; value: GameResult; indexes: { byStarted: number } };
  meta: { key: string; value: { key: string; value: unknown } };
  lessons: { key: string; value: LessonPlan };
  curricula: { key: string; value: CurriculumBook };
}

const DB_NAME = "heroes-world";
const DB_VERSION = 3;
let dbPromise: Promise<IDBPDatabase<HeroesDB>> | null = null;

export function getDB() {
  if (typeof indexedDB === "undefined") throw new Error("المتصفح لا يدعم التخزين المحلي (IndexedDB).");
  dbPromise ??= openDB<HeroesDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 2 && !db.objectStoreNames.contains("lessons")) db.createObjectStore("lessons", { keyPath: "id" });
      if (oldVersion < 3 && !db.objectStoreNames.contains("curricula")) db.createObjectStore("curricula", { keyPath: "id" });
      if (oldVersion >= 1) return;
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

export const lessonsRepo = {
  async all() {
    const db = await getDB();
    return (await db.getAll("lessons")).sort((a, b) => b.updatedAt - a.updatedAt);
  },
  async put(plan: LessonPlan) {
    await (await getDB()).put("lessons", plan);
    return plan;
  },
  async remove(id: string) {
    await (await getDB()).delete("lessons", id);
  },
};

/** Curricula imported from JSON files (the built-in index lives in the code). */
export const curriculaRepo = {
  async all() {
    return (await getDB()).getAll("curricula");
  },
  async put(book: CurriculumBook) {
    await (await getDB()).put("curricula", book);
  },
  async remove(id: string) {
    await (await getDB()).delete("curricula", id);
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

/** Version 1 backup helpers, kept for existing callers; new code uses `./backup`. */
export type { Backup } from "./backup";
