"use client";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Flag, Trophy } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { Confetti } from "@/components/Confetti";
import { Button, Loading } from "@/components/ui";
import { sound } from "@/lib/audio";
import { initialScore, recordAnswer, winners } from "@/lib/scoring";
import { raceLength } from "@/lib/race";
import { formatNum } from "@/lib/utils";
import { useSettings } from "@/store/settings";
import { AnimatedNumber } from "../shared/AnimatedNumber";
import { FeedbackBurst } from "../shared/Feedback";
import { QuestionPanel } from "../shared/QuestionPanel";
import { TimerBadge } from "../shared/TimerBadge";
import { useCountdown } from "../shared/useCountdown";
import { useFeedback } from "../shared/useFeedback";
import type { GameProps } from "../types";

const RaceScene = dynamic(() => import("./RaceScene"), { ssr: false, loading: () => <Loading label="نجهّز حلبة السباق..." /> });

type Phase = "question" | "answered" | "won";

export default function RaceGame({ game, questions, paused, onFinish }: GameProps) {
  const { settings } = game;
  const teams = settings.teams.length >= 2 ? settings.teams : [{ name: "الفريق الأحمر", color: "#FA5252" }, { name: "الفريق الأزرق", color: "#4361EE" }];
  const numerals = useSettings((s) => s.numerals);
  const length = useMemo(() => raceLength(questions.length, teams.length), [questions.length, teams.length]);
  const [steps, setSteps] = useState<number[]>(() => teams.map(() => 0));
  const [score, setScore] = useState(() => initialScore(teams));
  const [turn, setTurn] = useState(0);
  const [qi, setQi] = useState(0);
  const [phase, setPhase] = useState<Phase>("question");
  const [picked, setPicked] = useState<number | null>(null);
  const [winner, setWinner] = useState<number[] | null>(null);
  const [fire, setFire] = useState(0);
  const { feedback, show } = useFeedback();
  const team = turn % teams.length;
  const question = questions[qi % questions.length];

  const finish = useCallback(
    (s = score) => {
      const top = winners(s.teams);
      onFinish({ correct: s.correct, wrong: s.wrong, score: s.score, teams: s.teams, winner: top.length === 1 ? top[0].name : undefined });
    },
    [score, onFinish],
  );

  const answer = (choice: number | null) => {
    if (phase !== "question") return;
    const ok = choice === question.correctIndex;
    setPicked(choice ?? -1);
    show(ok);
    setScore((s) => recordAnswer(s, ok, settings.pointsPerCorrect, team));
    if (ok) {
      sound.play("engine");
      const nextSteps = steps.map((v, i) => (i === team ? v + 1 : v));
      setSteps(nextSteps);
      if (nextSteps[team] >= length) {
        setWinner([team]);
        setTimeout(() => {
          setPhase("won");
          setFire(Date.now());
          sound.play("win");
        }, 1300);
        setPhase("answered");
        return;
      }
    }
    setPhase("answered");
  };

  const remaining = useCountdown(settings.timePerQuestion, phase === "question" && !paused, `${qi}`, () => answer(null));

  const next = () => {
    if (qi + 1 >= questions.length) {
      // Out of questions: the leader wins (ties are shared).
      const best = Math.max(...steps);
      setWinner(steps.map((v, i) => (v === best ? i : -1)).filter((i) => i >= 0));
      setPhase("won");
      setFire(Date.now());
      sound.play("win");
      return;
    }
    sound.play("whoosh");
    setQi((i) => i + 1);
    setTurn((t) => t + 1);
    setPicked(null);
    setPhase("question");
  };

  const cars = teams.map((t, i) => ({ color: t.color, progress: steps[i] / length }));

  return (
    <div className="relative flex size-full flex-col">
      <Confetti fire={fire} />
      <FeedbackBurst feedback={feedback} />
      <div className="relative min-h-[34vh] flex-1">
        <RaceScene cars={cars} />
        <div className="pointer-events-none absolute inset-x-2 top-2 flex flex-wrap justify-center gap-2 md:inset-x-4 md:top-4">
          {teams.map((t, i) => (
            <motion.div
              key={i}
              animate={{ scale: i === team && phase !== "won" ? 1.06 : 1, y: i === team && phase !== "won" ? 2 : 0 }}
              className="min-w-40 rounded-2xl bg-white/92 px-4 py-2 shadow-soft"
              style={{ outline: i === team && phase !== "won" ? `4px solid ${t.color}` : "none" }}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="truncate font-display text-lg font-extrabold" style={{ color: t.color }}>{t.name}</span>
                <AnimatedNumber value={score.teams[i].score} className="font-display text-2xl font-extrabold" />
              </div>
              <div className="mt-1 flex gap-1" aria-label={`تقدّم ${t.name}: ${steps[i]} من ${length}`}>
                {Array.from({ length }, (_, k) => (
                  <span key={k} className="h-2.5 flex-1 rounded-full" style={{ background: k < steps[i] ? t.color : "#25304B22" }} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="relative z-10 border-t-4 border-white bg-hero-bg/95 p-3 md:p-5">
        <div className="mx-auto flex max-w-6xl flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-2xl px-4 py-2 font-display text-xl font-extrabold text-white md:text-2xl" style={{ background: teams[team].color }}>
              دور {teams[team].name}
            </span>
            <span className="font-display text-lg font-bold text-hero-muted">
              السؤال {formatNum(qi + 1, numerals)} من {formatNum(questions.length, numerals)} • خط النهاية بعد {formatNum(length, numerals)} إجابات
            </span>
            <TimerBadge remaining={phase === "question" ? remaining : null} total={settings.timePerQuestion} />
          </div>
          <QuestionPanel question={question} picked={phase === "question" ? null : picked} onPick={answer} ltr={game.subject === "english"} compact />
          <div className="flex justify-center gap-3">
            {phase === "answered" && !winner && (
              <Button size="lg" onClick={next}>
                السؤال التالي <ArrowLeft className="size-6" />
              </Button>
            )}
            <Button variant="ghost" icon={<Flag className="size-5" />} onClick={() => finish()}>
              إنهاء السباق
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {phase === "won" && winner && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-hero-ink/50 p-6 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.3, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
              className="flex flex-col items-center gap-3 rounded-[2rem] bg-white px-10 py-8 text-center shadow-2xl"
            >
              <Trophy className="size-24 fill-hero-yellow text-[#E67700]" />
              <h2 className="font-display text-4xl font-extrabold md:text-6xl" data-testid="race-winner">
                {winner.length > 1 ? "تعادل!" : `فاز ${teams[winner[0]].name}!`}
              </h2>
              <p className="text-xl text-hero-muted">{winner.length > 1 ? winner.map((i) => teams[i].name).join(" و ") : "عبر خط النهاية أولًا"}</p>
              <Button size="xl" variant="success" onClick={() => finish()}>
                عرض النتائج
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
