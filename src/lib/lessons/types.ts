import type { LessonGuide } from "@/content/curriculum/types";
import type { GameType, Grade, Question, Subject, Team } from "../types";
import type { TrainQuestion, TrainSettings } from "../train";

export type SegmentKind = "warmup" | "main" | "challenge";

export interface WarmupQuestion {
  /** «ما العدد الذي يأتي قبل/بعد n؟» */
  dir: "before" | "after";
  n: number;
}

export interface NumberLineActivity {
  type: "numberLine";
  min: number;
  max: number;
  questions: WarmupQuestion[];
}

/** A warm-up from the lesson's questions, with instructions for the teacher. */
export interface QuestionsActivity {
  type: "questions";
  instructions: string;
  questions: Question[];
}

export interface WarmupSegment {
  kind: "warmup";
  title: string;
  minutes: number;
  activity: NumberLineActivity | QuestionsActivity;
}

export interface MainSegment {
  kind: "main";
  title: string;
  minutes: number;
  /** gameId: a ready game (built-in or saved) played as it is; otherwise the train settings below. */
  game: { type: GameType; train: TrainSettings; points: number; gameId?: string };
}

export interface ChallengeSegment {
  kind: "challenge";
  title: string;
  minutes: number;
  mode: "class" | "teams";
  teams: Team[];
  /** Seconds per question; 0 = no timer. */
  timer: number;
  range: { min: number; max: number };
  questions: TrainQuestion[];
  /** Lesson questions; when present they are used instead of the train questions. */
  items?: Question[];
}

export type LessonSegment = WarmupSegment | MainSegment | ChallengeSegment;

export interface LessonPlan {
  id: string;
  title: string;
  lessonId: string;
  lessonTitle: string;
  unitTitle: string;
  semester: 1 | 2;
  grade: Grade;
  subject: Subject;
  /** Learning objectives, written by the platform's template (not quoted from the book). */
  objectives: string[];
  template: string;
  segments: [WarmupSegment, MainSegment, ChallengeSegment];
  /** The ready plan of a built-in lesson (read-only; editing it saves a copy). */
  builtin?: boolean;
  guide?: LessonGuide;
  createdAt: number;
  updatedAt: number;
}

export const SEGMENT_META: Record<SegmentKind, { label: string; color: string; emoji: string }> = {
  warmup: { label: "التمهيد", color: "#40C057", emoji: "🟢" },
  main: { label: "اللعبة الرئيسية", color: "#4361EE", emoji: "🔵" },
  challenge: { label: "التحدي الختامي", color: "#7950F2", emoji: "🟣" },
};
