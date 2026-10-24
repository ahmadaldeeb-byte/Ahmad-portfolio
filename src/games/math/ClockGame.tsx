"use client";
import { Minus, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { Button, IconButton } from "@/components/ui";
import { MATH_DEFAULTS } from "@/lib/math/common";
import { ROUTINE, clockTasks, type ClockTask } from "@/lib/math/games";
import type { GameProps } from "../types";
import { Choices, MathShell, type MathApi } from "./MathShell";
import { useMathTasks } from "./useMath";

/** Rotates a hand around the clock centre (SVG user units), smoothly. */
const handStyle = (deg: number): React.CSSProperties => ({ transform: `rotate(${deg}deg)`, transformOrigin: "110px 110px", transformBox: "view-box", transition: "transform 0.35s cubic-bezier(.3,1.4,.5,1)" });

const label = (h: number, m: number, fmt: (n: number | string) => string) => `${fmt(h)}:${m === 0 ? fmt("00") : fmt(30)}`;

/** Analog clock; hands can be dragged when `onSet` is given. */
function ClockFace({ h, m, fmt, onSet, allowHalf }: { h: number; m: number; fmt: (n: number | string) => string; onSet?: (h: number, m: 0 | 30) => void; allowHalf?: boolean }) {
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
    if (drag.current === "h") onSet(Math.round(a / 30) % 12 || 12, m as 0 | 30);
    else onSet(h, allowHalf && a > 90 && a < 270 ? 30 : 0);
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
      aria-label={`ساعة تشير إلى ${h}:${m === 0 ? "00" : "30"}`}
      data-testid="clock-face"
      data-time={`${h}:${m === 0 ? "00" : "30"}`}
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

export default function ClockGame({ game, paused, onFinish }: GameProps) {
  const tasks = useMathTasks(game, clockTasks);
  const allowHalf = (game.settings.math ?? MATH_DEFAULTS).level === 3;
  return (
    <MathShell
      game={game}
      paused={paused}
      onFinish={onFinish}
      tasks={tasks}
      prompt={(t, fmt) => (t.kind === "read" ? `${ROUTINE[t.activity].emoji} ${ROUTINE[t.activity].text} في هذا الوقت. كم الساعة؟` : `${ROUTINE[t.activity].emoji} ${ROUTINE[t.activity].text} الساعة ${label(t.h, t.m, fmt)}. اضبط الساعة!`)}
      skill={(t) => (t.m === 30 ? "time-half" : "time-hour")}
      hint={() => "العقرب القصير الأحمر يدل على الساعة، والطويل الأزرق يكون عند ١٢ في الساعة الكاملة وعند ٦ في نصف الساعة."}
    >
      {(t, api) => (t.kind === "read" ? <Read t={t} api={api} /> : <SetClock t={t} api={api} allowHalf={allowHalf} />)}
    </MathShell>
  );
}

function Read({ t, api }: { t: ClockTask; api: MathApi }) {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-4 p-4" data-testid="clock-read">
      <ClockFace h={t.h} m={t.m} fmt={api.fmt} />
      <Choices options={t.choices} answer={t.answer} api={api} className="w-full max-w-3xl" render={(c) => { const [hh, mm] = c.split(":").map(Number); return <span dir="ltr">{label(hh, mm, api.fmt)}</span>; }} />
    </div>
  );
}

function SetClock({ t, api, allowHalf }: { t: ClockTask; api: MathApi; allowHalf: boolean }) {
  const [h, setH] = useState(t.h === 12 ? 3 : 12);
  const [m, setM] = useState<0 | 30>(0);
  const shown = api.revealed ? { h: t.h, m: t.m } : { h, m };
  return (
    <div className="flex size-full flex-col items-center justify-center gap-4 p-4" data-testid="clock-set">
      <ClockFace h={shown.h} m={shown.m} fmt={api.fmt} allowHalf={allowHalf} onSet={api.locked ? undefined : (hh, mm) => { setH(hh); setM(mm); }} />
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="font-bold">الساعة:</span>
        <IconButton label="ساعة إلى الخلف" disabled={api.locked} onClick={() => setH((x) => (x === 1 ? 12 : x - 1))}><Minus /></IconButton>
        <span className="w-24 text-center font-display text-3xl font-extrabold" dir="ltr" data-testid="clock-value">{label(h, m, api.fmt)}</span>
        <IconButton label="ساعة إلى الأمام" disabled={api.locked} onClick={() => setH((x) => (x === 12 ? 1 : x + 1))}><Plus /></IconButton>
        {allowHalf && <Button variant="secondary" size="sm" disabled={api.locked} onClick={() => setM((x) => (x === 0 ? 30 : 0))}>{m === 0 ? "اجعلها والنصف" : "اجعلها تمامًا"}</Button>}
      </div>
      <Button size="lg" variant="success" disabled={api.locked} onClick={() => api.submit(h === t.h && m === t.m)}>تحقق</Button>
    </div>
  );
}
