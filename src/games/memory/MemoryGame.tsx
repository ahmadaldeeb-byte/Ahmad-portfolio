"use client";
import { motion } from "motion/react";
import { Flag } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Confetti } from "@/components/Confetti";
import { Button } from "@/components/ui";
import { sound } from "@/lib/audio";
import type { Question } from "@/lib/types";
import { cn, shuffle } from "@/lib/utils";
import { AnimatedNumber } from "../shared/AnimatedNumber";
import { FeedbackBurst } from "../shared/Feedback";
import { useFeedback } from "../shared/useFeedback";
import type { GameProps } from "../types";

export interface MemoryCard {
  id: string;
  pair: number;
  text: string;
}

/** Up to `max` pairs from the match questions (no repeated card text), as a shuffled deck. */
export function memoryDeck(questions: Question[], max = 8): MemoryCard[] {
  const seen = new Set<string>();
  const pairs: { a: string; b: string }[] = [];
  for (const q of questions)
    for (const p of q.pairs ?? []) {
      const a = p.a.trim();
      const b = p.b.trim();
      if (!a || !b || a === b || seen.has(a) || seen.has(b) || pairs.length >= max) continue;
      seen.add(a);
      seen.add(b);
      pairs.push({ a, b });
    }
  return shuffle(pairs.flatMap((p, k) => [
    { id: `${k}a`, pair: k, text: p.a },
    { id: `${k}b`, pair: k, text: p.b },
  ]));
}

const BACKS = ["#7950F2", "#4361EE", "#FF6B9A", "#40C057", "#FF922B", "#20A4C9"];

export default function MemoryGame({ game, paused, onFinish }: GameProps) {
  const deck = useMemo(() => memoryDeck(game.settings.shuffle ? shuffle(game.questions.filter((q) => q.kind === "match")) : game.questions.filter((q) => q.kind === "match")), [game]);
  const pairs = deck.length / 2;
  const points = game.settings.pointsPerCorrect;
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [misses, setMisses] = useState(0);
  const [score, setScore] = useState(0);
  const [fire, setFire] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  const done = useRef(false);
  const { feedback, show } = useFeedback(1100);

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (pairs > 0 && matched.size === pairs && !done.current) {
      done.current = true;
      setFire(Date.now());
      timer.current = window.setTimeout(() => onFinish({ correct: pairs, wrong: misses, score }), 1600);
    }
  }, [matched, pairs, misses, score, onFinish]);

  const flip = (i: number) => {
    if (paused || open.length === 2 || open.includes(i) || matched.has(deck[i].pair)) return;
    sound.play("pop");
    const next = [...open, i];
    setOpen(next);
    if (next.length < 2) return;
    const [x, y] = next.map((k) => deck[k]);
    if (x.pair === y.pair) {
      timer.current = window.setTimeout(() => {
        setMatched((m) => new Set(m).add(x.pair));
        setOpen([]);
        setScore((s) => s + points);
        show(true);
      }, 450);
    } else {
      timer.current = window.setTimeout(() => {
        setOpen([]);
        setMisses((m) => m + 1);
        show(false, "ليسا زوجًا، تذكّر مكانهما!");
      }, 1100);
    }
  };

  const cols = deck.length <= 8 ? "grid-cols-4" : deck.length <= 12 ? "grid-cols-4 md:grid-cols-6" : "grid-cols-4 md:grid-cols-8";
  return (
    <div className="relative flex size-full flex-col" data-testid="memory">
      <Confetti fire={fire} pieces={90} />
      <FeedbackBurst feedback={feedback} />
      <div className="z-10 flex items-center justify-between gap-2 bg-white/95 px-3 py-2 shadow-soft md:px-5">
        <h2 className="font-display text-2xl font-extrabold md:text-3xl">اقلب بطاقتين وطابق كل زوج مترابط</h2>
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-hero-muted" data-testid="memory-progress">{matched.size} / {pairs}</span>
          <span className="rounded-2xl bg-hero-purple px-3 py-1.5 font-display text-xl font-extrabold text-white" data-testid="math-score">⭐ <AnimatedNumber value={score} /></span>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3 md:p-5">
        <div className={cn("mx-auto grid max-w-5xl gap-3 md:gap-4", cols)} style={{ perspective: 1000 }}>
          {deck.map((card, i) => {
            const up = open.includes(i) || matched.has(card.pair);
            const ltr = /[A-Za-z]/.test(card.text) && !/[؀-ۿ]/.test(card.text);
            return (
              <motion.button
                key={card.id}
                type="button"
                onClick={() => flip(i)}
                aria-label={up ? card.text : "بطاقة مقلوبة"}
                animate={{ rotateY: up ? 180 : 0 }}
                transition={{ duration: 0.35 }}
                style={{ transformStyle: "preserve-3d" }}
                className="relative aspect-[4/3] cursor-pointer"
                data-testid="memory-card"
                data-pair={card.pair}
                data-up={up}
              >
                <span className="absolute inset-0 grid place-items-center rounded-3xl text-5xl text-white shadow-soft [backface-visibility:hidden]" style={{ background: BACKS[i % BACKS.length] }} aria-hidden>
                  ⭐
                </span>
                <span
                  dir={ltr ? "ltr" : "rtl"}
                  className={cn(
                    "absolute inset-0 grid place-items-center rounded-3xl border-4 bg-white p-2 text-center font-display font-extrabold shadow-soft [backface-visibility:hidden] [transform:rotateY(180deg)]",
                    matched.has(card.pair) ? "border-hero-green" : "border-hero-blue",
                    card.text.length > 10 ? "text-lg md:text-2xl" : "text-2xl md:text-4xl",
                  )}
                >
                  {card.text}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
      <div className="z-10 flex items-center justify-center gap-2 border-t border-hero-ink/5 bg-white/80 p-2">
        <span className="text-hero-muted">محاولات خاطئة: {misses}</span>
        <Button variant="ghost" size="sm" icon={<Flag className="size-5" />} onClick={() => onFinish({ correct: matched.size, wrong: misses, score })}>إنهاء</Button>
      </div>
    </div>
  );
}
