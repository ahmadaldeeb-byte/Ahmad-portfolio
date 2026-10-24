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

export interface CurriculumLesson {
  id: string;
  title: string;
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

export interface CurriculumBook {
  id: string;
  grade: Grade;
  subject: Subject;
  country: string;
  source: CurriculumSource;
  units: CurriculumUnit[];
}
