"use client";
import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import type { PlayableQuestion } from "@/lib/questions";
import { isMathExpression } from "@/lib/arabic";
import { cn } from "@/lib/utils";

const CHOICE_COLORS = ["#4361EE", "#FF6B9A", "#40C057", "#FF922B"];

/** Large, touch-friendly multiple-choice panel for classroom screens. */
export function QuestionPanel({
  question,
  picked,
  onPick,
  ltr,
  compact,
}: {
  question: PlayableQuestion;
  picked: number | null;
  onPick: (index: number) => void;
  ltr?: boolean;
  compact?: boolean;
}) {
  const revealed = picked !== null;
  return (
    <div className={cn("flex w-full flex-col gap-4", ltr && "ltr-content")}>
      <motion.div
        key={question.id + question.prompt}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-4 rounded-3xl bg-white px-6 py-4 text-center shadow-soft"
      >
        {question.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={question.image} alt="" className={cn("rounded-2xl object-contain", compact ? "max-h-24" : "max-h-40")} />
        )}
        <h2 data-testid="question-prompt" dir={isMathExpression(question.prompt) ? "ltr" : undefined} className={cn("font-display font-extrabold leading-snug text-hero-ink", compact ? "text-2xl md:text-3xl" : "text-3xl md:text-5xl")}>
          {question.prompt}
        </h2>
      </motion.div>
      <div className={cn("grid gap-3", question.choices.length === 2 ? "grid-cols-2" : "grid-cols-2")}>
        {question.choices.map((c, i) => {
          const isCorrect = i === question.correctIndex;
          const isPicked = i === picked;
          return (
            <motion.button
              key={`${question.id}-${i}`}
              type="button"
              data-testid="choice"
              disabled={revealed}
              onClick={() => onPick(i)}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={
                revealed && isPicked && !isCorrect
                  ? { opacity: 1, scale: 1, x: [0, -14, 14, -10, 10, 0] }
                  : revealed && isCorrect
                    ? { opacity: 1, scale: [1, 1.07, 1] }
                    : { opacity: revealed ? 0.55 : 1, scale: 1 }
              }
              transition={{ delay: revealed ? 0 : i * 0.06, type: "spring", stiffness: 320, damping: 20 }}
              whileHover={revealed ? undefined : { y: -4 }}
              whileTap={revealed ? undefined : { scale: 0.96 }}
              className={cn(
                "btn-3d relative flex cursor-pointer items-center justify-center gap-3 rounded-3xl px-4 font-display font-extrabold text-white disabled:cursor-default",
                compact ? "min-h-16 text-2xl md:text-3xl" : "min-h-24 text-3xl md:text-4xl",
              )}
              style={{ background: revealed && isCorrect ? "#40C057" : revealed && isPicked ? "#FA5252" : CHOICE_COLORS[i % 4] }}
            >
              {revealed && isCorrect && <Check className="size-8 shrink-0" strokeWidth={4} />}
              {revealed && isPicked && !isCorrect && <X className="size-8 shrink-0" strokeWidth={4} />}
              <span>{c}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
