import type { GameType, Grade, Subject } from "@/lib/types";

export type Semester = 1 | 2;

/** Games planned for Grade 1 math that are not playable yet (shown as "قيد التطوير"). */
export type PlannedGame =
  | "island"
  | "crocodile"
  | "rocket"
  | "appleBasket"
  | "factory"
  | "raceAdd"
  | "pirates"
  | "shapes"
  | "pizza"
  | "market"
  | "clock"
  | "measure";

/** Teacher notes for a lesson (objectives, explanation, examples, warm-up). */
export interface LessonGuide {
  objectives: string[];
  explanation: string;
  examples?: string[];
  warmup?: string;
}

export interface CurriculumLesson {
  id: string;
  title: string;
  /** Textbook pages of the lesson. */
  pages?: [number, number];
  guide?: LessonGuide;
  /** Lesson-specific playable games. */
  games: GameType[];
  /** Planned lesson games, not built yet. */
  planned: PlannedGame[];
  /** Lesson-plan template available for «حضّر حصتك». */
  template?: "prev-next";
}

export interface CurriculumUnit {
  id: string;
  number: number;
  title: string;
  semester: Semester;
  lessons: CurriculumLesson[];
}

export interface CurriculumSource {
  name: string;
  url: string;
  checkedOn: string;
  /** "provisional": copied from a secondary index, not matched against the official book. */
  status: "provisional" | "verified";
  note: string;
}

/** Set on curricula imported from a JSON file (stored in IndexedDB, not in the code). */
export interface CurriculumImportInfo {
  importId: string;
  importedAt: number;
  /** Detects importing the same book twice. */
  fingerprint: string;
  title: string;
  semester?: Semester;
  textbook: { title: string; publisher?: string; edition?: string; isbn?: string; pages?: number; sha256?: string };
  counts: { units: number; lessons: number; questions: number; games: number };
}

export interface CurriculumBook {
  id: string;
  /** Built into the app from a curriculum file in curricula/ (always available, read-only). */
  bundled?: boolean;
  imported?: CurriculumImportInfo;
  grade: Grade;
  subject: Subject;
  country: string;
  source: CurriculumSource;
  units: CurriculumUnit[];
}
