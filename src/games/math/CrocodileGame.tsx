"use client";
import { motion } from "motion/react";
import { useState } from "react";
import { compareSymbol, crocTasks, type CrocTask } from "@/lib/math/games";
import { cn } from "@/lib/utils";
import type { GameProps } from "../types";
import { ChoiceButton, MathShell, type MathApi } from "./MathShell";
import { useMathTasks } from "./useMath";

export default function CrocodileGame({ game, paused, onFinish }: GameProps) {
  const tasks = useMathTasks(game, crocTasks);
  return (
    <MathShell
      game={game}
      paused={paused}
      onFinish={onFinish}
      tasks={tasks}
      prompt={(t) => (t.mode === "group" ? (t.ask === "bigger" ? "أين المجموعة الأكبر؟" : "أين المجموعة الأصغر؟") : "اختر الرمز المناسب: > أو < أو =")}
      skill={(t) => (t.mode === "group" ? "compare-visual" : "compare-symbol")}
      hint={(t) => (t.mode === "group" ? "عُدّ الأسماك في كل مجموعة ثم قارن." : "التمساح يفتح فمه نحو العدد الأكبر. إذا تساوى العددان نختار =.")}
    >
      {(t, api) => <CrocTaskView t={t} api={api} />}
    </MathShell>
  );
}

/** Cartoon crocodile; `face` = which side its open mouth points to. */
function Crocodile({ face, open }: { face: "left" | "right" | "none"; open: boolean }) {
  return (
    <motion.svg viewBox="0 0 200 120" className="w-40 md:w-56" animate={{ scaleX: face === "left" ? -1 : 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }} aria-label="التمساح الجائع" role="img">
      <ellipse cx="80" cy="80" rx="62" ry="26" fill="#2F9E44" />
      {[40, 62, 84, 106].map((x) => (
        <path key={x} d={`M${x} 56 l8 -12 l8 12z`} fill="#2B8A3E" />
      ))}
      <path d="M20 80 q-18 4 -16 20 q14 -6 22 -8z" fill="#2F9E44" />
      <rect x="40" y="100" width="12" height="16" rx="5" fill="#2B8A3E" />
      <rect x="100" y="100" width="12" height="16" rx="5" fill="#2B8A3E" />
      {/* lower jaw */}
      <path d="M128 82 L196 92 L188 100 L128 96 Z" fill="#40C057" />
      <path d="M136 92 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6" stroke="#fff" strokeWidth="3" fill="none" />
      {/* upper jaw opens */}
      <motion.g style={{ originX: 0, originY: 1 }} animate={{ rotate: open && face !== "none" ? -28 : -4 }} transition={{ type: "spring", stiffness: 260, damping: 10 }}>
        <path d="M128 60 Q160 52 198 74 L196 84 L128 84 Z" fill="#40C057" />
        <path d="M138 82 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6" stroke="#fff" strokeWidth="3" fill="none" />
        <circle cx="146" cy="60" r="9" fill="#fff" />
        <circle cx="148" cy="60" r="4.5" fill="#25304B" />
      </motion.g>
    </motion.svg>
  );
}

function Group({ n, fmt, showNumber, onPick, state, disabled, side }: { n: number; fmt: (v: number) => string; showNumber: boolean; onPick?: () => void; state: "correct" | "wrong" | null; disabled: boolean; side: string }) {
  const content = (
    <>
      {n <= 10 && (
        <div className="grid grid-cols-3 gap-1 text-4xl md:text-5xl" aria-hidden>
          {Array.from({ length: n }, (_, i) => (
            <motion.span key={i} animate={{ x: [0, 4, 0] }} transition={{ duration: 1.6 + (i % 3) * 0.3, repeat: Infinity }}>🐟</motion.span>
          ))}
        </div>
      )}
      {showNumber && <span className="font-display text-6xl font-extrabold md:text-7xl">{fmt(n)}</span>}
    </>
  );
  const cls = cn(
    "flex min-h-48 min-w-40 flex-col items-center justify-center gap-2 rounded-[2rem] border-4 bg-white p-4 shadow-soft",
    state === "correct" ? "border-hero-green" : state === "wrong" ? "border-hero-red" : "border-transparent",
  );
  return onPick ? (
    <motion.button type="button" disabled={disabled} onClick={onPick} whileTap={{ scale: 0.96 }} animate={state === "wrong" ? { x: [0, -10, 10, 0] } : {}} className={cn(cls, "cursor-pointer")} data-testid={`croc-group-${side}`} aria-label={`مجموعة فيها ${n}`}>
      {content}
    </motion.button>
  ) : (
    <div className={cls} data-testid={`croc-group-${side}`}>{content}</div>
  );
}

function CrocTaskView({ t, api }: { t: CrocTask; api: MathApi }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);
  const symbol = compareSymbol(t.a, t.b);
  const done = picked !== null || api.revealed;
  const face = !done ? "none" : t.a > t.b ? "left" : t.a < t.b ? "right" : "none";
  const fmt = (v: number) => api.fmt(v);

  const pickGroup = (side: "a" | "b") => {
    const mine = side === "a" ? t.a : t.b;
    const other = side === "a" ? t.b : t.a;
    const ok = t.ask === "bigger" ? mine > other : mine < other;
    if (ok) setPicked(side);
    else setWrong(side);
    api.submit(ok);
  };
  const pickSymbol = (s: string) => {
    if (s === symbol) setPicked(s);
    else setWrong(s);
    api.submit(s === symbol);
  };

  // Math is written left-to-right: a (left) ○ b (right).
  return (
    <div className="flex size-full flex-col items-center justify-center gap-6 p-4" dir="ltr" data-testid="crocodile">
      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
        <Group n={t.a} fmt={fmt} side="a" showNumber={t.mode !== "group"} disabled={api.locked || done} onPick={t.mode === "group" ? () => pickGroup("a") : undefined} state={picked === "a" ? "correct" : wrong === "a" ? "wrong" : null} />
        <div className="flex flex-col items-center">
          <Crocodile face={face} open={done} />
          {t.mode !== "group" && (
            <span className={cn("grid size-20 place-items-center rounded-2xl border-4 font-display text-5xl font-extrabold", done ? "border-hero-green bg-hero-green/10 text-hero-green" : "border-dashed border-hero-orange text-hero-orange")} data-testid="croc-slot">
              {done ? symbol : "؟"}
            </span>
          )}
        </div>
        <Group n={t.b} fmt={fmt} side="b" showNumber={t.mode !== "group"} disabled={api.locked || done} onPick={t.mode === "group" ? () => pickGroup("b") : undefined} state={picked === "b" ? "correct" : wrong === "b" ? "wrong" : null} />
      </div>
      {t.mode !== "group" && (
        <div className="grid grid-cols-3 gap-4">
          {[">", "<", "="].map((s) => (
            <ChoiceButton key={s} disabled={api.locked || done} state={done ? (s === symbol ? "correct" : s === wrong ? "wrong" : "dim") : s === wrong ? "wrong" : null} onClick={() => pickSymbol(s)} className="min-w-24 text-5xl" testId="croc-symbol">
              {s}
            </ChoiceButton>
          ))}
        </div>
      )}
    </div>
  );
}
