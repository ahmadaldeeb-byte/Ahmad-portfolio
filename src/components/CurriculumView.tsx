"use client";
import { motion } from "motion/react";
import { BookOpen, ChevronDown, ExternalLink, Eye, Hourglass, Pencil, Play, Sparkles, TriangleAlert, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CATALOG } from "@/content/catalog";
import { PLANNED_GAME_NAMES, lessonTitle, type CurriculumBook, type CurriculumLesson } from "@/content/curriculum";
import { builtinPlan } from "@/lib/lessons/engine";
import { SEGMENT_META } from "@/lib/lessons/types";
import { GRADES, SUBJECTS } from "@/lib/constants";
import type { LessonPlan } from "@/lib/lessons/types";
import type { GameConfig, Question } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useData } from "@/store/data";
import { GameCard } from "./GameCard";
import { toast } from "./Toast";
import { Badge, Button, EmptyState, IconButton, PageHeader, Segmented, inputClass } from "./ui";

export function CurriculumView() {
  const params = useSearchParams();
  const router = useRouter();
  const { builtins, games: saved, curricula, titleOverrides, setTitleOverride, questions, lessons: plans } = useData();
  const [grade, setGrade] = useState(Number(params.get("grade")) || 1);
  const [subject, setSubject] = useState(params.get("subject") || "math");
  // The built-in textbooks and the curricula imported from files («📚 استيراد منهج»); an imported copy of a built-in book is not shown twice.
  const books = [...CATALOG, ...curricula.filter((c) => !CATALOG.some((b) => b.id === c.id))].filter((b) => b.grade === grade && b.subject === subject);
  const [bookId, setBookId] = useState(params.get("book"));
  const [semester, setSemester] = useState<1 | 2>(1);
  const allSemesters = [...new Set(books.flatMap((b) => b.units.map((u) => u.semester)))].sort();
  const pickedSemester = allSemesters.includes(semester) ? semester : (allSemesters[0] ?? 1);
  const semesterBooks = books.filter((b) => b.units.some((u) => u.semester === pickedSemester));
  const book: CurriculumBook | undefined = semesterBooks.find((b) => b.id === bookId) ?? semesterBooks[0];
  const [tab, setTab] = useState<"guide" | "games" | "plan" | "edit">("guide");
  const [openUnit, setOpenUnit] = useState<string | null>(params.get("unit"));
  const [openLesson, setOpenLesson] = useState<string | null>(params.get("lesson"));
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const shownSemester = pickedSemester;
  // Built-in games and the teacher's copies (a saved game replaces a built-in one with the same id).
  const lessonGames = (l: CurriculumLesson) => [...saved, ...builtins].filter((g, i, all) => g.lessonId === l.id && all.findIndex((x) => x.id === g.id) === i);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="المنهاج والدروس"
        subtitle="اختر الصف ← المادة ← الفصل ← الوحدة ← الدرس، لتظهر الألعاب المناسبة للدرس."
        actions={
          <Link href="/lessons/new" className="btn-3d inline-flex min-h-12 items-center gap-2 rounded-2xl bg-gradient-to-l from-hero-purple to-hero-pink px-5 font-display text-lg font-bold text-white">
            <Sparkles className="size-5" /> حضّر حصتك الآن ✨
          </Link>
        }
      />
      <div className="flex flex-wrap gap-3 rounded-3xl bg-white p-4 shadow-soft">
        <Segmented value={grade} onChange={setGrade} options={GRADES.map((g) => ({ value: g.id as number, label: g.label }))} />
        <Segmented value={subject} onChange={setSubject} options={SUBJECTS.map((s) => ({ value: s.id as string, label: s.label }))} />
      </div>

      {!book ? (
        <EmptyState
          title="لا يوجد فهرس لهذا الاختيار بعد"
          hint="الفهرس المدمج: رياضيات الصف الأول الأساسي (الأردن). يمكنك إضافة كتب أخرى من «📚 استيراد منهج»."
          action={<Link href="/import" className="btn-3d inline-flex min-h-12 items-center rounded-2xl bg-hero-blue px-5 font-bold text-white">📚 استيراد منهج</Link>}
        />
      ) : (
        <>
          {allSemesters.length > 1 && (
            <Segmented
              value={shownSemester}
              onChange={setSemester}
              options={allSemesters.map((s) => ({ value: s, label: s === 1 ? "الفصل الدراسي الأول" : "الفصل الدراسي الثاني" }))}
            />
          )}
          {semesterBooks.length > 1 && (
            <Segmented value={book.id} onChange={setBookId} options={semesterBooks.map((b) => ({ value: b.id, label: b.bundled ? `📘 ${b.source.name}` : b.imported ? `📚 ${b.imported.title}` : `الفهرس المؤقت — ${b.source.name}` }))} />
          )}
          <div className={cn("flex gap-3 rounded-3xl p-4", book.source.status === "verified" ? "bg-hero-green/10" : "bg-hero-yellow/25")} data-testid="curriculum-source">
            <TriangleAlert className="size-6 shrink-0 text-[#E67700]" />
            <div className="flex flex-col gap-1">
              <p className="font-display text-lg font-bold">
                حالة التحقق من المصدر: {book.source.status === "verified" ? "متحقَّق منه" : "فهرس مؤقت غير متحقَّق منه"}
              </p>
              <p>{book.source.note}</p>
              <p className="text-sm text-hero-muted">
                المصدر: {book.source.name} • تاريخ المراجعة: {book.source.checkedOn}
              </p>
              {book.source.url && <a href={book.source.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl bg-white px-4 font-bold text-hero-blue">
                فتح المصدر <ExternalLink className="size-4" />
              </a>}
            </div>
          </div>


          <div className="flex flex-col gap-3">
            {book.units
              .filter((u) => u.semester === shownSemester)
              .map((u) => {
                const open = openUnit === u.id;
                const readyCount = u.lessons.filter((l) => l.games.length).length;
                return (
                  <section key={u.id} className="overflow-hidden rounded-3xl bg-white shadow-soft">
                    <button type="button" onClick={() => setOpenUnit(open ? null : u.id)} className="flex min-h-16 w-full cursor-pointer items-center gap-3 p-4 text-start" aria-expanded={open}>
                      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-hero-blue font-display text-xl font-extrabold text-white">{u.number}</span>
                      <span className="flex-1">
                        <span className="block font-display text-xl font-extrabold">{u.title}</span>
                        <span className="text-sm text-hero-muted">
                          {u.lessons.length} دروس{readyCount ? ` • ${readyCount} بألعاب جاهزة` : ""}
                        </span>
                      </span>
                      <ChevronDown className={cn("size-6 transition", open && "rotate-180")} />
                    </button>
                    {open && (
                      <ol className="flex flex-col gap-2 border-t border-hero-ink/5 p-3">
                        {u.lessons.map((l, i) => {
                          const games = lessonGames(l);
                          const lOpen = openLesson === l.id;
                          const overridden = !!titleOverrides[l.id];
                          return (
                            <li key={l.id} className={cn("rounded-2xl border-2", lOpen ? "border-hero-blue" : "border-hero-ink/5")} data-testid={`lesson-${l.id}`}>
                              <div className="flex flex-wrap items-center gap-2 p-3">
                                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-hero-ink/5 font-display font-bold">{i + 1}</span>
                                {editing === l.id ? (
                                  <form
                                    className="flex flex-1 flex-wrap gap-2"
                                    onSubmit={async (e) => {
                                      e.preventDefault();
                                      await setTitleOverride(l.id, draft);
                                      setEditing(null);
                                      toast("تم حفظ عنوان الدرس");
                                    }}
                                  >
                                    <input autoFocus className={cn(inputClass, "flex-1")} value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="عنوان الدرس" />
                                    <Button type="submit" size="sm">حفظ</Button>
                                    <Button variant="secondary" size="sm" onClick={() => setEditing(null)}>إلغاء</Button>
                                  </form>
                                ) : (
                                  <button type="button" onClick={() => setOpenLesson(lOpen ? null : l.id)} className="min-h-11 flex-1 cursor-pointer text-start font-display text-lg font-bold">
                                    {lessonTitle(l, titleOverrides)}
                                    {overridden && <Badge color="#7950F2" className="ms-2">عدّله المعلم</Badge>}
                                  </button>
                                )}
                                {games.length > 0 && <Badge color="#40C057">{games.length} لعبة جاهزة</Badge>}
                                {(l.template || book.bundled) && <Badge color="#E64980">✨ حصة جاهزة</Badge>}
                                {editing !== l.id && (
                                  <IconButton label="تعديل عنوان الدرس" className="bg-hero-ink/5 shadow-none" onClick={() => { setEditing(l.id); setDraft(lessonTitle(l, titleOverrides)); }}>
                                    <Pencil className="size-5" />
                                  </IconButton>
                                )}
                                {overridden && editing !== l.id && (
                                  <IconButton label="استعادة العنوان الأصلي" className="bg-hero-ink/5 shadow-none" onClick={() => setTitleOverride(l.id, null)}>
                                    <Undo2 className="size-5" />
                                  </IconButton>
                                )}
                              </div>
                              {lOpen && (
                                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 border-t border-hero-ink/5 p-4">
                                  <LessonPanel
                                    lesson={l}
                                    title={lessonTitle(l, titleOverrides)}
                                    bundled={!!book.bundled}
                                    tab={tab}
                                    setTab={setTab}
                                    games={games}
                                    bank={questions.filter((q) => q.lessonId === l.id)}
                                    plan={book.bundled ? builtinPlan(l.id, titleOverrides) : null}
                                    myPlans={plans.filter((p) => p.lessonId === l.id)}
                                    grade={grade}
                                    subject={subject}
                                    onPrepare={() => router.push(`/lessons/new?lesson=${l.id}`)}
                                  />
                                </motion.div>
                              )}
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </section>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}

type Tab = "guide" | "games" | "plan" | "edit";
const TABS: { id: Tab; label: string }[] = [
  { id: "guide", label: "📖 شرح الدرس" },
  { id: "games", label: "🎮 الألعاب الجاهزة" },
  { id: "plan", label: "✨ الحصة الجاهزة" },
  { id: "edit", label: "✏️ تعديل المحتوى" },
];

/** A lesson: its explanation, ready games, ready lesson plan and where to edit its content. */
function LessonPanel({
  lesson,
  title,
  bundled,
  tab: picked,
  setTab,
  games,
  bank,
  plan,
  myPlans,
  grade,
  subject,
  onPrepare,
}: {
  lesson: CurriculumLesson;
  title: string;
  bundled: boolean;
  tab: Tab;
  setTab: (t: Tab) => void;
  games: GameConfig[];
  bank: Question[];
  plan: LessonPlan | null;
  myPlans: LessonPlan[];
  grade: number;
  subject: string;
  onPrepare: () => void;
}) {
  const g = lesson.guide;
  const fromBook = bank.filter((q) => q.origin === "textbook").length;
  // A lesson without a guide (imported or provisional) opens on its games.
  const tab = picked === "guide" && !g ? "games" : picked;
  return (
    <div className="flex flex-col gap-4" data-testid="lesson-panel">
      <div className="flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn("min-h-12 cursor-pointer rounded-2xl px-4 font-display text-lg font-bold", tab === t.id ? "bg-hero-blue text-white" : "bg-hero-ink/5")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "guide" &&
        (g ? (
          <div className="flex flex-col gap-3" data-testid="lesson-guide">
            {lesson.pages && <Badge color="#4361EE" className="w-fit"><BookOpen className="size-4" /> صفحات الكتاب {lesson.pages[0]}–{lesson.pages[1]}</Badge>}
            <div>
              <h3 className="text-lg font-extrabold">الأهداف التعليمية</h3>
              <ul className="list-inside list-disc">{g.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
            </div>
            <div>
              <h3 className="text-lg font-extrabold">شرح مبسّط للمعلم</h3>
              <p>{g.explanation}</p>
            </div>
            {g.examples?.length ? (
              <div>
                <h3 className="text-lg font-extrabold">أمثلة</h3>
                <div className="flex flex-wrap gap-2">{g.examples.map((e) => <span key={e} dir={/[\u0621-\u064A]/.test(e) ? undefined : "ltr"} className="rounded-xl bg-hero-yellow/30 px-3 py-1 font-bold">{e}</span>)}</div>
              </div>
            ) : null}
            {g.warmup && (
              <div>
                <h3 className="text-lg font-extrabold">النشاط التمهيدي</h3>
                <p>{g.warmup}</p>
              </div>
            )}
            <p className="text-sm text-hero-muted">الأهداف والشرح والأنشطة صياغة مقترحة من المنصة اعتمادًا على مفاهيم الدرس، وليست منقولة من الكتاب.</p>
          </div>
        ) : (
          <p className="text-hero-muted">لا يوجد شرح لهذا الدرس بعد{bundled ? "" : " (هذا الدرس من فهرس مؤقت)"}.</p>
        ))}

      {tab === "games" &&
        (games.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {games.map((game, k) => (
              <GameCard key={game.id} game={game} index={k} />
            ))}
          </div>
        ) : (
          <p className="text-hero-muted">لا توجد لعبة جاهزة مرتبطة بهذا الدرس بعد.</p>
        ))}
      {tab === "games" && lesson.planned.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-hero-muted">ألعاب مخطط لها لهذا الدرس:</span>
          {lesson.planned.map((p) => (
            <Badge key={p} color="#868E96">
              <Hourglass className="size-4" /> {PLANNED_GAME_NAMES[p]} — قيد التطوير
            </Badge>
          ))}
        </div>
      )}

      {tab === "plan" &&
        (plan ? (
          <div className="flex flex-col gap-3" data-testid="lesson-ready-plan">
            <div className="flex w-full max-w-2xl gap-2">
              {plan.segments.map((s) => (
                <div key={s.kind} style={{ flex: s.minutes, background: SEGMENT_META[s.kind].color }} className="rounded-2xl p-3 text-white">
                  <p className="font-display font-bold">{SEGMENT_META[s.kind].emoji} {SEGMENT_META[s.kind].label}</p>
                  <p className="font-display text-xl font-extrabold">{s.minutes} د</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/lesson-run?id=${plan.id}`} className="btn-3d inline-flex min-h-12 items-center gap-2 rounded-2xl bg-hero-green px-5 font-display text-lg font-bold text-white">
                <Play className="size-5 fill-current" /> تشغيل الحصة
              </Link>
              <Link href={`/lessons/edit?id=${plan.id}`} className="btn-3d inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-5 font-display text-lg font-bold">
                <Eye className="size-5" /> معاينة وتعديل
              </Link>
            </div>
            {myPlans.length > 0 && (
              <ul className="flex flex-col gap-2">
                {myPlans.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center gap-2 rounded-2xl bg-hero-ink/5 p-2">
                    <span className="flex-1 font-bold">{m.title}</span>
                    <Link href={`/lesson-run?id=${m.id}`} className="inline-flex min-h-11 items-center rounded-xl bg-hero-green px-3 font-bold text-white">تشغيل</Link>
                    <Link href={`/lessons/edit?id=${m.id}`} className="inline-flex min-h-11 items-center rounded-xl bg-white px-3 font-bold">فتح</Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : lesson.template ? (
          <Button className="w-fit bg-gradient-to-l from-hero-purple to-hero-pink" icon={<Sparkles className="size-5" />} onClick={onPrepare}>
            حضّر حصة لهذا الدرس
          </Button>
        ) : (
          <p className="text-hero-muted">لا توجد حصة جاهزة لهذا الدرس بعد.</p>
        ))}

      {tab === "edit" && (
        <div className="flex flex-col gap-3" data-testid="lesson-edit">
          <p>
            أسئلة الدرس في بنك الأسئلة: <b>{bank.length}</b> (📘 {fromBook} من الكتاب، ✨ {bank.length - fromBook} مولّدة)
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/bank?grade=${grade}&subject=${subject}&lessonId=${encodeURIComponent(lesson.id)}`} className="btn-3d inline-flex min-h-12 items-center gap-2 rounded-2xl bg-hero-blue px-5 font-bold text-white">
              <Pencil className="size-5" /> تعديل أسئلة الدرس
            </Link>
            {plan && (
              <Link href={`/lessons/edit?id=${plan.id}`} className="btn-3d inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-5 font-bold">
                <Sparkles className="size-5" /> تعديل الحصة (نسخة خاصة بك)
              </Link>
            )}
          </div>
          <p className="text-sm text-hero-muted">
            لتعديل لعبة: من «🎮 الألعاب الجاهزة» اختر «تخصيص»، فتُحفظ نسخة خاصة بك مرتبطة بالدرس. لتعديل عنوان «{title}» استعمل زر القلم بجانبه. المحتوى الأصلي يبقى كما هو.
          </p>
        </div>
      )}
    </div>
  );
}
