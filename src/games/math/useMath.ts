"use client";
import { useMemo } from "react";
import { MATH_DEFAULTS, type MathLevel } from "@/lib/math/common";
import type { GameConfig } from "@/lib/types";

/** Generates a game's tasks once per round from its math settings. */
export function useMathTasks<T>(game: GameConfig, make: (level: MathLevel, count: number) => T[]) {
  const m = game.settings.math ?? MATH_DEFAULTS;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => make(m.level, m.count), [m.level, m.count]);
}
