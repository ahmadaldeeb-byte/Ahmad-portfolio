"use client";
import { motion } from "motion/react";
import { useState } from "react";
import { FRACTION_NAMES, pizzaTasks, type FractionOrder, type PizzaTask } from "@/lib/math/games";
import { cn } from "@/lib/utils";
import type { GameProps } from "../types";
import { ChoiceButton, Choices, MathShell, type MathApi } from "./MathShell";
import { useMathTasks } from "./useMath";

/** "half" / "quarter" / "third", any number of equal parts, or an unequal cut. */
type Cut = "half" | "quarter" | "third" | "unequal2" | "unequal4" | number;

/** n equal wedges from the centre, starting at 12 o'clock. */
function wedges(n: number) {
  const pt = (k: number) => {
    const a = (k / n) * Math.PI * 2;
    return `${(100 + Math.sin(a) * 100).toFixed(1)} ${(100 - Math.cos(a) * 100).toFixed(1)}`;
  };
  return Array.from({ length: n }, (_, k) => `M100 100 L${pt(k)} A100 100 0 0 1 ${pt(k + 1)} Z`);
}

/** Pizza parts as SVG paths in a 200×200 box (centre 100,100, radius 100). */
const PARTS: Record<Exclude<Cut, number>, string[]> = {
  half: ["M100 0 A100 100 0 0 1 100 200 Z", "M100 0 A100 100 0 0 0 100 200 Z"],
  quarter: ["M100 100 L100 0 A100 100 0 0 1 200 100 Z", "M100 100 L200 100 A100 100 0 0 1 100 200 Z", "M100 100 L100 200 A100 100 0 0 1 0 100 Z", "M100 100 L0 100 A100 100 0 0 1 100 0 Z"],
  third: wedges(3),
  unequal2: ["M135 6.3 A100 100 0 0 1 135 193.7 Z", "M135 6.3 A100 100 0 1 0 135 193.7 Z"],
  unequal4: ["M130 80 L130 4.6 A100 100 0 0 1 198 80 Z", "M130 80 L198 80 A100 100 0 0 1 130 195.4 Z", "M130 80 L130 195.4 A100 100 0 0 1 2 80 Z", "M130 80 L2 80 A100 100 0 0 1 130 4.6 Z"],
};
const ORDER_CUT: Record<FractionOrder, Cut> = { half: "half", third: "third", quarter: "quarter" };

/** A fraction written the school way: numerator over denominator. */
export function Frac({ value, fmt, className }: { value: string; fmt: (n: number | string) => string; className?: string }) {
  const [n, d] = value.split("/");
  if (!d) return <>{value}</>;
  return (
    <span className={cn("inline-flex flex-col items-center align-middle leading-none", className)} aria-label={`${n} من ${d}`}>
      <span>{fmt(n)}</span>
      <span className="my-0.5 h-1 w-full min-w-6 rounded bg-current" />
      <span>{fmt(d)}</span>
    </span>
  );
}
const TOPPINGS = [[60, 50], [140, 60], [80, 120], [150, 140], [50, 150], [110, 30], [120, 170], [30, 95], [170, 100]];

export function Pizza({ cut, highlight = [], onPart, served = [], small }: { cut: Cut | null; highlight?: number[]; onPart?: (i: number) => void; served?: number[]; small?: boolean }) {
  const parts = cut === null ? ["M100 0 A100 100 0 1 1 99.9 0 Z"] : typeof cut === "number" ? wedges(cut) : PARTS[cut];
  return (
    <svg viewBox="-6 -6 212 212" className={small ? "h-44 w-44 md:h-56 md:w-56" : "h-64 w-64 md:h-72 md:w-72"} role="img" aria-label="بيتزا">
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
      hint={(t) =>
        t.kind === "frac" || t.kind === "compare"
          ? "المقام (الرقم السفلي) عدد الأجزاء المتساوية كلها، والبسط (العلوي) عدد الأجزاء الملوّنة. كلما زاد عدد الأجزاء صغرت القطعة."
          : "النصف: قطعة من قطعتين متساويتين. الثلث: قطعة من ثلاث. الربع: قطعة من أربع. الأجزاء يجب أن تكون متطابقة."
      }
    >
      {(t, api) => <PizzaTaskView t={t} api={api} />}
    </MathShell>
  );
}

function promptFor(t: PizzaTask, fmt: (n: number | string) => string) {
  if (t.kind === "equal") return "هل قُسّمت البيتزا إلى أجزاء متساوية؟";
  if (t.kind === "name") return "ما الجزء الملوّن بالأصفر من البيتزا؟";
  if (t.kind === "serve") return `${t.customer} تطلب ${FRACTION_NAMES[t.order]} بيتزا!`;
  if (t.kind === "frac") return "ما الكسر الذي يمثّل الجزء الملوّن؟";
  if (t.kind === "compare") return "أيّ الكسرين أكبر؟";
  if (t.num === 1) return `كم يساوي ${FRACTION_NAMES[(["", "", "half", "third", "quarter"] as const)[t.den] as FractionOrder]} ${fmt(t.items)} قطع؟`;
  return <>كم يساوي <Frac value={`${t.num}/${t.den}`} fmt={fmt} className="text-xl" /> من {fmt(t.items)} قطع؟</>;
}

function PizzaTaskView({ t, api }: { t: PizzaTask; api: MathApi }) {
  if (t.kind === "frac") {
    return (
      <div className="flex size-full flex-col items-center justify-center gap-4 p-4" data-testid="pizza-frac">
        <Pizza cut={t.den} highlight={Array.from({ length: t.num }, (_, k) => k)} />
        <Choices options={t.choices} answer={t.answer} api={api} className="w-full max-w-3xl" render={(c) => <Frac value={c} fmt={api.fmt} />} />
      </div>
    );
  }
  if (t.kind === "compare") {
    return (
      <div className="flex size-full flex-col items-center justify-center gap-4 p-4" data-testid="pizza-compare">
        <div className="flex flex-wrap items-center justify-center gap-6">
          {[t.a, t.b].map(([n, d], k) => (
            <div key={k} className="flex flex-col items-center gap-1">
              <Pizza cut={d} small highlight={Array.from({ length: n }, (_, j) => j)} />
              <Frac value={`${n}/${d}`} fmt={api.fmt} className="font-display text-3xl font-extrabold" />
            </div>
          ))}
        </div>
        <Choices options={t.choices} answer={t.answer} api={api} className="w-full max-w-3xl md:grid-cols-3" render={(c) => <Frac value={c} fmt={api.fmt} />} />
      </div>
    );
  }
  if (t.kind === "equal" || t.kind === "name") {
    const cut: Cut = t.parts === 2 ? (t.equal ? "half" : "unequal2") : t.parts === 3 ? (t.equal ? "third" : "unequal2") : t.equal ? "quarter" : "unequal4";
    return (
      <div className="flex size-full flex-col items-center justify-center gap-4 p-4" data-testid={`pizza-${t.kind}`}>
        <Pizza cut={cut} highlight={t.kind === "name" ? [0] : []} />
        <Choices options={t.choices} answer={t.answer} api={api} className={t.choices.length === 2 ? "w-full max-w-2xl md:grid-cols-2" : t.choices.length === 4 ? "w-full max-w-4xl" : "w-full max-w-4xl md:grid-cols-3"} />
      </div>
    );
  }
  if (t.kind === "group") {
    const groups = t.den;
    return (
      <div className="flex size-full flex-col items-center justify-center gap-4 p-4" data-testid="pizza-group">
        <div className="flex flex-wrap justify-center gap-3 rounded-3xl bg-white p-4 shadow-soft">
          {Array.from({ length: groups }, (_, g) => (
            <div key={g} className={cn("flex gap-1 rounded-2xl p-2 text-5xl", (api.solved || api.revealed) && g < t.num ? "border-4 border-dashed border-hero-green" : "")}>
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
  const need = ORDER_CUT[t.order];
  const options: { cut: Cut; label: string }[] = [
    { cut: "half", label: "قطعتان متساويتان" },
    ...(t.thirds ? [{ cut: "third" as Cut, label: "٣ قطع متساوية" }] : []),
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
        <div className={cn("grid w-full gap-3", options.length === 4 ? "max-w-4xl md:grid-cols-4" : "max-w-3xl md:grid-cols-3")}>
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
