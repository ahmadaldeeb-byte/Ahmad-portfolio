"use client";
import { Timer } from "lucide-react";
import { motion } from "motion/react";
import { formatNum } from "@/lib/utils";
import { useSettings } from "@/store/settings";

export function TimerBadge({ remaining, total }: { remaining: number | null; total: number }) {
  const numerals = useSettings((s) => s.numerals);
  if (remaining === null) return null;
  const danger = remaining <= 5;
  const pct = total > 0 ? remaining / total : 0;
  return (
    <motion.div
      key={danger ? remaining : "calm"}
      initial={danger ? { scale: 1.25 } : false}
      animate={{ scale: 1 }}
      className={`relative flex items-center gap-2 overflow-hidden rounded-2xl px-4 py-2 font-display text-3xl font-extrabold text-white ${danger ? "bg-hero-red" : "bg-hero-ink/80"}`}
      role="timer"
      aria-label={`الوقت المتبقي ${remaining} ثانية`}
    >
      <span className="absolute inset-y-0 start-0 bg-white/20 transition-[width] duration-200" style={{ width: `${pct * 100}%` }} />
      <Timer className="relative size-7" />
      <span className="relative tabular-nums">{formatNum(remaining, numerals)}</span>
    </motion.div>
  );
}
