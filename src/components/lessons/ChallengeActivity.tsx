"use client";
import { motion } from "motion/react";
import { ArrowLeft, Check, Trophy, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Confetti } from "@/components/Confetti";
import { Button } from "@/components/ui";
import { AnimatedNumber } from "@/games/shared/AnimatedNumber";
import { FeedbackBurst } from "@/games/shared/Feedback";
import { TimerBadge } from "@/games/shared/TimerBadge";
import { useCountdown } from "@/games/shared/useCountdown";
import { useFeedback } from "@/games/shared/useFeedback";
import { trainToPlayable } from "@/lib/lessons/engine";
import type { ChallengeSegment } from "@/lib/lessons/types";
import { initialScore, recordAnswer, winners } from "@/lib/scoring";
import { trainPrompt } from "@/lib/train";
import { cn, formatNum } from "@/lib/utils";
import { useSettings } from "@/store/settings";
import type { ActivitySummary } from "./WarmupActivity";

export const SKILL_NAMES: Record<string, string> = { prev: "العدد السابق", next: "العدد التالي", missing: "العدد الناقص", challenge: "إكمال أكثر من عدد" };

/** Closing challenge: five mixed questions, whole class or two teams, then answers and skills to review. */
export function ChallengeActivity({ segment, paused, onDone }: { segment: ChallengeSegment; paused: boolean; onDone: (s: ActivitySummary) => void }) {
  const numerals = useSettings((s) => s.numerals);
  const fmt = (n: number) => formatNum(n, numerals);
  const teams = segment.mode === "teams" ? segment.teams : [];
  const items = useMemo(() => segment.questions.map((q) => ({ q, p: trainToPlayable(q, segment.range.min, segment.range.max) })), [segment]);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(() => initialScore(teams));
  const [review, setReview] = useState<{ prompt: string; answer: string; ok: boolean; kind: string }[]>([]);
  const [finished, setFinished] = useState(false);
  const [fire, setFire] = useState(0);
  const { feedback, show } = useFeedback(1200);
  const { q, p } = items[qi];
  const team = teams.length ? qi % teams.length : undefined;

  const answer = (i: number | null) => {
    if (picked !== null || finished) return;
    const ok = i === p.correctIndex;
    setPicked(i ?? -1);
    show(ok, i === null ? "انتهى الوقت!" : undefined);
    setScore((s) => recordAnswer(s, ok, 10, team));
    const correctNums = q.missing.map((m) => fmt(q.sequence[m])).join("، ");
    setReview((r) => [...r, { prompt: `${trainPrompt(q, fmt)} [ ${q.cars.map((c) => (c === null ? "؟" : fmt(c))).join(" ، ")} ]`, answer: correctNums, ok, kind: q.kind }]);
  };
  const remaining = useCountdown(segment.timer, picked === null && !paused && !finished, qi, () => answer(null));

  const next = () => {
    if (qi + 1 >= items.length) {
      setFinished(true);
      setFire(Date.now());
      return;
    }
    setQi(qi + 1);
    setPicked(null);
  };

  const skills: Record<string, { correct: number; wrong: number }> = {};
  for (const r of review) {
    const s = (skills[r.kind] ??= { correct: 0, wrong: 0 });
    if (r.ok) s.correct++;
    else s.wrong++;
  }
  const weak = Object.entries(skills).filter(([, v]) => v.wrong > 0);
  const top = winners(score.teams);

  if (finished) {
    return (
      <div className="flex size-full flex-col items-center gap-5 overflow-y-auto p-4 md:p-8" data-testid="challenge-results">
        <Confetti fire={fire} />
        <Trophy className="size-20 fill-hero-yellow text-[#E67700]" />
        <h2 className="text-center font-display text-4xl font-extrabold md:text-5xl">
          {teams.length ? (top.length === 1 ? `فاز ${top[0].name}!` : "تعادل!") : `النتيجة: ${fmt(score.correct)} من ${fmt(items.length)}`}
        </h2>
        {teams.length > 0 && (
          <div className="flex gap-4">
            {score.teams.map((t) => (
              <div key={t.name} className="rounded-3xl px-6 py-3 text-center text-white" style={{ background: t.color }}>
                <p className="font-display text-xl font-bold">{t.name}</p>
                <p className="font-display text-4xl font-extrabold">{fmt(t.score)}</p>
              </div>
            ))}
          </div>
        )}
        <div className="w-full max-w-3xl rounded-3xl bg-white p-4 shadow-soft">
          <h3 className="mb-2 text-xl font-extrabold">الإجابات الصحيحة</h3>
          <ol className="flex flex-col gap-2">
            {review.map((r, i) => (
              <li key={i} className="flex items-center gap-3 rounded-2xl bg-hero-ink/5 p-2">
                {r.ok ? <Check className="size-6 text-hero-green" /> : <X className="size-6 text-hero-red" />}
                <span className="flex-1">{r.prompt}</span>
                <span className="rounded-xl bg-hero-green px-3 py-1 font-display text-xl font-extrabold text-white">{r.answer}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="w-full max-w-3xl rounded-3xl bg-hero-yellow/25 p-4" data-testid="skills-review">
          <h3 className="mb-1 text-xl font-extrabold">مهارات تحتاج إلى مراجعة</h3>
          {weak.length === 0 ? <p>لا شيء! أتقن الصف كل المهارات في هذا التحدي 🎉</p> : <p>{weak.map(([k, v]) => `${SKILL_NAMES[k]} (${fmt(v.wrong)} خطأ)`).join("، ")}</p>}
        </div>
        <Button
          size="lg"
          variant="success"
          onClick={() =>
            onDone({
              correct: score.correct,
              wrong: score.wrong,
              score: score.score,
              skills,
              review: review.map(({ prompt, answer, ok }) => ({ prompt, answer, ok })),
              teams: teams.length ? score.teams : undefined,
              winner: teams.length && top.length === 1 ? top[0].name : undefined,
            })
          }
        >
          إنهاء التحدي
        </Button>
      </div>
    );
  }

  return (
    <div className="relative flex size-full flex-col items-center justify-center gap-5 overflow-y-auto p-4 md:p-8" data-testid="challenge">
      <FeedbackBurst feedback={feedback} />
      <div className="flex w-full max-w-5xl flex-wrap items-center justify-between gap-3">
        <span className="font-display text-xl font-bold text-hero-muted">تحدي الأبطال • السؤال {fmt(qi + 1)} من {fmt(items.length)}</span>
        {team !== undefined ? (
          <span className="rounded-2xl px-4 py-2 font-display text-xl font-extrabold text-white" style={{ background: teams[team].color }}>
            دور {teams[team].name}
          </span>
        ) : null}
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
          <TimerBadge remaining={picked === null ? remaining : null} total={segment.timer} />
        </div>
      </div>
      <h2 className="text-center font-display text-4xl font-extrabold md:text-5xl" data-testid="challenge-prompt">{trainPrompt(q, fmt)}</h2>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {q.cars.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-3xl text-hero-muted">—</span>}
            <span data-testid="challenge-car" className={cn("grid h-20 min-w-20 place-items-center rounded-2xl border-4 px-3 font-display text-5xl font-extrabold", c === null ? "border-dashed border-hero-orange text-hero-orange" : "border-hero-ink/15 bg-white")}>
              {c === null ? (picked !== null ? fmt(q.sequence[i]) : "؟") : fmt(c)}
            </span>
          </div>
        ))}
      </div>
      <div className="grid w-full max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
        {p.choices.map((c, i) => (
          <motion.button
            key={`${qi}-${i}`}
            type="button"
            disabled={picked !== null}
            onClick={() => answer(i)}
            animate={picked === i && i !== p.correctIndex ? { x: [0, -10, 10, -6, 6, 0] } : {}}
            className={cn(
              "btn-3d min-h-24 cursor-pointer rounded-3xl font-display text-5xl font-extrabold text-white disabled:cursor-default",
              picked !== null && i === p.correctIndex ? "bg-hero-green" : picked === i ? "bg-hero-red" : "bg-hero-blue",
              picked !== null && i !== p.correctIndex && picked !== i && "opacity-40",
            )}
            data-testid="challenge-choice"
          >
            {fmt(Number(c))}
          </motion.button>
        ))}
      </div>
      {picked !== null && (
        <Button size="lg" onClick={next}>
          {qi + 1 >= items.length ? "إعلان النتيجة" : "السؤال التالي"} <ArrowLeft className="size-6" />
        </Button>
      )}
    </div>
  );
}
