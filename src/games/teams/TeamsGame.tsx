"use client";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Flag, Swords, Trophy } from "lucide-react";
import { useCallback, useState } from "react";
import { Confetti } from "@/components/Confetti";
import { Button } from "@/components/ui";
import { sound } from "@/lib/audio";
import { initialScore, recordAnswer, ropePosition, winners } from "@/lib/scoring";
import { formatNum } from "@/lib/utils";
import { useSettings } from "@/store/settings";
import { AnimatedNumber } from "../shared/AnimatedNumber";
import { FeedbackBurst } from "../shared/Feedback";
import { QuestionPanel } from "../shared/QuestionPanel";
import { TimerBadge } from "../shared/TimerBadge";
import { useCountdown } from "../shared/useCountdown";
import { useFeedback } from "../shared/useFeedback";
import type { GameProps } from "../types";

/**
 * «معركة الأبطال»: two teams take turns. A wrong answer (or time-out) passes
 * the same question to the other team for a "steal" worth half the points.
 */
type Phase = "question" | "steal" | "answered" | "over";

const FALLBACK = [
  { name: "الفريق الأحمر", color: "#FA5252" },
  { name: "الفريق الأزرق", color: "#4361EE" },
];

export default function TeamsGame({ game, questions, paused, onFinish }: GameProps) {
  const { settings } = game;
  const teams = settings.teams.length >= 2 ? settings.teams.slice(0, 2) : FALLBACK;
  const numerals = useSettings((s) => s.numerals);
  const n = (v: number) => formatNum(v, numerals);
  const [qi, setQi] = useState(0);
  const [phase, setPhase] = useState<Phase>("question");
  const [active, setActive] = useState(0); // team answering now
  const [tried, setTried] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(() => initialScore(teams));
  const [fire, setFire] = useState(0);
  const { feedback, show } = useFeedback();
  const question = questions[qi];

  const finish = useCallback(
    (s = score) => {
      const top = winners(s.teams);
      onFinish({ correct: s.correct, wrong: s.wrong, score: s.score, teams: s.teams, winner: top.length === 1 ? top[0].name : undefined });
    },
    [score, onFinish],
  );

  const answer = (choice: number | null) => {
    if (phase !== "question" && phase !== "steal") return;
    const ok = choice === question.correctIndex;
    const points = phase === "steal" ? Math.round(settings.pointsPerCorrect / 2) : settings.pointsPerCorrect;
    setScore((s) => recordAnswer(s, ok, points, active));
    if (ok) {
      show(true, phase === "steal" ? "سرقة ناجحة!" : undefined);
      setPicked(choice);
      setPhase("answered");
    } else if (phase === "question") {
      show(false, choice === null ? "انتهى الوقت!" : "الفرصة للفريق الآخر!");
      if (choice !== null) setTried([choice]);
      setActive(1 - active);
      setPhase("steal");
    } else {
      show(false);
      setPicked(choice ?? -1);
      setPhase("answered");
    }
  };

  const remaining = useCountdown(settings.timePerQuestion, (phase === "question" || phase === "steal") && !paused, `${qi}-${phase}`, () => answer(null));

  const next = () => {
    if (qi + 1 >= questions.length) {
      setPhase("over");
      setFire(Date.now());
      sound.play("win");
      return;
    }
    sound.play("whoosh");
    const q = qi + 1;
    setQi(q);
    setActive(q % 2); // teams alternate who starts each question
    setTried([]);
    setPicked(null);
    setPhase("question");
  };

  const rope = ropePosition(score.teams[0].score, score.teams[1].score);
  const top = winners(score.teams);

  return (
    <div className="relative flex size-full flex-col overflow-y-auto">
      <Confetti fire={fire} />
      <FeedbackBurst feedback={feedback} />

      {/* Scoreboard + tug of war */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 p-3 md:gap-4 md:p-5">
        {teams.map((t, i) => (
          <motion.div
            key={i}
            style={{ order: i === 0 ? 0 : 2, background: t.color }}
            animate={{ scale: active === i && phase !== "answered" && phase !== "over" ? 1.04 : 1, opacity: active === i || phase === "answered" || phase === "over" ? 1 : 0.6 }}
            className="flex flex-col items-center justify-center rounded-3xl p-3 text-white shadow-soft md:p-5"
            data-testid={`team-${i}`}
          >
            <span className="truncate font-display text-xl font-extrabold md:text-3xl">{t.name}</span>
            <AnimatedNumber value={score.teams[i].score} className="font-display text-5xl font-extrabold md:text-7xl" />
            {active === i && (phase === "question" || phase === "steal") && (
              <span className="mt-1 rounded-full bg-white/25 px-3 py-0.5 text-sm font-bold md:text-base">{phase === "steal" ? "فرصة سرقة!" : "دوره الآن"}</span>
            )}
          </motion.div>
        ))}
        <div className="order-1 grid place-items-center">
          <motion.div animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 2.4, repeat: Infinity }} className="grid size-14 place-items-center rounded-full bg-hero-yellow shadow-soft md:size-20">
            <Swords className="size-8 md:size-11" />
          </motion.div>
        </div>
      </div>
      <div className="mx-3 md:mx-5" aria-label="شد الحبل">
        <div className="relative flex h-10 items-center">
          <div className="h-4 w-full rounded-full" style={{ background: `linear-gradient(to left, ${teams[0].color}66, ${teams[1].color}66)` }} />
          <span className="absolute left-1/2 h-8 w-1 -translate-x-1/2 rounded-full bg-hero-ink/25" />
          <motion.div
            className="absolute grid size-10 translate-x-1/2 place-items-center rounded-full border-4 border-white bg-hero-yellow text-lg shadow-soft"
            animate={{ right: `${50 - rope * 45}%` }}
            transition={{ type: "spring", stiffness: 90, damping: 12 }}
            data-testid="rope-knot"
          >
            ⭐
          </motion.div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-display text-xl font-bold text-hero-muted">
            السؤال {n(qi + 1)} من {n(questions.length)}
          </span>
          <TimerBadge remaining={phase === "question" || phase === "steal" ? remaining : null} total={settings.timePerQuestion} />
        </div>
        <QuestionPanel question={question} picked={phase === "answered" ? picked : null} disabled={tried} onPick={answer} ltr={game.subject === "english"} />
        <div className="flex min-h-16 items-center justify-center gap-3">
          {phase === "answered" && (
            <Button size="lg" onClick={next}>
              {qi + 1 >= questions.length ? "إعلان الفائز" : "السؤال التالي"} <ArrowLeft className="size-6" />
            </Button>
          )}
          <Button variant="ghost" icon={<Flag className="size-5" />} onClick={() => finish()}>إنهاء المباراة</Button>
        </div>
      </div>

      <AnimatePresence>
        {phase === "over" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-30 flex items-center justify-center bg-hero-ink/50 p-6 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.3, rotate: 8 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
              className="flex flex-col items-center gap-3 rounded-[2rem] bg-white px-10 py-8 text-center shadow-2xl"
            >
              <Trophy className="size-24 fill-hero-yellow text-[#E67700]" />
              <h2 className="font-display text-4xl font-extrabold md:text-6xl" data-testid="teams-winner" style={{ color: top.length === 1 ? top[0].color : undefined }}>
                {top.length === 1 ? `فاز ${top[0].name}!` : "تعادل!"}
              </h2>
              <p className="text-2xl font-bold text-hero-muted">
                {n(score.teams[0].score)} — {n(score.teams[1].score)}
              </p>
              <Button size="xl" variant="success" onClick={() => finish()}>عرض النتائج</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
