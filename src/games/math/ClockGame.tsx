"use client";
import { Minus, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { Button, IconButton } from "@/components/ui";
import { MATH_DEFAULTS } from "@/lib/math/common";
import { ROUTINE, clockStep, clockTasks, pad2, timeKey, type ClockTask } from "@/lib/math/games";
import type { GameProps } from "../types";
import { Choices, MathShell, type MathApi } from "./MathShell";
import { useMathTasks } from "./useMath";

/** Rotates a hand around the clock centre (SVG user units), smoothly. */
const handStyle = (deg: number): React.CSSProperties => ({ transform: `rotate(${deg}deg)`, transformOrigin: "110px 110px", transformBox: "view-box", transition: "transform 0.35s cubic-bezier(.3,1.4,.5,1)" });

const label = (h: number, m: number, fmt: (n: number | string) => string) => `${fmt(h)}:${fmt(pad2(m))}`;

/** Analog clock; hands can be dragged when `onSet` is given. `step` = minute snapping (60: whole hours only). */
export function ClockFace({ h, m, fmt, onSet, step = 60 }: { h: number; m: number; fmt: (n: number | string) => string; onSet?: (h: number, m: number) => void; step?: number }) {
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<"h" | "m" | null>(null);
  const angleAt = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    return ((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360; // 0° = 12 o'clock
  };
  const move = (e: React.PointerEvent) => {
    if (!drag.current || !onSet) return;
    const a = angleAt(e);
    if (drag.current === "h") onSet(Math.round(a / 30) % 12 || 12, m);
    else if (step < 60) onSet(h, (Math.round(a / 6 / step) * step) % 60);
  };
  const hourAngle = ((h % 12) + m / 60) * 30;
  const minuteAngle = m * 6;
  return (
    <svg
      ref={svg}
      viewBox="0 0 220 220"
      className="h-64 w-64 touch-none select-none md:h-80 md:w-80"
      onPointerMove={move}
      onPointerUp={() => (drag.current = null)}
      onPointerLeave={() => (drag.current = null)}
      role="img"
      aria-label={`ساعة تشير إلى ${timeKey(h, m)}`}
      data-testid="clock-face"
      data-time={timeKey(h, m)}
    >
      <circle cx="110" cy="110" r="104" fill="#fff" stroke="#3B5BDB" strokeWidth="8" />
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i * 6 * Math.PI) / 180;
        const r1 = i % 5 ? 96 : 90;
        return <line key={i} x1={110 + Math.sin(a) * r1} y1={110 - Math.cos(a) * r1} x2={110 + Math.sin(a) * 100} y2={110 - Math.cos(a) * 100} stroke="#25304B" strokeWidth={i % 5 ? 1.5 : 3} />;
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const n = i + 1;
        const a = (n * 30 * Math.PI) / 180;
        return <text key={n} x={110 + Math.sin(a) * 74} y={110 - Math.cos(a) * 74 + 8} textAnchor="middle" fontSize="22" fontWeight="800" fontFamily="Cairo, sans-serif" fill="#25304B">{fmt(n)}</text>;
      })}
      <line x1="110" y1="110" x2="110" y2="58" stroke="#FA5252" strokeWidth="10" strokeLinecap="round" style={handStyle(hourAngle)} onPointerDown={(e) => { drag.current = "h"; (e.target as Element).setPointerCapture?.(e.pointerId); }} className={onSet ? "cursor-grab" : undefined} data-testid="clock-hour" />
      <line x1="110" y1="110" x2="110" y2="30" stroke="#3B5BDB" strokeWidth="6" strokeLinecap="round" style={handStyle(minuteAngle)} onPointerDown={(e) => { drag.current = "m"; (e.target as Element).setPointerCapture?.(e.pointerId); }} className={onSet ? "cursor-grab" : undefined} data-testid="clock-minute" />
      <circle cx="110" cy="110" r="8" fill="#25304B" />
    </svg>
  );
}

const ACTIVITIES = ["اللعب في الحديقة", "قراءة قصة", "الرسم", "حلّ الواجب", "ترتيب غرفته", "مساعدة أمه في المطبخ"];

export default function ClockGame({ game, paused, onFinish }: GameProps) {
  const tasks = useMathTasks(game, clockTasks);
  const step = clockStep((game.settings.math ?? MATH_DEFAULTS).level, game.grade);
  return (
    <MathShell
      game={game}
      paused={paused}
      onFinish={onFinish}
      tasks={tasks}
      prompt={(t, fmt) => {
        const r = ROUTINE[t.activity];
        if (t.kind === "elapsed") return `⏳ بدأ فارس ${ACTIVITIES[t.activity % ACTIVITIES.length]} في هذا الوقت واستمر ${fmt(t.minutes!)} دقيقة. متى انتهى؟`;
        return t.kind === "read" ? `${r.emoji} ${r.text} في هذا الوقت. كم الساعة؟` : `${r.emoji} ${r.text} الساعة ${label(t.h, t.m, fmt)}. اضبط الساعة!`;
      }}
      skill={(t) => (t.kind === "elapsed" ? "time-elapsed" : t.m === 0 ? "time-hour" : t.m === 30 ? "time-half" : "time-minutes")}
      hint={(t) =>
        t.kind === "elapsed"
          ? "حرّك العقرب الطويل في ذهنك: كل رقم على الساعة يعني ٥ دقائق، و٦٠ دقيقة تساوي ساعة كاملة."
          : step < 30
            ? "العقرب الطويل: كل رقم عليه يعني ٥ دقائق؛ عند ٣ تكون ١٥ دقيقة (ربع ساعة)، وعند ٦ تكون ٣٠ دقيقة (نصف ساعة)."
            : "العقرب القصير الأحمر يدل على الساعة، والطويل الأزرق يكون عند ١٢ في الساعة الكاملة وعند ٦ في نصف الساعة."
      }
    >
      {(t, api) => (t.kind === "set" ? <SetClock t={t} api={api} step={Math.max(step, 5)} /> : <Read t={t} api={api} />)}
    </MathShell>
  );
}

function Read({ t, api }: { t: ClockTask; api: MathApi }) {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-4 p-4" data-testid={t.kind === "elapsed" ? "clock-elapsed" : "clock-read"}>
      <ClockFace h={t.h} m={t.m} fmt={api.fmt} />
      <Choices options={t.choices} answer={t.answer} api={api} className="w-full max-w-3xl" render={(c) => { const [hh, mm] = c.split(":").map(Number); return <span dir="ltr">{label(hh, mm, api.fmt)}</span>; }} />
    </div>
  );
}

function SetClock({ t, api, step }: { t: ClockTask; api: MathApi; step: number }) {
  const [h, setH] = useState(t.h === 12 ? 3 : 12);
  const [m, setM] = useState(0);
  const shown = api.revealed ? { h: t.h, m: t.m } : { h, m };
  const minutes = (d: number) => setM((x) => (x + d + 60) % 60);
  return (
    <div className="flex size-full flex-col items-center justify-center gap-4 p-4" data-testid="clock-set">
      <ClockFace h={shown.h} m={shown.m} fmt={api.fmt} step={step} onSet={api.locked ? undefined : (hh, mm) => { setH(hh); setM(mm); }} />
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="font-bold">الساعة:</span>
        <IconButton label="ساعة إلى الخلف" disabled={api.locked} onClick={() => setH((x) => (x === 1 ? 12 : x - 1))}><Minus /></IconButton>
        <span className="w-24 text-center font-display text-3xl font-extrabold" dir="ltr" data-testid="clock-value">{label(h, m, api.fmt)}</span>
        <IconButton label="ساعة إلى الأمام" disabled={api.locked} onClick={() => setH((x) => (x === 12 ? 1 : x + 1))}><Plus /></IconButton>
        {step === 30 && <Button variant="secondary" size="sm" disabled={api.locked} onClick={() => setM((x) => (x === 0 ? 30 : 0))}>{m === 0 ? "اجعلها والنصف" : "اجعلها تمامًا"}</Button>}
        {step < 30 && (
          <>
            <span className="font-bold">الدقائق:</span>
            <IconButton label={`${step} دقائق إلى الخلف`} disabled={api.locked} onClick={() => minutes(-step)}><Minus /></IconButton>
            <IconButton label={`${step} دقائق إلى الأمام`} disabled={api.locked} onClick={() => minutes(step)}><Plus /></IconButton>
          </>
        )}
      </div>
      <Button size="lg" variant="success" disabled={api.locked} onClick={() => api.submit(h === t.h && m === t.m)}>تحقق</Button>
    </div>
  );
}
