"use client";
import { AnimatePresence, motion } from "motion/react";
import { Home, Maximize, Minimize, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { HeroKid, RobotBuddy } from "@/components/Characters";
import { Button, Loading } from "@/components/ui";
import { sound } from "@/lib/audio";
import { gameMeta, gradeLabel, subjectLabel } from "@/lib/constants";
import { MATH_GAME_INFO } from "@/lib/math/meta";
import { preparePlayable, validateGame } from "@/lib/questions";
import type { GameType } from "@/lib/types";
import { uid } from "@/lib/utils";
import { useData } from "@/store/data";
import { useSettings } from "@/store/settings";
import { ResultsView } from "./ResultsView";
import { useFullscreen } from "./shared/useFullscreen";
import type { GameProps, GameSummary } from "./types";

function GameLoading() {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-4">
      <RobotBuddy size={140} mood="think" />
      <Loading label="نجهّز اللعبة..." />
    </div>
  );
}

// Each game is code-split and only loaded when played.
const GAME_COMPONENTS: Partial<Record<GameType, ComponentType<GameProps>>> = {
  wheel: dynamic(() => import("./wheel/WheelGame"), { ssr: false, loading: GameLoading }),
  race: dynamic(() => import("./race/RaceGame"), { ssr: false, loading: GameLoading }),
  balloons: dynamic(() => import("./balloons/BalloonsGame"), { ssr: false, loading: GameLoading }),
  quiz: dynamic(() => import("./quiz/QuizGame"), { ssr: false, loading: GameLoading }),
  teams: dynamic(() => import("./teams/TeamsGame"), { ssr: false, loading: GameLoading }),
  train: dynamic(() => import("./train/TrainGame"), { ssr: false, loading: GameLoading }),
  island: dynamic(() => import("./math/IslandGame"), { ssr: false, loading: GameLoading }),
  crocodile: dynamic(() => import("./math/CrocodileGame"), { ssr: false, loading: GameLoading }),
  rocket: dynamic(() => import("./math/RocketGame"), { ssr: false, loading: GameLoading }),
  appleBasket: dynamic(() => import("./math/AppleBasketGame"), { ssr: false, loading: GameLoading }),
  factory: dynamic(() => import("./math/FactoryGame"), { ssr: false, loading: GameLoading }),
  raceAdd: dynamic(() => import("./math/RaceAddGame"), { ssr: false, loading: GameLoading }),
  pirates: dynamic(() => import("./math/PiratesGame"), { ssr: false, loading: GameLoading }),
  shapes: dynamic(() => import("./math/ShapesGame"), { ssr: false, loading: GameLoading }),
  pizza: dynamic(() => import("./math/PizzaGame"), { ssr: false, loading: GameLoading }),
  market: dynamic(() => import("./math/MarketGame"), { ssr: false, loading: GameLoading }),
  clock: dynamic(() => import("./math/ClockGame"), { ssr: false, loading: GameLoading }),
  measure: dynamic(() => import("./math/MeasureGame"), { ssr: false, loading: GameLoading }),
};

const HOW_TO: Partial<Record<GameType, string[]>> = {
  ...Object.fromEntries(Object.entries(MATH_GAME_INFO).map(([k, v]) => [k, v.howTo])),
  wheel: ["اضغط «دوّر العجلة» لتختار العجلة سؤالًا أو اسمًا بعدل تام.", "يجيب الطالب أو الفريق عن السؤال الظاهر.", "تُزال الخانة المستخدمة إن كان هذا الخيار مفعّلًا."],
  race: ["الفريق الأحمر على يمين الشاشة والفريق الأزرق على يسارها، ويلعبان في الوقت نفسه.", "لكل فريق أسئلته؛ كل إجابة صحيحة تدفع سيارته إلى الأمام، والخطأ لا يحرّكها.", "أول سيارة تعبر خط النهاية تفوز، وإن انتهى الوقت يفوز الأكثر تقدمًا."],
  train: ["في كل محطة عربة فارغة تنتظر عددها.", "اضغط على العدد الصحيح أو اسحبه إلى العربة.", "اضغط «تلميح» لترى خط الأعداد، ولا تُخصم نقاط عند الخطأ في الوضع التعليمي."],
  quiz: ["سؤال واحد في كل شاشة مع أربعة خيارات.", "كلما أجبت أسرع حصلت على نقاط إضافية.", "الإجابات الصحيحة المتتالية تشعل سلسلة الأبطال 🔥"],
  teams: ["يتناوب الفريقان على البدء بالسؤال.", "إن أخطأ الفريق ينتقل السؤال للفريق الآخر ليسرق نصف النقاط.", "الفريق صاحب النقاط الأعلى في النهاية يفوز!"],
  balloons: ["اقرأ السؤال في أعلى الشاشة.", "افقع البالون الذي يحمل الإجابة الصحيحة باللمس أو بالفأرة.", "الإجابة من المحاولة الأولى تمنح النقاط كاملة."],
};

type Phase = "intro" | "playing" | "results";

export function PlayScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id") ?? "";
  const preview = params.get("preview") === "1";
  const { ready, findGame, addResult } = useData();
  const { muted, set } = useSettings();
  const game = ready ? findGame(id) : undefined;
  const rootRef = useRef<HTMLDivElement>(null);
  const fs = useFullscreen(rootRef);
  const [phase, setPhase] = useState<Phase>("intro");
  const [paused, setPaused] = useState(false);
  const [round, setRound] = useState(0);
  const [summary, setSummary] = useState<GameSummary | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const startedAt = useRef(0);
  const pausedAt = useRef(0);
  const pausedTotal = useRef(0);

  const issues = useMemo(() => (game ? validateGame(game) : []), [game]);
  // Re-shuffle questions for every round.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const questions = useMemo(() => (game ? preparePlayable(game) : []), [game, round]);

  const start = useCallback(() => {
    sound.play("whoosh");
    void fs.enter();
    startedAt.current = Date.now();
    pausedTotal.current = 0;
    setSummary(null);
    setPaused(false);
    setRound((r) => r + 1);
    setPhase("playing");
  }, [fs]);

  const togglePause = useCallback(() => {
    setPaused((p) => {
      if (!p) pausedAt.current = Date.now();
      else pausedTotal.current += Date.now() - pausedAt.current;
      return !p;
    });
  }, []);

  const finish = useCallback(
    (s: GameSummary) => {
      if (!game) return;
      const duration = Date.now() - startedAt.current - pausedTotal.current;
      setDurationMs(duration);
      setSummary(s);
      setPhase("results");
      sound.play("win");
      if (!preview && s.correct + s.wrong > 0) {
        void addResult({
          id: uid("r_"),
          gameId: game.id,
          gameTitle: game.title,
          type: game.type,
          grade: game.grade,
          subject: game.subject,
          startedAt: startedAt.current,
          durationMs: duration,
          correct: s.correct,
          wrong: s.wrong,
          score: s.score,
          teams: s.teams,
          winner: s.winner,
        });
      }
    },
    [game, preview, addResult],
  );

  // Keyboard shortcuts for the teacher: Space/P = pause, F = fullscreen, M = mute.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== "playing" || (e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "p" || e.key === "P" || e.key === "ح") togglePause();
      else if (e.key === "f" || e.key === "F" || e.key === "ب") void fs.toggle();
      else if (e.key === "m" || e.key === "M" || e.key === "ة") set({ muted: !useSettings.getState().muted });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, togglePause, fs, set]);

  const exit = async () => {
    await fs.exit();
    router.push(preview && game ? `/create?edit=${encodeURIComponent(game.id)}` : "/");
  };

  if (!ready) return <div className="h-dvh"><GameLoading /></div>;

  if (!game) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <RobotBuddy size={140} mood="think" />
        <h1 className="text-3xl font-extrabold">لم نعثر على هذه اللعبة</h1>
        <p className="text-lg text-hero-muted">ربما حُذفت أو أن الرابط غير صحيح.</p>
        <Link href="/library" className="btn-3d rounded-2xl bg-hero-blue px-6 py-3 font-display text-xl font-bold text-white">مكتبة الألعاب</Link>
      </div>
    );
  }

  const meta = gameMeta(game.type);
  const GameComponent = GAME_COMPONENTS[game.type];

  if (!meta.ready || !GameComponent || issues.length > 0) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <RobotBuddy size={140} mood="think" />
        <h1 className="text-3xl font-extrabold">{meta.ready ? "اللعبة تحتاج إلى بعض التعديلات" : "هذه اللعبة قيد التطوير"}</h1>
        <ul className="text-lg text-hero-red">
          {issues.slice(0, 6).map((i, k) => (
            <li key={k}>• {i.index !== undefined ? `السؤال ${i.index + 1}: ` : ""}{i.message}</li>
          ))}
        </ul>
        <div className="flex gap-3">
          {!game.builtin && <Link href={`/create?edit=${encodeURIComponent(game.id)}`} className="btn-3d rounded-2xl bg-hero-blue px-6 py-3 font-display text-xl font-bold text-white">تعديل اللعبة</Link>}
          <Link href="/" className="btn-3d rounded-2xl bg-white px-6 py-3 font-display text-xl font-bold">الرئيسية</Link>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative flex h-dvh flex-col overflow-hidden bg-hero-bg" data-testid="classroom">
      {/* Classroom HUD */}
      <header className="z-40 flex items-center gap-3 bg-gradient-to-l from-hero-blue to-hero-purple px-3 py-2 text-white md:px-5">
        <span className="hidden size-11 place-items-center rounded-xl bg-white/20 text-xl sm:grid">⭐</span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl font-extrabold md:text-2xl">{game.title}</h1>
          <p className="truncate text-sm text-white/80">
            {gradeLabel(game.grade)} • {subjectLabel(game.subject)}{preview && " • معاينة"}
          </p>
        </div>
        {phase === "playing" && (
          <>
            <HudButton label={paused ? "استئناف" : "إيقاف مؤقت"} onClick={togglePause}>{paused ? <Play /> : <Pause />}</HudButton>
            <HudButton label="إعادة تشغيل اللعبة" onClick={start}><RotateCcw /></HudButton>
          </>
        )}
        <HudButton label={muted ? "تشغيل الصوت" : "كتم الصوت"} onClick={() => set({ muted: !muted })}>{muted ? <VolumeX /> : <Volume2 />}</HudButton>
        {fs.supported && <HudButton label={fs.active ? "الخروج من ملء الشاشة" : "ملء الشاشة"} onClick={() => void fs.toggle()}>{fs.active ? <Minimize /> : <Maximize />}</HudButton>}
        <HudButton label="العودة إلى لوحة التحكم" onClick={exit}><Home /></HudButton>
      </header>

      <div className="relative min-h-0 flex-1">
        {phase === "intro" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex size-full flex-col items-center justify-center gap-5 overflow-y-auto p-6 text-center">
            <div className="flex items-end">
              <HeroKid size={150} mood="cheer" />
              <RobotBuddy size={130} className="-ms-4" />
            </div>
            <h2 className="font-display text-4xl font-extrabold md:text-6xl">{meta.name}</h2>
            <p className="text-xl text-hero-muted md:text-2xl">{game.lesson}</p>
            <ol className="flex max-w-2xl flex-col gap-2 rounded-3xl bg-white p-5 text-start text-lg shadow-soft md:text-xl">
              {(HOW_TO[game.type] ?? []).map((t, i) => (
                <li key={i} className="flex gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-hero-yellow font-display font-bold">{i + 1}</span>
                  {t}
                </li>
              ))}
            </ol>
            <Button size="xl" variant="success" icon={<Play className="size-9 fill-current" />} onClick={start}>
              ابدأ اللعب
            </Button>
            <p className="text-sm text-hero-muted">اختصارات المعلم: P إيقاف مؤقت • F ملء الشاشة • M كتم الصوت</p>
          </motion.div>
        )}

        {phase === "playing" && <GameComponent key={round} game={game} questions={questions} paused={paused} onFinish={finish} />}

        {phase === "results" && summary && (
          <ResultsView summary={summary} durationMs={durationMs} game={game} preview={preview} onReplay={start} onExit={exit} />
        )}

        <AnimatePresence>
          {paused && phase === "playing" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-hero-ink/60 backdrop-blur-md"
            >
              <RobotBuddy size={140} mood="think" />
              <h2 className="font-display text-5xl font-extrabold text-white">استراحة قصيرة</h2>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="xl" variant="success" icon={<Play className="size-8 fill-current" />} onClick={togglePause}>متابعة</Button>
                <Button size="xl" variant="secondary" icon={<RotateCcw className="size-8" />} onClick={start}>من البداية</Button>
                <Button size="xl" variant="secondary" icon={<Home className="size-8" />} onClick={exit}>لوحة التحكم</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function HudButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        sound.play("click");
        onClick();
      }}
      className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-2xl bg-white/15 transition hover:bg-white/30 active:scale-95 md:size-14"
    >
      {children}
    </button>
  );
}
