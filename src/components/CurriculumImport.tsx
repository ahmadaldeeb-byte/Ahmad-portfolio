"use client";
import { CheckCircle2, ChevronDown, FileUp, Trash2, TriangleAlert, XCircle } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { GAMES, gameMetaFor, gradeLabel, subjectLabel } from "@/lib/constants";
import { duplicateOf, planImport, slug, suggestGames } from "@/lib/curriculum/import";
import { validateCurriculumFile, type CurriculumFile, type CurriculumFileLesson, type CurriculumFileQuestion, type Issue } from "@/lib/curriculum/schema";
import type { GameType } from "@/lib/types";
import { cn, readFileAsText } from "@/lib/utils";
import { useData } from "@/store/data";
import { toast } from "./Toast";
import { Badge, Button, Card, EmptyState, IconButton, Modal, PageHeader, inputClass } from "./ui";

/** Game templates that can play in a subject (ready, and either for every subject or with a question-bank version). */
function templatesFor(subject: CurriculumFile["curriculum"]["subject"]) {
  return GAMES.filter((g) => g.ready && (!g.subjects || g.subjects.includes(subject) || (g.bank && subject !== "math")));
}

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

function IssueList({ issues }: { issues: Issue[] }) {
  if (!issues.length) return null;
  return (
    <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto rounded-2xl bg-hero-ink/5 p-3 text-sm" data-testid="import-issues">
      {issues.map((i, k) => (
        <li key={k} className={cn("flex gap-2", i.level === "error" ? "text-hero-red" : "text-[#B35C00]")}>
          {i.level === "error" ? <XCircle className="size-4 shrink-0" /> : <TriangleAlert className="size-4 shrink-0" />}
          <span>
            <b>{i.where}:</b> {i.message}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function CurriculumImport() {
  const { curricula, importCurriculum, removeCurriculum } = useData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<CurriculumFile | null>(null);
  const [fileIssues, setFileIssues] = useState<Issue[]>([]);
  const [fileName, setFileName] = useState("");
  const [openLesson, setOpenLesson] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const load = async (f: File) => {
    setFileName(f.name);
    setDraft(null);
    let raw: unknown;
    try {
      raw = JSON.parse(await readFileAsText(f));
    } catch {
      setFileIssues([{ level: "error", where: "الملف", message: "الملف ليس بصيغة JSON صالحة." }]);
      return;
    }
    const r = validateCurriculumFile(raw);
    setFileIssues(r.issues);
    if (r.file) setDraft(clone(r.file));
  };

  // Every edit is re-checked, and the games are rebuilt from the edited lessons.
  const check = useMemo(() => (draft ? validateCurriculumFile(clone(draft)) : null), [draft]);
  const plan = useMemo(() => (check?.file ? planImport(check.file) : null), [check]);
  const duplicate = plan ? duplicateOf(plan, curricula) : null;
  const errors = (check?.issues ?? []).filter((i) => i.level === "error");
  const warnings = [...(check?.issues ?? []).filter((i) => i.level === "warning"), ...(plan?.issues ?? [])];

  const edit = (fn: (d: CurriculumFile) => void) =>
    setDraft((d) => {
      if (!d) return d;
      const next = clone(d);
      fn(next);
      return next;
    });
  const lessonAt = (d: CurriculumFile, ui: number, li: number) => d.curriculum.units[ui].lessons[li];

  const save = async () => {
    if (!plan || errors.length || duplicate) return;
    setSaving(true);
    try {
      await importCurriculum(plan);
      toast(`تم استيراد المنهج: ${plan.book.imported!.counts.lessons} درسًا و${plan.questions.length} سؤالًا و${plan.games.length} لعبة`);
      setDraft(null);
      setFileName("");
      setFileIssues([]);
    } catch {
      toast("تعذّر حفظ المنهج", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="📚 استيراد منهج"
        subtitle="استورد ملف منهج (JSON) فيه وحدات الكتاب ودروسه وأسئلته، فتُنشأ الأسئلة في البنك والألعاب مرتبطة بدروسها تلقائيًا."
        actions={
          <Button icon={<FileUp className="size-5" />} onClick={() => fileRef.current?.click()}>
            اختيار ملف منهج
          </Button>
        }
      />
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        data-testid="curriculum-input"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void load(f);
          e.target.value = "";
        }}
      />

      <Card>
        <h2 className="mb-3 text-2xl font-extrabold">المناهج المستوردة</h2>
        {curricula.length === 0 ? (
          <p className="text-hero-muted">لم يُستورد أي منهج بعد. الفهرس المدمج في التطبيق (رياضيات الصف الأول) يبقى كما هو.</p>
        ) : (
          <ul className="flex flex-col gap-2" data-testid="imported-list">
            {curricula.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-hero-ink/5 p-3">
                <span className="flex-1">
                  <b className="font-display text-lg">{b.imported?.title ?? b.source.name}</b>
                  <span className="block text-sm text-hero-muted">
                    {gradeLabel(b.grade)} • {subjectLabel(b.subject)} • {b.imported?.counts.lessons} درسًا • {b.imported?.counts.questions} سؤالًا • {b.imported?.counts.games} لعبة
                  </span>
                </span>
                <Link href={`/curriculum?grade=${b.grade}&subject=${b.subject}&book=${encodeURIComponent(b.id)}`} className="btn-3d inline-flex min-h-11 items-center rounded-2xl bg-white px-4 font-bold">
                  عرض في المنهاج
                </Link>
                <IconButton label="حذف المنهج المستورد" className="bg-white shadow-none" onClick={() => setConfirmRemove(b.id)}>
                  <Trash2 className="size-5 text-hero-red" />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {fileName && !draft && (
        <Card>
          <h2 className="mb-2 text-xl font-extrabold">تعذّر قراءة «{fileName}»</h2>
          <IssueList issues={fileIssues} />
        </Card>
      )}

      {!draft && !fileName && (
        <EmptyState
          title="اختر ملف منهج للبدء"
          hint="يُحضَّر الملف من كتاب PDF باتباع الدليل docs/CURRICULUM_IMPORT.md، ثم يُراجع هنا قبل الحفظ. لا يُحفظ شيء قبل الضغط على «استيراد»."
        />
      )}

      {draft && check && (
        <>
          <Card>
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex-1">
                <h2 className="text-2xl font-extrabold" data-testid="import-title">{draft.curriculum.title}</h2>
                <p className="text-hero-muted">
                  {gradeLabel(draft.curriculum.grade)} • {subjectLabel(draft.curriculum.subject)}
                  {draft.curriculum.semester ? ` • الفصل الدراسي ${draft.curriculum.semester === 1 ? "الأول" : "الثاني"}` : ""} • الكتاب: {draft.curriculum.textbook.title}
                </p>
                {plan && (
                  <p className="mt-1 font-bold" data-testid="import-summary">
                    {plan.book.units.length} وحدات • {plan.book.imported!.counts.lessons} درسًا • {plan.questions.length} سؤالًا ({plan.questions.filter((q) => q.origin === "textbook").length} من الكتاب، {plan.questions.filter((q) => q.origin === "generated").length} مولّدة) • {plan.games.length} لعبة
                  </p>
                )}
              </div>
              <Button variant="success" size="lg" icon={<CheckCircle2 className="size-6" />} disabled={!plan || errors.length > 0 || !!duplicate || saving} onClick={save}>
                استيراد
              </Button>
              <Button variant="secondary" onClick={() => { setDraft(null); setFileName(""); }}>
                إلغاء
              </Button>
            </div>
            {duplicate && (
              <p className="mt-3 rounded-2xl bg-hero-red/10 p-3 font-bold text-hero-red" data-testid="import-duplicate">
                هذا المنهج مستورد من قبل («{duplicate.imported?.title ?? duplicate.source.name}»). لن يُستورد مرتين؛ احذف النسخة السابقة أولًا إن أردت استبدالها.
              </p>
            )}
            {errors.length > 0 && <p className="mt-3 font-bold text-hero-red">يوجد {errors.length} خطأ يجب إصلاحه قبل الاستيراد:</p>}
            <div className="mt-2">
              <IssueList issues={[...errors, ...warnings]} />
            </div>
          </Card>

          <div className="flex flex-col gap-3" data-testid="import-preview">
            {draft.curriculum.units.map((u, ui) => (
              <section key={u.id} className="rounded-3xl bg-white p-4 shadow-soft">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="grid size-10 place-items-center rounded-2xl bg-hero-blue font-display text-lg font-extrabold text-white">{u.number}</span>
                  <input className={cn(inputClass, "flex-1 font-display text-lg font-bold")} value={u.title} aria-label={`عنوان الوحدة ${u.number}`} onChange={(e) => edit((d) => (d.curriculum.units[ui].title = e.target.value))} />
                  {u.semester && <Badge color="#7950F2">الفصل {u.semester === 1 ? "الأول" : "الثاني"}</Badge>}
                </div>
                <ol className="flex flex-col gap-2">
                  {u.lessons.map((l, li) => (
                    <LessonEditor
                      key={l.id}
                      lesson={l}
                      subject={draft.curriculum.subject}
                      open={openLesson === l.id}
                      onToggle={() => setOpenLesson(openLesson === l.id ? null : l.id)}
                      createdGames={plan?.games.filter((g) => g.lessonId === `${plan.book.id}__${slug(l.id)}`).map((g) => g.type) ?? []}
                      onChange={(fn) => edit((d) => fn(lessonAt(d, ui, li)))}
                      onRemove={() => edit((d) => d.curriculum.units[ui].lessons.splice(li, 1))}
                    />
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </>
      )}

      <Modal open={!!confirmRemove} title="حذف المنهج المستورد" onClose={() => setConfirmRemove(null)}>
        <p className="mb-4">سيُحذف المنهج مع الأسئلة والألعاب التي أنشأها الاستيراد (ومنها ما عدّلته منها). ألعابك وأسئلتك الأخرى لن تتأثر.</p>
        <div className="flex gap-3">
          <Button
            variant="danger"
            onClick={async () => {
              await removeCurriculum(confirmRemove!);
              setConfirmRemove(null);
              toast("تم حذف المنهج المستورد");
            }}
          >
            حذف
          </Button>
          <Button variant="secondary" onClick={() => setConfirmRemove(null)}>
            إلغاء
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function LessonEditor({
  lesson: l,
  subject,
  open,
  onToggle,
  createdGames,
  onChange,
  onRemove,
}: {
  lesson: CurriculumFileLesson;
  subject: CurriculumFile["curriculum"]["subject"];
  open: boolean;
  onToggle: () => void;
  createdGames: GameType[];
  onChange: (fn: (l: CurriculumFileLesson) => void) => void;
  onRemove: () => void;
}) {
  const textbook = l.questions.filter((q) => q.origin === "textbook").length;
  const chosen = (l.games?.length ? l.games : suggestGames(l, subject)).map((g) => g.template);
  const toggleGame = (t: GameType) =>
    onChange((x) => {
      const current = x.games?.length ? x.games : suggestGames(x, subject);
      // An empty list means "the app picks suitable games" (see the file format).
      x.games = chosen.includes(t) ? current.filter((g) => g.template !== t) : [...current, { template: t }];
    });
  return (
    <li className={cn("rounded-2xl border-2", open ? "border-hero-blue" : "border-hero-ink/5")} data-testid={`import-lesson-${l.id}`}>
      <div className="flex flex-wrap items-center gap-2 p-3">
        <input className={cn(inputClass, "min-w-48 flex-1 font-bold")} value={l.title} aria-label="عنوان الدرس" onChange={(e) => onChange((x) => (x.title = e.target.value))} />
        <Badge color="#4361EE">{l.questions.length} سؤالًا ({textbook} من الكتاب)</Badge>
        {createdGames.map((t) => (
          <Badge key={t} color="#40C057">{gameMetaFor(t, subject).name}</Badge>
        ))}
        <IconButton label={open ? "إغلاق الدرس" : "فتح الدرس"} className="bg-hero-ink/5 shadow-none" onClick={onToggle}>
          <ChevronDown className={cn("size-5 transition", open && "rotate-180")} />
        </IconButton>
        <IconButton label="حذف الدرس من الاستيراد" className="bg-hero-ink/5 shadow-none" onClick={onRemove}>
          <Trash2 className="size-5 text-hero-red" />
        </IconButton>
      </div>
      {open && (
        <div className="flex flex-col gap-4 border-t border-hero-ink/5 p-3">
          <div>
            <p className="mb-2 font-bold">ألعاب الدرس (قوالب الألعاب الموجودة):</p>
            <div className="flex flex-wrap gap-2" data-testid="import-games">
              {templatesFor(subject).map((g) => (
                <button
                  key={g.type}
                  type="button"
                  aria-pressed={chosen.includes(g.type)}
                  onClick={() => toggleGame(g.type)}
                  className={cn("min-h-10 cursor-pointer rounded-full border-2 px-3 font-bold", chosen.includes(g.type) ? "border-hero-green bg-hero-green/10" : "border-hero-ink/10 text-hero-muted")}
                >
                  {gameMetaFor(g.type, subject).name}
                </button>
              ))}
            </div>
          </div>
          <ol className="flex flex-col gap-3">
            {l.questions.map((q, qi) => (
              <QuestionEditor key={q.id} q={q} onChange={(fn) => onChange((x) => fn(x.questions[qi]))} onRemove={() => onChange((x) => x.questions.splice(qi, 1))} />
            ))}
          </ol>
        </div>
      )}
    </li>
  );
}

function QuestionEditor({ q, onChange, onRemove }: { q: CurriculumFileQuestion; onChange: (fn: (q: CurriculumFileQuestion) => void) => void; onRemove: () => void }) {
  return (
    <li className="flex flex-col gap-2 rounded-2xl bg-hero-ink/5 p-3" data-testid="import-question">
      <div className="flex flex-wrap items-center gap-2">
        <Badge color={q.origin === "textbook" ? "#1C7ED6" : "#E64980"}>{q.origin === "textbook" ? `📘 من الكتاب${q.page ? ` ص${q.page}` : ""}` : "✨ مولّد — راجعه"}</Badge>
        <input className={cn(inputClass, "min-w-48 flex-1")} value={q.prompt} aria-label="نص السؤال" onChange={(e) => onChange((x) => (x.prompt = e.target.value))} />
        <IconButton label="حذف السؤال" className="bg-white shadow-none" onClick={onRemove}>
          <Trash2 className="size-5 text-hero-red" />
        </IconButton>
      </div>
      {(q.kind === "mcq" || q.kind === "truefalse") && (
        <div className="flex flex-wrap gap-2">
          {(q.kind === "truefalse" ? ["صح", "خطأ"] : q.choices ?? []).map((c, ci) => (
            <label key={ci} className={cn("flex items-center gap-2 rounded-xl border-2 bg-white px-2", q.correctIndex === ci ? "border-hero-green" : "border-transparent")}>
              <input type="radio" name={`correct-${q.id}`} checked={q.correctIndex === ci} onChange={() => onChange((x) => (x.correctIndex = ci))} aria-label={`الإجابة الصحيحة: ${c}`} />
              {q.kind === "mcq" ? (
                <input className="min-h-10 w-32 bg-transparent font-bold outline-none" value={c} aria-label={`الخيار ${ci + 1}`} onChange={(e) => onChange((x) => (x.choices![ci] = e.target.value))} />
              ) : (
                <span className="min-h-10 px-2 font-bold leading-10">{c}</span>
              )}
            </label>
          ))}
        </div>
      )}
      {q.kind === "order" && <input className={inputClass} value={q.answer ?? ""} aria-label="الكلمة أو الجملة الصحيحة" onChange={(e) => onChange((x) => (x.answer = e.target.value))} />}
      {q.kind === "match" && <p className="text-sm text-hero-muted">{(q.pairs ?? []).map((p) => `${p.a} ↔ ${p.b}`).join("، ")}</p>}
    </li>
  );
}
