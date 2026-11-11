"use client";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { COINS, priceLabel } from "@/lib/math/games";
import type { MathGameType } from "@/lib/math/meta";
import type { PlayableQuestion } from "@/lib/questions";
import { cn } from "@/lib/utils";
import type { GameProps } from "../types";
import { ClockFace } from "./ClockGame";
import { Crocodile } from "./CrocodileGame";
import { CoinIcon } from "./MarketGame";
import { Choices, MathShell } from "./MathShell";
import { PirateMap } from "./PiratesGame";
import { Pizza } from "./PizzaGame";
import { RocketStage, rocketCelebrate } from "./RocketGame";
import { ShapeCity } from "./ShapesGame";

type Stage = { solved: number; index: number; celebrating: number; total: number };

/** A strip above the questions that shows progress in the game's world. */
function Strip({ children, className, testId }: { children: ReactNode; className?: string; testId?: string }) {
  return (
    <div className={cn("relative mx-2 mt-2 flex h-28 items-center justify-center gap-3 overflow-hidden rounded-3xl px-4 shadow-inner md:h-32", className)} data-testid={testId ?? "world-stage"}>
      {children}
    </div>
  );
}

const pop = { initial: { scale: 0, y: -30 }, animate: { scale: 1, y: 0 }, transition: { type: "spring" as const, stiffness: 260, damping: 14 } };
const TOYS = ["🧸", "🚗", "🪀", "🎈", "🤖", "🪁", "🚂", "⚽", "🎲", "🛴", "🧩", "🥁"];
const DAY = [
  { h: 7, emoji: "⏰" },
  { h: 8, emoji: "🎒" },
  { h: 10, emoji: "📚" },
  { h: 12, emoji: "🍽️" },
  { h: 3, emoji: "⚽" },
  { h: 5, emoji: "📖" },
  { h: 7, emoji: "🍲" },
  { h: 8, emoji: "🌙" },
];

/** The world scene for each game type (question-bank version). */
const STAGES: Record<Exclude<MathGameType, "raceAdd">, (s: Stage) => ReactNode> = {
  island: ({ solved }) => (
    <Strip className="bg-gradient-to-b from-[#74C0FC] to-[#1C7ED6]">
      <span className="text-5xl" aria-hidden>🏝️</span>
      <div className="flex min-h-20 min-w-32 flex-wrap items-center justify-center rounded-3xl bg-[#FFF4E6] p-2 text-3xl" data-built={solved}>
        <span aria-hidden>🧺</span>
        {Array.from({ length: solved }, (_, k) => <motion.span key={k} {...pop}>{["🍎", "🍌", "🍊", "🍓"][k % 4]}</motion.span>)}
      </div>
    </Strip>
  ),
  crocodile: ({ solved, index }) => (
    <Strip className="bg-gradient-to-b from-[#A5D8FF] to-[#4DABF7]">
      <div dir="ltr" className="flex items-center gap-2 [&_svg]:w-36 md:[&_svg]:w-44">
        <Crocodile face="right" open={solved > index} />
        <div className="flex flex-wrap text-3xl" aria-label={`أكل التمساح ${solved} سمكات`}>
          {Array.from({ length: Math.max(0, 6 - (solved % 7)) }, (_, k) => <span key={k} aria-hidden>🐟</span>)}
        </div>
      </div>
      <span className="absolute end-3 top-2 rounded-2xl bg-white/90 px-3 py-1 font-display font-bold" data-built={solved}>🐟 × {solved}</span>
    </Strip>
  ),
  rocket: (s) => <RocketStage {...s} />,
  appleBasket: ({ solved, total }) => (
    <Strip className="bg-gradient-to-b from-[#D3F9D8] to-[#B2F2BB]">
      <div className="relative grid h-24 w-40 place-items-center rounded-[50%] bg-[#40C057]">
        <div className="flex flex-wrap justify-center gap-0.5 px-4 text-xl">
          {Array.from({ length: Math.max(0, total - solved) }, (_, k) => <span key={k} aria-hidden>🍎</span>)}
        </div>
      </div>
      <div className="flex min-h-20 min-w-28 flex-wrap items-center justify-center rounded-3xl border-4 border-dashed border-[#B07D3B] bg-[#FFF4E6] p-2 text-2xl" data-built={solved}>
        <span aria-hidden>🧺</span>
        {Array.from({ length: solved }, (_, k) => <motion.span key={k} initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>🍎</motion.span>)}
      </div>
    </Strip>
  ),
  factory: ({ solved }) => (
    <Strip className="bg-[#E9ECEF]">
      <motion.span className="text-5xl" animate={{ rotate: solved * 90 }} aria-hidden>⚙️</motion.span>
      <div className="relative flex h-16 flex-1 items-center gap-2 overflow-hidden rounded-2xl bg-[#495057] px-3" data-built={solved}>
        {Array.from({ length: Math.min(solved, 12) }, (_, k) => (
          <motion.span key={k} className="text-4xl" initial={{ x: -200 }} animate={{ x: 0 }} transition={{ type: "spring", stiffness: 90, damping: 14 }} aria-hidden>
            {TOYS[k % TOYS.length]}
          </motion.span>
        ))}
      </div>
    </Strip>
  ),
  pirates: ({ solved, total }) => <PirateMap count={total} solved={solved} />,
  shapes: ({ solved }) => <ShapeCity solved={solved} empty="أجب لتبني مدينة الأبطال!" />,
  pizza: ({ solved, total }) => {
    const parts = Math.max(2, Math.min(total, 12));
    const shown = Math.min(parts, Math.round((solved / total) * parts));
    return (
      <Strip className="bg-[#FFF4E6]">
        <div className="h-24 w-24 md:h-28 md:w-28 [&>svg]:size-full" data-built={shown}>
          <Pizza cut={parts} served={Array.from({ length: parts - shown }, (_, k) => shown + k)} />
        </div>
        <span className="font-display text-xl font-bold">{shown === parts ? "اكتملت البيتزا! 🍕" : "أجب لتضيف قطعة"}</span>
      </Strip>
    );
  },
  market: ({ solved }) => (
    <Strip className="bg-[#FFF0F6]">
      <span className="text-5xl" aria-hidden>🐷</span>
      <div className="flex flex-wrap items-center gap-1" data-built={solved}>
        {Array.from({ length: Math.min(solved, 10) }, (_, k) => (
          <motion.span key={k} {...pop}><CoinIcon coin={COINS[1]} size={40} /></motion.span>
        ))}
      </div>
      <span className="rounded-2xl bg-white px-3 py-1 font-display text-xl font-extrabold">{solved ? priceLabel(solved * 5) : "٠"}</span>
    </Strip>
  ),
  clock: ({ solved }) => {
    const step = DAY[Math.min(solved, DAY.length - 1)];
    return (
      <Strip className="bg-[#EDF2FF]">
        <div className="h-24 w-24 md:h-28 md:w-28 [&>svg]:size-full" data-built={solved}>
          <ClockFace h={step.h} m={0} fmt={String} />
        </div>
        <motion.span key={solved} {...pop} className="text-5xl" aria-hidden>{step.emoji}</motion.span>
      </Strip>
    );
  },
  measure: ({ solved, total }) => {
    const tilt = Math.min(14, (solved / Math.max(1, total)) * 14);
    return (
      <Strip className="bg-[#F1F3F5]">
        <svg viewBox="0 0 300 120" className="h-24 w-72" role="img" aria-label="ميزان الأبطال" data-built={solved}>
          <rect x="144" y="40" width="12" height="70" fill="#868E96" />
          <g style={{ transform: `rotate(${-tilt}deg)`, transformOrigin: "150px 40px", transformBox: "view-box", transition: "transform 1s" }}>
            <rect x="30" y="34" width="240" height="10" rx="5" fill="#495057" />
            <path d="M10 44 Q50 80 90 44 Z" fill="#ADB5BD" />
            <path d="M210 44 Q250 80 290 44 Z" fill="#ADB5BD" />
            <text x="50" y="40" textAnchor="middle" fontSize="26">{"⭐".repeat(Math.min(solved, 3))}</text>
          </g>
        </svg>
      </Strip>
    );
  },
};

/**
 * Question-bank version of a math game's world for Arabic, science and
 * English: the same scene and shell, playing the game's own questions.
 */
export default function BankWorldGame({ game, questions, paused, onFinish }: GameProps) {
  const type = game.type as Exclude<MathGameType, "raceAdd">;
  const stage = STAGES[type];
  const latin = (q: PlayableQuestion) => /[A-Za-z]/.test(q.prompt) && !/[؀-ۿ]/.test(q.prompt);
  return (
    <MathShell
      game={game}
      paused={paused}
      onFinish={onFinish}
      tasks={questions}
      prompt={(q) => <span dir={latin(q) ? "ltr" : "rtl"} className="block">{q.prompt}</span>}
      skill={() => "bank"}
      celebrate={type === "rocket" ? rocketCelebrate : (solved) => (solved === questions.length ? 1500 : 0)}
      stage={(s) => stage({ ...s, total: questions.length })}
    >
      {(q, api) => (
        <div className="flex size-full flex-col items-center justify-center gap-4 p-4" dir={latin(q) ? "ltr" : undefined} data-testid="bank-question">
          {q.image && <img src={q.image} alt="" className="max-h-48 rounded-2xl object-contain shadow-soft" />}
          <Choices
            options={q.choices}
            answer={q.choices[q.correctIndex]}
            api={api}
            className={q.choices.length === 2 ? "w-full max-w-3xl md:grid-cols-2" : "w-full max-w-5xl"}
            render={(c) => <span className={cn("block leading-tight", c.length > 14 ? "text-xl md:text-2xl" : "text-2xl md:text-3xl")}>{c}</span>}
          />
        </div>
      )}
    </MathShell>
  );
}
