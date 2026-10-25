"use client";
import { AnimatePresence, motion } from "motion/react";
import { Flag } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type Phaser from "phaser";
import { Confetti } from "@/components/Confetti";
import { Button, Loading } from "@/components/ui";
import { sound } from "@/lib/audio";
import { initialScore, recordAnswer } from "@/lib/scoring";
import { isMathExpression } from "@/lib/arabic";
import { cn, formatNum } from "@/lib/utils";
import { useSettings } from "@/store/settings";
import { AnimatedNumber } from "../shared/AnimatedNumber";
import { FeedbackBurst } from "../shared/Feedback";
import { TimerBadge } from "../shared/TimerBadge";
import { useCountdown } from "../shared/useCountdown";
import { useFeedback } from "../shared/useFeedback";
import type { GameProps } from "../types";
import { createBalloonScene } from "./BalloonScene";

type SceneApi = {
  showQuestion: (q: { choices: string[]; correctIndex: number; rtl: boolean }) => void;
  pop: (i: number) => void;
  deflate: (i: number) => void;
  reveal: (i: number) => void;
};

type Phase = "loading" | "question" | "solved";

export default function BalloonsGame({ game, questions, paused, onFinish }: GameProps) {
  const { settings } = game;
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<SceneApi | null>(null);
  const numerals = useSettings((s) => s.numerals);
  const reducedRef = useRef(useSettings.getState().reducedMotion);
  const [phase, setPhase] = useState<Phase>("loading");
  const [qi, setQi] = useState(0);
  const [mistakes, setMistakes] = useState(0); // wrong taps on the current question
  const [score, setScore] = useState(() => initialScore());
  const [fire, setFire] = useState(0);
  const { feedback, show } = useFeedback(1200);
  const question = questions[qi];
  const isEnglish = game.subject === "english";
  const stateRef = useRef({ phase, qi, mistakes });
  stateRef.current = { phase, qi, mistakes };

  useEffect(() => useSettings.subscribe((s) => (reducedRef.current = s.reducedMotion)), []);

  const finish = useCallback((s = score) => onFinish({ correct: s.correct, wrong: s.wrong, score: s.score }), [score, onFinish]);

  const handlePick = useCallback(
    (index: number) => {
      const { phase: ph, qi: i, mistakes: m } = stateRef.current;
      if (ph !== "question") return;
      const q = questions[i];
      if (index === q.correctIndex) {
        sound.play("pop");
        sceneRef.current?.pop(index);
        show(true);
        // First try: full points; after a mistake: half points (it still counts as a mistake).
        setScore((s) => (m === 0 ? recordAnswer(s, true, settings.pointsPerCorrect, undefined, { streakBonus: true }) : { ...s, score: s.score + Math.round(settings.pointsPerCorrect / 2) }));
        setPhase("solved");
        if (i === questions.length - 1) setFire(Date.now());
      } else {
        sceneRef.current?.deflate(index);
        show(false);
        if (m === 0) setScore((s) => recordAnswer(s, false, 0));
        setMistakes(m + 1);
      }
    },
    [questions, settings.pointsPerCorrect, show],
  );
  const pickRef = useRef(handlePick);
  pickRef.current = handlePick;

  // Boot Phaser once, lazily. Destroy everything on unmount.
  useEffect(() => {
    let cancelled = false;
    let instance: Phaser.Game | null = null;
    (async () => {
      const [{ default: P }] = await Promise.all([import("phaser"), document.fonts?.load?.('800 40px "Cairo"').catch(() => undefined)]);
      if (cancelled || !hostRef.current) return;
      const Scene = createBalloonScene(P, { onPick: (i) => pickRef.current(i) }, () => reducedRef.current);
      instance = new P.Game({
        type: P.AUTO,
        parent: hostRef.current,
        transparent: false,
        backgroundColor: "#a5d8ff",
        scale: { mode: P.Scale.RESIZE, width: hostRef.current.clientWidth, height: hostRef.current.clientHeight },
        render: { antialias: true, powerPreference: "high-performance" },
        input: { activePointers: 3 },
        banner: false,
        audio: { noAudio: true },
        scene: Scene,
      });
      gameRef.current = instance;
      instance.events.once("scene-ready", () => {
        if (cancelled) return;
        sceneRef.current = instance!.scene.getScene("balloons") as unknown as SceneApi;
        setPhase("question");
      });
    })();
    return () => {
      cancelled = true;
      sceneRef.current = null;
      instance?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // Show the current question in the scene.
  useEffect(() => {
    if (phase === "question" && sceneRef.current && question && stateRef.current.mistakes === 0) {
      sceneRef.current.showQuestion({ choices: question.choices, correctIndex: question.correctIndex, rtl: !isEnglish });
    }
  }, [phase, qi, question, isEnglish]);

  // Pause Phaser together with the classroom pause button.
  useEffect(() => {
    const g = gameRef.current;
    if (!g) return;
    if (paused) g.scene.pause("balloons");
    else g.scene.resume("balloons");
  }, [paused]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= (question?.choices.length ?? 0) && !paused) handlePick(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [question, paused, handlePick]);

  const timeUp = () => {
    if (stateRef.current.phase !== "question") return;
    sceneRef.current?.reveal(question.correctIndex);
    if (stateRef.current.mistakes === 0) setScore((s) => recordAnswer(s, false, 0));
    show(false, "انتهى الوقت!");
    setPhase("solved");
  };
  const remaining = useCountdown(settings.timePerQuestion, phase === "question" && !paused, qi, timeUp);

  const next = () => {
    if (qi + 1 >= questions.length) return finish();
    sound.play("whoosh");
    setMistakes(0);
    setQi((i) => i + 1);
    setPhase("question");
  };

  // Auto-advance after a short celebration so the class keeps its rhythm.
  useEffect(() => {
    if (phase !== "solved" || paused) return;
    const t = setTimeout(next, 2200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, paused]);

  return (
    <div className="relative flex size-full flex-col">
      <Confetti fire={fire} />
      <FeedbackBurst feedback={feedback} />
      <div className="z-10 flex flex-col gap-2 bg-white/95 p-3 shadow-soft md:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-display text-lg font-bold text-hero-muted">
            السؤال {formatNum(qi + 1, numerals)} من {formatNum(questions.length, numerals)}
          </span>
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-hero-purple px-4 py-2 font-display text-2xl font-extrabold text-white">
              ⭐ <AnimatedNumber value={score.score} />
            </span>
            <TimerBadge remaining={phase === "question" ? remaining : null} total={settings.timePerQuestion} />
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-hero-ink/10">
          <motion.div className="h-full rounded-full bg-hero-green" animate={{ width: `${((qi + (phase === "solved" ? 1 : 0)) / questions.length) * 100}%` }} />
        </div>
        <AnimatePresence mode="wait">
          <motion.h2
            key={qi}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className={cn("flex items-center justify-center gap-4 text-center font-display text-3xl font-extrabold md:text-5xl", isEnglish && "ltr-content")}
            data-testid="balloon-question"
            dir={question && isMathExpression(question.prompt) ? "ltr" : undefined}
          >
            {question?.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={question.image} alt="" className="max-h-24 rounded-xl" />
            )}
            {question?.prompt}
          </motion.h2>
        </AnimatePresence>
      </div>
      <div ref={hostRef} className="relative min-h-0 flex-1 touch-none select-none" data-testid="balloon-stage">
        {phase === "loading" && (
          <div className="absolute inset-0 grid place-items-center">
            <Loading label="ننفخ البالونات..." />
          </div>
        )}
      </div>
      {/* Keyboard / screen-reader access to the balloons (visible when focused). Keys 1-4 also work. */}
      {phase === "question" && question && (
        <div className="absolute bottom-3 end-3 z-10 flex gap-2" aria-label="الإجابات">
          {question.choices.map((c, i) => (
            <button
              key={`${qi}-${i}`}
              type="button"
              onClick={() => handlePick(i)}
              className="sr-only cursor-pointer rounded-xl bg-white px-4 py-2 font-display text-xl font-bold shadow-soft focus:not-sr-only"
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <div className="absolute bottom-3 start-3 z-10 flex gap-2">
        {phase === "solved" && (
          <Button size="md" onClick={next}>{qi + 1 >= questions.length ? "النتائج" : "التالي"}</Button>
        )}
        <Button variant="secondary" size="sm" icon={<Flag className="size-5" />} onClick={() => finish()}>إنهاء</Button>
      </div>
    </div>
  );
}
