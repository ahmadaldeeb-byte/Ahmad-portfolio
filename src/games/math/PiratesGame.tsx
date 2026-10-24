"use client";
import { AnimatePresence, motion } from "motion/react";
import { pirateTasks } from "@/lib/math/games";
import { cn } from "@/lib/utils";
import type { GameProps } from "../types";
import { Choices, MathShell } from "./MathShell";
import { useMathTasks } from "./useMath";

export default function PiratesGame({ game, paused, onFinish }: GameProps) {
  const tasks = useMathTasks(game, pirateTasks);
  return (
    <MathShell
      game={game}
      paused={paused}
      onFinish={onFinish}
      tasks={tasks}
      ltr
      prompt={(t, fmt) => <span dir="ltr">{fmt(t.a)} − {fmt(t.b)} = ؟</span>}
      skill={() => "subtract"}
      hint={(t) => (t.a >= 100 || t.a % 10 < t.b % 10 ? "ابدأ بالآحاد. إذا كان الرقم العلوي أصغر فاستلف عشرة من المنزلة التالية." : t.a >= 20 ? "اطرح العشرات من العشرات، والآحاد من الآحاد." : "ابدأ من العدد الأكبر وعُدّ إلى الخلف.")}
      celebrate={(solved) => (solved === tasks.length ? 1800 : 600)}
      stage={({ solved }) => <PirateMap count={tasks.length} solved={solved} />}
    >
      {(t, api, i) => (
        <div className="flex size-full flex-col items-center justify-center gap-4 p-4">
          <div className="relative">
            <motion.div className="grid h-40 w-32 place-items-center rounded-t-[4rem] border-8 border-[#5C3B1E] bg-[#8B5E3C] text-5xl shadow-xl md:h-52 md:w-40" aria-label={`الباب ${i + 1}`}>
              {api.solved ? "🔓" : "🔒"}
            </motion.div>
            <AnimatePresence>
              {api.solved && (
                <motion.span initial={{ x: 120, y: -60, opacity: 0, rotate: -40 }} animate={{ x: 0, y: 0, opacity: 1, rotate: 0 }} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl" aria-label="مفتاح">
                  🗝️
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <p className="text-lg font-bold text-hero-muted">حلّ المسألة لتحصل على المفتاح!</p>
          <Choices options={t.choices} answer={t.answer} api={api} className="w-full max-w-4xl" />
        </div>
      )}
    </MathShell>
  );
}

/** Treasure map: one door per task; the pirate walks along the path. */
export function PirateMap({ count, solved }: { count: number; solved: number }) {
  return (
    <div className="relative mx-2 mt-2 flex h-28 items-center justify-between overflow-hidden rounded-3xl bg-[#F3D9A4] px-6 shadow-inner md:h-32" data-testid="pirate-map" data-open={solved}>
      <div className="absolute inset-x-8 top-1/2 border-t-4 border-dashed border-[#B07D3B]" />
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="relative z-10 flex flex-col items-center">
          <motion.span className="text-3xl md:text-4xl" animate={{ rotateY: i < solved ? 70 : 0 }} style={{ transformOrigin: "right" }} aria-hidden>
            {i < solved ? "🚪" : "🔒"}
          </motion.span>
        </div>
      ))}
      <span className={cn("relative z-10 text-4xl md:text-5xl")} aria-hidden>{solved >= count ? "💰" : "🧰"}</span>
      <motion.span
        className="absolute bottom-1 z-20 text-4xl"
        // The path reads right-to-left: start on the right, treasure on the left.
        animate={{ right: `${6 + (Math.min(solved, count) / (count + 1)) * 88}%` }}
        transition={{ type: "spring", stiffness: 80, damping: 12 }}
        aria-label="القرصان الصغير"
      >
        🏴‍☠️
      </motion.span>
    </div>
  );
}
