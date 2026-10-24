"use client";
import { motion } from "motion/react";
import { isMathExpression } from "@/lib/arabic";
import { cn } from "@/lib/utils";
import { Choices, MathShell } from "../math/MathShell";
import type { GameProps } from "../types";

const TREASURES = ["💎", "⭐", "🪙", "🍀", "🔑"];

/** Adventure path: the hero hops one stone forward with every right answer, collecting treasures on the way. */
function Path({ total, solved }: { total: number; solved: number }) {
  const stones = Math.min(10, Math.max(2, total));
  const reached = Math.round((Math.min(solved, total) / Math.max(1, total)) * (stones - 1)); // stone the hero stands on
  return (
    <div className="relative mx-2 mt-2 h-32 overflow-hidden rounded-3xl bg-gradient-to-b from-[#B2F2BB] via-[#8CE99A] to-[#74C0FC] shadow-inner md:h-36" data-testid="numbers-path" data-step={solved}>
      <span className="absolute start-2 top-1 text-3xl" aria-hidden>🌳</span>
      <span className="absolute end-2 top-1 text-4xl" aria-hidden>{solved >= total ? "🏆" : "🏰"}</span>
      <div className="absolute inset-x-10 bottom-4 flex items-end justify-between">
        {Array.from({ length: stones }, (_, k) => (
          <div key={k} className="relative flex flex-col items-center">
            {k % 3 === 2 && <span className={cn("text-xl transition", k <= reached && solved > 0 ? "opacity-20" : "")} aria-hidden>{TREASURES[k % TREASURES.length]}</span>}
            <span className={cn("block h-4 w-8 rounded-[50%] md:w-10", k <= reached ? "bg-hero-yellow" : "bg-[#868E96]")} />
          </div>
        ))}
      </div>
      <motion.span
        className="absolute bottom-6 text-5xl"
        // Reads right-to-left: start on the right.
        animate={{ right: `${4 + (reached / (stones - 1)) * 84}%`, y: [0, -24, 0] }}
        transition={{ right: { type: "spring", stiffness: 90, damping: 14 }, y: { duration: 0.45 } }}
        key={solved}
        aria-label="البطل"
      >
        🦸
      </motion.span>
    </div>
  );
}

/** «أبطال الأرقام»: math questions on an adventure path. */
export default function NumbersGame({ game, questions, paused, onFinish }: GameProps) {
  return (
    <MathShell
      game={game}
      paused={paused}
      onFinish={onFinish}
      tasks={questions}
      prompt={(q, fmt) => (isMathExpression(q.prompt) ? <span dir="ltr">{q.prompt.replace(/\d+/g, (d) => fmt(d))}</span> : q.prompt)}
      skill={() => "numbers"}
      celebrate={(solved) => (solved % 3 === 0 ? 700 : 0)}
      stage={({ solved }) => <Path total={questions.length} solved={solved} />}
    >
      {(q, api) => (
        <div className="flex size-full flex-col items-center justify-center gap-4 p-4" data-testid="bank-question">
          {q.image && <img src={q.image} alt="" className="max-h-48 rounded-2xl object-contain shadow-soft" />}
          <Choices options={q.choices} answer={q.choices[q.correctIndex]} api={api} className={q.choices.length === 2 ? "w-full max-w-3xl md:grid-cols-2" : "w-full max-w-5xl"} render={(c) => (/^\d+$/.test(c) ? api.fmt(c) : <span className="text-2xl md:text-3xl">{c}</span>)} />
        </div>
      )}
    </MathShell>
  );
}
