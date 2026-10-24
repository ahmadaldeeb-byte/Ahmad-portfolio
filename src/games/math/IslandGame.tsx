"use client";
import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui";
import { sound } from "@/lib/audio";
import { countPhrase, numberWord } from "@/lib/math/common";
import { FRUITS, islandTasks, type IslandTask } from "@/lib/math/games";
import { useTileDrag } from "../train/useTileDrag";
import type { GameProps } from "../types";
import { MathShell, type MathApi } from "./MathShell";
import { useMathTasks } from "./useMath";

export default function IslandGame({ game, paused, onFinish }: GameProps) {
  const tasks = useMathTasks(game, islandTasks);
  return (
    <MathShell
      game={game}
      paused={paused}
      onFinish={onFinish}
      tasks={tasks}
      prompt={(t, fmt) => `اجمع ${countPhrase(t.target, FRUITS[t.fruit], (n) => fmt(n))} (${numberWord(t.target)})`}
      skill={() => "count"}
      hint={(t) => `عُدّ وأنت تضع كل ثمرة: واحد، اثنان، ثلاثة... حتى تصل إلى ${numberWord(t.target)}.`}
    >
      {(t, api) => <IslandTaskView t={t} api={api} />}
    </MathShell>
  );
}

/** Grid spots inside the island (6 × 4, slightly staggered) so fruits never overlap. */
const SPOTS = Array.from({ length: 24 }, (_, k) => {
  const row = Math.floor(k / 6);
  const col = k % 6;
  return { left: 24 + col * 10.5 + (row % 2) * 4, top: 38 + row * 10 };
});
/** Stable shuffled order of the spots for a task. */
function spot(i: number, seed: number) {
  const order = SPOTS.map((_, k) => k).sort((a, b) => ((a * 7 + seed * 13) % 24) - ((b * 7 + seed * 13) % 24));
  return SPOTS[order[i % 24]];
}

function IslandTaskView({ t, api }: { t: IslandTask; api: MathApi }) {
  const fruit = FRUITS[t.fruit];
  const [basket, setBasket] = useState<number[]>([]);
  const toggle = (i: number, toBasket?: boolean) => {
    if (api.locked) return;
    sound.play("pop");
    setBasket((b) => (b.includes(i) ? (toBasket ? b : b.filter((x) => x !== i)) : [...b, i]));
  };
  const { bind, ghost } = useTileDrag((i, slot) => toggle(i, slot === 0));
  const n = basket.length;
  return (
    <div className="flex size-full flex-col gap-3 p-3 lg:flex-row" data-testid="island">
      <div className="relative min-h-[46vh] flex-1 overflow-hidden rounded-[2rem] bg-gradient-to-b from-[#74C0FC] to-[#1C7ED6]">
        <motion.div className="absolute inset-x-[6%] bottom-[8%] top-[22%] rounded-[50%] bg-[#FFE8A3] shadow-[inset_0_-20px_0_#F5D06F]" animate={{ y: [0, -4, 0] }} transition={{ duration: 4, repeat: Infinity }} />
        <div className="absolute inset-x-[14%] bottom-[16%] top-[28%] rounded-[50%] bg-[#69DB7C]" />
        {["🌴", "🌴", "🐢", "🦜", "🐒"].map((e, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute text-5xl"
            style={{ left: `${[12, 78, 20, 70, 84][i]}%`, top: `${[24, 22, 72, 70, 50][i]}%` }}
            animate={{ y: [0, -6, 0], rotate: i > 1 ? [0, 4, 0] : 0 }}
            transition={{ duration: 2.5 + i * 0.4, repeat: Infinity }}
          >
            {e}
          </motion.span>
        ))}
        {Array.from({ length: t.onIsland }, (_, i) => i)
          .filter((i) => !basket.includes(i))
          .map((i) => {
            const p = spot(i, t.target);
            return (
              <motion.button
                key={i}
                type="button"
                layoutId={`fruit-${i}`}
                aria-label={fruit.one}
                className="absolute grid size-14 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none select-none place-items-center text-5xl md:size-16"
                style={{ left: `${p.left}%`, top: `${p.top}%` }}
                whileHover={{ scale: 1.15 }}
                data-testid="island-fruit"
                {...bind(i, fruit.emoji)}
              >
                {fruit.emoji}
              </motion.button>
            );
          })}
      </div>
      <div className="flex flex-col items-center gap-3 lg:w-80">
        <div data-slot={0} className="flex min-h-48 w-full flex-col items-center rounded-[2rem] border-4 border-dashed border-[#B07D3B] bg-[#FFF4E6] p-3" data-testid="island-basket">
          <span className="text-5xl" aria-hidden>🧺</span>
          <div className="flex flex-wrap justify-center gap-1">
            {basket.map((i) => (
              <motion.button key={i} type="button" layoutId={`fruit-${i}`} aria-label={`أعد ${fruit.one}`} onClick={() => toggle(i)} className="cursor-pointer text-4xl">
                {fruit.emoji}
              </motion.button>
            ))}
          </div>
        </div>
        <div className="text-center">
          <p className="font-display text-6xl font-extrabold text-hero-blue" data-testid="island-count">{api.fmt(n)}</p>
          <p className="text-xl font-bold text-hero-muted">{numberWord(n)}</p>
        </div>
        <Button
          size="lg"
          variant="success"
          disabled={api.locked}
          onClick={() =>
            api.submit(n === t.target, n === t.target ? "أحسنت! لقد جمعت العدد الصحيح" : n < t.target ? "نحتاج إلى ثمار أكثر!" : "هذا أكثر من المطلوب! أعد بعضها.")
          }
        >
          تحقق
        </Button>
        {api.revealed && <p className="font-bold text-hero-red">العدد الصحيح: {api.fmt(t.target)}</p>}
      </div>
      {ghost && (
        <div className="pointer-events-none fixed z-[80] -translate-x-1/2 -translate-y-1/2 text-6xl" style={{ left: ghost.x, top: ghost.y }}>
          {ghost.label}
        </div>
      )}
    </div>
  );
}
