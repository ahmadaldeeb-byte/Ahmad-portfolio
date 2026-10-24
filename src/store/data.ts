"use client";
import { create } from "zustand";
import { SEED_VERSION, builtinGames, seedQuestions, seedQuestionsSince } from "@/content/seed";
import { gamesRepo, lessonsRepo, metaRepo, questionsRepo, resultsRepo } from "@/lib/db";
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

export const useData = create<DataState>()((set, get) => ({
  ready: false,
  error: null,
  games: [],
  questions: [],
  results: [],
  lessons: [],
  titleOverrides: {},
  builtins: builtinGames(),

  load: () => {
    loading ??= (async () => {
      try {
        if (!(await metaRepo.get<boolean>("seeded"))) {
          await questionsRepo.putMany(seedQuestions());
          await metaRepo.set("seeded", true);
          await metaRepo.set("seed-version", SEED_VERSION);
        } else {
          const version = (await metaRepo.get<number>("seed-version")) ?? 1;
          if (version < SEED_VERSION) {
            await questionsRepo.putMany(seedQuestionsSince(version));
            await metaRepo.set("seed-version", SEED_VERSION);
          }
        }
        const [games, questions, results, lessons, titleOverrides] = await Promise.all([
          gamesRepo.all(),
          questionsRepo.all(),
          resultsRepo.all(),
          lessonsRepo.all(),
          metaRepo.get<Record<string, string>>("curriculum-titles"),
        ]);
        set({ games, questions, results, lessons, titleOverrides: titleOverrides ?? {}, ready: true, error: null });
      } catch (e) {
        loading = null;
        set({ ready: true, error: e instanceof Error ? e.message : "تعذّر فتح قاعدة البيانات المحلية." });
      }
    })();
    return loading;
  },

  refresh: async () => {
    const [games, questions, results, lessons] = await Promise.all([gamesRepo.all(), questionsRepo.all(), resultsRepo.all(), lessonsRepo.all()]);
    set({ games, questions, results, lessons, ready: true, error: null });
  },

  saveGame: async (g) => {
    const game = { ...g, builtin: false, updatedAt: Date.now() };
    await gamesRepo.put(game);
    set((s) => ({ games: [game, ...s.games.filter((x) => x.id !== game.id)] }));
    return game;
  },
  deleteGame: async (id) => {
    await gamesRepo.remove(id);
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
    await questionsRepo.put(item);
    set((s) => ({ questions: [item, ...s.questions.filter((x) => x.id !== item.id)] }));
  },
  saveQuestions: async (qs) => {
    await questionsRepo.putMany(qs);
    const ids = new Set(qs.map((q) => q.id));
    set((s) => ({ questions: [...qs, ...s.questions.filter((x) => !ids.has(x.id))] }));
  },
  deleteQuestion: async (id) => {
    await questionsRepo.remove(id);
    set((s) => ({ questions: s.questions.filter((q) => q.id !== id) }));
  },
  addResult: async (r) => {
    await resultsRepo.add(r);
    set((s) => ({ results: [r, ...s.results] }));
  },
  clearResults: async () => {
    await resultsRepo.clear();
    set({ results: [] });
  },
  saveLesson: async (p) => {
    const plan = { ...p, updatedAt: Date.now() };
    await lessonsRepo.put(plan);
    set((s) => ({ lessons: [plan, ...s.lessons.filter((x) => x.id !== plan.id)] }));
    return plan;
  },
  deleteLesson: async (id) => {
    await lessonsRepo.remove(id);
    set((s) => ({ lessons: s.lessons.filter((x) => x.id !== id) }));
  },
  setTitleOverride: async (lessonId, title) => {
    const next = { ...get().titleOverrides };
    if (title && title.trim()) next[lessonId] = title.trim();
    else delete next[lessonId];
    await metaRepo.set("curriculum-titles", next);
    set({ titleOverrides: next });
  },
  findGame: (id) => get().games.find((g) => g.id === id) ?? get().builtins.find((g) => g.id === id),
}));
