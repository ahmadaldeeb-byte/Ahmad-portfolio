"use client";
import { Field, inputClass } from "./ui";
import { DIFFICULTY_LABELS, GRADES, SUBJECTS } from "@/lib/constants";
import type { Difficulty, Grade, Question, Subject } from "@/lib/types";

export function QuestionMetaFields({ q, onChange }: { q: Question; onChange: (q: Question) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="الصف">
        <select className={inputClass} value={q.grade} onChange={(e) => onChange({ ...q, grade: Number(e.target.value) as Grade })}>
          {GRADES.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
        </select>
      </Field>
      <Field label="المادة">
        <select className={inputClass} value={q.subject} onChange={(e) => onChange({ ...q, subject: e.target.value as Subject })}>
          {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </Field>
      <Field label="الدرس">
        <input className={inputClass} value={q.lesson} placeholder="مثال: الجمع" onChange={(e) => onChange({ ...q, lesson: e.target.value })} />
      </Field>
      <Field label="مستوى الصعوبة">
        <select className={inputClass} value={q.difficulty} onChange={(e) => onChange({ ...q, difficulty: Number(e.target.value) as Difficulty })}>
          {([1, 2, 3] as Difficulty[]).map((d) => <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>)}
        </select>
      </Field>
    </div>
  );
}
