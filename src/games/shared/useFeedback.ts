"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ENCOURAGEMENTS, TRY_AGAIN } from "@/lib/constants";
import { sound } from "@/lib/audio";
import { randomInt } from "@/lib/utils";
import type { FeedbackState } from "./Feedback";

export function useFeedback(duration = 1400) {
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const counter = useRef(0);

  const show = useCallback(
    (correct: boolean, text?: string) => {
      const msg = text ?? (correct ? ENCOURAGEMENTS[randomInt(ENCOURAGEMENTS.length)] : TRY_AGAIN);
      sound.play(correct ? "correct" : "wrong");
      sound.say(msg);
      setFeedback({ id: ++counter.current, correct, text: msg });
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setFeedback(null), duration);
    },
    [duration],
  );

  useEffect(() => () => window.clearTimeout(timer.current), []);
  return { feedback, show };
}
