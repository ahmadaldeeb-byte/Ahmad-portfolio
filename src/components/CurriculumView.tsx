"use client";
import { motion } from "motion/react";
import { ChevronDown, ExternalLink, Hourglass, Pencil, Sparkles, TriangleAlert, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { BOOKS, PLANNED_GAME_NAMES, lessonTitle, type CurriculumLesson } from "@/content/curriculum";
import { GRADES, SUBJECTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useData } from "@/store/data";
import { GameCard } from "./GameCard";
import { toast } from "./Toast";
import { Badge, Button, EmptyState, IconButton, PageHeader, Segmented, inputClass } from "./ui";

export function CurriculumView() {
  const params = useSearchParams();
  const router = useRouter();
  const { builtins, games: saved, curricula, titleOverrides, setTitleOverride } = useData();
  const [grade, setGrade] = useState(Number(params.get("grade")) || 1);
  const [subject, setSubject] = useState(params.get("subject") || "math");
  // The built-in index and the curricula imported from files («📚 استيراد منهج»).
  const books = [...BOOKS, ...curricula].filter((b) => b.grade === grade && b.subject === subject);
  const [bookId, setBookId] = useState(params.get("book"));
  const book = books.find((b) => b.id === bookId) ?? books[0];
  const [semester, setSemester] = useState<1 | 2>(1);
  const [openUnit, setOpenUnit] = useState<string | null>(params.get("unit"));
  const [openLesson, setOpenLesson] = useState<string | null>(params.get("lesson"));
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  // A book for one semester only shows that semester without a switch.
  const semesters = [...new Set(book?.units.map((u) => u.semester) ?? [])];
  const shownSemester = semesters.includes(semester) ? semester : (semesters[0] ?? 1);
  const lessonGames = (l: CurriculumLesson) => [...builtins, ...saved].filter((g) => g.lessonId === l.id);

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
          {books.length > 1 && (
            <Segmented value={book.id} onChange={setBookId} options={books.map((b) => ({ value: b.id, label: b.imported ? `📚 ${b.imported.title}` : `الفهرس المدمج — ${b.source.name}` }))} />
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

          {semesters.length > 1 && (
            <Segmented
              value={shownSemester}
              onChange={setSemester}
              options={[
                { value: 1 as const, label: "الفصل الدراسي الأول" },
                { value: 2 as const, label: "الفصل الدراسي الثاني" },
              ]}
            />
          )}

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
                                {l.template && <Badge color="#E64980">✨ قالب حصة</Badge>}
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
                                  {l.template && (
                                    <Button
                                      className="w-fit bg-gradient-to-l from-hero-purple to-hero-pink"
                                      icon={<Sparkles className="size-5" />}
                                      onClick={() => router.push(`/lessons/new?lesson=${l.id}`)}
                                    >
                                      حضّر حصة لهذا الدرس
                                    </Button>
                                  )}
                                  {games.length > 0 ? (
                                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                      {games.map((g, k) => (
                                        <GameCard key={g.id} game={g} index={k} />
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-hero-muted">لا توجد لعبة جاهزة مرتبطة بهذا الدرس بعد.</p>
                                  )}
                                  {l.planned.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-sm text-hero-muted">ألعاب مخطط لها لهذا الدرس:</span>
                                      {l.planned.map((p) => (
                                        <Badge key={p} color="#868E96">
                                          <Hourglass className="size-4" /> {PLANNED_GAME_NAMES[p]} — قيد التطوير
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
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
