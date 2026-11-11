"use client";
import { AnimatePresence, motion } from "motion/react";
import { Flag, Lightbulb } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Confetti } from "@/components/Confetti";
import { HeroKid } from "@/components/Characters";
import { Button, Loading } from "@/components/ui";
import { sound } from "@/lib/audio";
import { STATION_NAMES, TRAIN_DEFAULTS, answerTiles, generateTrainQuestions, trainHint, trainPrompt, type TrainKind, type TrainQuestion } from "@/lib/train";
import { cn, formatNum } from "@/lib/utils";
import { useSettings } from "@/store/settings";
import { AnimatedNumber } from "../shared/AnimatedNumber";
import { FeedbackBurst } from "../shared/Feedback";
import { useFeedback } from "../shared/useFeedback";
import type { GameProps } from "../types";
import type { TrainPhase } from "./TrainScene";
import { useTileDrag } from "./useTileDrag";

const TrainScene = dynamic(() => import("./TrainScene"), { ssr: false, loading: () => <Loading label="القطار في الطريق..." /> });

export interface TrainGameProps extends GameProps {
  /** Pre-generated questions (lesson mode); otherwise generated from settings. */
  presetQuestions?: TrainQuestion[];
}

export default function TrainGame({ game, paused, onFinish, presetQuestions }: TrainGameProps) {
  const settings = game.settings.train ?? TRAIN_DEFAULTS;
  const points = game.settings.pointsPerCorrect;
  const numerals = useSettings((s) => s.numerals);
  const reduced = useSettings((s) => s.reducedMotion);
  const fmt = useCallback((n: number) => formatNum(n, numerals), [numerals]);
  const questions = useMemo(() => presetQuestions ?? generateTrainQuestions(settings), [presetQuestions, settings]);

  const [qi, setQi] = useState(0);
  const [phase, setPhase] = useState<TrainPhase>("intro");
  const [filled, setFilled] = useState<Record<number, number>>({});
  const [mistakes, setMistakes] = useState(0);
  const [shake, setShake] = useState<{ index: number; key: number } | null>(null);
  const [hint, setHint] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [fire, setFire] = useState(0);
  const [score, setScore] = useState(0);
  const tally = useRef({ correct: 0, wrong: 0, skills: {} as Record<string, { correct: number; wrong: number }> });
  const { feedback, show } = useFeedback(1300);

  const q = questions[qi];
  const tiles = useMemo(() => answerTiles(q, settings), [q, settings]);
  const openSlots = q.missing.filter((i) => filled[i] === undefined);
  const activeSlot = openSlots[0] ?? null;
  const labels = q.cars.map((c, i) => (c !== null ? fmt(c) : filled[i] !== undefined ? fmt(filled[i]) : ""));

  // Opening: wide shot, then the first station.
  useEffect(() => {
    sound.play("whoosh");
    sound.say("هيا نبدأ!");
    setBanner(STATION_NAMES[questions[0].kind]);
    const t = setTimeout(() => setPhase("question"), reduced ? 200 : 2200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 1800);
    return () => clearTimeout(t);
  }, [banner]);

  const finishQuestion = useCallback(
    (ok: boolean) => {
      const kind: TrainKind = q.kind;
      const sk = (tally.current.skills[kind] ??= { correct: 0, wrong: 0 });
      if (ok) {
        tally.current.correct++;
        sk.correct++;
      } else {
        tally.current.wrong++;
        sk.wrong++;
      }
      setFire(Date.now());
      sound.play("levelUp");
      // Leave the station after a short celebration.
      setTimeout(() => {
        if (qi + 1 >= questions.length) {
          onFinish({ correct: tally.current.correct, wrong: tally.current.wrong, score: scoreRef.current, skills: tally.current.skills });
          return;
        }
        setPhase("travel");
        sound.play("engine");
        setTimeout(
          () => {
            const next = questions[qi + 1];
            if (next.kind !== q.kind) {
              setBanner(STATION_NAMES[next.kind]);
              sound.say("لقد وصلت إلى المرحلة التالية!");
            }
            setQi(qi + 1);
            setFilled({});
            setMistakes(0);
            setHint(false);
            setPhase("question");
          },
          reduced ? 300 : 2600,
        );
      }, reduced ? 300 : 1200);
    },
    [q, qi, questions, onFinish, reduced],
  );
  const scoreRef = useRef(0);
  scoreRef.current = score;

  const drop = useCallback(
    (value: number, slot: number | null) => {
      if (phase !== "question" || paused) return;
      const target = slot !== null && q.missing.includes(slot) && filled[slot] === undefined ? slot : activeSlot;
      if (target === null) return;
      const correct = q.sequence[target];
      if (value === correct) {
        const nextFilled = { ...filled, [target]: value };
        setFilled(nextFilled);
        const done = q.missing.every((i) => nextFilled[i] !== undefined);
        show(true, done ? undefined : "رائع يا بطل!");
        if (done) {
          const earned = mistakes === 0 ? points : Math.round(points / 2); // never a deduction
          setScore((s) => s + earned);
          finishQuestion(mistakes === 0);
        }
      } else {
        setShake({ index: target, key: Date.now() });
        setMistakes((m) => m + 1);
        if (!settings.learning) {
          // Test mode: reveal the right number and move on.
          show(false, "الإجابة الصحيحة: " + fmt(correct));
          const revealed = Object.fromEntries(q.missing.map((i) => [i, q.sequence[i]]));
          setFilled(revealed);
          finishQuestion(false);
          return;
        }
        show(false);
        if (mistakes + 1 >= 2) setHint(true);
      }
    },
    [phase, paused, q, filled, activeSlot, mistakes, points, settings.learning, show, finishQuestion, fmt],
  );
  const { bind, ghost } = useTileDrag(drop);

  // Number keys 1-4 pick a tile (teacher keyboard).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= tiles.length) drop(tiles[n - 1], null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tiles, drop]);

  const lineFrom = Math.max(settings.min, q.sequence[0] - 1);
  const lineTo = Math.min(settings.max, q.sequence[q.sequence.length - 1] + 1);

  return (
    <div className="relative flex size-full flex-col">
      <Confetti fire={fire} pieces={70} />
      <FeedbackBurst feedback={feedback} />

      <div className="z-10 flex flex-wrap items-center justify-between gap-2 bg-white/95 px-3 py-2 shadow-soft md:px-5">
        <span className="rounded-2xl bg-hero-orange px-4 py-1.5 font-display text-lg font-extrabold text-white md:text-xl" data-testid="train-station">
          🚂 {STATION_NAMES[q.kind]}
        </span>
        <h2 className="order-last w-full text-center font-display text-3xl font-extrabold md:order-none md:w-auto md:text-4xl" data-testid="train-prompt">
          {trainPrompt(q, fmt)}
        </h2>
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-hero-muted" data-testid="train-progress">
            {fmt(qi + 1)} / {fmt(questions.length)}
          </span>
          <span className="rounded-2xl bg-hero-purple px-3 py-1.5 font-display text-xl font-extrabold text-white">
            ⭐ <AnimatedNumber value={score} />
          </span>
        </div>
      </div>

      <div className="relative min-h-[28vh] flex-1">
        <TrainScene labels={labels} filled={q.missing.filter((i) => filled[i] !== undefined)} shake={shake} phase={phase} leg={qi} stationName={STATION_NAMES[q.kind]} />
        <AnimatePresence>
          {banner && (
            <motion.div
              key={banner}
              initial={{ opacity: 0, y: -30, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="pointer-events-none absolute inset-x-0 top-6 flex justify-center"
            >
              <span className="flex items-center gap-3 rounded-3xl bg-white/95 px-6 py-3 font-display text-3xl font-extrabold shadow-2xl md:text-4xl">
                <HeroKid size={56} mood="cheer" /> {banner}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-3 border-t-4 border-white bg-hero-bg/95 p-3 md:p-4">
        {/* Wagon strip: the same numbers as the 3D train, in reading order; drop targets for drag & drop. */}
        <div className="flex flex-wrap items-center justify-center gap-2" aria-label="عربات القطار">
          {q.cars.map((c, i) => {
            const isMissing = q.missing.includes(i);
            const value = c ?? filled[i];
            const isActive = i === activeSlot && phase === "question";
            return (
              <div key={`${qi}-${i}`} className="flex items-center gap-2">
                {i > 0 && <span className="text-2xl text-hero-muted">—</span>}
                <motion.div
                  data-slot={isMissing ? i : undefined}
                  data-testid={isMissing ? "train-slot" : "train-car"}
                  animate={shake && shake.index === i ? { x: [0, -10, 10, -7, 7, 0] } : value !== undefined && isMissing ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.45 }}
                  className={cn(
                    "grid h-16 min-w-16 place-items-center rounded-2xl border-4 px-3 font-display text-4xl font-extrabold md:h-20 md:min-w-20 md:text-5xl",
                    !isMissing && "border-hero-ink/15 bg-white",
                    isMissing && value === undefined && "border-dashed border-hero-orange bg-hero-orange/10 text-hero-orange",
                    isMissing && value !== undefined && "border-hero-green bg-hero-green/15 text-hero-green",
                    isActive && "ring-4 ring-hero-yellow",
                  )}
                >
                  {value !== undefined ? fmt(value) : "؟"}
                </motion.div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3" aria-label="الإجابات">
          {tiles.map((t) => (
            <button
              key={`${qi}-${t}`}
              type="button"
              disabled={phase !== "question"}
              {...bind(t, fmt(t))}
              className="btn-3d grid h-20 min-w-20 cursor-grab touch-none select-none place-items-center rounded-3xl bg-hero-blue px-4 font-display text-4xl font-extrabold text-white active:cursor-grabbing disabled:opacity-40 md:h-24 md:min-w-24 md:text-5xl"
              data-testid="train-tile"
            >
              {fmt(t)}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {hint && (
            // Floats above the panel so opening/closing it never shifts the tiles.
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-full left-1/2 mb-2 flex w-max max-w-[95vw] -translate-x-1/2 flex-col items-center gap-2 rounded-2xl bg-[#FFF3BF] px-4 py-2 shadow-soft"
              data-testid="train-hint"
            >
              <p className="text-center text-lg font-bold">{trainHint(q)}</p>
              <div className="flex flex-wrap justify-center gap-1" dir="ltr" aria-label="خط الأعداد">
                {Array.from({ length: lineTo - lineFrom + 1 }, (_, k) => lineFrom + k).map((n) => (
                  <span
                    key={n}
                    className={cn("grid size-10 place-items-center rounded-lg font-display text-lg font-bold", q.cars.includes(n) ? "bg-hero-blue text-white" : "bg-white")}
                  >
                    {fmt(n)}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<Lightbulb className="size-5" />} onClick={() => setHint((h) => !h)}>
            تلميح
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Flag className="size-5" />}
            onClick={() => onFinish({ correct: tally.current.correct, wrong: tally.current.wrong, score, skills: tally.current.skills })}
          >
            إنهاء
          </Button>
        </div>
      </div>

      {ghost && (
        <div
          className="pointer-events-none fixed z-[80] grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-3xl bg-hero-blue font-display text-4xl font-extrabold text-white shadow-2xl"
          style={{ left: ghost.x, top: ghost.y }}
        >
          {ghost.label}
        </div>
      )}
    </div>
  );
}
