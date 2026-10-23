import { clamp } from "./utils";

/** Steps needed to reach the finish line, based on how many questions each team can get. */
export function raceLength(questionCount: number, teamCount: number) {
  return clamp(Math.floor(questionCount / Math.max(1, teamCount)), 2, 8);
}
