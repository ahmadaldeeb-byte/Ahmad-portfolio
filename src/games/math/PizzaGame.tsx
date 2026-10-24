"use client";
import { motion } from "motion/react";
import { useState } from "react";
import { FRACTION_NAMES, pizzaTasks, type PizzaTask } from "@/lib/math/games";
import { cn } from "@/lib/utils";
import type { GameProps } from "../types";
import { ChoiceButton, Choices, MathShell, type MathApi } from "./MathShell";
import { useMathTasks } from "./useMath";

type Cut = "half" | "quarter" | "unequal2" | "unequal4";

/** Pizza parts as SVG paths in a 200×200 box (centre 100,100, radius 100). */
const PARTS: Record<Cut, string[]> = {
  half: ["M100 0 A100 100 0 0 1 100 200 Z", "M100 0 A100 100 0 0 0 100 200 Z"],
  quarter: ["M100 100 L100 0 A100 100 0 0 1 200 100 Z", "M100 100 L200 100 A100 100 0 0 1 100 200 Z", "M100 100 L100 200 A100 100 0 0 1 0 100 Z", "M100 100 L0 100 A100 100 0 0 1 100 0 Z"],
  unequal2: ["M135 6.3 A100 100 0 0 1 135 193.7 Z", "M135 6.3 A100 100 0 1 0 135 193.7 Z"],
  unequal4: ["M130 80 L130 4.6 A100 100 0 0 1 198 80 Z", "M130 80 L198 80 A100 100 0 0 1 130 195.4 Z", "M130 80 L130 195.4 A100 100 0 0 1 2 80 Z", "M130 80 L2 80 A100 100 0 0 1 130 4.6 Z"],
};
const TOPPINGS = [[60, 50], [140, 60], [80, 120], [150, 140], [50, 150], [110, 30], [120, 170], [30, 95], [170, 100]];

function Pizza({ cut, highlight = [], onPart, served = [] }: { cut: Cut | null; highlight?: number[]; onPart?: (i: number) => void; served?: number[] }) {
  const parts = cut ? PARTS[cut] : ["M100 0 A100 100 0 1 1 99.9 0 Z"];
  return (
    <svg viewBox="-6 -6 212 212" className="h-64 w-64 md:h-72 md:w-72" role="img" aria-label="بيتزا">
      {parts.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          fill={highlight.includes(i) ? "#FFD43B" : "#FFA94D"}
          stroke="#C2410C"
          strokeWidth="5"
          animate={{ opacity: served.includes(i) ? 0.15 : 1 }}
          onClick={onPart ? () => onPart(i) : undefined}
          className={onPart ? "cursor-pointer" : undefined}
          data-testid={onPart ? "pizza-part" : undefined}
        />
      ))}
      {TOPPINGS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="9" fill="#E03131" pointerEvents="none" />)}
    </svg>
  );
}

export default function PizzaGame({ game, paused, onFinish }: GameProps) {
  const tasks = useMathTasks(game, pizzaTasks);
  return (
    <MathShell
      game={game}
      paused={paused}
      onFinish={onFinish}
      tasks={tasks}
      prompt={(t, fmt) => promptFor(t, fmt)}
      skill={(t) => t.kind}
      hint={() => "النصف: قطعة من قطعتين متساويتين. الربع: قطعة من أربع قطع متساوية. الأجزاء يجب أن تكون متطابقة."}
    >
      {(t, api) => <PizzaTaskView t={t} api={api} />}
    </MathShell>
  );
}

function promptFor(t: PizzaTask, fmt: (n: number | string) => string) {
  if (t.kind === "equal") return "هل قُسّمت البيتزا إلى أجزاء متساوية؟";
  if (t.kind === "name") return "ما الجزء الملوّن بالأصفر من البيتزا؟";
  if (t.kind === "serve") return `${t.customer} تطلب ${FRACTION_NAMES[t.order]} بيتزا!`;
  return `كم يساوي ${FRACTION_NAMES[t.fraction]} ${fmt(t.items)} قطع؟`;
}

function PizzaTaskView({ t, api }: { t: PizzaTask; api: MathApi }) {
  if (t.kind === "equal" || t.kind === "name") {
    const cut: Cut = t.parts === 2 ? (t.equal ? "half" : "unequal2") : t.equal ? "quarter" : "unequal4";
    return (
      <div className="flex size-full flex-col items-center justify-center gap-4 p-4" data-testid={`pizza-${t.kind}`}>
        <Pizza cut={cut} highlight={t.kind === "name" ? [0] : []} />
        <Choices options={t.choices} answer={t.answer} api={api} className={t.choices.length === 2 ? "w-full max-w-2xl md:grid-cols-2" : "w-full max-w-4xl md:grid-cols-3"} />
      </div>
    );
  }
  if (t.kind === "group") {
    const groups = t.fraction === "half" ? 2 : 4;
    return (
      <div className="flex size-full flex-col items-center justify-center gap-4 p-4" data-testid="pizza-group">
        <div className="flex flex-wrap justify-center gap-3 rounded-3xl bg-white p-4 shadow-soft">
          {Array.from({ length: groups }, (_, g) => (
            <div key={g} className={cn("flex gap-1 rounded-2xl p-2 text-5xl", api.solved || api.revealed ? "border-4 border-dashed border-hero-green" : "")}>
              {Array.from({ length: t.items / groups }, (_, k) => <span key={k}>{t.emoji}</span>)}
            </div>
          ))}
        </div>
        <Choices options={t.choices} answer={t.answer} api={api} className="w-full max-w-3xl" render={(c) => api.fmt(c)} />
      </div>
    );
  }
  return <Serve t={t} api={api} />;
}

/** Choose a cut, then put one piece on the customer's plate. */
function Serve({ t, api }: { t: Extract<PizzaTask, { kind: "serve" }>; api: MathApi }) {
  const [cut, setCut] = useState<Cut | null>(null);
  const [served, setServed] = useState<number[]>([]);
  const need: Cut = t.order === "half" ? "half" : "quarter";
  const options: { cut: Cut; label: string }[] = [
    { cut: "half", label: "قطعتان متساويتان" },
    { cut: "quarter", label: "٤ قطع متساوية" },
    { cut: "unequal2", label: "قطعتان غير متساويتين" },
  ];
  return (
    <div className="flex size-full flex-col items-center justify-center gap-4 p-4" data-testid="pizza-serve">
      <div className="flex items-center gap-4">
        <span className="rounded-3xl bg-white px-4 py-2 text-xl font-bold shadow-soft">🧑‍🍳 «أريد {FRACTION_NAMES[t.order]} بيتزا من فضلك»</span>
        <span className="text-6xl" aria-hidden>🍽️</span>
      </div>
      <Pizza
        cut={cut}
        served={served}
        onPart={cut === need && !api.locked ? (i) => {
          setServed([i]);
          api.submit(true, `تفضّل! هذا ${FRACTION_NAMES[t.order]} البيتزا`);
        } : undefined}
      />
      {cut !== need ? (
        <div className="grid w-full max-w-3xl gap-3 md:grid-cols-3">
          {options.map((o) => (
            <ChoiceButton
              key={o.cut}
              disabled={api.locked}
              state={api.revealed ? (o.cut === need ? "correct" : "dim") : cut === o.cut ? "wrong" : null}
              className="text-2xl md:text-2xl"
              testId="pizza-cut"
              onClick={() => {
                setCut(o.cut);
                if (o.cut !== need) api.submit(false, o.cut === "unequal2" ? "الأجزاء غير متساوية!" : `هذا ليس ${FRACTION_NAMES[t.order]}!`);
              }}
            >
              🔪 {o.label}
            </ChoiceButton>
          ))}
        </div>
      ) : (
        <p className="text-xl font-bold">ممتاز! الآن اضغط على قطعة واحدة لتقدّمها.</p>
      )}
    </div>
  );
}
