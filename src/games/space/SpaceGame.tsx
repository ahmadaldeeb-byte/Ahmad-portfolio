"use client";
import dynamic from "next/dynamic";
import { Loading } from "@/components/ui";
import { sound } from "@/lib/audio";
import { Choices, MathShell } from "../math/MathShell";
import type { GameProps } from "../types";

const SpaceScene = dynamic(() => import("./SpaceScene"), { ssr: false, loading: () => <Loading label="نجهّز المركبة..." /> });

/** «رحلة إلى النجوم»: every right answer flies the ship to the next planet; the last one is the star. */
export default function SpaceGame({ game, questions, paused, onFinish }: GameProps) {
  const planets = questions.length + 1;
  const ltr = (s: string) => /[A-Za-z]/.test(s) && !/[؀-ۿ]/.test(s);
  return (
    <MathShell
      game={game}
      paused={paused}
      onFinish={onFinish}
      tasks={questions}
      prompt={(q) => <span dir={ltr(q.prompt) ? "ltr" : "rtl"}>{q.prompt}</span>}
      skill={() => "space"}
      celebrate={(solved) => {
        sound.play("whoosh");
        return solved === questions.length ? 1800 : 900;
      }}
      stage={({ solved }) => (
        <div className="relative mx-2 mt-2 h-[30vh] min-h-48 overflow-hidden rounded-3xl" data-testid="space-stage" data-planet={solved}>
          <SpaceScene target={solved} planets={planets} />
          <span className="absolute start-3 top-3 rounded-2xl bg-white/90 px-3 py-1 font-display font-bold">
            {solved >= questions.length ? "🌟 وصلت إلى النجمة!" : `🪐 الكوكب ${solved + 1} من ${planets}`}
          </span>
        </div>
      )}
    >
      {(q, api) => (
        <div className="flex size-full flex-col items-center justify-center gap-4 p-4" dir={ltr(q.prompt) ? "ltr" : undefined} data-testid="bank-question">
          {q.image && <img src={q.image} alt="" className="max-h-40 rounded-2xl object-contain shadow-soft" />}
          <Choices options={q.choices} answer={q.choices[q.correctIndex]} api={api} className={q.choices.length === 2 ? "w-full max-w-3xl md:grid-cols-2" : "w-full max-w-5xl"} render={(c) => <span className="text-2xl md:text-3xl">{c}</span>} />
        </div>
      )}
    </MathShell>
  );
}
