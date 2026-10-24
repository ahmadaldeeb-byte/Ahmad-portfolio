/*
 * Versioned backup format shared by the web, installed and portable versions.
 *
 * Version 2 keeps the version 1 layout (top-level `games`, `questions`,
 * `results`, `lessons` arrays) so older copies of the app can still read the
 * games, questions and lesson plans in a new file, and adds settings, the
 * teacher's curriculum title corrections and some metadata. Every record is
 * validated on import; damaged records are skipped and reported.
 */
import { GAMES } from "./constants";
import type { CurriculumBook } from "@/content/curriculum/types";
import { curriculaRepo, gamesRepo, getDB, lessonsRepo, metaRepo, questionsRepo, resultsRepo } from "./db";
import type { LessonPlan } from "./lessons/types";
import type { Platform } from "./platform";
import type { GameConfig, GameResult, Question } from "./types";
import { APP_VERSION } from "./version";

export const BACKUP_VERSION = 2;

/** Teacher preferences carried in a backup (the same keys as the settings store). */
export interface BackupSettings {
  volume?: number;
  sfxVolume?: number;
  voiceVolume?: number;
  muted?: boolean;
  voice?: boolean;
  reducedMotion?: boolean;
  numerals?: "arabic" | "hindi";
  quality?: "auto" | "high" | "low";
}

export interface BackupData {
  games: GameConfig[];
  questions: Question[];
  results: GameResult[];
  lessons: LessonPlan[];
  settings?: BackupSettings;
  /** Lesson id → title corrected by the teacher. */
  curriculumTitles?: Record<string, string>;
  /** Curricula imported from JSON files (their questions and games are in the lists above). */
  curricula?: CurriculumBook[];
}

export interface Backup extends BackupData {
  app: "heroes-world";
  kind: "backup";
  version: number;
  exportedAt: number;
  appVersion: string;
  platform: Platform;
  counts: { games: number; questions: number; results: number; lessons: number };
}

export function makeBackup(data: BackupData, platform: Platform, now = Date.now()): Backup {
  return {
    app: "heroes-world",
    kind: "backup",
    version: BACKUP_VERSION,
    exportedAt: now,
    appVersion: APP_VERSION,
    platform,
    counts: { games: data.games.length, questions: data.questions.length, results: data.results.length, lessons: data.lessons.length },
    ...data,
  };
}

export const backupFileName = (now = new Date()) => `heroes-world-backup-${now.toISOString().slice(0, 10)}.json`;

/* ---------- validation ---------- */

const GAME_TYPES = new Set(GAMES.map((g) => g.type));
const GRADES = [1, 2, 3];
const SUBJECTS = ["arabic", "math", "science", "english"];
const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);
const str = (x: unknown) => typeof x === "string" && x.length > 0;

export function isValidQuestion(q: unknown): q is Question {
  if (!isObj(q)) return false;
  return str(q.id) && typeof q.prompt === "string" && typeof q.kind === "string" && GRADES.includes(q.grade as number) && SUBJECTS.includes(q.subject as string) && Array.isArray(q.choices ?? []);
}
export function isValidGame(g: unknown): g is GameConfig {
  if (!isObj(g)) return false;
  return str(g.id) && typeof g.title === "string" && GAME_TYPES.has(g.type as never) && GRADES.includes(g.grade as number) && SUBJECTS.includes(g.subject as string) && Array.isArray(g.questions) && g.questions.every(isValidQuestion) && isObj(g.settings);
}
export function isValidLesson(l: unknown): l is LessonPlan {
  if (!isObj(l) || !str(l.id) || !Array.isArray(l.segments) || l.segments.length !== 3) return false;
  return l.segments.map((s) => (isObj(s) ? s.kind : "")).join(",") === "warmup,main,challenge";
}
export function isValidCurriculum(b: unknown): b is CurriculumBook {
  if (!isObj(b) || !str(b.id) || !GRADES.includes(b.grade as number) || !SUBJECTS.includes(b.subject as string) || !Array.isArray(b.units)) return false;
  return b.units.every((u) => isObj(u) && str(u.id) && typeof u.title === "string" && Array.isArray(u.lessons) && u.lessons.every((l) => isObj(l) && str(l.id) && typeof l.title === "string"));
}
export function isValidResult(r: unknown): r is GameResult {
  return isObj(r) && str(r.id) && typeof r.gameId === "string" && typeof r.startedAt === "number" && GAME_TYPES.has(r.type as never);
}
function cleanSettings(s: unknown): BackupSettings | undefined {
  if (!isObj(s)) return undefined;
  const out: BackupSettings = {};
  for (const k of ["volume", "sfxVolume", "voiceVolume"] as const) if (typeof s[k] === "number" && s[k] >= 0 && s[k] <= 1) out[k] = s[k];
  for (const k of ["muted", "voice", "reducedMotion"] as const) if (typeof s[k] === "boolean") out[k] = s[k];
  if (s.numerals === "arabic" || s.numerals === "hindi") out.numerals = s.numerals;
  if (s.quality === "auto" || s.quality === "high" || s.quality === "low") out.quality = s.quality;
  return out;
}

export interface ParsedBackup {
  data: BackupData;
  version: number;
  platform: Platform | "unknown";
  exportedAt?: number;
  /** Arabic notes for the teacher (skipped records, newer format...). */
  warnings: string[];
}

/** Reads a backup of any version (1, 2 or newer). Throws an Arabic message when the file is not a backup at all. */
export function parseBackup(raw: unknown): ParsedBackup {
  if (!isObj(raw) || raw.app !== "heroes-world" || !Array.isArray(raw.games) || !Array.isArray(raw.questions)) {
    if (isObj(raw) && raw.app === "heroes-world" && raw.kind === "curriculum") throw new Error("هذا ملف منهج، وليس نسخة احتياطية. استورده من صفحة «📚 استيراد منهج».");
    if (isObj(raw) && raw.app === "heroes-world" && typeof raw.kind === "string" && raw.kind !== "backup")
      throw new Error("هذا ملف لعبة أو أسئلة أو حصة مفردة، وليس نسخة احتياطية كاملة. استورده من صفحة «ألعابي» أو «بنك الأسئلة» أو «تحضير الحصص».");
    throw new Error("هذا الملف ليس نسخة احتياطية من عالم الأبطال.");
  }
  const version = typeof raw.version === "number" ? raw.version : 1;
  const warnings: string[] = [];
  const pick = <T,>(list: unknown, ok: (x: unknown) => x is T, label: string): T[] => {
    const arr = Array.isArray(list) ? list : [];
    const good = arr.filter(ok);
    if (good.length < arr.length) warnings.push(`تُجوهل ${arr.length - good.length} من ${label} لأنها تالفة.`);
    return good;
  };
  const data: BackupData = {
    games: pick(raw.games, isValidGame, "الألعاب"),
    questions: pick(raw.questions, isValidQuestion, "الأسئلة"),
    results: pick(raw.results, isValidResult, "النتائج"),
    lessons: pick(raw.lessons, isValidLesson, "الحصص"),
    curricula: pick(raw.curricula, isValidCurriculum, "المناهج المستوردة"),
    settings: cleanSettings(raw.settings),
    curriculumTitles: isObj(raw.curriculumTitles) ? Object.fromEntries(Object.entries(raw.curriculumTitles).filter(([, v]) => typeof v === "string")) as Record<string, string> : undefined,
  };
  if (version > BACKUP_VERSION) warnings.push("النسخة الاحتياطية من إصدار أحدث من التطبيق؛ استُعيدت البيانات المعروفة فقط.");
  const platform = raw.platform === "web" || raw.platform === "desktop" || raw.platform === "portable" ? raw.platform : "unknown";
  return { data, version, platform, exportedAt: typeof raw.exportedAt === "number" ? raw.exportedAt : undefined, warnings };
}

/* ---------- reading and writing the local database ---------- */

/** Collects everything the teacher made. Settings live outside the database, so the caller passes them in. */
export async function collectBackupData(extra: { settings?: BackupSettings } = {}): Promise<BackupData> {
  const [games, questions, results, lessons, curriculumTitles, curricula] = await Promise.all([
    gamesRepo.all(),
    questionsRepo.all(),
    resultsRepo.all(),
    lessonsRepo.all(),
    metaRepo.get<Record<string, string>>("curriculum-titles"),
    curriculaRepo.all(),
  ]);
  return { games, questions, results, lessons, settings: extra.settings, curriculumTitles: curriculumTitles ?? {}, curricula };
}

export type RestoreMode = "merge" | "replace";

/**
 * Restores a parsed backup. "merge" adds and updates records (same id →
 * replaced by the backup's copy) and deletes nothing; "replace" first empties
 * games, questions, results, lessons and imported curricula. Settings are returned for the caller to apply.
 */
export async function restoreBackup(parsed: ParsedBackup, mode: RestoreMode = "merge") {
  const { data } = parsed;
  const db = await getDB();
  const tx = db.transaction(["games", "questions", "results", "lessons", "meta", "curricula"], "readwrite");
  const ops: Promise<unknown>[] = [];
  if (mode === "replace") for (const s of ["games", "questions", "results", "lessons", "curricula"] as const) ops.push(tx.objectStore(s).clear());
  for (const b of data.curricula ?? []) ops.push(tx.objectStore("curricula").put(b));
  for (const g of data.games) ops.push(tx.objectStore("games").put({ ...g, builtin: false }));
  for (const q of data.questions) ops.push(tx.objectStore("questions").put(q));
  for (const r of data.results) ops.push(tx.objectStore("results").put(r));
  for (const l of data.lessons) ops.push(tx.objectStore("lessons").put(l));
  if (data.curriculumTitles) {
    const current = mode === "merge" ? (((await tx.objectStore("meta").get("curriculum-titles"))?.value as Record<string, string>) ?? {}) : {};
    ops.push(tx.objectStore("meta").put({ key: "curriculum-titles", value: { ...current, ...data.curriculumTitles } }));
  }
  // The restored bank already holds the sample questions it wants: don't re-add deleted ones.
  ops.push(tx.objectStore("meta").put({ key: "seeded", value: true }));
  await Promise.all([...ops, tx.done]);
  return { games: data.games.length, questions: data.questions.length, results: data.results.length, lessons: data.lessons.length, settings: data.settings };
}
