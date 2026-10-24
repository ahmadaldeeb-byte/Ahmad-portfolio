"use client";
import { useMemo } from "react";
import { MATH_DEFAULTS } from "@/lib/math/common";
import { raceAddQuestions } from "@/lib/math/games";
import RaceGame from "../race/RaceGame";
import type { GameProps } from "../types";

/** «سباق الجمع»: the split-screen race with generated two-digit additions. */
export default function RaceAddGame(props: GameProps) {
  const level = (props.game.settings.math ?? MATH_DEFAULTS).level;
  const questions = useMemo(() => raceAddQuestions(level, 120), [level]);
  return <RaceGame {...props} questions={questions} />;
}
