"use client";
import { CheckCircle2, Cloud, Copy, Eye, Minus, Play, Plus, RefreshCw, Save, Trash2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { gameMeta, gradeLabel, subjectLabel } from "@/lib/constants";
import {
  CHOICE_KINDS,
  builtinPlanById,
  customCopy,
  buildTrainQuestion,
  challengeQuestions,
  duplicatePlan,
  isValidTrainQuestion,
  questionAnchor,
  totalMinutes,
  validatePlan,
  warmupAnswer,
  warmupQuestions,
} from "@/lib/lessons/engine";
import { SEGMENT_META, type LessonPlan, type LessonSegment } from "@/lib/lessons/types";
import { isMathExpression } from "@/lib/arabic";
import { toPlayable } from "@/lib/questions";
import type { GameType, Question } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useData } from "@/store/data";
import { toast } from "../Toast";
import { TrainSettingsForm } from "../TrainSettingsForm";
import { Badge, Button, Card, EmptyState, Field, IconButton, Loading, Segmented, inputClass } from "../ui";

/** Games that can run the main part of a «السابق والتالي» lesson. */
export const MAIN_GAME_OPTIONS: GameType[] = ["train", "quiz", "balloons", "race", "teams"];

export function LessonEditor() {
  const params = useSearchParams();
  const router = useRouter();
  const { ready, lessons, saveLesson, titleOverrides, builtins, games, questions: bank } = useData();
  const id = params.get("id");
  const builtin = useMemo(() => builtinPlanById(id, titleOverrides), [id, titleOverrides]);
  const stored = lessons.find((l) => l.id === id) ?? builtin ?? undefined;
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [selected, setSelected] = useState(0);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const copying = useRef(false);

  useEffect(() => {
    if (stored && (!plan || plan.id !== stored.id)) setPlan(structuredClone(stored));
  }, [stored, plan]);

  // Auto-save edits. The ready plan of a lesson is never changed: the first edit saves the teacher's own copy.
  useEffect(() => {
    if (!plan || !stored || plan === stored) return;
    if (JSON.stringify(plan) === JSON.stringify(stored)) return;
    if (stored.builtin) {
      if (copying.current) return;
      copying.current = true;
      const copy = customCopy(plan);
      void saveLesson(copy).then(() => {
        toast("حُفظت تعديلاتك في نسخة خاصة بك؛ الحصة الجاهزة الأصلية لم تتغيّر");
        router.replace(`/lessons/edit?id=${copy.id}`);
      });
      return;
    }
    setSaveState("saving");
    const t = setTimeout(async () => {
      await saveLesson(plan);
      setSaveState("saved");
    }, 600);
    return () => clearTimeout(t);
  }, [plan, stored, saveLesson, router]);

  const issues = useMemo(() => (plan ? validatePlan(plan) : []), [plan]);

  if (!ready) return <Loading />;
  if (!stored) return <EmptyState title="لم نعثر على هذه الحصة" hint="ربما حُذفت." action={<Link className="font-bold text-hero-blue underline" href="/lessons">تحضير الحصص</Link>} />;
  if (!plan) return <Loading />;

  const setSeg = <K extends 0 | 1 | 2>(i: K, patch: Partial<LessonPlan["segments"][K]>) =>
    setPlan((p) => {
      if (!p) return p;
      const segments = [...p.segments] as LessonPlan["segments"];
      segments[i] = { ...segments[i], ...patch } as LessonPlan["segments"][K];
      return { ...p, segments };
    });
  const total = totalMinutes(plan);
  const [warm, main, ch] = plan.segments;
  // Ready games of this lesson: built-in ones and the teacher's saved copies.
  const lessonGames = [...games, ...builtins].filter((g, i, all) => g.lessonId === plan.lessonId && all.findIndex((x) => x.id === g.id) === i);
  const WA = warm.activity.type === "numberLine" ? warm.activity : null;
  const lessonBank = bank.filter((q) => q.lessonId === plan.lessonId && CHOICE_KINDS.includes(q.kind));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <input
            aria-label="عنوان الحصة"
            className="w-full bg-transparent font-display text-3xl font-extrabold outline-none md:text-4xl"
            value={plan.title}
            onChange={(e) => setPlan({ ...plan, title: e.target.value })}
          />
          <p className="text-lg text-hero-muted">{plan.lessonTitle}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-bold text-hero-muted shadow-soft" aria-live="polite">
          {stored.builtin ? <Badge color="#E64980">✨ الحصة الجاهزة</Badge> : saveState === "saving" ? <Cloud className="size-5 animate-pulse" /> : <CheckCircle2 className="size-5 text-hero-green" />}
          {stored.builtin ? "" : saveState === "saving" ? "جارٍ الحفظ..." : "محفوظة تلقائيًا"}
        </span>
      </div>
      {stored.builtin && (
        <p className="rounded-3xl bg-hero-purple/10 p-4 text-lg" data-testid="builtin-plan-note">
          هذه الحصة الجاهزة للدرس. يمكنك تشغيلها مباشرة، وأي تعديل تجريه يُحفظ تلقائيًا في <b>نسخة خاصة بك</b> دون تغيير الأصل.
        </p>
      )}

      <Card className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" >
        <Info label="الدرس" value={plan.lessonTitle} />
        <Info label="الصف والمادة" value={`${gradeLabel(plan.grade)} • ${subjectLabel(plan.subject)}`} />
        <Info label="الوحدة" value={`${plan.unitTitle} (الفصل ${plan.semester === 1 ? "الأول" : "الثاني"})`} />
        <Info label="مدة الحصة" value={`${total} دقيقة`} testId="lesson-total" />
        <div className="sm:col-span-2">
          <p className="text-sm text-hero-muted">الأهداف التعليمية (صياغة مقترحة من المنصة، غير منقولة من الكتاب):</p>
          <ul className="list-inside list-disc">
            {plan.objectives.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </div>
      </Card>

      {/* Interactive timeline */}
      <Card className="flex flex-col gap-4">
        <h2 className="text-2xl font-extrabold">مخطط الحصة</h2>
        <div className="flex min-h-20 w-full gap-2" role="tablist" aria-label="مراحل الحصة">
          {plan.segments.map((s, i) => (
            <button
              key={s.kind}
              type="button"
              role="tab"
              aria-selected={selected === i}
              onClick={() => setSelected(i)}
              style={{ flex: Math.max(s.minutes, 2), background: SEGMENT_META[s.kind].color }}
              className={cn("flex min-w-0 cursor-pointer flex-col items-center justify-center rounded-2xl p-2 text-white transition", selected === i ? "ring-4 ring-hero-yellow" : "opacity-85")}
            >
              <span className="truncate font-display text-lg font-extrabold">{SEGMENT_META[s.kind].emoji} {SEGMENT_META[s.kind].label}</span>
              <span className="font-display text-2xl font-extrabold" data-testid={`seg-minutes-${s.kind}`}>{s.minutes} د</span>
            </button>
          ))}
        </div>
        <p className="font-display text-lg font-bold">إجمالي الوقت: {total} دقيقة{total !== 15 && <span className="text-hero-muted"> (المقترح ١٥ دقيقة)</span>}</p>
      </Card>

      <SegmentPanel
        segment={plan.segments[selected]}
        onMinutes={(m) => setSeg(selected as 0 | 1 | 2, { minutes: m })}
        onPreview={() => router.push(`/lesson-run?id=${plan.id}&stage=${selected}&preview=1`)}
      >
        {selected === 0 && warm.activity.type === "questions" && (
          <div className="flex flex-col gap-3">
            <Field label="تعليمات النشاط التمهيدي للمعلم">
              <textarea
                className={cn(inputClass, "min-h-24")}
                value={warm.activity.instructions}
                onChange={(e) => setSeg(0, { activity: { ...warm.activity, instructions: e.target.value } as typeof warm.activity })}
              />
            </Field>
            <QuestionList
              label="أسئلة التمهيد"
              items={warm.activity.questions}
              bank={lessonBank}
              onChange={(questions) => setSeg(0, { activity: { ...warm.activity, questions } as typeof warm.activity })}
            />
          </div>
        )}
        {selected === 0 && WA && (
          <div className="flex flex-col gap-3">
            <p className="text-hero-muted">شخصية كرتونية تقف على خط الأعداد من {WA.min} إلى {WA.max}، والطلاب يجيبون دون مؤقت.</p>
            {WA.questions.map((q, k) => {
              const a = warmupAnswer(q);
              const bad = a < WA.min || a > WA.max;
              return (
                <div key={k} className={cn("flex flex-wrap items-center gap-2 rounded-2xl border-2 p-2", bad ? "border-hero-red" : "border-hero-ink/10")}>
                  <span className="font-bold">سؤال {k + 1}: ما العدد الذي يأتي</span>
                  <Segmented
                    value={q.dir}
                    onChange={(dir) => setSeg(0, { activity: { ...WA, questions: WA.questions.map((x, j) => (j === k ? { ...x, dir } : x)) } })}
                    options={[{ value: "before" as const, label: "قبل" }, { value: "after" as const, label: "بعد" }]}
                  />
                  <input
                    type="number"
                    aria-label={`عدد سؤال التمهيد ${k + 1}`}
                    className={cn(inputClass, "w-24")}
                    value={q.n}
                    onChange={(e) => setSeg(0, { activity: { ...WA, questions: WA.questions.map((x, j) => (j === k ? { ...x, n: Math.round(Number(e.target.value) || 0) } : x)) } })}
                  />
                  <span>؟ الإجابة: <b>{a}</b></span>
                </div>
              );
            })}
            <Button variant="secondary" size="sm" className="w-fit" icon={<RefreshCw className="size-5" />} onClick={() => setSeg(0, { activity: { ...WA, questions: warmupQuestions(WA.min, WA.max) } })}>
              أسئلة تمهيد جديدة
            </Button>
          </div>
        )}

        {selected === 1 && main.game.gameId && (
          <div className="flex flex-col gap-4">
            <Field label="اللعبة الجاهزة لهذا الدرس" group>
              <div className="flex flex-wrap gap-2">
                {lessonGames.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    aria-pressed={main.game.gameId === g.id}
                    onClick={() => setSeg(1, { game: { ...main.game, gameId: g.id, type: g.type }, title: gameMeta(g.type).name })}
                    className={cn("min-h-12 cursor-pointer rounded-2xl border-2 px-4 py-2 text-start font-bold", main.game.gameId === g.id ? "border-hero-blue bg-hero-blue/10 text-hero-blue" : "border-hero-ink/10 bg-white")}
                  >
                    {g.title} {!g.builtin && <Badge color="#7950F2" className="ms-1">نسختي</Badge>}
                  </button>
                ))}
              </div>
            </Field>
            {lessonGames.every((g) => g.id !== main.game.gameId) && <p className="text-hero-red">اللعبة المختارة غير موجودة؛ اختر لعبة أخرى.</p>}
            <p className="rounded-2xl bg-hero-blue/10 p-3">
              لتعديل أسئلة اللعبة أو وقتها:{" "}
              <Link className="font-bold text-hero-blue underline" href={`/create?from=${encodeURIComponent(main.game.gameId)}`}>خصّص هذه اللعبة</Link>
              ، فتُحفظ نسخة مخصّصة مرتبطة بالدرس وتظهر هنا للاختيار.
            </p>
          </div>
        )}
        {selected === 1 && !main.game.gameId && (
          <div className="flex flex-col gap-5">
            <Field label="اللعبة الرئيسية" group>
              <Segmented
                value={main.game.type}
                onChange={(type) => setSeg(1, { game: { ...main.game, type }, title: gameMeta(type).name })}
                options={MAIN_GAME_OPTIONS.map((t) => ({ value: t, label: gameMeta(t).name }))}
              />
            </Field>
            {main.game.type !== "train" && <p className="rounded-2xl bg-hero-blue/10 p-3">ستعرض «{gameMeta(main.game.type).name}» أسئلة السابق والتالي على شكل اختيار من متعدد، مولّدة من الإعدادات أدناه.</p>}
            <TrainSettingsForm value={main.game.train} onChange={(train) => setSeg(1, { game: { ...main.game, train } })} />
          </div>
        )}

        {selected === 2 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4">
              <Field label="طريقة التحدي" group>
                <Segmented value={ch.mode} onChange={(mode) => setSeg(2, { mode })} options={[{ value: "class" as const, label: "الصف كله" }, { value: "teams" as const, label: "فريقان" }]} />
              </Field>
              <Field label="مؤقت لكل سؤال" group>
                <Segmented value={ch.timer} onChange={(timer) => setSeg(2, { timer })} options={[0, 20, 30, 60].map((t) => ({ value: t, label: t ? `${t} ث` : "بلا مؤقت" }))} />
              </Field>
            </div>
            {ch.mode === "teams" && (
              <div className="grid gap-2 sm:grid-cols-2">
                {ch.teams.map((t, i) => (
                  <input
                    key={i}
                    aria-label={`اسم الفريق ${i + 1}`}
                    className={cn(inputClass, "font-bold")}
                    style={{ borderColor: t.color }}
                    value={t.name}
                    onChange={(e) => setSeg(2, { teams: ch.teams.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })}
                  />
                ))}
              </div>
            )}
            {ch.items && <QuestionList label="أسئلة التحدي (مع الإجابات الصحيحة)" items={ch.items} bank={lessonBank} onChange={(items) => setSeg(2, { items })} />}
            {!ch.items && <p className="text-hero-muted">الأسئلة مختلفة عن أسئلة اللعبة الرئيسية، ضمن النطاق {ch.range.min} إلى {ch.range.max}.</p>}
            {!ch.items && ch.questions.map((q, k) => {
              const ok = isValidTrainQuestion(q, ch.range.min, ch.range.max);
              const kind = q.kind === "challenge" ? "missing" : q.kind;
              return (
                <div key={k} className={cn("flex flex-wrap items-center gap-2 rounded-2xl border-2 p-2", ok ? "border-hero-ink/10" : "border-hero-red")} data-testid="challenge-question-row">
                  <span className="font-bold">سؤال {k + 1}</span>
                  <Segmented
                    value={kind}
                    onChange={(kd) => setSeg(2, { questions: ch.questions.map((x, j) => (j === k ? buildTrainQuestion(kd, questionAnchor(x)) : x)) })}
                    options={[{ value: "prev" as const, label: "السابق" }, { value: "next" as const, label: "التالي" }, { value: "missing" as const, label: "الناقص" }]}
                  />
                  <input
                    type="number"
                    aria-label={`عدد سؤال التحدي ${k + 1}`}
                    className={cn(inputClass, "w-24")}
                    value={questionAnchor(q)}
                    onChange={(e) => setSeg(2, { questions: ch.questions.map((x, j) => (j === k ? buildTrainQuestion(kind, Math.round(Number(e.target.value) || 0)) : x)) })}
                  />
                  <span dir="ltr" className="font-display text-xl font-bold">[ {q.cars.map((c) => (c === null ? "؟" : c)).join(" ، ")} ]</span>
                  {!ok && <span className="text-hero-red">خارج النطاق</span>}
                </div>
              );
            })}
            {!ch.items && (
              <Button variant="secondary" size="sm" className="w-fit" icon={<RefreshCw className="size-5" />} onClick={() => setSeg(2, { questions: challengeQuestions(ch.range.min, ch.range.max) })}>
                أسئلة تحدٍّ جديدة
              </Button>
            )}
          </div>
        )}
      </SegmentPanel>

      {issues.length > 0 && (
        <div className="rounded-3xl bg-hero-red/10 p-4 text-hero-red" role="alert">
          <p className="flex items-center gap-2 font-bold"><TriangleAlert className="size-5" /> أصلح ما يلي قبل تشغيل الحصة:</p>
          <ul>{issues.map((i) => <li key={i}>• {i}</li>)}</ul>
        </div>
      )}

      <div className="flex flex-wrap justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {stored.builtin ? (
            <Button variant="secondary" icon={<Save className="size-5" />} onClick={async () => { const c = await saveLesson(customCopy(plan)); toast("حُفظت نسخة مخصّصة من الحصة"); router.push(`/lessons/edit?id=${c.id}`); }}>حفظ نسخة مخصّصة</Button>
          ) : (
            <>
              <Button variant="secondary" icon={<Save className="size-5" />} onClick={async () => { await saveLesson(plan); toast("تم حفظ الحصة"); }}>حفظ الحصة</Button>
              <Button variant="secondary" icon={<Copy className="size-5" />} onClick={async () => { const c = await saveLesson(duplicatePlan(plan)); toast("تم نسخ الحصة"); router.push(`/lessons/edit?id=${c.id}`); }}>نسخ الحصة</Button>
            </>
          )}
        </div>
        <Button
          size="xl"
          variant="success"
          disabled={issues.length > 0}
          icon={<Play className="size-8 fill-current" />}
          onClick={async () => {
            if (!stored.builtin) await saveLesson(plan);
            router.push(`/lesson-run?id=${plan.id}`);
          }}
        >
          ابدأ الحصة الآن
        </Button>
      </div>
    </div>
  );
}

function Info({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div>
      <p className="text-sm text-hero-muted">{label}</p>
      <p className="font-display text-lg font-bold" data-testid={testId}>{value}</p>
    </div>
  );
}

function SegmentPanel({ segment, onMinutes, onPreview, children }: { segment: LessonSegment; onMinutes: (m: number) => void; onPreview: () => void; children: React.ReactNode }) {
  const meta = SEGMENT_META[segment.kind];
  return (
    <Card className="flex flex-col gap-4" >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-extrabold" style={{ color: meta.color }}>
          {meta.emoji} {meta.label}: {segment.title}
        </h2>
        <div className="flex items-center gap-2">
          <span className="font-bold">المدة</span>
          <IconButton label="إنقاص دقيقة" className="bg-hero-ink/5 shadow-none" disabled={segment.minutes <= 1} onClick={() => onMinutes(segment.minutes - 1)}>
            <Minus className="size-5" />
          </IconButton>
          <span className="w-16 text-center font-display text-2xl font-extrabold">{segment.minutes} د</span>
          <IconButton label="زيادة دقيقة" className="bg-hero-ink/5 shadow-none" disabled={segment.minutes >= 30} onClick={() => onMinutes(segment.minutes + 1)}>
            <Plus className="size-5" />
          </IconButton>
          <Button variant="secondary" size="sm" icon={<Eye className="size-5" />} onClick={onPreview}>معاينة</Button>
        </div>
      </div>
      <Badge color={meta.color} className="w-fit">{segment.kind === "warmup" ? "بدون مؤقت ضاغط على الطلاب" : segment.kind === "main" ? "تطبيق المفهوم باللعب" : "قياس الفهم"}</Badge>
      {children}
    </Card>
  );
}

/** Editable list of lesson questions (warm-up or challenge): text, choices, right answer; add from the lesson's bank. */
function QuestionList({ label, items, bank, onChange }: { label: string; items: Question[]; bank: Question[]; onChange: (items: Question[]) => void }) {
  const set = (k: number, patch: Partial<Question>) => onChange(items.map((q, j) => (j === k ? { ...q, ...patch } : q)));
  const unused = bank.filter((b) => !items.some((q) => q.id === b.id));
  return (
    <div className="flex flex-col gap-3" data-testid="plan-questions">
      <p className="font-bold">{label} ({items.length})</p>
      {items.map((q, k) => {
        const ok = !!toPlayable(q);
        return (
          <div key={`${q.id}-${k}`} className={cn("flex flex-col gap-2 rounded-2xl border-2 p-3", ok ? "border-hero-ink/10" : "border-hero-red")} data-testid="plan-question">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold">سؤال {k + 1}</span>
              {q.origin && <Badge color={q.origin === "textbook" ? "#4361EE" : "#E67700"}>{q.origin === "textbook" ? `📘 من الكتاب${q.page ? ` ص${q.page}` : ""}` : "✨ مولّد"}</Badge>}
              <input aria-label={`نص السؤال ${k + 1}`} dir={isMathExpression(q.prompt) ? "ltr" : undefined} className={cn(inputClass, "min-w-56 flex-1")} value={q.prompt} onChange={(e) => set(k, { prompt: e.target.value })} />
              <IconButton label="حذف السؤال" className="bg-hero-red/10 text-hero-red shadow-none" onClick={() => onChange(items.filter((_, j) => j !== k))}>
                <Trash2 className="size-5" />
              </IconButton>
            </div>
            {q.kind === "mcq" && (
              <div className="flex flex-wrap gap-2">
                {q.choices.map((c, i) => (
                  <label key={i} className={cn("flex items-center gap-1 rounded-xl border-2 px-2", i === q.correctIndex ? "border-hero-green" : "border-hero-ink/10")}>
                    <input type="radio" name={`correct-${q.id}-${k}`} checked={i === q.correctIndex} onChange={() => set(k, { correctIndex: i })} aria-label={`الإجابة الصحيحة ${i + 1}`} />
                    <input className="w-28 bg-transparent p-1 outline-none" value={c} aria-label={`الخيار ${i + 1}`} onChange={(e) => set(k, { choices: q.choices.map((x, j) => (j === i ? e.target.value : x)) })} />
                  </label>
                ))}
              </div>
            )}
            {q.kind === "truefalse" && (
              <Segmented value={q.correctIndex === 1 ? 1 : 0} onChange={(v) => set(k, { correctIndex: v })} options={[{ value: 0, label: "صح" }, { value: 1, label: "خطأ" }]} />
            )}
            {q.kind === "arithmetic" && <p className="text-sm text-hero-muted">مسألة حسابية: تُحسب الإجابة وتُولَّد الخيارات تلقائيًا.</p>}
          </div>
        );
      })}
      {unused.length > 0 && (
        <select
          aria-label="إضافة سؤال من أسئلة الدرس"
          className={cn(inputClass, "w-full max-w-xl")}
          value=""
          onChange={(e) => {
            const q = unused.find((b) => b.id === e.target.value);
            if (q) onChange([...items, structuredClone(q)]);
          }}
        >
          <option value="">➕ إضافة سؤال من أسئلة الدرس ({unused.length})</option>
          {unused.map((b) => (
            <option key={b.id} value={b.id}>{b.prompt}</option>
          ))}
        </select>
      )}
    </div>
  );
}
