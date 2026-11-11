"use client";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { isCorrectOrder, splitLetters } from "@/lib/arabic";
import { sound } from "@/lib/audio";
import { shuffle } from "@/lib/utils";
import { ChoiceButton, MathShell, type MathApi } from "../math/MathShell";
import type { GameProps } from "../types";

export interface WordTask {
  id: string;
  prompt: string;
  answer: string;
  /** Sentence tasks order whole words; word tasks order letters. */
  words: boolean;
  tiles: string[];
  ltr: boolean;
}

/** Tiles in a shuffled order that is never already the answer (when another order exists). */
export function makeWordTask(id: string, prompt: string, answer: string): WordTask {
  const words = /\s/.test(answer.trim());
  const parts = words ? answer.trim().split(/\s+/) : splitLetters(answer.trim());
  let tiles = shuffle(parts);
  for (let k = 0; k < 8 && new Set(parts).size > 1 && tiles.join("|") === parts.join("|"); k++) tiles = shuffle(parts);
  return { id, prompt, answer: answer.trim(), words, tiles, ltr: /[A-Za-z]/.test(answer) };
}

export default function WordsGame({ game, paused, onFinish }: GameProps) {
  const tasks = useMemo(() => {
    const list = game.questions.filter((q) => q.kind === "order" && q.answer?.trim()).map((q) => makeWordTask(q.id, q.prompt, q.answer!));
    return game.settings.shuffle ? shuffle(list) : list;
  }, [game]);
  return (
    <MathShell
      game={game}
      paused={paused}
      onFinish={onFinish}
      tasks={tasks}
      prompt={(t) => <span dir={t.ltr ? "ltr" : "rtl"}>{t.prompt}</span>}
      skill={(t) => (t.words ? "sentence" : "word")}
      hint={(t) => (t.words ? `الجملة تبدأ بكلمة «${t.answer.split(/\s+/)[0]}».` : `الكلمة تبدأ بـ «${splitLetters(t.answer)[0]}».`)}
    >
      {(t, api) => <WordTaskView t={t} api={api} />}
    </MathShell>
  );
}

function WordTaskView({ t, api }: { t: WordTask; api: MathApi }) {
  const [placed, setPlaced] = useState<number[]>([]);
  const [shake, setShake] = useState(0);
  const built = placed.map((i) => t.tiles[i]);
  const full = placed.length === t.tiles.length;
  const ok = t.words ? built.join(" ") === t.answer.split(/\s+/).join(" ") : isCorrectOrder(built, t.answer);
  const put = (i: number) => {
    if (api.locked || placed.includes(i)) return;
    sound.play("pop");
    setPlaced((p) => [...p, i]);
  };
  const check = () => {
    if (ok) return api.submit(true);
    setShake((s) => s + 1);
    api.submit(false, "الترتيب غير صحيح، حاول مرة أخرى!");
    setPlaced([]);
  };
  const shown = api.revealed ? (t.words ? t.answer.split(/\s+/) : splitLetters(t.answer)) : built;
  return (
    <div className="flex size-full flex-col items-center justify-center gap-6 p-4" dir={t.ltr ? "ltr" : "rtl"} data-testid="words">
      {/* The word as it is being built (letters joined, so Arabic letters connect). */}
      <motion.div
        key={shake}
        animate={shake ? { x: [0, -12, 12, -8, 8, 0] } : {}}
        className="flex min-h-28 w-full max-w-4xl flex-wrap items-center justify-center gap-3 rounded-[2rem] border-4 border-dashed border-hero-orange bg-white px-4 py-3 shadow-soft"
        data-testid="words-built"
      >
        {shown.length === 0 && <span className="text-xl text-hero-muted">اضغط على {t.words ? "الكلمات" : "الحروف"} بالترتيب</span>}
        {t.words ? (
          shown.map((w, k) => (
            <button key={k} type="button" disabled={api.locked} onClick={() => setPlaced((p) => p.filter((_, j) => j !== k))} className="cursor-pointer rounded-2xl bg-hero-yellow/40 px-3 py-1 font-display text-3xl font-extrabold md:text-4xl">
              {w}
            </button>
          ))
        ) : (
          <span className="font-display text-6xl font-extrabold md:text-7xl" data-testid="words-word">{shown.join("")}</span>
        )}
      </motion.div>
      <div className="flex flex-wrap justify-center gap-3">
        {t.tiles.map((tile, i) => (
          <ChoiceButton key={i} disabled={api.locked || placed.includes(i)} state={placed.includes(i) ? "dim" : null} onClick={() => put(i)} className="min-w-20 bg-hero-orange px-5 text-4xl md:text-5xl" testId="words-tile">
            {tile}
          </ChoiceButton>
        ))}
      </div>
      <div className="flex gap-3">
        <Button size="lg" variant="success" disabled={api.locked || !full} onClick={check}>تحقق</Button>
        <Button variant="ghost" disabled={api.locked || placed.length === 0} onClick={() => setPlaced((p) => p.slice(0, -1))}>تراجع</Button>
      </div>
    </div>
  );
}
