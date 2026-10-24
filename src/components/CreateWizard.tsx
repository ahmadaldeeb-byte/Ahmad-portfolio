"use client";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookPlus,
  Check,
  CheckCircle2,
  Cloud,
  Copy,
  Eye,
  Library,
  Play,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { defaultSettings } from "@/content/seed";
import { DEFAULT_TEAM_NAMES, DIFFICULTY_LABELS, GAMES, GRADES, KIND_LABELS, SUBJECTS, TEAM_COLORS, gameMetaFor } from "@/lib/constants";
import { blankQuestion, validateGame, validateQuestion } from "@/lib/questions";
import type { Difficulty, GameConfig, GameType, Question } from "@/lib/types";
import { cn, uid } from "@/lib/utils";
import { useData } from "@/store/data";
import { RobotBuddy } from "./Characters";
import { GameArt } from "./GameArt";
import { playHref, questionCount } from "./GameCard";
import { QuestionEditor } from "./QuestionEditor";
import { TrainSettingsForm } from "./TrainSettingsForm";
import { TRAIN_DEFAULTS } from "@/lib/train";
import { RACE_DEFAULTS } from "@/lib/race";
import { MATH_DEFAULTS } from "@/lib/math/common";
import { isMathGame } from "@/lib/math/meta";
import { MathSettingsForm } from "./MathSettingsForm";
import { toast } from "./Toast";
import { Badge, Button, Card, EmptyState, Field, IconButton, Loading, Modal, Segmented, inputClass } from "./ui";

const STEPS = ["الصف", "المادة", "الدرس", "نوع اللعبة", "الأسئلة والإجابات", "الوقت والنقاط", "المعاينة", "الحفظ والتشغيل"];

function newGame(): GameConfig {
  const now = Date.now();
  return {
    id: uid("g_"),
    title: "",
    grade: 1,
    subject: "arabic",
    lesson: "",
    type: "wheel",
    difficulty: 1,
    questions: [],
    settings: defaultSettings("wheel"),
    createdAt: now,
    updatedAt: now,
  };
}

export function CreateWizard() {
  const params = useSearchParams();
  const router = useRouter();
  const { ready, findGame, saveGame, questions: bank, saveQuestions } = useData();
  const [game, setGame] = useState<GameConfig | null>(null);
  const [step, setStep] = useState(0);
  const [persist, setPersist] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [openQ, setOpenQ] = useState<string | null>(null);
  const [bankOpen, setBankOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const initKey = useRef<string | null>(null);

  // Initialise from ?edit=, ?from= or a blank game.
  useEffect(() => {
    if (!ready) return;
    const key = params.toString();
    if (initKey.current === key) return;
    initKey.current = key;
    const edit = params.get("edit");
    const from = params.get("from");
    const src = edit ? findGame(edit) : from ? findGame(from) : undefined;
    if (src && edit && !src.builtin) {
      setGame(structuredClone(src));
      setPersist(true);
      setStep(4);
    } else if (src) {
      const now = Date.now();
      setGame({ ...structuredClone(src), id: uid("g_"), builtin: false, title: `${src.title} (مخصّصة)`, createdAt: now, updatedAt: now });
      setPersist(false);
      setStep(4);
    } else {
      setGame(newGame());
      setPersist(false);
      setStep(0);
    }
  }, [ready, params, findGame]);

  // Auto-save (debounced) once the game exists in storage.
  useEffect(() => {
    if (!game || !persist) return;
    setSaveState("saving");
    const t = setTimeout(async () => {
      await saveGame(game);
      setSaveState("saved");
    }, 600);
    return () => clearTimeout(t);
  }, [game, persist, saveGame]);

  const meta = game ? gameMetaFor(game.type, game.subject) : null;
  const issues = useMemo(() => (game ? validateGame(game) : []), [game]);

  if (!ready || !game || !meta) return <Loading />;

  const update = (patch: Partial<GameConfig>) => {
    setGame((g) => (g ? { ...g, ...patch } : g));
    if (step >= 3) setPersist(true);
  };
  const updateSettings = (patch: Partial<GameConfig["settings"]>) => update({ settings: { ...game.settings, ...patch } });
  const setQuestions = (qs: Question[]) => update({ questions: qs });

  const canNext = (() => {
    if (step === 2) return game.lesson.trim().length > 0;
    return true;
  })();

  const next = () => {
    if (step === 2 && !game.title.trim()) update({ title: `${meta.name} — ${game.lesson}` });
    if (step === 3) setPersist(true);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const chooseType = (t: GameType) => {
    const defaults = defaultSettings(t);
    const oldDefaultTitle = `${meta.name} — ${game.lesson}`;
    update({
      type: t,
      title: !game.title || game.title === oldDefaultTitle ? `${gameMetaFor(t, game.subject).name} — ${game.lesson}` : game.title,
      settings: { ...defaults, ...game.settings, train: game.settings.train ?? defaults.train, math: game.settings.math ?? defaults.math, timePerQuestion: game.settings.timePerQuestion || defaults.timePerQuestion },
    });
  };

  const addQuestion = () => {
    const q = blankQuestion({ grade: game.grade, subject: game.subject, lesson: game.lesson, difficulty: game.difficulty }, meta.kinds[0]);
    setQuestions([...game.questions, q]);
    setOpenQ(q.id);
  };

  const move = (i: number, dir: -1 | 1) => {
    const qs = game.questions.slice();
    const j = i + dir;
    if (j < 0 || j >= qs.length) return;
    [qs[i], qs[j]] = [qs[j], qs[i]];
    setQuestions(qs);
  };

  const saveAndPlay = async (preview = false) => {
    if (issues.length) {
      setShowErrors(true);
      setStep(6);
      toast("أكمل البيانات الناقصة قبل التشغيل", "error");
      return;
    }
    await saveGame(game);
    setPersist(true);
    router.push(playHref(game.id) + (preview ? "&preview=1" : ""));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold md:text-4xl">{params.get("edit") ? "تعديل اللعبة" : "إنشاء لعبة جديدة"}</h1>
          <p className="text-lg text-hero-muted">بدون أي برمجة — اتبع الخطوات وستكون لعبتك جاهزة.</p>
        </div>
        {persist && (
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-bold text-hero-muted shadow-soft" aria-live="polite">
            {saveState === "saving" ? <Cloud className="size-5 animate-pulse" /> : <CheckCircle2 className="size-5 text-hero-green" />}
            {saveState === "saving" ? "جارٍ الحفظ..." : "محفوظ تلقائيًا"}
          </span>
        )}
      </div>

      {/* Stepper */}
      <ol className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => (i <= 2 || game.lesson.trim()) && setStep(i)}
              className={cn(
                "flex min-h-12 cursor-pointer items-center gap-2 whitespace-nowrap rounded-2xl px-4 font-display font-bold transition",
                i === step ? "bg-hero-blue text-white shadow-lg" : i < step ? "bg-hero-green/15 text-hero-green" : "bg-white text-hero-muted",
              )}
            >
              <span className={cn("grid size-7 place-items-center rounded-full text-sm", i === step ? "bg-white/25" : i < step ? "bg-hero-green text-white" : "bg-hero-ink/10")}>
                {i < step ? <Check className="size-4" /> : i + 1}
              </span>
              {s}
            </button>
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.22 }}>
          {step === 0 && (
            <StepCard title="لأيّ صف هذه اللعبة؟">
              <div className="grid gap-4 sm:grid-cols-3">
                {GRADES.map((g) => (
                  <ChoiceTile key={g.id} active={game.grade === g.id} color={g.color} onClick={() => { update({ grade: g.id }); setStep(1); }}>
                    <span className="font-display text-5xl font-extrabold">{["١", "٢", "٣"][g.id - 1]}</span>
                    <span className="font-display text-2xl font-bold">{g.label}</span>
                  </ChoiceTile>
                ))}
              </div>
            </StepCard>
          )}

          {step === 1 && (
            <StepCard title="اختر المادة">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {SUBJECTS.map((s) => (
                  <ChoiceTile key={s.id} active={game.subject === s.id} color={s.color} onClick={() => { update({ subject: s.id }); setStep(2); }}>
                    <span className="text-5xl">{s.emoji}</span>
                    <span className="font-display text-2xl font-bold">{s.label}</span>
                  </ChoiceTile>
                ))}
              </div>
            </StepCard>
          )}

          {step === 2 && (
            <StepCard title="ما عنوان الدرس؟">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="عنوان الدرس" hint="مثال: الجمع ضمن ٢٠، الحواس الخمس، الحروف الشمسية">
                  <input
                    autoFocus
                    className={inputClass}
                    value={game.lesson}
                    onChange={(e) => update({ lesson: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && canNext && next()}
                    placeholder="اكتب عنوان الدرس"
                  />
                </Field>
                <Field label="اسم اللعبة (اختياري)" hint="إن تركته فارغًا سيُقترح اسم تلقائي.">
                  <input className={inputClass} value={game.title} onChange={(e) => update({ title: e.target.value })} placeholder="مثال: سباق الجمع الكبير" />
                </Field>
                <Field label="مستوى الصعوبة" group>
                  <Segmented value={game.difficulty} onChange={(d: Difficulty) => update({ difficulty: d })} options={([1, 2, 3] as Difficulty[]).map((d) => ({ value: d, label: DIFFICULTY_LABELS[d] }))} />
                </Field>
              </div>
            </StepCard>
          )}

          {step === 3 && (
            <StepCard title="اختر نوع اللعبة">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {GAMES.map((base) => gameMetaFor(base.type, game.subject)).map((g) => (
                  <button
                    key={g.type}
                    type="button"
                    disabled={!g.ready}
                    onClick={() => chooseType(g.type)}
                    className={cn(
                      "relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border-4 bg-white text-start transition hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0",
                      game.type === g.type ? "border-hero-blue shadow-lg" : "border-transparent shadow-soft",
                    )}
                  >
                    <GameArt type={g.type} className="aspect-[16/8] w-full" />
                    <span className="flex flex-col gap-1 p-4">
                      <span className="flex items-center justify-between gap-2 font-display text-xl font-extrabold">
                        {g.name}
                        {!g.ready && <Badge color="#868E96">قريبًا</Badge>}
                        {game.type === g.type && <CheckCircle2 className="size-7 text-hero-blue" />}
                      </span>
                      <span className="text-hero-muted">{g.description}</span>
                      <span className="text-sm text-hero-muted">{g.generated ? "أسئلة مولّدة تلقائيًا" : `يدعم: ${g.kinds.map((k) => KIND_LABELS[k]).join("، ")}`}</span>
                    </span>
                  </button>
                ))}
              </div>
            </StepCard>
          )}

          {step === 4 && isMathGame(game.type) && meta.generated && (
            <StepCard title={`إعدادات «${meta.name}»`}>
              <p className="mb-4 text-hero-muted">تُولَّد مهام هذه اللعبة تلقائيًا وبصورة صحيحة حسب المستوى الذي تختاره.</p>
              <MathSettingsForm type={game.type} grade={game.grade} value={game.settings.math ?? MATH_DEFAULTS} onChange={(math) => updateSettings({ math })} />
            </StepCard>
          )}

          {step === 4 && meta.generated && game.type === "train" && (
            <StepCard title="إعدادات أسئلة القطار">
              <p className="mb-4 text-hero-muted">تُولَّد أسئلة هذه اللعبة تلقائيًا وبصورة صحيحة ضمن النطاق الذي تختاره، ولا تخرج عنه أبدًا.</p>
              <TrainSettingsForm value={game.settings.train ?? TRAIN_DEFAULTS} onChange={(train) => updateSettings({ train })} />
            </StepCard>
          )}

          {step === 4 && !meta.generated && (
            <StepCard
              title={`الأسئلة (${game.questions.length})`}
              actions={
                <>
                  <Button variant="secondary" icon={<Library className="size-5" />} onClick={() => setBankOpen(true)}>من بنك الأسئلة</Button>
                  {game.questions.length > 0 && (
                    <Button
                      variant="secondary"
                      icon={<BookPlus className="size-5" />}
                      onClick={async () => {
                        const valid = game.questions.filter((q) => validateQuestion(q).length === 0);
                        await saveQuestions(valid.map((q) => ({ ...q, grade: game.grade, subject: game.subject, lesson: q.lesson || game.lesson })));
                        toast(`حُفظ ${valid.length} سؤالًا في البنك`);
                      }}
                    >
                      حفظ في البنك
                    </Button>
                  )}
                  <Button icon={<Plus className="size-5" />} onClick={addQuestion}>سؤال جديد</Button>
                </>
              }
            >
              <p className="mb-4 text-hero-muted">
                لعبة «{meta.name}» تقبل: {meta.kinds.map((k) => KIND_LABELS[k]).join("، ")}. اكتب السؤال، أضف الإجابات، وحدّد الإجابة الصحيحة.
              </p>
              {isMathGame(game.type) && (
                <Field label="طريقة اللعب" group>
                  <Segmented
                    value={(game.settings.math ?? MATH_DEFAULTS).learning ? 1 : 0}
                    onChange={(v) => updateSettings({ math: { ...(game.settings.math ?? MATH_DEFAULTS), learning: v === 1 } })}
                    options={[{ value: 1, label: "تعليمي: محاولات بلا خصم" }, { value: 0, label: "اختبار: محاولة واحدة" }]}
                  />
                </Field>
              )}
              {game.type === "wheel" && game.settings.wheelMode === "names" && (
                <p className="mb-4 rounded-2xl bg-hero-yellow/25 p-3">العجلة مضبوطة على «أسماء الطلاب»؛ الأسئلة هنا اختيارية. يمكنك تعديل ذلك في خطوة «الوقت والنقاط».</p>
              )}
              {game.questions.length === 0 ? (
                <EmptyState art={<RobotBuddy size={110} mood="think" />} title="لا توجد أسئلة بعد" hint="أضف سؤالًا جديدًا أو اختر أسئلة جاهزة من بنك الأسئلة." />
              ) : (
                <ol className="flex flex-col gap-3">
                  {game.questions.map((q, i) => {
                    const errs = validateQuestion(q);
                    const unsupported = !meta.kinds.includes(q.kind);
                    const open = openQ === q.id;
                    return (
                      <li key={q.id} className={cn("rounded-3xl border-2 bg-white", errs.length || unsupported ? "border-hero-red/40" : "border-hero-ink/5")}>
                        <div className="flex flex-wrap items-center gap-2 p-3">
                          <button type="button" onClick={() => setOpenQ(open ? null : q.id)} className="flex min-h-12 min-w-0 flex-1 cursor-pointer items-center gap-3 text-start">
                            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-hero-blue font-display font-bold text-white">{i + 1}</span>
                            <span className="min-w-0">
                              <span className="block truncate text-lg font-bold">{q.prompt || q.answer || "سؤال بلا نص"}</span>
                              <span className="text-sm text-hero-muted">
                                {KIND_LABELS[q.kind]}
                                {errs.length > 0 && <span className="text-hero-red"> • غير مكتمل</span>}
                                {unsupported && <span className="text-hero-red"> • غير مدعوم في هذه اللعبة</span>}
                              </span>
                            </span>
                          </button>
                          <IconButton label="تحريك للأعلى" disabled={i === 0} className="bg-hero-ink/5 shadow-none" onClick={() => move(i, -1)}><ArrowUp className="size-5" /></IconButton>
                          <IconButton label="تحريك للأسفل" disabled={i === game.questions.length - 1} className="bg-hero-ink/5 shadow-none" onClick={() => move(i, 1)}><ArrowDown className="size-5" /></IconButton>
                          <IconButton
                            label="تكرار السؤال"
                            className="bg-hero-ink/5 shadow-none"
                            onClick={() => {
                              const copy = { ...structuredClone(q), id: uid("q_") };
                              const qs = game.questions.slice();
                              qs.splice(i + 1, 0, copy);
                              setQuestions(qs);
                            }}
                          >
                            <Copy className="size-5" />
                          </IconButton>
                          <IconButton label="حذف السؤال" className="bg-hero-red/10 text-hero-red shadow-none" onClick={() => setQuestions(game.questions.filter((x) => x.id !== q.id))}>
                            <Trash2 className="size-5" />
                          </IconButton>
                        </div>
                        {open && (
                          <div className="border-t border-hero-ink/5 p-4">
                            <QuestionEditor
                              value={q}
                              kinds={meta.kinds.includes(q.kind) ? meta.kinds : [...meta.kinds, q.kind]}
                              showErrors
                              onChange={(nq) => setQuestions(game.questions.map((x) => (x.id === q.id ? nq : x)))}
                            />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </StepCard>
          )}

          {step === 5 && (
            <StepCard title="الوقت والنقاط">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="الوقت لكل سؤال (بالثواني)" hint="اكتب ٠ لإلغاء المؤقت.">
                  <input type="number" min={0} max={300} className={inputClass} value={game.settings.timePerQuestion} onChange={(e) => updateSettings({ timePerQuestion: Math.max(0, Number(e.target.value) || 0) })} />
                </Field>
                <Field label="النقاط لكل إجابة صحيحة">
                  <input type="number" min={1} max={1000} className={inputClass} value={game.settings.pointsPerCorrect} onChange={(e) => updateSettings({ pointsPerCorrect: Math.max(1, Number(e.target.value) || 1) })} />
                </Field>
                <Field label="ترتيب الأسئلة" group>
                  <Segmented value={game.settings.shuffle ? 1 : 0} onChange={(v) => updateSettings({ shuffle: v === 1 })} options={[{ value: 1, label: "عشوائي" }, { value: 0, label: "بالترتيب" }]} />
                </Field>

                {(game.type === "race" || game.type === "raceAdd") && (
                  <>
                    <Field label="مدة السباق الافتراضية (بالدقائق)" hint="يمكن تغييرها قبل كل سباق.">
                      <input
                        type="number"
                        min={0.5}
                        max={60}
                        step={0.5}
                        className={inputClass}
                        value={(game.settings.race?.durationSec ?? RACE_DEFAULTS.durationSec) / 60}
                        onChange={(e) => updateSettings({ race: { ...RACE_DEFAULTS, ...game.settings.race, durationSec: Math.round((Number(e.target.value) || 0) * 60) } })}
                      />
                    </Field>
                    <Field label="عدد الإجابات الصحيحة للوصول إلى خط النهاية">
                      <input
                        type="number"
                        min={2}
                        max={30}
                        className={inputClass}
                        value={game.settings.race?.finishSteps ?? RACE_DEFAULTS.finishSteps}
                        onChange={(e) => updateSettings({ race: { ...RACE_DEFAULTS, ...game.settings.race, finishSteps: Math.round(Number(e.target.value) || 0) } })}
                      />
                    </Field>
                  </>
                )}

                {game.type === "wheel" && (
                  <>
                    <Field label="محتوى العجلة" group>
                      <Segmented value={game.settings.wheelMode ?? "questions"} onChange={(v) => updateSettings({ wheelMode: v })} options={[{ value: "questions", label: "أسئلة" }, { value: "names", label: "أسماء الطلاب" }]} />
                    </Field>
                    <Field label="بعد اختيار خانة" group>
                      <Segmented value={game.settings.removeUsed ? 1 : 0} onChange={(v) => updateSettings({ removeUsed: v === 1 })} options={[{ value: 1, label: "أزلها من العجلة" }, { value: 0, label: "أبقها" }]} />
                    </Field>
                    {game.settings.wheelMode === "names" && (
                      <Field label="أسماء الطلاب (اسم في كل سطر)" hint="لا تُحفظ إلا على هذا الجهاز. يكفي الاسم الأول.">
                        <textarea
                          rows={6}
                          className={cn(inputClass, "py-3")}
                          value={(game.settings.wheelNames ?? []).join("\n")}
                          onChange={(e) => updateSettings({ wheelNames: e.target.value.split("\n") })}
                          placeholder={"سارة\nعمر\nليان"}
                        />
                      </Field>
                    )}
                  </>
                )}

                {meta.teamBased && (
                  <div className="flex flex-col gap-3 md:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="font-display text-lg font-bold">الفرق</span>
                      {(game.type === "race" || game.type === "raceAdd") && <span className="text-hero-muted">فريقان يلعبان معًا: الأحمر يمين الشاشة والأزرق يسارها.</span>}
                      {game.type === "wheel" && (
                        <Segmented
                          value={game.settings.teams.length}
                          onChange={(n) =>
                            updateSettings({
                              teams: Array.from({ length: n }, (_, i) => game.settings.teams[i] ?? { name: DEFAULT_TEAM_NAMES[i], color: TEAM_COLORS[i] }),
                            })
                          }
                          options={[{ value: 0, label: "بدون فرق" }, { value: 2, label: "فريقان" }, { value: 3, label: "٣ فرق" }, { value: 4, label: "٤ فرق" }]}
                        />
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(game.type === "race" || game.type === "raceAdd" ? game.settings.teams.slice(0, 2) : game.settings.teams).map((t, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-2xl border-2 p-2" style={{ borderColor: t.color }}>
                          <span className="size-10 shrink-0 rounded-xl" style={{ background: t.color }} />
                          <input
                            aria-label={`اسم الفريق ${i + 1}`}
                            className="min-h-11 w-full bg-transparent text-lg font-bold outline-none"
                            value={t.name}
                            onChange={(e) => updateSettings({ teams: game.settings.teams.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </StepCard>
          )}

          {step === 6 && (
            <StepCard title="المعاينة والتحقق">
              <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
                <div className="overflow-hidden rounded-3xl bg-hero-ink/5">
                  <GameArt type={game.type} className="aspect-[16/10] w-full" />
                  <div className="p-4">
                    <h3 className="text-2xl font-extrabold">{game.title || "لعبة بلا اسم"}</h3>
                    <p className="text-hero-muted">
                      {meta.name} • {GRADES[game.grade - 1].label} • {SUBJECTS.find((s) => s.id === game.subject)!.label} • {game.lesson}
                    </p>
                    <p className="mt-2">
                      {questionCount(game)} سؤالًا • {game.settings.timePerQuestion ? `${game.settings.timePerQuestion} ثانية لكل سؤال` : "بدون مؤقت"} • {game.settings.pointsPerCorrect} نقاط للإجابة
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  {issues.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-3xl bg-hero-green/10 p-5 text-xl font-bold text-hero-green">
                      <CheckCircle2 className="size-8" /> كل شيء جاهز! اللعبة صالحة للتشغيل.
                    </div>
                  ) : (
                    <div className="rounded-3xl bg-hero-red/10 p-5 text-hero-red" role="alert">
                      <p className="mb-2 flex items-center gap-2 text-xl font-bold"><TriangleAlert className="size-6" /> يجب إصلاح ما يلي قبل التشغيل:</p>
                      <ul className="flex flex-col gap-1">
                        {issues.slice(0, 12).map((iss, k) => (
                          <li key={k}>• {iss.index !== undefined ? `السؤال ${iss.index + 1}: ` : ""}{iss.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {showErrors && issues.length > 0 && <p className="text-hero-muted">انتقل إلى خطوة «الأسئلة والإجابات» لتصحيحها.</p>}
                  <Button variant="secondary" size="lg" icon={<Eye className="size-6" />} disabled={issues.length > 0} onClick={() => saveAndPlay(true)}>
                    معاينة اللعبة
                  </Button>
                  <p className="text-sm text-hero-muted">في وضع المعاينة لا تُسجَّل النتائج.</p>
                </div>
              </div>
            </StepCard>
          )}

          {step === 7 && (
            <StepCard title="الحفظ والتشغيل">
              <div className="flex flex-col items-center gap-5 py-6 text-center">
                <RobotBuddy size={140} mood={issues.length ? "think" : "cheer"} />
                <h3 className="text-3xl font-extrabold">{issues.length ? "بقيت بعض التفاصيل" : "لعبتك جاهزة!"}</h3>
                <p className="max-w-lg text-lg text-hero-muted">
                  {issues.length ? `يوجد ${issues.length} ملاحظة يجب إصلاحها. راجع خطوة المعاينة.` : "تم حفظ اللعبة في «ألعابي المحفوظة». اضغط «ابدأ اللعب» لعرضها على الشاشة بوضع الحصة."}
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={async () => {
                      await saveGame(game);
                      setPersist(true);
                      toast("تم حفظ اللعبة");
                      router.push("/my-games");
                    }}
                  >
                    حفظ والعودة
                  </Button>
                  <Button variant="success" size="lg" icon={<Play className="size-6 fill-current" />} onClick={() => saveAndPlay(false)}>
                    ابدأ اللعب
                  </Button>
                </div>
              </div>
            </StepCard>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between gap-3">
        <Button variant="secondary" size="lg" icon={<ArrowRight className="size-6" />} disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          السابق
        </Button>
        {step < STEPS.length - 1 && (
          <Button size="lg" disabled={!canNext} onClick={next}>
            التالي <ArrowLeft className="size-6" />
          </Button>
        )}
      </div>

      <BankPicker
        open={bankOpen}
        onClose={() => setBankOpen(false)}
        bank={bank}
        game={game}
        onPick={(picked) => {
          setQuestions([...game.questions, ...picked.map((q) => ({ ...structuredClone(q), id: uid("q_") }))]);
          setBankOpen(false);
          toast(`أُضيف ${picked.length} سؤالًا`);
        }}
      />
    </div>
  );
}

function StepCard({ title, actions, children }: { title: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-extrabold">{title}</h2>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </Card>
  );
}

function ChoiceTile({ active, color, onClick, children }: { active: boolean; color: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      aria-pressed={active}
      className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-4 bg-white p-4 shadow-soft"
      style={{ borderColor: active ? color : "transparent", background: active ? `${color}12` : undefined }}
    >
      {children}
    </motion.button>
  );
}

function BankPicker({
  open,
  onClose,
  bank,
  game,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  bank: Question[];
  game: GameConfig;
  onPick: (qs: Question[]) => void;
}) {
  const meta = gameMetaFor(game.type, game.subject);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [onlyThis, setOnlyThis] = useState(true);
  const [query, setQuery] = useState("");
  const list = bank.filter(
    (q) =>
      meta.kinds.includes(q.kind) &&
      (!onlyThis || (q.grade === game.grade && q.subject === game.subject)) &&
      (!query.trim() || q.prompt.includes(query.trim()) || q.lesson.includes(query.trim())),
  );
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <Modal open={open} onClose={onClose} title="اختر من بنك الأسئلة" wide>
      <div className="mb-3 flex flex-wrap gap-3">
        <input className={cn(inputClass, "flex-1")} placeholder="بحث..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <Segmented value={onlyThis ? 1 : 0} onChange={(v) => setOnlyThis(v === 1)} options={[{ value: 1, label: "هذا الصف والمادة" }, { value: 0, label: "الكل" }]} />
      </div>
      <div className="mb-3 flex gap-3">
        <Button variant="ghost" size="sm" onClick={() => setSelected(new Set(list.map((q) => q.id)))}>تحديد الكل ({list.length})</Button>
        <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>إلغاء التحديد</Button>
      </div>
      <ul className="flex max-h-[50dvh] flex-col gap-2 overflow-y-auto">
        {list.length === 0 && <li className="p-6 text-center text-hero-muted">لا توجد أسئلة مناسبة لهذه اللعبة.</li>}
        {list.map((q) => (
          <li key={q.id}>
            <label className={cn("flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 p-3", selected.has(q.id) ? "border-hero-blue bg-hero-blue/5" : "border-hero-ink/5")}>
              <input type="checkbox" className="size-6 accent-hero-blue" checked={selected.has(q.id)} onChange={() => toggle(q.id)} />
              <span className="flex-1">
                <span className="block font-bold">{q.prompt}</span>
                <span className="text-sm text-hero-muted">{q.lesson} • {KIND_LABELS[q.kind]}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>إلغاء</Button>
        <Button
          disabled={selected.size === 0}
          onClick={() => {
            onPick(bank.filter((q) => selected.has(q.id)));
            setSelected(new Set());
          }}
        >
          إضافة {selected.size} سؤالًا
        </Button>
      </div>
    </Modal>
  );
}
