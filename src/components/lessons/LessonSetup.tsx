"use client";
import { Check, Eye, Pencil, Play, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CATALOG, findLesson } from "@/content/catalog";
import { lessonTitle } from "@/content/curriculum";
import { GRADES, SUBJECTS } from "@/lib/constants";
import { builtinPlan, prepareLesson, totalMinutes } from "@/lib/lessons/engine";
import { SEGMENT_META } from "@/lib/lessons/types";
import { cn } from "@/lib/utils";
import { useData } from "@/store/data";
import { toast } from "../Toast";
import { Badge, Button, Card, PageHeader } from "../ui";

/** «حضّر حصتك»: grade → subject → semester → unit → lesson, then create. */
export function LessonSetup() {
  const params = useSearchParams();
  const router = useRouter();
  const { titleOverrides, saveLesson, lessons, findGame } = useData();
  const pre = findLesson(params.get("lesson") ?? "");
  const [grade, setGrade] = useState<number | null>(pre ? pre.book.grade : null);
  const [subject, setSubject] = useState<string | null>(pre ? pre.book.subject : null);
  const [semester, setSemester] = useState<1 | 2 | null>(pre ? pre.unit.semester : null);
  const [unitId, setUnitId] = useState<string | null>(pre ? pre.unit.id : null);
  const [lessonId, setLessonId] = useState<string | null>(pre ? pre.lesson.id : null);
  const [busy, setBusy] = useState(false);

  // Built-in textbooks first; Grade 1 math semester 2 comes from the provisional index.
  const books = CATALOG.filter((b) => b.grade === grade && b.subject === subject);
  const book = books[0];
  const units = books.flatMap((b) => b.units);
  const semesters = [...new Set(units.map((u) => u.semester))].sort();
  const unit = units.find((u) => u.id === unitId);
  const unitBook = books.find((b) => b.units.some((u) => u.id === unitId));
  const lesson = unit?.lessons.find((l) => l.id === lessonId);
  const ready = lesson ? builtinPlan(lesson.id, titleOverrides) : null;
  const mine = lesson ? lessons.filter((l) => l.lessonId === lesson.id) : [];

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
              const has = CATALOG.some((b) => b.grade === grade && b.subject === s.id);
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
            {semesters.map((s) => (
              <Choice key={s} active={semester === s} onClick={() => { setSemester(s); setUnitId(null); setLessonId(null); }}>
                {s === 1 ? "الفصل الأول" : "الفصل الثاني"}
              </Choice>
            ))}
          </div>
          {books.some((b) => b.source.status !== "verified") && <p className="text-sm text-hero-muted">الفصل الذي لا يوجد له كتاب مدرسي بعد يأتي من فهرس مؤقت غير متحقَّق منه. يمكنك تصحيح العناوين من صفحة «المنهاج».</p>}
        </Step>
      )}
      {book && semester && (
        <Step n={4} title="الوحدة" done={unitId !== null}>
          <div className="grid gap-2 md:grid-cols-2">
            {units.filter((u) => u.semester === semester).map((u) => (
              <Choice key={u.id} active={unitId === u.id} onClick={() => { setUnitId(u.id); setLessonId(null); }}>
                {u.number}. {u.title}
                {(u.lessons.some((l) => l.template) || books.find((b) => b.units.includes(u))?.bundled) && <Badge color="#E64980" className="ms-2">✨</Badge>}
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
                {unitBook?.bundled || l.template ? <Badge color="#E64980" className="ms-2">✨ حصة جاهزة</Badge> : <Badge color="#868E96" className="ms-2">قالبه قيد الإعداد</Badge>}
              </Choice>
            ))}
          </div>
        </Step>
      )}
      {lesson && (
        <Card className="flex flex-col items-center gap-3 text-center">
          {ready ? (
            <div className="flex w-full flex-col items-center gap-4" data-testid="ready-plan">
              <h2 className="font-display text-2xl font-extrabold">✨ الحصة الجاهزة: {lessonTitle(lesson, titleOverrides)}</h2>
              <div className="flex w-full max-w-2xl gap-2">
                {ready.segments.map((s) => (
                  <div key={s.kind} style={{ flex: s.minutes, background: SEGMENT_META[s.kind].color }} className="rounded-2xl p-3 text-white">
                    <p className="font-display font-bold">{SEGMENT_META[s.kind].emoji} {SEGMENT_META[s.kind].label}</p>
                    <p className="text-sm">{s.kind === "main" ? findGame(s.game.gameId ?? "")?.title ?? s.title : s.kind === "warmup" && s.activity.type === "questions" ? `${s.activity.questions.length} أسئلة` : s.kind === "challenge" ? `${s.items?.length ?? s.questions.length} أسئلة` : s.title}</p>
                    <p className="font-display text-2xl font-extrabold">{s.minutes} د</p>
                  </div>
                ))}
              </div>
              <p className="text-hero-muted">المدة: {totalMinutes(ready)} دقيقة. تعديل الحصة يحفظ نسخة خاصة بك ولا يغيّر الأصل.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href={`/lesson-run?id=${ready.id}`} className="btn-3d inline-flex min-h-14 items-center gap-2 rounded-2xl bg-hero-green px-6 font-display text-xl font-bold text-white">
                  <Play className="size-6 fill-current" /> ابدأ الحصة الآن
                </Link>
                <Link href={`/lessons/edit?id=${ready.id}`} className="btn-3d inline-flex min-h-14 items-center gap-2 rounded-2xl bg-white px-6 font-display text-xl font-bold">
                  <Eye className="size-6" /> معاينة المراحل وتعديلها
                </Link>
              </div>
              {lesson.template && (
                <Button variant="secondary" icon={<Sparkles className="size-5" />} disabled={busy} onClick={create}>
                  إنشاء حصة بقالب «السابق والتالي» (خط الأعداد وقطار الأرقام)
                </Button>
              )}
              {mine.length > 0 && (
                <div className="w-full max-w-2xl text-start">
                  <p className="font-bold">حصصك المحفوظة لهذا الدرس:</p>
                  <ul className="flex flex-col gap-2">
                    {mine.map((m) => (
                      <li key={m.id} className="flex flex-wrap items-center gap-2 rounded-2xl bg-hero-ink/5 p-2">
                        <span className="flex-1 font-bold">{m.title}</span>
                        <Link href={`/lesson-run?id=${m.id}`} className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-hero-green px-3 font-bold text-white"><Play className="size-4" /> تشغيل</Link>
                        <Link href={`/lessons/edit?id=${m.id}`} className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-white px-3 font-bold"><Pencil className="size-4" /> فتح</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : lesson.template ? (
            <>
              <p className="text-lg">ستتكوّن الحصة من: 🟢 تمهيد ٣ دقائق ← 🔵 لعبة رئيسية ٧ دقائق ← 🟣 تحدٍّ ختامي ٥ دقائق.</p>
              <Button size="xl" icon={<Sparkles className="size-8" />} disabled={busy} onClick={create} className="bg-gradient-to-l from-hero-purple to-hero-pink">
                إنشاء الحصة
              </Button>
            </>
          ) : (
            <p className="text-lg text-hero-muted">لا توجد حصة جاهزة لهذا الدرس بعد: دروس هذا الفصل من فهرس مؤقت، وستُجهَّز حصصها عند إضافة كتابه المدرسي.</p>
          )}
        </Card>
      )}
    </div>
  );
}
