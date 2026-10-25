import type { PlayableQuestion } from "./questions";
import { clamp, shuffle } from "./utils";

/** Steps needed to reach the finish line, based on how many questions each team can get. */
export function raceLength(questionCount: number, teamCount: number) {
  return clamp(Math.floor(questionCount / Math.max(1, teamCount)), 2, 8);
}

export interface RaceSettings {
  /** Match length in seconds. */
  durationSec: number;
  /** Correct answers needed to cross the finish line. */
  finishSteps: number;
}

export const RACE_DEFAULTS: RaceSettings = { durationSec: 180, finishSteps: 6 };
export const RACE_DURATIONS = [60, 180, 300, 600];

export function validateRaceSettings(r: RaceSettings): string[] {
  const errs: string[] = [];
  if (!Number.isInteger(r.durationSec) || r.durationSec < 30 || r.durationSec > 3600) errs.push("مدة السباق يجب أن تكون بين نصف دقيقة و٦٠ دقيقة.");
  if (!Number.isInteger(r.finishSteps) || r.finishSteps < 2 || r.finishSteps > 30) errs.push("عدد الإجابات للوصول إلى خط النهاية يجب أن يكون بين ٢ و٣٠.");
  return errs;
}

/**
 * Builds two independent question sequences of equivalent difficulty.
 * Questions are grouped by difficulty and dealt alternately, so the teams get
 * different questions where the bank allows it; both sequences follow the same
 * difficulty pattern, so position i is equally hard for both teams. A team only
 * sees a repeat after it has used every question in its own share.
 */
export function fairSequences(questions: PlayableQuestion[], length: number) {
  const groups = new Map<number, PlayableQuestion[]>();
  for (const q of questions) {
    const d = q.difficulty ?? 1;
    groups.set(d, [...(groups.get(d) ?? []), q]);
  }
  const shares = new Map<number, [PlayableQuestion[], PlayableQuestion[]]>();
  for (const [d, list] of groups) {
    const s = shuffle(list);
    const a = s.filter((_, i) => i % 2 === 0);
    const b = s.filter((_, i) => i % 2 === 1);
    // A single question of a difficulty is shared rather than given to one team only.
    shares.set(d, [a, b.length ? b : a]);
  }
  // One difficulty pattern for both teams, mixing levels in proportion to the bank.
  const pattern = shuffle([...shares.entries()].flatMap(([d, [a, b]]) => Array<number>(Math.min(a.length, b.length)).fill(d)));
  const make = (team: 0 | 1) => {
    const pools = new Map([...shares].map(([d, pair]) => [d, { list: pair[team], queue: shuffle(pair[team]) }]));
    const out: PlayableQuestion[] = [];
    for (let i = 0; i < length; i++) {
      const p = pools.get(pattern[i % pattern.length])!;
      if (p.queue.length === 0) p.queue = shuffle(p.list);
      out.push(p.queue.shift()!);
    }
    return out;
  };
  return { red: make(0), blue: make(1), pattern };
}

export type RaceOutcome = { winner: 0 | 1 | null; reason: "finish" | "time" };

/** Winner when a car crosses the line, or by progress when time runs out (null = draw). */
export function decideRace(steps: [number, number], finishSteps: number, timeUp: boolean): RaceOutcome | null {
  const [r, b] = steps;
  if (r >= finishSteps && b >= finishSteps) return { winner: null, reason: "finish" };
  if (r >= finishSteps) return { winner: 0, reason: "finish" };
  if (b >= finishSteps) return { winner: 1, reason: "finish" };
  if (!timeUp) return null;
  return { winner: r === b ? null : r > b ? 0 : 1, reason: "time" };
}
