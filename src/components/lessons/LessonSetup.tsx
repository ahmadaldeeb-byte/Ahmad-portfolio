"use client";
import { Check, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { BOOKS, findLesson, lessonTitle } from "@/content/curriculum";
import { GRADES, SUBJECTS } from "@/lib/constants";
import { prepareLesson } from "@/lib/lessons/engine";
import { cn } from "@/lib/utils";
import { useData } from "@/store/data";
import { toast } from "../Toast";
import { Badge, Button, Card, PageHeader } from "../ui";

/** «حضّر حصتك»: grade → subject → semester → unit → lesson, then create. */
export function LessonSetup() {
  const params = useSearchParams();
  const router = useRouter();
  const { titleOverrides, saveLesson } = useData();
  const pre = findLesson(params.get("lesson") ?? "");
  const [grade, setGrade] = useState<number | null>(pre ? pre.book.grade : null);
  const [subject, setSubject] = useState<string | null>(pre ? pre.book.subject : null);
  const [semester, setSemester] = useState<1 | 2 | null>(pre ? pre.unit.semester : null);
  const [unitId, setUnitId] = useState<string | null>(pre ? pre.unit.id : null);
  const [lessonId, setLessonId] = useState<string | null>(pre ? pre.lesson.id : null);
  const [busy, setBusy] = useState(false);

  const book = BOOKS.find((b) => b.grade === grade && b.subject === subject);
  const unit = book?.units.find((u) => u.id === unitId);
  const lesson = unit?.lessons.find((l) => l.id === lessonId);

  const create = async () => {
    if (!lessonId) return;
    setBusy(true);
    const plan = prepareLesson(lessonId, titleOverrides);
    if (!plan) {
      setBusy(false);
      toast("قالب الحصة لهذا الدرس غير متوفر بعد", "error");
      return;
    }
    await saveLesson(plan);
    toast("تم تجهيز الحصة");
    router.push(`/lessons/edit?id=${plan.id}`);
  };

  const Step = ({ n, title, done, children }: { n: number; title: string; done: boolean; children: React.ReactNode }) => (
    <Card className="flex flex-col gap-3">
      <h2 className="flex items-center gap-3 text-xl font-extrabold">
        <span className={cn("grid size-9 place-items-center rounded-full font-display", done ? "bg-hero-green text-white" : "bg-hero-ink/10")}>{done ? <Check className="size-5" /> : n}</span>
        {title}
      </h2>
      {children}
    </Card>
  );
  const Choice = ({ active, onClick, children, disabled }: { active: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-12 cursor-pointer rounded-2xl border-2 px-4 py-2 text-start font-display text-lg font-bold transition disabled:cursor-not-allowed disabled:opacity-40",
        active ? "border-hero-blue bg-hero-blue/10 text-hero-blue" : "border-hero-ink/10 bg-white hover:border-hero-blue/40",
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="حضّر حصتك ✨" subtitle="اختر الدرس، وستجهّز المنصة حصة تفاعلية من ١٥ دقيقة بقوالب تعليمية جاهزة يمكنك تعديلها." />
      <Step n={1} title="الصف الدراسي" done={grade !== null}>
        <div className="flex flex-wrap gap-2">
          {GRADES.map((g) => (
            <Choice key={g.id} active={grade === g.id} onClick={() => { setGrade(g.id); setSubject(null); setSemester(null); setUnitId(null); setLessonId(null); }}>
              {g.label}
            </Choice>
          ))}
        </div>
      </Step>
      {grade !== null && (
        <Step n={2} title="المادة" done={subject !== null}>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map((s) => {
              const has = BOOKS.some((b) => b.grade === grade && b.subject === s.id);
              return (
                <Choice key={s.id} disabled={!has} active={subject === s.id} onClick={() => { setSubject(s.id); setSemester(null); setUnitId(null); setLessonId(null); }}>
                  {s.label} {!has && <span className="text-sm font-normal">(لا يوجد فهرس بعد)</span>}
                </Choice>
              );
            })}
          </div>
        </Step>
      )}
      {book && (
        <Step n={3} title="الفصل الدراسي" done={semester !== null}>
          <div className="flex flex-wrap gap-2">
            {([1, 2] as const).map((s) => (
              <Choice key={s} active={semester === s} onClick={() => { setSemester(s); setUnitId(null); setLessonId(null); }}>
                {s === 1 ? "الفصل الأول" : "الفصل الثاني"}
              </Choice>
            ))}
          </div>
          <p className="text-sm text-hero-muted">الفهرس مؤقت وغير متحقَّق منه مع الكتاب الرسمي بعد. يمكنك تصحيح العناوين من صفحة «المنهاج».</p>
        </Step>
      )}
      {book && semester && (
        <Step n={4} title="الوحدة" done={unitId !== null}>
          <div className="grid gap-2 md:grid-cols-2">
            {book.units.filter((u) => u.semester === semester).map((u) => (
              <Choice key={u.id} active={unitId === u.id} onClick={() => { setUnitId(u.id); setLessonId(null); }}>
                {u.number}. {u.title}
                {u.lessons.some((l) => l.template) && <Badge color="#E64980" className="ms-2">✨</Badge>}
              </Choice>
            ))}
          </div>
        </Step>
      )}
      {unit && (
        <Step n={5} title="الدرس" done={lessonId !== null}>
          <div className="grid gap-2 md:grid-cols-2">
            {unit.lessons.map((l) => (
              <Choice key={l.id} active={lessonId === l.id} onClick={() => setLessonId(l.id)}>
                {lessonTitle(l, titleOverrides)}
                {l.template ? <Badge color="#E64980" className="ms-2">✨ قالب جاهز</Badge> : <Badge color="#868E96" className="ms-2">قالبه قيد الإعداد</Badge>}
              </Choice>
            ))}
          </div>
        </Step>
      )}
      {lesson && (
        <Card className="flex flex-col items-center gap-3 text-center">
          {lesson.template ? (
            <>
              <p className="text-lg">ستتكوّن الحصة من: 🟢 تمهيد ٣ دقائق ← 🔵 لعبة رئيسية ٧ دقائق ← 🟣 تحدٍّ ختامي ٥ دقائق.</p>
              <Button size="xl" icon={<Sparkles className="size-8" />} disabled={busy} onClick={create} className="bg-gradient-to-l from-hero-purple to-hero-pink">
                إنشاء الحصة
              </Button>
            </>
          ) : (
            <p className="text-lg text-hero-muted">قالب الحصة لهذا الدرس قيد الإعداد. القالب المتوفر الآن: «العدد السابق والعدد التالي» في الوحدة الثالثة.</p>
          )}
        </Card>
      )}
    </div>
  );
}
