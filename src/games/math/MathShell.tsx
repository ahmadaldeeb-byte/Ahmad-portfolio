"use client";
import { AnimatePresence, motion } from "motion/react";
import { Flag, Lightbulb } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Confetti } from "@/components/Confetti";
import { Button } from "@/components/ui";
import { sound } from "@/lib/audio";
import { MATH_DEFAULTS } from "@/lib/math/common";
import { cn, formatNum } from "@/lib/utils";
import { useSettings } from "@/store/settings";
import { AnimatedNumber } from "../shared/AnimatedNumber";
import { FeedbackBurst } from "../shared/Feedback";
import { useFeedback } from "../shared/useFeedback";
import type { GameProps } from "../types";

export interface MathApi {
  /** Report an answer. In learning mode a wrong answer can simply be tried again. */
  submit: (ok: boolean, message?: string) => void;
  /** True while feedback is showing or the game is paused. */
  locked: boolean;
  /** Test mode, after a wrong answer: show the right answer. */
  revealed: boolean;
  mistakes: number;
  fmt: (n: number | string) => string;
}

interface Props<T> extends Pick<GameProps, "game" | "paused" | "onFinish"> {
  tasks: T[];
  prompt: (task: T, fmt: (n: number | string) => string) => ReactNode;
  /** Skill tag for the teacher summary. */
  skill?: (task: T) => string;
  hint?: (task: T) => string;
  /** Extra celebration time (ms) after the n-th solved task, e.g. a rocket launch. */
  celebrate?: (solved: number) => number;
  /** Persistent scene above the tasks (keeps its state between tasks). */
  stage?: (s: { solved: number; index: number; celebrating: number }) => ReactNode;
  children: (task: T, api: MathApi, index: number) => ReactNode;
  /** Text direction for the task area; math expressions read left-to-right. */
  ltr?: boolean;
}

/**
 * Shared frame for the Grade 1 math games: prompt, progress, score, feedback,
 * hints, learning mode (retry without deductions) and the final summary.
 */
export function MathShell<T>({ game, paused, onFinish, tasks, prompt, skill, hint, celebrate, stage, children, ltr }: Props<T>) {
  const learning = (game.settings.math ?? MATH_DEFAULTS).learning;
  const points = game.settings.pointsPerCorrect;
  const numerals = useSettings((s) => s.numerals);
  const fmt = useCallback((n: number | string) => formatNum(n, numerals), [numerals]);
  const [index, setIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [locked, setLocked] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [solved, setSolved] = useState(0);
  const [celebrating, setCelebrating] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [fire, setFire] = useState(0);
  const tally = useRef({ correct: 0, wrong: 0, skills: {} as Record<string, { correct: number; wrong: number }> });
  const timer = useRef<number | undefined>(undefined);
  const { feedback, show } = useFeedback(1300);
  const task = tasks[index];

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const finish = useCallback(
    (finalScore: number) => onFinish({ correct: tally.current.correct, wrong: tally.current.wrong, score: finalScore, skills: tally.current.skills }),
    [onFinish],
  );

  const advance = (delay: number, nextScore: number) => {
    timer.current = window.setTimeout(() => {
      if (index + 1 >= tasks.length) return finish(nextScore);
      sound.play("whoosh");
      setIndex(index + 1);
      setMistakes(0);
      setLocked(false);
      setRevealed(false);
      setShowHint(false);
    }, delay);
  };

  const record = (ok: boolean) => {
    tally.current[ok ? "correct" : "wrong"]++;
    const k = skill?.(task) ?? "general";
    const s = (tally.current.skills[k] ??= { correct: 0, wrong: 0 });
    s[ok ? "correct" : "wrong"]++;
  };

  const submit = (ok: boolean, message?: string) => {
    if (locked || paused) return;
    if (ok) {
      show(true, message);
      record(mistakes === 0);
      const earned = mistakes === 0 ? points : Math.round(points / 2); // never a deduction
      const nextScore = score + earned;
      const nextSolved = solved + 1;
      setScore(nextScore);
      setSolved(nextSolved);
      setLocked(true);
      const extra = celebrate?.(nextSolved) ?? 0;
      if (extra) {
        setCelebrating((c) => c + 1);
        setFire(Date.now());
      }
      if (index + 1 >= tasks.length) setFire(Date.now());
      advance(1300 + extra, nextScore);
      return;
    }
    if (learning) {
      show(false, message);
      setMistakes((m) => m + 1);
      if (mistakes + 1 >= 2 && hint) setShowHint(true);
      return;
    }
    // Test mode: one try, then the right answer is shown.
    show(false, message);
    record(false);
    setMistakes((m) => m + 1);
    setRevealed(true);
    setLocked(true);
    advance(2200, score);
  };

  const api: MathApi = { submit, locked: locked || paused, revealed, mistakes, fmt };

  return (
    <div className="relative flex size-full flex-col">
      <Confetti fire={fire} pieces={90} />
      <FeedbackBurst feedback={feedback} />
      <div className="z-10 flex flex-wrap items-center justify-between gap-2 bg-white/95 px-3 py-2 shadow-soft md:px-5">
        <h2 className="order-last w-full text-center font-display text-2xl font-extrabold md:order-none md:w-auto md:flex-1 md:text-4xl" data-testid="math-prompt">
          {prompt(task, fmt)}
        </h2>
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-hero-muted" data-testid="math-progress">
            {fmt(index + 1)} / {fmt(tasks.length)}
          </span>
          <span className="rounded-2xl bg-hero-purple px-3 py-1.5 font-display text-xl font-extrabold text-white" data-testid="math-score">
            ⭐ <AnimatedNumber value={score} />
          </span>
        </div>
      </div>
      {stage && <div className="relative shrink-0">{stage({ solved, index, celebrating })}</div>}
      <div className={cn("relative min-h-0 flex-1 overflow-y-auto", ltr && "ltr-content")}>
        <AnimatePresence mode="wait">
          <motion.div key={index} initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} transition={{ duration: 0.25 }} className="size-full">
            {children(task, api, index)}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="z-10 flex items-center justify-center gap-2 border-t border-hero-ink/5 bg-white/80 p-2">
        <AnimatePresence>
          {showHint && hint && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-2xl bg-[#FFF3BF] px-4 py-2 font-bold" data-testid="math-hint">
              💡 {hint(task)}
            </motion.p>
          )}
        </AnimatePresence>
        {hint && !showHint && (
          <Button variant="secondary" size="sm" icon={<Lightbulb className="size-5" />} onClick={() => setShowHint(true)}>تلميح</Button>
        )}
        <Button variant="ghost" size="sm" icon={<Flag className="size-5" />} onClick={() => finish(score)}>إنهاء</Button>
      </div>
    </div>
  );
}

/** Big touch-friendly answer button used by several math games. */
export function ChoiceButton({
  children,
  onClick,
  state,
  disabled,
  className,
  testId = "math-choice",
}: {
  children: ReactNode;
  onClick: () => void;
  state?: "correct" | "wrong" | "dim" | null;
  disabled?: boolean;
  className?: string;
  testId?: string;
}) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      animate={state === "wrong" ? { x: [0, -10, 10, -6, 6, 0] } : {}}
      className={cn(
        "btn-3d min-h-20 cursor-pointer rounded-3xl px-4 font-display text-3xl font-extrabold text-white disabled:cursor-default md:text-4xl",
        state === "correct" ? "bg-hero-green" : state === "wrong" ? "bg-hero-red" : "bg-hero-blue",
        state === "dim" && "opacity-40",
        className,
      )}
      data-testid={testId}
    >
      {children}
    </motion.button>
  );
}

/** Multiple-choice row: handles wrong-shake in learning mode and reveal in test mode. */
export function Choices<V extends string | number>({ options, answer, api, render, className }: { options: V[]; answer: V; api: MathApi; render?: (v: V) => ReactNode; className?: string }) {
  const [wrong, setWrong] = useState<V | null>(null);
  const [picked, setPicked] = useState<V | null>(null);
  return (
    <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-4", className)}>
      {options.map((o) => {
        const state = picked !== null || api.revealed ? (o === answer ? "correct" : o === wrong ? "wrong" : "dim") : o === wrong ? "wrong" : null;
        return (
          <ChoiceButton
            key={String(o)}
            disabled={api.locked || picked !== null}
            state={state}
            onClick={() => {
              if (o === answer) setPicked(o);
              else setWrong(o); // stays marked so the child sees what was tried
              api.submit(o === answer);
            }}
          >
            {render ? render(o) : typeof o === "number" ? api.fmt(o) : o}
          </ChoiceButton>
        );
      })}
    </div>
  );
}
