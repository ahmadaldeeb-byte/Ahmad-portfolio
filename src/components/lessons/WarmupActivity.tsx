"use client";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { HeroKid } from "@/components/Characters";
import { Button } from "@/components/ui";
import { FeedbackBurst } from "@/games/shared/Feedback";
import { useFeedback } from "@/games/shared/useFeedback";
import { warmupAnswer, warmupPrompt } from "@/lib/lessons/engine";
import type { WarmupSegment } from "@/lib/lessons/types";
import { cn, formatNum, shuffle } from "@/lib/utils";
import { useSettings } from "@/store/settings";

export interface ActivitySummary {
  correct: number;
  wrong: number;
  score: number;
  skills?: Record<string, { correct: number; wrong: number }>;
  review?: { prompt: string; answer: string; ok: boolean }[];
  teams?: { name: string; color: string; score: number; correct: number; wrong: number }[];
  winner?: string;
}

/** Warm-up: a character on a number line; «قبل» and «بعد» questions, no timer. */
export function WarmupActivity({ activity, onDone }: { activity: WarmupSegment["activity"]; onDone: (s: ActivitySummary) => void }) {
  const numerals = useSettings((s) => s.numerals);
  const fmt = (n: number) => formatNum(n, numerals);
  const [qi, setQi] = useState(0);
  const [pos, setPos] = useState(activity.questions[0]?.n ?? activity.min);
  const [solved, setSolved] = useState(false);
  const [tally, setTally] = useState({ correct: 0, wrong: 0, missed: false });
  const { feedback, show } = useFeedback(1200);
  const q = activity.questions[qi];
  const answer = warmupAnswer(q);
  const choices = useMemo(() => {
    const other = q.dir === "before" ? q.n + 1 : q.n - 1;
    return shuffle([...new Set([answer, other, q.n])].filter((v) => v >= activity.min && v <= activity.max));
  }, [q, answer, activity.min, activity.max]);
  const nums = Array.from({ length: activity.max - activity.min + 1 }, (_, i) => activity.min + i);

  const pick = (v: number) => {
    if (solved) return;
    if (v === answer) {
      show(true);
      setPos(v);
      setSolved(true);
      setTally((t) => ({ ...t, correct: t.correct + (t.missed ? 0 : 1), wrong: t.wrong + (t.missed ? 1 : 0), missed: false }));
    } else {
      show(false);
      setTally((t) => ({ ...t, missed: true }));
    }
  };

  const next = () => {
    if (qi + 1 >= activity.questions.length) return onDone({ correct: tally.correct, wrong: tally.wrong, score: tally.correct * 10 });
    setQi(qi + 1);
    setPos(activity.questions[qi + 1].n);
    setSolved(false);
  };

  return (
    <div className="relative flex size-full flex-col items-center justify-center gap-6 overflow-y-auto p-4 md:p-8" data-testid="warmup">
      <FeedbackBurst feedback={feedback} />
      <p className="text-xl text-hero-muted">تمهيد: نتحرك على خط الأعداد خطوة إلى الأمام أو إلى الخلف</p>
      <h2 className="text-center font-display text-4xl font-extrabold md:text-6xl" data-testid="warmup-prompt">{warmupPrompt(q, fmt)}</h2>
      {/* Number line reads left-to-right as in the math book. */}
      <div className="w-full max-w-5xl" dir="ltr">
        <div className="relative grid pt-28" style={{ gridTemplateColumns: `repeat(${nums.length}, minmax(0, 1fr))` }}>
          <motion.div
            className="absolute top-0 flex justify-center"
            style={{ width: `${100 / nums.length}%` }}
            animate={{ left: `${((pos - activity.min) / nums.length) * 100}%`, y: solved ? [0, -30, 0] : 0 }}
            transition={{ type: "spring", stiffness: 160, damping: 16 }}
          >
            <HeroKid size={88} mood={solved ? "cheer" : "think"} />
          </motion.div>
          <div className="absolute inset-x-0 top-[8.6rem] h-2 rounded-full bg-hero-ink/70" />
          {nums.map((n) => (
            <div key={n} className="relative flex flex-col items-center gap-1">
              <span className="h-6 w-1.5 rounded-full bg-hero-ink/70" />
              <span
                className={cn(
                  "grid size-12 place-items-center rounded-2xl font-display text-2xl font-extrabold md:size-14 md:text-3xl",
                  n === q.n ? "bg-hero-blue text-white" : n === pos && solved ? "bg-hero-green text-white" : "bg-white shadow-soft",
                )}
              >
                {fmt(n)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        {choices.map((c) => (
          <motion.button
            key={`${qi}-${c}`}
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => pick(c)}
            disabled={solved}
            className={cn(
              "btn-3d grid h-24 min-w-28 cursor-pointer place-items-center rounded-3xl px-6 font-display text-5xl font-extrabold text-white",
              solved && c === answer ? "bg-hero-green" : "bg-hero-purple",
              solved && c !== answer && "opacity-40",
            )}
            data-testid="warmup-choice"
          >
            {fmt(c)}
          </motion.button>
        ))}
      </div>
      {solved && (
        <Button size="lg" onClick={next}>
          {qi + 1 >= activity.questions.length ? "أحسنتم! انتهى التمهيد" : "السؤال التالي"} <ArrowLeft className="size-6" />
        </Button>
      )}
      <p className="text-hero-muted">السؤال {fmt(qi + 1)} من {fmt(activity.questions.length)}</p>
    </div>
  );
}
