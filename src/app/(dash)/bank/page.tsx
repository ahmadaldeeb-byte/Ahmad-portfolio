"use client";
import { Download, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { QuestionEditor } from "@/components/QuestionEditor";
import { toast } from "@/components/Toast";
import { Badge, Button, ConfirmDialog, EmptyState, Field, IconButton, Loading, Modal, PageHeader, Segmented, inputClass } from "@/components/ui";
import { DIFFICULTY_LABELS, GRADES, KIND_LABELS, SUBJECTS, gradeLabel, subjectLabel } from "@/lib/constants";
import { blankQuestion, validateQuestion } from "@/lib/questions";
import { parseQuestionsFile, questionsToFile } from "@/lib/transfer";
import type { Difficulty, Grade, Question, QuestionKind, Subject } from "@/lib/types";
import { downloadJSON, readFileAsText } from "@/lib/utils";
import { useData } from "@/store/data";
import { QuestionMetaFields } from "@/components/QuestionMetaFields";

export default function BankPage() {
  const { questions, ready, saveQuestion, saveQuestions, deleteQuestion } = useData();
  const [grade, setGrade] = useState<Grade | 0>(0);
  const [subject, setSubject] = useState<Subject | "all">("all");
  const [kind, setKind] = useState<QuestionKind | "all">("all");
  const [difficulty, setDifficulty] = useState<Difficulty | 0>(0);
  const [lesson, setLesson] = useState("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Question | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [toDelete, setToDelete] = useState<Question | null>(null);
  const [limit, setLimit] = useState(40);
  const fileRef = useRef<HTMLInputElement>(null);

  const lessons = useMemo(
    () => [...new Set(questions.filter((q) => (grade === 0 || q.grade === grade) && (subject === "all" || q.subject === subject)).map((q) => q.lesson).filter(Boolean))],
    [questions, grade, subject],
  );

  const filtered = useMemo(() => {
    const t = query.trim().toLowerCase();
    return questions.filter(
      (q) =>
        (grade === 0 || q.grade === grade) &&
        (subject === "all" || q.subject === subject) &&
        (kind === "all" || q.kind === kind) &&
        (difficulty === 0 || q.difficulty === difficulty) &&
        (lesson === "all" || q.lesson === lesson) &&
        (!t || q.prompt.toLowerCase().includes(t) || q.lesson.toLowerCase().includes(t) || q.choices.some((c) => c.toLowerCase().includes(t))),
    );
  }, [questions, grade, subject, kind, difficulty, lesson, query]);

  const save = async () => {
    if (!editing) return;
    if (validateQuestion(editing).length) {
      setShowErrors(true);
      return;
    }
    await saveQuestion(editing);
    toast("تم حفظ السؤال");
    setEditing(null);
  };

  const importFile = async (file: File) => {
    try {
      const list = parseQuestionsFile(JSON.parse(await readFileAsText(file)));
      await saveQuestions(list);
      toast(`تم استيراد ${list.length} سؤالًا`);
    } catch (e) {
      toast(e instanceof Error && e.message.length < 80 ? e.message : "تعذّر قراءة الملف", "error");
    }
  };

  return (
    <div>
      <PageHeader
        title="بنك الأسئلة"
        subtitle="نظّم أسئلتك حسب الصف والمادة والدرس، وأعد استخدامها في ألعاب مختلفة."
        actions={
          <>
            <Button variant="secondary" icon={<Upload className="size-5" />} onClick={() => fileRef.current?.click()}>استيراد</Button>
            <Button variant="secondary" icon={<Download className="size-5" />} onClick={() => downloadJSON(`heroes-world-questions-${new Date().toISOString().slice(0, 10)}.json`, questionsToFile(filtered))} disabled={!filtered.length}>
              تصدير ({filtered.length})
            </Button>
            <Button
              icon={<Plus className="size-5" />}
              onClick={() => {
                setShowErrors(false);
                setEditing(blankQuestion({ grade: grade || 1, subject: subject === "all" ? "arabic" : subject, lesson: lesson === "all" ? "" : lesson }));
              }}
            >
              سؤال جديد
            </Button>
          </>
        }
      />
      <input ref={fileRef} type="file" accept="application/json,.json" hidden data-testid="import-questions-input" onChange={(e) => { const f = e.target.files?.[0]; if (f) void importFile(f); e.target.value = ""; }} />

      <div className="mb-5 flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-soft">
        <div className="relative">
          <Search className="absolute start-4 top-1/2 size-5 -translate-y-1/2 text-hero-muted" />
          <input className={`${inputClass} ps-12`} placeholder="ابحث في نص السؤال أو الإجابات..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-3">
          <Segmented value={grade} onChange={(v) => { setGrade(v); setLesson("all"); }} options={[{ value: 0 as const, label: "كل الصفوف" }, ...GRADES.map((g) => ({ value: g.id, label: g.short }))]} />
          <Segmented value={subject} onChange={(v) => { setSubject(v); setLesson("all"); }} options={[{ value: "all" as const, label: "كل المواد" }, ...SUBJECTS.map((s) => ({ value: s.id, label: s.label }))]} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <select aria-label="الدرس" className={inputClass} value={lesson} onChange={(e) => setLesson(e.target.value)}>
            <option value="all">كل الدروس</option>
            {lessons.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select aria-label="نوع السؤال" className={inputClass} value={kind} onChange={(e) => setKind(e.target.value as QuestionKind | "all")}>
            <option value="all">كل الأنواع</option>
            {(Object.keys(KIND_LABELS) as QuestionKind[]).map((k) => <option key={k} value={k}>{KIND_LABELS[k]}</option>)}
          </select>
          <select aria-label="الصعوبة" className={inputClass} value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value) as Difficulty | 0)}>
            <option value={0}>كل المستويات</option>
            {([1, 2, 3] as Difficulty[]).map((d) => <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>)}
          </select>
        </div>
      </div>

      {!ready ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState title="لا توجد أسئلة مطابقة" hint="غيّر خيارات التصفية أو أضف سؤالًا جديدًا." />
      ) : (
        <>
          <p className="mb-3 text-hero-muted">{filtered.length} سؤالًا</p>
          <ul className="flex flex-col gap-3">
            {filtered.slice(0, limit).map((q) => (
              <li key={q.id} className="flex flex-wrap items-center gap-3 rounded-3xl bg-white p-4 shadow-soft">
                {q.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={q.image} alt="" className="size-16 rounded-xl object-cover" />
                )}
                <div className="min-w-60 flex-1">
                  <p className={`text-lg font-bold ${q.subject === "english" ? "ltr-content text-start" : ""}`}>{q.prompt || q.answer}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Badge color="#4361EE">{gradeLabel(q.grade)}</Badge>
                    <Badge color="#7950F2">{subjectLabel(q.subject)}</Badge>
                    {q.lesson && <Badge color="#E67700" className={q.subject === "english" ? "ltr-content" : ""}>{q.lesson}</Badge>}
                    <Badge color="#40C057">{KIND_LABELS[q.kind]}</Badge>
                    <Badge color="#868E96">{DIFFICULTY_LABELS[q.difficulty]}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <IconButton label="تعديل السؤال" className="bg-hero-ink/5 shadow-none" onClick={() => { setShowErrors(false); setEditing(structuredClone(q)); }}>
                    <Pencil className="size-5" />
                  </IconButton>
                  <IconButton label="حذف السؤال" className="bg-hero-red/10 text-hero-red shadow-none" onClick={() => setToDelete(q)}>
                    <Trash2 className="size-5" />
                  </IconButton>
                </div>
              </li>
            ))}
          </ul>
          {filtered.length > limit && (
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" onClick={() => setLimit((l) => l + 40)}>عرض المزيد</Button>
            </div>
          )}
        </>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing && questions.some((x) => x.id === editing.id) ? "تعديل سؤال" : "سؤال جديد"} wide>
        {editing && (
          <div className="flex flex-col gap-5">
            <QuestionMetaFields q={editing} onChange={setEditing} />
            <QuestionEditor value={editing} onChange={setEditing} showErrors={showErrors} />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setEditing(null)}>إلغاء</Button>
              <Button variant="success" onClick={save}>حفظ السؤال</Button>
            </div>
          </div>
        )}
      </Modal>
      <ConfirmDialog
        open={!!toDelete}
        title="حذف السؤال؟"
        message="سيُحذف السؤال من البنك. الألعاب التي تحتوي على نسخة منه لن تتأثر."
        confirmLabel="حذف"
        danger
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) await deleteQuestion(toDelete.id);
          setToDelete(null);
        }}
      />
    </div>
  );
}
