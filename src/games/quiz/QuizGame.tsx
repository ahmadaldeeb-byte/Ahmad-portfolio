"use client";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Flag, Flame } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button, Segmented } from "@/components/ui";
import { sound } from "@/lib/audio";
import { DIFFICULTY_LABELS } from "@/lib/constants";
import { initialScore, recordAnswer, speedBonus } from "@/lib/scoring";
import { formatNum } from "@/lib/utils";
import { useSettings } from "@/store/settings";
import { AnimatedNumber } from "../shared/AnimatedNumber";
import { FeedbackBurst } from "../shared/Feedback";
import { QuestionPanel } from "../shared/QuestionPanel";
import { TimerBadge } from "../shared/TimerBadge";
import { useCountdown } from "../shared/useCountdown";
import { useFeedback } from "../shared/useFeedback";
import type { GameProps } from "../types";
import { RobotBuddy } from "@/components/Characters";

type Phase = "level" | "question" | "answered";

export default function QuizGame({ game, questions: all, paused, onFinish }: GameProps) {
  const { settings } = game;
  const numerals = useSettings((s) => s.numerals);
  const levels = useMemo(() => [...new Set(all.map((q) => q.difficulty ?? 1))].sort(), [all]);
  const [level, setLevel] = useState<number>(0); // 0 = all levels
  const [phase, setPhase] = useState<Phase>(levels.length > 1 ? "level" : "question");
  const questions = useMemo(() => (level ? all.filter((q) => (q.difficulty ?? 1) === level) : all), [all, level]);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(() => initialScore());
  const { feedback, show } = useFeedback();
  const question = questions[qi];
  const n = (v: number) => formatNum(v, numerals);

  const finish = useCallback((s = score) => onFinish({ correct: s.correct, wrong: s.wrong, score: s.score }), [score, onFinish]);

  const answer = (choice: number | null, remainingNow: number | null) => {
    if (phase !== "question") return;
    const ok = choice === question.correctIndex;
    setPicked(choice ?? -1);
    show(ok, choice === null ? "انتهى الوقت!" : undefined);
    const pts = settings.pointsPerCorrect + (ok ? speedBonus(settings.pointsPerCorrect, remainingNow, settings.timePerQuestion) : 0);
    setScore((s) => recordAnswer(s, ok, pts));
    setPhase("answered");
  };

  const remaining = useCountdown(settings.timePerQuestion, phase === "question" && !paused, qi, () => answer(null, 0));

  const next = () => {
    if (qi + 1 >= questions.length) return finish();
    sound.play("whoosh");
    setQi((i) => i + 1);
    setPicked(null);
    setPhase("question");
  };

  if (phase === "level") {
    return (
      <div className="flex size-full flex-col items-center justify-center gap-6 p-6 text-center">
        <RobotBuddy size={130} mood="think" />
        <h2 className="font-display text-4xl font-extrabold">اختر مستوى الصعوبة</h2>
        <Segmented
          value={level}
          onChange={setLevel}
          className="text-xl"
          options={[{ value: 0, label: `كل المستويات (${n(all.length)})` }, ...levels.map((l) => ({ value: l, label: `${DIFFICULTY_LABELS[l as 1 | 2 | 3]} (${n(all.filter((q) => (q.difficulty ?? 1) === l).length)})` }))]}
        />
        <Button size="xl" variant="success" onClick={() => { sound.play("levelUp"); setPhase("question"); }}>
          انطلق!
        </Button>
      </div>
    );
  }

  const progress = (qi + (phase === "answered" ? 1 : 0)) / questions.length;

  return (
    <div className="relative flex size-full flex-col overflow-y-auto">
      <FeedbackBurst feedback={feedback} />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-5 p-4 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-display text-xl font-bold text-hero-muted" data-testid="quiz-progress">
            السؤال {n(qi + 1)} من {n(questions.length)}
          </span>
          <div className="flex items-center gap-3">
            {score.streak >= 2 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-flex items-center gap-1 rounded-2xl bg-hero-orange px-3 py-2 font-display text-xl font-extrabold text-white">
                <Flame className="size-6" /> {n(score.streak)}
              </motion.span>
            )}
            <span className="rounded-2xl bg-hero-purple px-4 py-2 font-display text-2xl font-extrabold text-white">
              ⭐ <AnimatedNumber value={score.score} />
            </span>
            <TimerBadge remaining={phase === "question" ? remaining : null} total={settings.timePerQuestion} />
          </div>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-hero-ink/10" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <motion.div className="h-full rounded-full bg-gradient-to-l from-hero-green to-[#20A4C9]" animate={{ width: `${progress * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={qi} initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }} transition={{ type: "spring", stiffness: 260, damping: 26 }}>
            <QuestionPanel question={question} picked={phase === "answered" ? picked : null} onPick={(i) => answer(i, remaining)} ltr={game.subject === "english"} />
          </motion.div>
        </AnimatePresence>
        <div className="flex min-h-16 items-center justify-center gap-3">
          {phase === "answered" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Button size="lg" onClick={next}>
                {qi + 1 >= questions.length ? "النتائج" : "السؤال التالي"} <ArrowLeft className="size-6" />
              </Button>
            </motion.div>
          )}
          <Button variant="ghost" icon={<Flag className="size-5" />} onClick={() => finish()}>إنهاء</Button>
        </div>
      </div>
    </div>
  );
}
