"use client";
import { AnimatePresence, motion } from "motion/react";
import { HeroKid, RobotBuddy } from "@/components/Characters";

export interface FeedbackState {
  id: number;
  correct: boolean;
  text: string;
}

/** Big encouraging message with a character; auto-hidden by the parent. */
export function FeedbackBurst({ feedback }: { feedback: FeedbackState | null }) {
  return (
    <AnimatePresence>
      {feedback && (
        <motion.div
          key={feedback.id}
          className="pointer-events-none absolute inset-x-0 top-1/4 z-30 flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.5, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -30 }}
          transition={{ type: "spring", stiffness: 380, damping: 20 }}
          role="status"
        >
          {feedback.correct ? <HeroKid size={130} mood="cheer" /> : <RobotBuddy size={110} mood="think" />}
          <span
            className={`-mt-2 rounded-3xl px-8 py-3 font-display text-4xl font-extrabold text-white shadow-2xl md:text-5xl ${feedback.correct ? "bg-hero-green" : "bg-hero-orange"}`}
          >
            {feedback.text}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
