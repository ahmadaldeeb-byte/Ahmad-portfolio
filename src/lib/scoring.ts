import type { TeamScore, Team } from "./types";

export interface ScoreState {
  correct: number;
  wrong: number;
  score: number;
  streak: number;
  teams: TeamScore[];
}

export function initialScore(teams: Team[] = []): ScoreState {
  return {
    correct: 0,
    wrong: 0,
    score: 0,
    streak: 0,
    teams: teams.map((t) => ({ ...t, score: 0, correct: 0, wrong: 0 })),
  };
}

/**
 * Records an answer. Correct answers earn `points`, plus a small streak bonus
 * (+10% per consecutive correct answer, capped at +50%) to keep it exciting.
 */
export function recordAnswer(
  s: ScoreState,
  correct: boolean,
  points: number,
  teamIndex?: number,
  opts: { streakBonus?: boolean } = {},
): ScoreState {
  const streak = correct ? s.streak + 1 : 0;
  const bonus = opts.streakBonus && correct ? Math.min(0.5, (streak - 1) * 0.1) : 0;
  const earned = correct ? Math.round(points * (1 + bonus)) : 0;
  const teams = s.teams.map((t, i) =>
    i === teamIndex
      ? { ...t, score: t.score + earned, correct: t.correct + (correct ? 1 : 0), wrong: t.wrong + (correct ? 0 : 1) }
      : t,
  );
  return {
    correct: s.correct + (correct ? 1 : 0),
    wrong: s.wrong + (correct ? 0 : 1),
    score: s.score + earned,
    streak,
    teams,
  };
}

export function successRate(correct: number, wrong: number): number {
  const total = correct + wrong;
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}

/** Returns the winning team(s); several entries mean a tie. */
export function winners(teams: TeamScore[]): TeamScore[] {
  if (teams.length === 0) return [];
  const best = Math.max(...teams.map((t) => t.score));
  return teams.filter((t) => t.score === best);
}

export function starsFor(rate: number): 0 | 1 | 2 | 3 {
  if (rate >= 90) return 3;
  if (rate >= 60) return 2;
  if (rate >= 30) return 1;
  return 0;
}
