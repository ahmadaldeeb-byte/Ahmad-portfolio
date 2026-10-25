"use client";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, ChevronLeft, ChevronRight, Home, Maximize, Minimize, Pause, Play, Plus, RotateCcw, Square, Volume2, VolumeX } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HeroKid, RobotBuddy } from "@/components/Characters";
import { Confetti } from "@/components/Confetti";
import { Button, Loading } from "@/components/ui";
import { useFullscreen } from "@/games/shared/useFullscreen";
import type { GameProps } from "@/games/types";
import { sound } from "@/lib/audio";
import { gameMeta } from "@/lib/constants";
import { gameComponentFor } from "@/games/registry";
import { builtinPlanById, mainQuestions, playableItems, trainToPlayable, validatePlan } from "@/lib/lessons/engine";
import { preparePlayable } from "@/lib/questions";
import { SEGMENT_META, type LessonPlan } from "@/lib/lessons/types";
import { successRate } from "@/lib/scoring";
import { generateTrainQuestions } from "@/lib/train";
import type { GameConfig, GameType } from "@/lib/types";
import { cn, formatDuration, formatNum, uid } from "@/lib/utils";
import { useData } from "@/store/data";
import { useSettings } from "@/store/settings";
import { ChallengeActivity, SKILL_NAMES } from "./ChallengeActivity";
import { QuestionsActivity } from "./QuestionsActivity";
import { WarmupActivity, type ActivitySummary } from "./WarmupActivity";

const loading = () => <Loading label="نجهّز النشاط..." />;
const TrainGame = dynamic(() => import("@/games/train/TrainGame"), { ssr: false, loading });
const CHOICE_GAMES: Partial<Record<GameType, React.ComponentType<GameProps>>> = {
  quiz: dynamic(() => import("@/games/quiz/QuizGame"), { ssr: false, loading }),
  balloons: dynamic(() => import("@/games/balloons/BalloonsGame"), { ssr: false, loading }),
  race: dynamic(() => import("@/games/race/RaceGame"), { ssr: false, loading }),
  teams: dynamic(() => import("@/games/teams/TeamsGame"), { ssr: false, loading }),
};

/** Builds the transient game config the main part runs with. */
function mainGameConfig(plan: LessonPlan): GameConfig {
  const main = plan.segments[1];
  return {
    id: `lesson-${plan.id}`,
    title: plan.title,
    grade: plan.grade,
    subject: plan.subject,
    lesson: plan.lessonTitle,
    type: main.game.type,
    difficulty: 1,
    questions: [],
    settings: {
      timePerQuestion: 0,
      pointsPerCorrect: main.game.points,
      teams: plan.segments[2].teams,
      shuffle: false,
      train: main.game.train,
    },
    lessonId: plan.lessonId,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}

export function LessonRunner() {
  const params = useSearchParams();
  const router = useRouter();
  const { ready, lessons, addResult, titleOverrides, findGame } = useData();
  const { muted, set } = useSettings();
  const numerals = useSettings((s) => s.numerals);
  const fmt = (n: number | string) => formatNum(n, numerals);
  const id = params.get("id");
  const builtin = useMemo(() => builtinPlanById(id, titleOverrides), [id, titleOverrides]);
  const plan = lessons.find((l) => l.id === id) ?? builtin ?? undefined;
  // A ready game (built-in or the teacher's saved copy) played in the main part.
  const readyGame = plan?.segments[1].game.gameId ? findGame(plan.segments[1].game.gameId) : undefined;
  const preview = params.get("preview") === "1";
  const startStage = Math.min(2, Math.max(0, Number(params.get("stage")) || 0));
  const rootRef = useRef<HTMLDivElement>(null);
  const fs = useFullscreen(rootRef);

  const [started, setStarted] = useState(false);
  const [stage, setStage] = useState(startStage);
  const [paused, setPaused] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [intro, setIntro] = useState(false);
  const [remaining, setRemaining] = useState<number[]>([]);
  const [used, setUsed] = useState([0, 0, 0]);
  const [results, setResults] = useState<(ActivitySummary | null)[]>([null, null, null]);
  const [ended, setEnded] = useState(false);
  const [fire, setFire] = useState(0);
  const startedAt = useRef(0);

  useEffect(() => {
    if (plan && remaining.length === 0) setRemaining(plan.segments.map((s) => s.minutes * 60));
  }, [plan, remaining.length]);

  // Stage clock: counts down while running; never advances the stage by itself.
  useEffect(() => {
    if (!started || paused || ended || intro) return;
    const t = setInterval(() => {
      setRemaining((r) => r.map((v, i) => (i === stage ? Math.max(0, v - 1) : v)));
      setUsed((u) => u.map((v, i) => (i === stage ? v + 1 : v)));
    }, 1000);
    return () => clearInterval(t);
  }, [started, paused, ended, intro, stage]);

  useEffect(() => {
    if (!intro) return;
    const t = setTimeout(() => setIntro(false), 1700);
    return () => clearTimeout(t);
  }, [intro]);

  const goStage = useCallback(
    (i: number) => {
      sound.play("whoosh");
      setStage(i);
      setPaused(false);
      setIntro(true);
    },
    [],
  );

  // Fresh main-game questions for every run of the main part.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mainQs = useMemo(() => (plan ? mainQuestions(plan) : []), [plan?.id, runKey]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const readyQs = useMemo(() => (readyGame ? preparePlayable(readyGame) : []), [readyGame, runKey]);
  const choiceQs = useMemo(() => {
    if (!plan || plan.segments[1].game.gameId) return [];
    const t = plan.segments[1].game.train;
    // Choice games use three-wagon questions (one missing number).
    return generateTrainQuestions({ ...t, difficulty: "easy", mode: t.mode }, { exclude: new Set(plan.segments[2].questions.map((q) => q.key)) }).map((q) => trainToPlayable(q, t.min, t.max));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id, runKey]);

  const finishActivity = (s: ActivitySummary) => {
    setResults((r) => r.map((v, i) => (i === stage ? s : v)));
    sound.play("levelUp");
  };

  const endLesson = useCallback(() => {
    setEnded(true);
    setFire(Date.now());
    sound.play("win");
    sound.say("أحسنتم يا أبطال!");
    if (!plan || preview) return;
    const now = Date.now();
    [1, 2].forEach((i) => {
      const r = results[i];
      if (!r || r.correct + r.wrong === 0) return;
      void addResult({
        id: uid("r_"),
        gameId: `lesson-${plan.id}`,
        gameTitle: `${plan.title} — ${SEGMENT_META[plan.segments[i].kind].label}`,
        type: i === 1 ? plan.segments[1].game.type : plan.segments[2].items ? "quiz" : "train",
        grade: plan.grade,
        subject: plan.subject,
        startedAt: startedAt.current || now,
        durationMs: used[i] * 1000,
        correct: r.correct,
        wrong: r.wrong,
        score: r.score,
        teams: r.teams,
        winner: r.winner,
      });
    });
  }, [plan, preview, results, used, addResult]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!started || ended) return;
      if (e.key === "p" || e.key === "P") setPaused((p) => !p);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, ended]);

  if (!ready) return <div className="h-dvh"><Loading /></div>;
  if (!plan)
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <RobotBuddy size={130} mood="think" />
        <h1 className="text-3xl font-extrabold">لم نعثر على هذه الحصة</h1>
        <Link href="/lessons" className="btn-3d rounded-2xl bg-hero-blue px-6 py-3 font-display text-xl font-bold text-white">تحضير الحصص</Link>
      </div>
    );
  const issues = validatePlan(plan);
  const seg = plan.segments[stage];
  const meta = SEGMENT_META[seg.kind];
  const left = remaining[stage] ?? seg.minutes * 60;
  const ChoiceGame = CHOICE_GAMES[plan.segments[1].game.type];
  const ReadyGame = readyGame ? gameComponentFor(readyGame) : undefined;
  const missingGame = !!plan.segments[1].game.gameId && !ReadyGame;
  const exit = async () => {
    await fs.exit();
    router.push(preview ? `/lessons/edit?id=${plan.id}` : "/lessons");
  };

  return (
    <div ref={rootRef} className="relative flex h-dvh flex-col overflow-hidden bg-hero-bg" data-testid="lesson-runner">
      <header className="z-40 flex flex-wrap items-center gap-2 bg-gradient-to-l from-hero-blue to-hero-purple px-3 py-2 text-white md:px-5">
        <div className="min-w-0 basis-full md:basis-0 md:flex-1">
          <h1 className="truncate font-display text-lg font-extrabold md:text-2xl">{plan.title}{preview && " • معاينة"}</h1>
          <div className="flex items-center gap-2 text-sm">
            {plan.segments.map((s, i) => (
              <span key={s.kind} className={cn("rounded-full px-2 py-0.5 font-bold", i === stage ? "bg-white text-hero-blue" : results[i] ? "bg-white/30" : "bg-white/10")}>
                {results[i] ? "✓ " : ""}{SEGMENT_META[s.kind].label}
              </span>
            ))}
          </div>
        </div>
        {started && !ended && (
          <>
            <div className={cn("flex items-center gap-1 rounded-2xl px-3 py-1.5 font-display text-2xl font-extrabold tabular-nums", left === 0 ? "animate-pulse bg-hero-orange" : "bg-white/20")} role="timer" data-testid="stage-timer">
              {fmt(formatDuration(left * 1000))}
            </div>
            <Hud label="تمديد دقيقة" onClick={() => setRemaining((r) => r.map((v, i) => (i === stage ? v + 60 : v)))}><Plus /></Hud>
            <Hud label={paused ? "استئناف" : "إيقاف مؤقت"} onClick={() => setPaused((p) => !p)}>{paused ? <Play /> : <Pause />}</Hud>
            <Hud label="المرحلة السابقة" disabled={stage === 0} onClick={() => goStage(stage - 1)}><ChevronRight /></Hud>
            <Hud label="المرحلة التالية" disabled={stage === 2} onClick={() => goStage(stage + 1)}><ChevronLeft /></Hud>
            <Hud label="إعادة النشاط" onClick={() => { setRunKey((k) => k + 1); setResults((r) => r.map((v, i) => (i === stage ? null : v))); }}><RotateCcw /></Hud>
            <Hud label="إنهاء الحصة" onClick={endLesson}><Square /></Hud>
          </>
        )}
        <Hud label={muted ? "تشغيل الصوت" : "كتم الصوت"} onClick={() => set({ muted: !muted })}>{muted ? <VolumeX /> : <Volume2 />}</Hud>
        {fs.supported && <Hud label={fs.active ? "الخروج من ملء الشاشة" : "ملء الشاشة"} onClick={() => void fs.toggle()}>{fs.active ? <Minimize /> : <Maximize />}</Hud>}
        <Hud label="العودة إلى لوحة التحكم" onClick={exit}><Home /></Hud>
      </header>

      <div className="relative min-h-0 flex-1">
        {!started && (
          <div className="flex size-full flex-col items-center justify-center gap-5 overflow-y-auto p-6 text-center">
            <div className="flex items-end"><HeroKid size={140} mood="cheer" /><RobotBuddy size={120} className="-ms-4" /></div>
            <h2 className="font-display text-4xl font-extrabold md:text-5xl">{plan.lessonTitle}</h2>
            <div className="flex w-full max-w-2xl gap-2">
              {plan.segments.map((s) => (
                <div key={s.kind} style={{ flex: s.minutes, background: SEGMENT_META[s.kind].color }} className="rounded-2xl p-3 text-white">
                  <p className="font-display font-bold">{SEGMENT_META[s.kind].label}</p>
                  <p className="font-display text-2xl font-extrabold">{fmt(s.minutes)} د</p>
                </div>
              ))}
            </div>
            {issues.length > 0 || missingGame ? (
              <p className="text-hero-red">لا يمكن تشغيل الحصة قبل إصلاح: {issues[0] ?? "اللعبة الرئيسية غير موجودة (ربما حُذفت). اختر لعبة أخرى من تعديل الحصة."}</p>
            ) : (
              <Button
                size="xl"
                variant="success"
                icon={<Play className="size-9 fill-current" />}
                onClick={() => {
                  void fs.enter();
                  startedAt.current = Date.now();
                  setStarted(true);
                  sound.say("هيا نبدأ!");
                  goStage(startStage);
                }}
              >
                {preview ? "ابدأ المعاينة" : "ابدأ الحصة الآن"}
              </Button>
            )}
          </div>
        )}

        {started && !ended && !results[stage] && (
          <div key={`${stage}-${runKey}`} className="size-full">
            {seg.kind === "warmup" &&
              (seg.activity.type === "questions" ? (
                <QuestionsActivity kind="warmup" items={playableItems(seg.activity.questions)} instructions={seg.activity.instructions} paused={paused || intro} onDone={finishActivity} />
              ) : (
                <WarmupActivity activity={seg.activity} onDone={finishActivity} />
              ))}
            {seg.kind === "main" &&
              (readyGame && ReadyGame ? (
                <ReadyGame game={readyGame} questions={readyQs} paused={paused || intro} onFinish={finishActivity} />
              ) : seg.game.gameId ? null : seg.game.type === "train" ? (
                <TrainGame game={mainGameConfig(plan)} questions={[]} presetQuestions={mainQs} paused={paused || intro} onFinish={finishActivity} />
              ) : ChoiceGame ? (
                <ChoiceGame game={mainGameConfig(plan)} questions={choiceQs} paused={paused || intro} onFinish={finishActivity} />
              ) : null)}
            {seg.kind === "challenge" &&
              (seg.items ? (
                <QuestionsActivity kind="challenge" items={playableItems(seg.items)} timer={seg.timer} teams={seg.mode === "teams" ? seg.teams : []} paused={paused || intro} onDone={finishActivity} />
              ) : (
                <ChallengeActivity segment={seg} paused={paused || intro} onDone={finishActivity} />
              ))}
          </div>
        )}

        {/* Activity finished: the teacher decides when to move on. */}
        {started && !ended && results[stage] && (
          <div className="flex size-full flex-col items-center justify-center gap-5 p-6 text-center" data-testid="stage-done">
            <CheckCircle2 className="size-20 text-hero-green" />
            <h2 className="font-display text-4xl font-extrabold">انتهى {meta.label}!</h2>
            {results[stage]!.correct + results[stage]!.wrong > 0 && (
              <p className="text-2xl">✔ {fmt(results[stage]!.correct)} • ✘ {fmt(results[stage]!.wrong)} • ⭐ {fmt(results[stage]!.score)}</p>
            )}
            {stage < 2 ? (
              <Button size="xl" icon={<ChevronLeft className="size-8" />} onClick={() => goStage(stage + 1)}>
                الانتقال للمرحلة التالية
              </Button>
            ) : (
              <Button size="xl" variant="success" onClick={endLesson}>إنهاء الحصة</Button>
            )}
          </div>
        )}

        {/* The teacher can always move on, even mid-activity. */}
        {started && !ended && !results[stage] && stage < 2 && (
          <button
            type="button"
            onClick={() => goStage(stage + 1)}
            className="absolute bottom-3 start-3 z-30 hidden min-h-12 cursor-pointer items-center gap-2 rounded-2xl bg-white/95 px-4 font-display font-bold shadow-soft lg:flex"
          >
            الانتقال للمرحلة التالية <ChevronLeft className="size-5" />
          </button>
        )}

        <AnimatePresence>
          {intro && started && !ended && (
            <motion.div
              key={stage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4"
              style={{ background: meta.color }}
            >
              <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display text-2xl font-bold text-white/85">
                المرحلة {fmt(stage + 1)} من {fmt(3)}
              </motion.p>
              <motion.h2 initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 220, damping: 14 }} className="font-display text-6xl font-extrabold text-white" data-testid="stage-intro">
                {meta.label}
              </motion.h2>
              <p className="text-2xl text-white">{seg.title} • {fmt(seg.minutes)} دقائق</p>
            </motion.div>
          )}
          {paused && started && !ended && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-hero-ink/60 backdrop-blur-md">
              <h2 className="font-display text-5xl font-extrabold text-white">الحصة متوقفة مؤقتًا</h2>
              <Button size="xl" variant="success" icon={<Play className="size-8 fill-current" />} onClick={() => setPaused(false)}>متابعة</Button>
            </motion.div>
          )}
        </AnimatePresence>

        {ended && (
          <div className="flex size-full flex-col items-center gap-5 overflow-y-auto p-6" data-testid="lesson-summary">
            <Confetti fire={fire} />
            <div className="flex items-end"><HeroKid size={130} mood="cheer" /><RobotBuddy size={110} mood="cheer" className="-ms-4" /></div>
            <h2 className="font-display text-5xl font-extrabold md:text-6xl">أحسنتم يا أبطال!</h2>
            <div className="w-full max-w-3xl rounded-3xl bg-white p-5 shadow-soft">
              <h3 className="mb-3 text-2xl font-extrabold">ملخص الحصة للمعلم</h3>
              <ul className="flex flex-col gap-2">
                {plan.segments.map((s, i) => {
                  const r = results[i];
                  return (
                    <li key={s.kind} className="flex flex-wrap items-center gap-3 rounded-2xl bg-hero-ink/5 p-3">
                      <span className="size-4 rounded-full" style={{ background: SEGMENT_META[s.kind].color }} />
                      <span className="flex-1 font-bold">{SEGMENT_META[s.kind].label}: {s.kind === "main" ? (readyGame?.title ?? gameMeta(s.game.type).name) : s.title}</span>
                      <span className="text-hero-muted">الوقت: {fmt(formatDuration(used[i] * 1000))} من {fmt(s.minutes)} د</span>
                      <span className="font-bold">
                        {r ? (r.correct + r.wrong ? `نجاح ${fmt(successRate(r.correct, r.wrong))}٪` : "مكتمل") : "لم يكتمل"}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {(() => {
                const weak: Record<string, number> = {};
                for (const r of [results[1], results[2]]) for (const [k, v] of Object.entries(r?.skills ?? {})) if (v.wrong) weak[k] = (weak[k] ?? 0) + v.wrong;
                const list = Object.entries(weak);
                return (
                  <p className="mt-3 rounded-2xl bg-hero-yellow/25 p-3">
                    <b>مهارات تحتاج إلى مراجعة: </b>
                    {list.length ? list.map(([k, n]) => `${SKILL_NAMES[k] ?? k} (${fmt(n)})`).join("، ") : "لا توجد — أداء ممتاز!"}
                  </p>
                );
              })()}
              {preview && <p className="mt-2 text-hero-muted">هذه معاينة؛ لم تُحفظ النتائج.</p>}
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" variant="secondary" icon={<RotateCcw className="size-6" />} onClick={() => { setEnded(false); setResults([null, null, null]); setUsed([0, 0, 0]); setRemaining(plan.segments.map((s) => s.minutes * 60)); setRunKey((k) => k + 1); goStage(0); }}>
                إعادة الحصة
              </Button>
              <Button size="lg" icon={<Home className="size-6" />} onClick={exit}>{preview ? "العودة للتعديل" : "تحضير الحصص"}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Hud({ label, onClick, children, disabled }: { label: string; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => {
        sound.play("click");
        onClick();
      }}
      className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-2xl bg-white/15 transition hover:bg-white/30 active:scale-95 disabled:opacity-40 md:size-14"
    >
      {children}
    </button>
  );
}
