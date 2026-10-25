"use client";
import { motion } from "motion/react";
import { ArrowLeft, Check, Trophy, X } from "lucide-react";
import { useState } from "react";
import { Confetti } from "@/components/Confetti";
import { Button } from "@/components/ui";
import { AnimatedNumber } from "@/games/shared/AnimatedNumber";
import { FeedbackBurst } from "@/games/shared/Feedback";
import { TimerBadge } from "@/games/shared/TimerBadge";
import { useCountdown } from "@/games/shared/useCountdown";
import { useFeedback } from "@/games/shared/useFeedback";
import { isMathExpression } from "@/lib/arabic";
import type { PlayableQuestion } from "@/lib/questions";
import { initialScore, recordAnswer, winners } from "@/lib/scoring";
import type { Team } from "@/lib/types";
import { cn, formatNum } from "@/lib/utils";
import { useSettings } from "@/store/settings";
import type { ActivitySummary } from "./WarmupActivity";

/**
 * Lesson questions one at a time: the warm-up (teacher instructions, no timer)
 * and the closing challenge (optional timer and teams, then the answers).
 */
export function QuestionsActivity({
  kind,
  items,
  instructions,
  timer = 0,
  teams = [],
  paused,
  onDone,
}: {
  kind: "warmup" | "challenge";
  items: PlayableQuestion[];
  instructions?: string;
  timer?: number;
  teams?: Team[];
  paused: boolean;
  onDone: (s: ActivitySummary) => void;
}) {
  const numerals = useSettings((s) => s.numerals);
  const fmt = (n: number) => formatNum(n, numerals);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(() => initialScore(teams));
  const [review, setReview] = useState<{ prompt: string; answer: string; ok: boolean }[]>([]);
  const [finished, setFinished] = useState(false);
  const [fire, setFire] = useState(0);
  const { feedback, show } = useFeedback(1200);
  const p = items[qi];
  const team = teams.length ? qi % teams.length : undefined;
  const challenge = kind === "challenge";

  const answer = (i: number | null) => {
    if (picked !== null || finished || !p) return;
    const ok = i === p.correctIndex;
    setPicked(i ?? -1);
    show(ok, i === null ? "انتهى الوقت!" : undefined);
    setScore((s) => recordAnswer(s, ok, 10, team));
    setReview((r) => [...r, { prompt: p.prompt, answer: p.choices[p.correctIndex], ok }]);
  };
  const remaining = useCountdown(challenge ? timer : 0, picked === null && !paused && !finished, qi, () => answer(null));
  const summary = (): ActivitySummary => {
    const top = winners(score.teams);
    return {
      correct: score.correct,
      wrong: score.wrong,
      score: score.score,
      review,
      teams: teams.length ? score.teams : undefined,
      winner: teams.length && top.length === 1 ? top[0].name : undefined,
    };
  };
  const next = () => {
    if (qi + 1 < items.length) {
      setQi(qi + 1);
      setPicked(null);
    } else if (challenge) {
      setFinished(true);
      setFire(Date.now());
    } else onDone(summary());
  };

  if (!p) return <p className="p-8 text-center text-xl">لا توجد أسئلة في هذه المرحلة.</p>;

  if (finished) {
    const top = winners(score.teams);
    return (
      <div className="flex size-full flex-col items-center gap-5 overflow-y-auto p-4 md:p-8" data-testid="challenge-results">
        <Confetti fire={fire} />
        <Trophy className="size-20 fill-hero-yellow text-[#E67700]" />
        <h2 className="text-center font-display text-4xl font-extrabold md:text-5xl">
          {teams.length ? (top.length === 1 ? `فاز ${top[0].name}!` : "تعادل!") : `النتيجة: ${fmt(score.correct)} من ${fmt(items.length)}`}
        </h2>
        <div className="w-full max-w-3xl rounded-3xl bg-white p-4 shadow-soft">
          <h3 className="mb-2 text-xl font-extrabold">الإجابات الصحيحة</h3>
          <ol className="flex flex-col gap-2">
            {review.map((r, i) => (
              <li key={i} className="flex items-center gap-3 rounded-2xl bg-hero-ink/5 p-2">
                {r.ok ? <Check className="size-6 shrink-0 text-hero-green" /> : <X className="size-6 shrink-0 text-hero-red" />}
                <span className="flex-1" dir={isMathExpression(r.prompt) ? "ltr" : undefined}>{r.prompt}</span>
                <span className="rounded-xl bg-hero-green px-3 py-1 font-display text-xl font-extrabold text-white">{r.answer}</span>
              </li>
            ))}
          </ol>
        </div>
        <Button size="lg" variant="success" onClick={() => onDone(summary())}>إنهاء التحدي</Button>
      </div>
    );
  }

  return (
    <div className="relative flex size-full flex-col items-center justify-center gap-5 overflow-y-auto p-4 md:p-8" data-testid={challenge ? "challenge" : "warmup"}>
      <FeedbackBurst feedback={feedback} />
      {!challenge && instructions && qi === 0 && picked === null && (
        <p className="w-full max-w-4xl rounded-3xl bg-hero-green/10 p-4 text-lg" data-testid="warmup-instructions">
          <b>للمعلم: </b>{instructions}
        </p>
      )}
      <div className="flex w-full max-w-5xl flex-wrap items-center justify-between gap-3">
        <span className="font-display text-xl font-bold text-hero-muted">
          {challenge ? "تحدي الأبطال" : "تمهيد"} • السؤال {fmt(qi + 1)} من {fmt(items.length)}
        </span>
        {team !== undefined && (
          <span className="rounded-2xl px-4 py-2 font-display text-xl font-extrabold text-white" style={{ background: teams[team].color }}>
            دور {teams[team].name}
          </span>
        )}
        {challenge && (
          <div className="flex items-center gap-3">
            {teams.length ? (
              score.teams.map((t) => (
                <span key={t.name} className="rounded-2xl px-3 py-1.5 font-display text-xl font-extrabold text-white" style={{ background: t.color }}>
                  <AnimatedNumber value={t.score} />
                </span>
              ))
            ) : (
              <span className="rounded-2xl bg-hero-purple px-4 py-2 font-display text-2xl font-extrabold text-white">⭐ <AnimatedNumber value={score.score} /></span>
            )}
            <TimerBadge remaining={picked === null ? remaining : null} total={timer} />
          </div>
        )}
      </div>
      <h2
        className="max-w-5xl text-center font-display text-3xl font-extrabold md:text-5xl"
        dir={isMathExpression(p.prompt) ? "ltr" : undefined}
        data-testid={challenge ? "challenge-prompt" : "warmup-prompt"}
      >
        {p.prompt}
      </h2>
      <div className={cn("grid w-full max-w-4xl gap-3", p.choices.length > 2 ? "md:grid-cols-2" : "grid-cols-2")}>
        {p.choices.map((c, i) => (
          <motion.button
            key={`${qi}-${i}`}
            type="button"
            disabled={picked !== null}
            onClick={() => answer(i)}
            animate={picked === i && i !== p.correctIndex ? { x: [0, -10, 10, -6, 6, 0] } : {}}
            className={cn(
              "btn-3d min-h-20 cursor-pointer rounded-3xl px-4 py-3 font-display text-3xl font-extrabold text-white disabled:cursor-default md:text-4xl",
              picked !== null && i === p.correctIndex ? "bg-hero-green" : picked === i ? "bg-hero-red" : challenge ? "bg-hero-blue" : "bg-hero-purple",
              picked !== null && i !== p.correctIndex && picked !== i && "opacity-40",
            )}
            dir={isMathExpression(c) ? "ltr" : undefined}
            data-testid={challenge ? "challenge-choice" : "warmup-choice"}
          >
            {c}
          </motion.button>
        ))}
      </div>
      {picked !== null && (
        <Button size="lg" onClick={next}>
          {qi + 1 >= items.length ? (challenge ? "إعلان النتيجة" : "أحسنتم! انتهى التمهيد") : "السؤال التالي"} <ArrowLeft className="size-6" />
        </Button>
      )}
    </div>
  );
}
