"use client";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { RobotBuddy } from "@/components/Characters";
import { Loading } from "@/components/ui";
import { gameMetaFor } from "@/lib/constants";
import { isMathGame } from "@/lib/math/meta";
import type { GameConfig, GameType } from "@/lib/types";
import type { GameProps } from "./types";

export function GameLoading() {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-4">
      <RobotBuddy size={140} mood="think" />
      <Loading label="نجهّز اللعبة..." />
    </div>
  );
}

// Each game is code-split and only loaded when played.
export const GAME_COMPONENTS: Partial<Record<GameType, ComponentType<GameProps>>> = {
  wheel: dynamic(() => import("./wheel/WheelGame"), { ssr: false, loading: GameLoading }),
  race: dynamic(() => import("./race/RaceGame"), { ssr: false, loading: GameLoading }),
  balloons: dynamic(() => import("./balloons/BalloonsGame"), { ssr: false, loading: GameLoading }),
  quiz: dynamic(() => import("./quiz/QuizGame"), { ssr: false, loading: GameLoading }),
  teams: dynamic(() => import("./teams/TeamsGame"), { ssr: false, loading: GameLoading }),
  train: dynamic(() => import("./train/TrainGame"), { ssr: false, loading: GameLoading }),
  island: dynamic(() => import("./math/IslandGame"), { ssr: false, loading: GameLoading }),
  crocodile: dynamic(() => import("./math/CrocodileGame"), { ssr: false, loading: GameLoading }),
  rocket: dynamic(() => import("./math/RocketGame"), { ssr: false, loading: GameLoading }),
  appleBasket: dynamic(() => import("./math/AppleBasketGame"), { ssr: false, loading: GameLoading }),
  factory: dynamic(() => import("./math/FactoryGame"), { ssr: false, loading: GameLoading }),
  raceAdd: dynamic(() => import("./math/RaceAddGame"), { ssr: false, loading: GameLoading }),
  pirates: dynamic(() => import("./math/PiratesGame"), { ssr: false, loading: GameLoading }),
  shapes: dynamic(() => import("./math/ShapesGame"), { ssr: false, loading: GameLoading }),
  pizza: dynamic(() => import("./math/PizzaGame"), { ssr: false, loading: GameLoading }),
  market: dynamic(() => import("./math/MarketGame"), { ssr: false, loading: GameLoading }),
  clock: dynamic(() => import("./math/ClockGame"), { ssr: false, loading: GameLoading }),
  measure: dynamic(() => import("./math/MeasureGame"), { ssr: false, loading: GameLoading }),
  memory: dynamic(() => import("./memory/MemoryGame"), { ssr: false, loading: GameLoading }),
  words: dynamic(() => import("./words/WordsGame"), { ssr: false, loading: GameLoading }),
  numbers: dynamic(() => import("./numbers/NumbersGame"), { ssr: false, loading: GameLoading }),
  puzzle: dynamic(() => import("./puzzle/PuzzleGame"), { ssr: false, loading: GameLoading }),
  space: dynamic(() => import("./space/SpaceGame"), { ssr: false, loading: GameLoading }),
};
/** Math game worlds playing question-bank questions in the other subjects. */
export const BankWorldGame = dynamic(() => import("./math/BankWorldGame"), { ssr: false, loading: GameLoading });

/** The component that plays a game config (math worlds play bank questions outside math). */
export function gameComponentFor(game: GameConfig): ComponentType<GameProps> | undefined {
  const meta = gameMetaFor(game.type, game.subject);
  return isMathGame(game.type) && !meta.generated ? BankWorldGame : GAME_COMPONENTS[game.type as GameType];
}
