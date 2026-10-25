"use client";
import { create } from "zustand";
import { BUNDLED_GAMES, BUNDLED_QUESTIONS, isBundledQuestion } from "@/content/catalog";
import { SEED_VERSION, builtinGames, seedQuestions, seedQuestionsSince } from "@/content/seed";
import { dataStore } from "@/lib/datastore";
import type { CurriculumBook } from "@/content/curriculum/types";
import type { ImportPlan } from "@/lib/curriculum/import";
import type { LessonPlan } from "@/lib/lessons/types";
import type { GameConfig, GameResult, Question } from "@/lib/types";
import { uid } from "@/lib/utils";

interface DataState {
  ready: boolean;
  error: string | null;
  games: GameConfig[];
  questions: Question[];
  results: GameResult[];
  builtins: GameConfig[];
  lessons: LessonPlan[];
  /** Teacher corrections of curriculum lesson titles, by lesson id. */
  titleOverrides: Record<string, string>;
  /** Curricula imported from JSON files («📚 استيراد منهج»). */
  curricula: CurriculumBook[];
  /** Saves an import plan: the curriculum, its questions and its games (new records only). */
  importCurriculum: (plan: ImportPlan) => Promise<void>;
  /** Removes an imported curriculum with the questions and games it created. */
  removeCurriculum: (id: string) => Promise<void>;
  /** The local database was empty when the app started (first run, or storage was cleared). */
  firstRun: boolean;
  saveLesson: (p: LessonPlan) => Promise<LessonPlan>;
  deleteLesson: (id: string) => Promise<void>;
  setTitleOverride: (lessonId: string, title: string | null) => Promise<void>;
  load: () => Promise<void>;
  /** Re-reads everything from IndexedDB (e.g. after restoring a backup). */
  refresh: () => Promise<void>;
  saveGame: (g: GameConfig) => Promise<GameConfig>;
  deleteGame: (id: string) => Promise<void>;
  duplicateGame: (id: string) => Promise<GameConfig | null>;
  saveQuestion: (q: Question) => Promise<void>;
  saveQuestions: (qs: Question[]) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  addResult: (r: GameResult) => Promise<void>;
  clearResults: () => Promise<void>;
  findGame: (id: string) => GameConfig | undefined;
}

let loading: Promise<void> | null = null;

/**
 * Puts the built-in curricula's questions into the question bank once.
 * Safe to repeat: a question already added (even if the teacher edited or
 * deleted it since) is never added again, so nothing is duplicated or reset.
 */
export async function seedBundledQuestions() {
  const seeded = new Set((await dataStore().meta.get<string[]>("bundled-questions")) ?? []);
  const fresh = BUNDLED_QUESTIONS.filter((q) => !seeded.has(q.id));
  if (!fresh.length) return;
  const existing = new Set((await dataStore().questions.all()).map((q) => q.id));
  const add = fresh.filter((q) => !existing.has(q.id));
  if (add.length) await dataStore().questions.putMany(add);
  await dataStore().meta.set("bundled-questions", [...seeded, ...fresh.map((q) => q.id)]);
}

export const useData = create<DataState>()((set, get) => ({
  ready: false,
  error: null,
  games: [],
  questions: [],
  results: [],
  lessons: [],
  titleOverrides: {},
  firstRun: false,
  curricula: [],
  builtins: [...builtinGames(), ...BUNDLED_GAMES],

  load: () => {
    loading ??= (async () => {
      try {
        const firstRun = !(await dataStore().meta.get<boolean>("seeded"));
        set({ firstRun });
        if (firstRun) {
          await dataStore().questions.putMany(seedQuestions());
          await dataStore().meta.set("seeded", true);
          await dataStore().meta.set("seed-version", SEED_VERSION);
        } else {
          const version = (await dataStore().meta.get<number>("seed-version")) ?? 1;
          if (version < SEED_VERSION) {
            await dataStore().questions.putMany(seedQuestionsSince(version));
            await dataStore().meta.set("seed-version", SEED_VERSION);
          }
        }
        await seedBundledQuestions();
        const [games, questions, results, lessons, titleOverrides, curricula] = await Promise.all([
          dataStore().games.all(),
          dataStore().questions.all(),
          dataStore().results.all(),
          dataStore().lessons.all(),
          dataStore().meta.get<Record<string, string>>("curriculum-titles"),
          dataStore().curricula.all(),
        ]);
        set({ games, questions, results, lessons, curricula, titleOverrides: titleOverrides ?? {}, ready: true, error: null });
      } catch (e) {
        loading = null;
        set({ ready: true, error: e instanceof Error ? e.message : "تعذّر فتح قاعدة البيانات المحلية." });
      }
    })();
    return loading;
  },

  importCurriculum: async (plan) => {
    await dataStore().questions.putMany(plan.questions);
    for (const g of plan.games) await dataStore().games.put(g);
    await dataStore().curricula.put(plan.book);
    await get().refresh();
  },
  removeCurriculum: async (id) => {
    const book = get().curricula.find((b) => b.id === id);
    if (!book) return;
    const importId = book.imported?.importId ?? id;
    for (const g of get().games.filter((x) => x.importId === importId)) await dataStore().games.remove(g.id);
    // Questions of a built-in book stay in the bank (they belong to the built-in curriculum too).
    for (const q of get().questions.filter((x) => x.importId === importId && !isBundledQuestion(x.id))) await dataStore().questions.remove(q.id);
    await dataStore().curricula.remove(id);
    await get().refresh();
  },

  refresh: async () => {
    const [games, questions, results, lessons, titleOverrides, curricula] = await Promise.all([dataStore().games.all(), dataStore().questions.all(), dataStore().results.all(), dataStore().lessons.all(), dataStore().meta.get<Record<string, string>>("curriculum-titles"), dataStore().curricula.all()]);
    set({ games, questions, results, lessons, curricula, titleOverrides: titleOverrides ?? {}, ready: true, error: null });
  },

  saveGame: async (g) => {
    const game = { ...g, builtin: false, updatedAt: Date.now() };
    await dataStore().games.put(game);
    set((s) => ({ games: [game, ...s.games.filter((x) => x.id !== game.id)] }));
    return game;
  },
  deleteGame: async (id) => {
    await dataStore().games.remove(id);
    set((s) => ({ games: s.games.filter((g) => g.id !== id) }));
  },
  duplicateGame: async (id) => {
    const src = get().findGame(id);
    if (!src) return null;
    const now = Date.now();
    const copy: GameConfig = {
      ...structuredClone(src),
      id: uid("g_"),
      title: src.builtin ? src.title : `${src.title} (نسخة)`,
      builtin: false,
      createdAt: now,
      updatedAt: now,
    };
    return get().saveGame(copy);
  },
  saveQuestion: async (q) => {
    const item = { ...q, updatedAt: Date.now() };
    await dataStore().questions.put(item);
    set((s) => ({ questions: [item, ...s.questions.filter((x) => x.id !== item.id)] }));
  },
  saveQuestions: async (qs) => {
    await dataStore().questions.putMany(qs);
    const ids = new Set(qs.map((q) => q.id));
    set((s) => ({ questions: [...qs, ...s.questions.filter((x) => !ids.has(x.id))] }));
  },
  deleteQuestion: async (id) => {
    await dataStore().questions.remove(id);
    set((s) => ({ questions: s.questions.filter((q) => q.id !== id) }));
  },
  addResult: async (r) => {
    await dataStore().results.add(r);
    set((s) => ({ results: [r, ...s.results] }));
  },
  clearResults: async () => {
    await dataStore().results.clear();
    set({ results: [] });
  },
  saveLesson: async (p) => {
    const plan = { ...p, updatedAt: Date.now() };
    await dataStore().lessons.put(plan);
    set((s) => ({ lessons: [plan, ...s.lessons.filter((x) => x.id !== plan.id)] }));
    return plan;
  },
  deleteLesson: async (id) => {
    await dataStore().lessons.remove(id);
    set((s) => ({ lessons: s.lessons.filter((x) => x.id !== id) }));
  },
  setTitleOverride: async (lessonId, title) => {
    const next = { ...get().titleOverrides };
    if (title && title.trim()) next[lessonId] = title.trim();
    else delete next[lessonId];
    await dataStore().meta.set("curriculum-titles", next);
    set({ titleOverrides: next });
  },
  findGame: (id) => get().games.find((g) => g.id === id) ?? get().builtins.find((g) => g.id === id),
}));
