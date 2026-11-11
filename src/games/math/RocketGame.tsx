"use client";
import { motion } from "motion/react";
import dynamic from "next/dynamic";
import { Loading } from "@/components/ui";
import { sound } from "@/lib/audio";
import { rocketTasks } from "@/lib/math/games";
import { cn } from "@/lib/utils";
import type { GameProps } from "../types";
import { Choices, MathShell } from "./MathShell";
import { useMathTasks } from "./useMath";

const RocketScene = dynamic(() => import("./RocketScene"), { ssr: false, loading: () => <Loading label="نجهّز الصاروخ..." /> });
const FUEL = 5;

export default function RocketGame({ game, paused, onFinish }: GameProps) {
  const tasks = useMathTasks(game, rocketTasks);
  return (
    <MathShell
      game={game}
      paused={paused}
      onFinish={onFinish}
      tasks={tasks}
      ltr
      prompt={(t, fmt) => <span dir="ltr">{t.terms.map((x) => fmt(x)).join(" + ")} = ؟</span>}
      skill={() => "add"}
      hint={(t) => (t.terms.length === 3 ? "اجمع أول عددين، ثم أضف العدد الثالث." : t.answer > 20 ? "اجمع الآحاد أولًا ثم العشرات ثم المئات. إذا زاد مجموع منزلة على ٩ فاحمل واحدًا إلى المنزلة التالية." : "ابدأ بالعدد الأكبر وعُدّ إلى الأمام بمقدار العدد الآخر.")}
      celebrate={rocketCelebrate}
      stage={(st) => <RocketStage {...st} />}
    >
      {(t, api) => (
        <div className="flex size-full items-center justify-center p-4">
          <Choices options={t.choices} answer={t.answer} api={api} className="w-full max-w-4xl" />
        </div>
      )}
    </MathShell>
  );
}

/** Rocket on its pad with a five-part fuel tank; launches every fifth right answer. */
export function RocketStage({ solved, celebrating, index }: { solved: number; celebrating: number; index: number }) {
  // Full while the rocket launches, then empty for the next trip.
  const fuel = solved > 0 && solved % FUEL === 0 && index === solved - 1 ? FUEL : solved % FUEL;
  return (
    <div className="flex h-[34vh] min-h-56 gap-2 p-2">
      <div className="relative flex-1 overflow-hidden rounded-3xl">
        <RocketScene launch={celebrating} fuel={fuel} />
        <span className="absolute start-3 top-3 rounded-2xl bg-white/90 px-3 py-1 font-display font-bold" data-testid="rocket-planet">🪐 الكوكب {celebrating + 1}</span>
      </div>
      <div className="flex w-20 flex-col items-center gap-1" aria-label={`الوقود ${fuel} من ${FUEL}`} data-testid="rocket-fuel" data-fuel={fuel}>
        <span className="text-2xl" aria-hidden>⛽</span>
        <div className="flex w-12 flex-1 flex-col-reverse gap-1 rounded-2xl border-4 border-hero-ink/20 bg-white p-1">
          {Array.from({ length: FUEL }, (_, k) => (
            <motion.span key={k} className={cn("flex-1 rounded-lg", k < fuel ? "bg-gradient-to-t from-hero-orange to-hero-yellow" : "bg-hero-ink/5")} animate={k === fuel - 1 ? { scale: [1, 1.15, 1] } : {}} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Launch celebration every fifth right answer (shared with the question-bank version). */
export function rocketCelebrate(solved: number) {
  if (solved % FUEL !== 0) return 0;
  sound.play("levelUp");
  sound.say("لقد وصلت إلى المرحلة التالية!");
  return 2600;
}
