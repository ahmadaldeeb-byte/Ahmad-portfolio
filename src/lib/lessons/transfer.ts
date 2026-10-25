import { uid } from "../utils";
import type { LessonPlan } from "./types";

export interface LessonFile {
  app: "heroes-world";
  kind: "lesson";
  version: 1;
  lesson: LessonPlan;
}

export const lessonToFile = (lesson: LessonPlan): LessonFile => ({ app: "heroes-world", kind: "lesson", version: 1, lesson });

/** Parses an exported lesson. Gives it a fresh id so importing never overwrites. */
export function parseLessonFile(data: unknown): LessonPlan {
  const f = data as LessonFile;
  const l = f?.lesson;
  if (!f || f.app !== "heroes-world" || f.kind !== "lesson" || !l || !Array.isArray(l.segments) || l.segments.length !== 3)
    throw new Error("هذا الملف ليس حصة من عالم الأبطال.");
  const kinds = l.segments.map((s) => s.kind).join(",");
  if (kinds !== "warmup,main,challenge") throw new Error("مراحل الحصة في الملف غير صحيحة.");
  const now = Date.now();
  return { ...l, id: uid("ls_"), createdAt: now, updatedAt: now };
}
