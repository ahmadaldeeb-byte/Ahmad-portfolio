"use client";
import { animate, AnimatePresence, motion, useMotionValue, useMotionValueEvent, type AnimationPlaybackControls } from "motion/react";
import { Flag, HelpCircle, RefreshCw, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Confetti } from "@/components/Confetti";
import { Button } from "@/components/ui";
import { sound } from "@/lib/audio";
import { initialScore, recordAnswer, winners } from "@/lib/scoring";
import { formatNum } from "@/lib/utils";
import { planSpin, segmentAtPointer } from "@/lib/wheel";
import { useSettings } from "@/store/settings";
import { AnimatedNumber } from "../shared/AnimatedNumber";
import { FeedbackBurst } from "../shared/Feedback";
import { QuestionPanel } from "../shared/QuestionPanel";
import { TimerBadge } from "../shared/TimerBadge";
import { useCountdown } from "../shared/useCountdown";
import { useFeedback } from "../shared/useFeedback";
import type { GameProps } from "../types";
import { WheelSvg } from "./WheelSvg";

type Phase = "idle" | "spinning" | "landed" | "question" | "answered";

interface Item {
  key: string;
  label: string;
  /** Index into `questions` (questions mode). */
  q?: number;
}

export default function WheelGame({ game, questions, paused, onFinish }: GameProps) {
  const { settings } = game;
  const numerals = useSettings((s) => s.numerals);
  const reduced = useSettings((s) => s.reducedMotion);
  const namesMode = settings.wheelMode === "names";
  const teams = namesMode ? [] : settings.teams;
  const n = (v: number) => formatNum(v, numerals);

  const initialItems = useMemo<Item[]>(() => {
    if (namesMode)
      return (settings.wheelNames ?? [])
        .map((s) => s.trim())
        .filter(Boolean)
        .map((name, i) => ({ key: `n${i}`, label: name }));
    return questions.map((_, i) => ({ key: `q${i}`, label: `سؤال ${formatNum(i + 1, numerals)}`, q: i }));
  }, [namesMode, settings.wheelNames, questions, numerals]);

  const [items, setItems] = useState<Item[]>(initialItems);
  const [phase, setPhase] = useState<Phase>("idle");
  const [landed, setLanded] = useState<number | null>(null);
  const [score, setScore] = useState(() => initialScore(teams));
  const [turn, setTurn] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [activeQ, setActiveQ] = useState<number | null>(null);
  const [deck, setDeck] = useState(0); // next question for names mode
  const [fire, setFire] = useState(0);
  const { feedback, show } = useFeedback();

  const rotation = useMotionValue(0);
  const controls = useRef<AnimationPlaybackControls | null>(null);
  const lastSeg = useRef(0);
  const pointerKick = useMotionValue(0);

  useMotionValueEvent(rotation, "change", (r) => {
    if (items.length < 2) return;
    const s = segmentAtPointer(r, items.length);
    if (s !== lastSeg.current) {
      lastSeg.current = s;
      sound.play("wheelTick");
      pointerKick.set(-18);
      animate(pointerKick, 0, { type: "spring", stiffness: 600, damping: 12 });
    }
  });

  useEffect(() => {
    if (paused) controls.current?.pause();
    else controls.current?.play();
  }, [paused]);
  useEffect(() => () => controls.current?.stop(), []);

  const finish = useCallback(
    (s = score) => {
      const top = winners(s.teams);
      onFinish({
        correct: s.correct,
        wrong: s.wrong,
        score: s.score,
        teams: s.teams.length > 1 ? s.teams : undefined,
        winner: s.teams.length > 1 && top.length === 1 ? top[0].name : undefined,
      });
    },
    [score, onFinish],
  );

  const spin = () => {
    if (phase === "spinning" || items.length === 0 || paused) return;
    setPhase("spinning");
    setLanded(null);
    setPicked(null);
    sound.play("whoosh");
    const plan = planSpin(rotation.get(), items.length);
    controls.current = animate(rotation, plan.rotation, {
      duration: reduced ? 1.4 : 5.2 + Math.random() * 0.8,
      ease: [0.12, 0.72, 0.16, 1],
      onComplete: () => {
        controls.current = null;
        setLanded(plan.winner);
        setPhase("landed");
        setFire(Date.now());
        sound.play("levelUp");
        const item = items[plan.winner];
        if (item.q !== undefined) {
          setTimeout(() => {
            setActiveQ(item.q!);
            setPhase("question");
          }, reduced ? 300 : 1100);
        }
      },
    });
  };

  const answer = (choice: number | null) => {
    if (activeQ === null || phase !== "question") return;
    const q = questions[activeQ];
    const ok = choice === q.correctIndex;
    setPicked(choice ?? -1);
    show(ok);
    setScore((s) => recordAnswer(s, ok, settings.pointsPerCorrect, teams.length ? turn : undefined));
    setPhase("answered");
  };

  const remaining = useCountdown(settings.timePerQuestion, phase === "question" && !paused, activeQ, () => answer(null));

  const next = () => {
    let nextItems = items;
    if (landed !== null && settings.removeUsed) {
      nextItems = items.filter((_, i) => i !== landed);
      setItems(nextItems);
      rotation.set(rotation.get() % 360);
    }
    if (phase === "answered" && teams.length > 1) setTurn((t) => (t + 1) % teams.length);
    setActiveQ(null);
    setLanded(null);
    setPicked(null);
    setPhase("idle");
    if (nextItems.length === 0) finish();
  };

  const askForName = () => {
    if (questions.length === 0) return;
    setActiveQ(deck % questions.length);
    setDeck((d) => d + 1);
    setPicked(null);
    setPhase("question");
  };

  const currentItem = landed !== null ? items[landed] : null;
  const activeTeam = teams.length > 1 ? teams[turn] : null;
  const isEnglish = game.subject === "english";

  return (
    <div className="relative flex size-full flex-col gap-4 overflow-y-auto p-4 lg:flex-row lg:items-center lg:justify-center lg:gap-10 lg:p-8">
      <Confetti fire={fire} pieces={90} />
      <FeedbackBurst feedback={feedback} />

      {/* Wheel */}
      <div className="relative mx-auto aspect-square w-full max-w-[min(78vh,640px)] shrink-0 lg:mx-0">
        <motion.div className="absolute left-1/2 top-[-6px] z-10 -translate-x-1/2" style={{ rotate: pointerKick, originY: 0 }}>
          <svg width="56" height="64" viewBox="0 0 56 64" aria-hidden>
            <path d="M28 62 L6 14 A24 24 0 1 1 50 14 Z" fill="#FA5252" stroke="#25304B" strokeWidth="4" strokeLinejoin="round" />
            <circle cx="28" cy="22" r="8" fill="#fff" />
          </svg>
        </motion.div>
        {items.length > 0 ? (
          <motion.div className="size-full" style={{ rotate: rotation }}>
            <WheelSvg labels={items.map((i) => i.label)} highlight={phase === "landed" || phase === "question" || phase === "answered" ? landed : null} />
          </motion.div>
        ) : (
          <div className="grid size-full place-items-center rounded-full bg-hero-ink/5 text-2xl font-bold text-hero-muted">لا توجد خانات</div>
        )}
        <button
          type="button"
          aria-label="دوّر العجلة"
          onClick={spin}
          disabled={phase !== "idle"}
          className="absolute left-1/2 top-1/2 z-10 grid size-[22%] -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-hero-yellow font-display text-xl font-extrabold text-hero-ink shadow-[0_6px_0_0_rgb(0_0_0/0.25)] transition hover:scale-105 active:scale-95 disabled:cursor-default md:text-3xl"
        >
          دوّر
        </button>
      </div>

      {/* Side panel */}
      <div className="flex w-full max-w-xl flex-col gap-4 lg:w-[420px]">
        <div className="flex items-center justify-between gap-3 rounded-3xl bg-white p-4 shadow-soft">
          <div>
            <p className="text-hero-muted">{namesMode ? "الأسماء المتبقية" : "الأسئلة المتبقية"}</p>
            <p className="font-display text-4xl font-extrabold">{n(items.length)}</p>
          </div>
          {!namesMode || questions.length > 0 ? (
            <div className="text-end">
              <p className="text-hero-muted">النقاط</p>
              <AnimatedNumber value={score.score} className="font-display text-4xl font-extrabold text-hero-purple" />
            </div>
          ) : null}
        </div>

        {teams.length > 1 && (
          <div className="grid grid-cols-2 gap-3">
            {score.teams.map((t, i) => (
              <motion.div
                key={t.name + i}
                animate={{ scale: i === turn ? 1.04 : 1 }}
                className="rounded-3xl border-4 bg-white p-3 shadow-soft"
                style={{ borderColor: i === turn ? t.color : "transparent" }}
              >
                <p className="truncate font-display text-lg font-bold" style={{ color: t.color }}>{t.name}</p>
                <AnimatedNumber value={t.score} className="font-display text-3xl font-extrabold" />
                {i === turn && <p className="text-sm font-bold text-hero-muted">دوره الآن</p>}
              </motion.div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Button size="xl" variant="yellow" className="w-full" icon={<RefreshCw className="size-8" />} onClick={spin} disabled={items.length === 0}>
                دوّر العجلة
              </Button>
              {activeTeam && <p className="mt-2 text-center text-lg font-bold" style={{ color: activeTeam.color }}>الدور: {activeTeam.name}</p>}
            </motion.div>
          )}
          {phase === "spinning" && (
            <motion.p key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center font-display text-3xl font-extrabold text-hero-blue">
              العجلة تدور...
            </motion.p>
          )}
          {phase === "landed" && currentItem && (
            <motion.div
              key="landed"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="flex flex-col items-center gap-3 rounded-3xl bg-gradient-to-br from-hero-yellow to-hero-orange p-6 text-center shadow-soft"
            >
              <Sparkles className="size-10" />
              <p className="text-xl font-bold">{namesMode ? "الدور على" : "اختارت العجلة"}</p>
              <p className="font-display text-5xl font-extrabold" data-testid="wheel-result">{currentItem.label}</p>
              {namesMode && (
                <div className="flex flex-wrap justify-center gap-3">
                  {questions.length > 0 && (
                    <Button variant="primary" icon={<HelpCircle className="size-6" />} onClick={askForName}>اطرح سؤالًا</Button>
                  )}
                  <Button variant="secondary" icon={<RefreshCw className="size-6" />} onClick={next}>
                    {items.length - (settings.removeUsed ? 1 : 0) > 0 ? "دوّر مرة أخرى" : "إنهاء"}
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <Button variant="ghost" icon={<Flag className="size-5" />} onClick={() => finish()}>
          إنهاء اللعبة وعرض النتائج
        </Button>
      </div>

      {/* Question overlay */}
      <AnimatePresence>
        {(phase === "question" || phase === "answered") && activeQ !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-hero-bg/85 p-4 backdrop-blur-sm"
          >
            <motion.div initial={{ y: 40, scale: 0.95 }} animate={{ y: 0, scale: 1 }} className="flex w-full max-w-5xl flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-2xl bg-white px-4 py-2 font-display text-2xl font-extrabold shadow-soft" style={{ color: activeTeam?.color }}>
                  {activeTeam ? `سؤال ${activeTeam.name}` : currentItem?.label ?? "سؤال"}
                </span>
                <TimerBadge remaining={phase === "question" ? remaining : null} total={settings.timePerQuestion} />
              </div>
              <QuestionPanel question={questions[activeQ]} picked={phase === "answered" ? picked : null} onPick={answer} ltr={isEnglish} />
              {phase === "answered" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex justify-center">
                  <Button size="xl" icon={<RefreshCw className="size-8" />} onClick={next}>
                    {items.length - (settings.removeUsed && landed !== null ? 1 : 0) > 0 ? "دوّر مرة أخرى" : "عرض النتائج"}
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
