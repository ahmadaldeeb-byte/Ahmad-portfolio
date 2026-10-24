"use client";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { sound } from "@/lib/audio";
import { countPhrase } from "@/lib/math/common";
import { FRUITS, appleTasks, type AppleTask } from "@/lib/math/games";
import type { GameProps } from "../types";
import { Choices, MathShell, type MathApi } from "./MathShell";
import { useMathTasks } from "./useMath";

export default function AppleBasketGame({ game, paused, onFinish }: GameProps) {
  const tasks = useMathTasks(game, appleTasks);
  return (
    <MathShell
      game={game}
      paused={paused}
      onFinish={onFinish}
      tasks={tasks}
      prompt={(t, fmt) =>
        t.share
          ? `وزّع ${countPhrase(t.total, FRUITS[0], (n) => fmt(n))} على ${t.share === 2 ? "سلتين" : `${fmt(t.share)} سلال`} بالتساوي. كم في كل سلة؟`
          : `على الشجرة ${countPhrase(t.total, FRUITS[0], (n) => fmt(n))}، أخذنا ${fmt(t.take)}. كم بقي؟`
      }
      skill={(t) => (t.share ? "divide" : "subtract")}
      hint={(t) => (t.share ? `اضغط على التفاحات واحدة واحدة؛ كل تفاحة تذهب إلى السلة التالية. ثم عُدّ ما في سلة واحدة.` : `خذ ${t.take} تفاحات إلى السلة، ثم عُدّ التفاحات التي بقيت على الشجرة.`)}
    >
      {(t, api) => (t.share ? <ShareView t={t} api={api} /> : <AppleTaskView t={t} api={api} />)}
    </MathShell>
  );
}

function applePos(i: number) {
  const row = Math.floor(i / 5);
  const col = i % 5;
  return { left: 20 + col * 15 + (row % 2) * 6, top: 22 + row * 12 };
}

/** Tree with the apples; tapping one calls `onTake`. */
function Tree({ total, taken, onTake }: { total: number; taken: number[]; onTake: (i: number) => void }) {
  return (
    <div className="relative aspect-square w-full max-w-[min(60vh,520px)] shrink-0">
      <div className="absolute bottom-0 left-1/2 h-[38%] w-[14%] -translate-x-1/2 rounded-b-xl bg-[#8B5E3C]" />
      <div className="absolute inset-x-[4%] top-[2%] h-[70%] rounded-[50%] bg-[#40C057] shadow-[inset_0_-18px_0_#2F9E44]" />
      {Array.from({ length: total }, (_, i) => {
        const p = applePos(i);
        const gone = taken.includes(i);
        return (
          <AnimatePresence key={i}>
            {!gone && (
              <motion.button
                type="button"
                aria-label="تفاحة"
                onClick={() => onTake(i)}
                exit={{ y: 260, opacity: 0, rotate: 40 }}
                transition={{ duration: 0.6, ease: "easeIn" }}
                className="absolute grid size-12 -translate-x-1/2 cursor-pointer place-items-center text-4xl md:size-14 md:text-5xl"
                style={{ left: `${p.left}%`, top: `${p.top}%` }}
                data-testid="apple"
              >
                🍎
              </motion.button>
            )}
          </AnimatePresence>
        );
      })}
    </div>
  );
}

/** Grades 2–3: share the apples equally; each tap drops an apple into the next basket. */
function ShareView({ t, api }: { t: AppleTask; api: MathApi }) {
  const share = t.share!;
  const [taken, setTaken] = useState<number[]>([]);
  const done = taken.length === t.total;
  const take = (i: number) => {
    if (api.locked || taken.includes(i)) return;
    sound.play("pop");
    setTaken((x) => [...x, i]);
  };
  return (
    <div className="flex size-full flex-col items-center gap-3 p-3 md:flex-row md:items-stretch" data-testid="apple-share">
      <Tree total={t.total} taken={taken} onTake={take} />
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: share }, (_, b) => {
            const n = taken.filter((_, k) => k % share === b).length;
            return (
              <div key={b} className="flex min-h-24 w-28 flex-col items-center rounded-3xl border-4 border-dashed border-[#B07D3B] bg-[#FFF4E6] p-2" data-testid="apple-share-basket" data-count={n}>
                <span className="text-3xl" aria-hidden>🧺</span>
                <div className="flex flex-wrap justify-center text-xl">{Array.from({ length: n }, (_, k) => <motion.span key={k} initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>🍎</motion.span>)}</div>
              </div>
            );
          })}
        </div>
        {!done ? (
          <p className="text-center text-xl font-bold text-hero-muted">اضغط على التفاحات لتوزّعها على السلال ({api.fmt(taken.length)} من {api.fmt(t.total)}).</p>
        ) : (
          <>
            <p className="font-display text-4xl font-extrabold" dir="ltr" data-testid="apple-equation">
              {api.fmt(t.total)} ÷ {api.fmt(share)} = ؟
            </p>
            <Choices options={t.choices} answer={t.answer} api={api} className="w-full max-w-xl" />
          </>
        )}
      </div>
    </div>
  );
}

function AppleTaskView({ t, api }: { t: AppleTask; api: MathApi }) {
  const [taken, setTaken] = useState<number[]>([]);
  const [warn, setWarn] = useState(false);
  const ready = taken.length === t.take;
  const take = (i: number) => {
    if (api.locked || taken.includes(i)) return;
    if (ready) return setWarn(true);
    sound.play("pop");
    setTaken((x) => [...x, i]);
  };
  return (
    <div className="flex size-full flex-col items-center gap-3 p-3 md:flex-row md:items-stretch" data-testid="apple-basket">
      <Tree total={t.total} taken={taken} onTake={take} />
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="flex min-h-28 w-full max-w-md flex-col items-center rounded-[2rem] border-4 border-dashed border-[#B07D3B] bg-[#FFF4E6] p-3">
          <span className="text-5xl" aria-hidden>🧺</span>
          <div className="flex flex-wrap justify-center text-3xl">{taken.map((i) => <motion.span key={i} initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>🍎</motion.span>)}</div>
          <p className="font-display text-xl font-bold" data-testid="apple-taken">في السلة: {api.fmt(taken.length)} من {api.fmt(t.take)}</p>
        </div>
        {!ready ? (
          <p className="text-center text-xl font-bold text-hero-muted">اضغط على {api.fmt(t.take)} تفاحات لتسقط في السلة.</p>
        ) : (
          <>
            {warn && <p className="font-bold text-hero-orange">يكفي! أخذنا العدد المطلوب.</p>}
            <p className="font-display text-4xl font-extrabold" dir="ltr" data-testid="apple-equation">
              {api.fmt(t.total)} − {api.fmt(t.take)} = ؟
            </p>
            <p className="text-lg font-bold">عُدّ التفاحات على الشجرة: كم تفاحة بقيت؟</p>
            <Choices options={t.choices} answer={t.answer} api={api} className="w-full max-w-xl" />
          </>
        )}
      </div>
    </div>
  );
}
