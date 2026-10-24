/*
 * The one place the app's data store is chosen. Today it is the local
 * IndexedDB store (same on web, installed and portable). Future teacher
 * accounts can provide another implementation (e.g. one that syncs with a
 * server) with the same shape, without touching the games or the pages.
 */
import { curriculaRepo, gamesRepo, lessonsRepo, metaRepo, questionsRepo, resultsRepo } from "./db";

export interface DataStore {
  /** Identifies the store, e.g. "local" or a future "cloud:<teacher id>". */
  id: string;
  games: typeof gamesRepo;
  questions: typeof questionsRepo;
  results: typeof resultsRepo;
  lessons: typeof lessonsRepo;
  meta: typeof metaRepo;
  curricula: typeof curriculaRepo;
}

export const localStore: DataStore = { id: "local", games: gamesRepo, questions: questionsRepo, results: resultsRepo, lessons: lessonsRepo, meta: metaRepo, curricula: curriculaRepo };

let active: DataStore = localStore;
export const dataStore = () => active;
/** Switches the store (call before the data is loaded). */
export function setDataStore(store: DataStore) {
  active = store;
}
