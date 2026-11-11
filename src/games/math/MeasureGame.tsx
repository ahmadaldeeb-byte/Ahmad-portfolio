"use client";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { numberChoices } from "@/lib/math/common";
import { MEASURE_WORDS, measureAnswer, measureTasks, type MeasureTask } from "@/lib/math/games";
import { cn } from "@/lib/utils";
import type { GameProps } from "../types";
import { ChoiceButton, Choices, MathShell, type MathApi } from "./MathShell";
import { useMathTasks } from "./useMath";

export default function MeasureGame({ game, paused, onFinish }: GameProps) {
  const tasks = useMathTasks(game, measureTasks);
  return (
    <MathShell
      game={game}
      paused={paused}
      onFinish={onFinish}
      tasks={tasks}
      prompt={(t) =>
        t.kind === "units" ? "كم مشبكًا طول القلم؟"
        : t.kind === "ruler" ? "كم سنتيمترًا طول هذا الشيء؟"
        : t.kind === "unit" || t.kind === "convert" ? (t.kind === "convert" ? <span dir="rtl">أكمل: {t.text}</span> : t.text)
        : t.kind === "length" ? `اختر القلم ${MEASURE_WORDS.length[t.ask]}` : t.kind === "mass" ? `أيّهما ${MEASURE_WORDS.mass[t.ask]}؟ ضعهما على الميزان` : `أيّ وعاء ${MEASURE_WORDS.capacity[t.ask]}؟`
      }
      skill={(t) => t.kind}
      hint={(t) =>
        t.kind === "mass" ? "كفّة الميزان تنزل نحو الشيء الأثقل."
        : t.kind === "capacity" ? "عُدّ الأكواب التي يملؤها كل وعاء."
        : t.kind === "units" ? "عُدّ المشابك من أول القلم إلى آخره."
        : t.kind === "ruler" ? "ابدأ من الصفر، واقرأ الرقم عند نهاية الشيء."
        : t.kind === "unit" ? "الأشياء الصغيرة نقيسها بالسنتيمتر أو الغرام أو المللتر، والكبيرة بالمتر أو الكيلوغرام أو اللتر."
        : t.kind === "convert" ? "المتر = ١٠٠ سنتيمتر، والكيلوغرام = ١٠٠٠ غرام، واللتر = ١٠٠٠ مللتر."
        : "قارن أطراف الأقلام وهي تبدأ من الخط نفسه."
      }
    >
      {(t, api) =>
        t.kind === "length" ? <Lengths t={t} api={api} />
        : t.kind === "mass" ? <Balance t={t} api={api} />
        : t.kind === "capacity" ? <Capacity t={t} api={api} />
        : t.kind === "ruler" ? <Ruler t={t} api={api} />
        : t.kind === "unit" || t.kind === "convert" ? <TextChoice t={t} api={api} />
        : <Units t={t} api={api} />
      }
    </MathShell>
  );
}

function usePick(t: MeasureTask, api: MathApi) {
  const answer = measureAnswer(t);
  const [picked, setPicked] = useState<number | null>(null);
  const [wrong, setWrong] = useState<number | null>(null);
  const pick = (i: number) => {
    if (api.locked) return;
    if (i === answer) setPicked(i);
    else setWrong(i);
    api.submit(i === answer);
  };
  const state = (i: number) => (picked !== null || api.revealed ? (i === answer ? "correct" : i === wrong ? "wrong" : null) : i === wrong ? "wrong" : null);
  return { pick, state };
}

function Lengths({ t, api }: { t: MeasureTask; api: MathApi }) {
  const { pick, state } = usePick(t, api);
  const colors = ["#FAB005", "#FA5252", "#4361EE"];
  return (
    <div className="flex size-full flex-col items-center justify-center gap-4 p-4" dir="ltr" data-testid="measure-length">
      <div className="relative flex w-full max-w-3xl flex-col gap-5 border-l-4 border-hero-ink/40 py-2">
        {t.values.map((v, i) => (
          <button key={i} type="button" onClick={() => pick(i)} disabled={api.locked} aria-label={`القلم ${i + 1}`} className={cn("flex h-14 cursor-pointer items-center rounded-r-full border-4", state(i) === "correct" ? "border-hero-green" : state(i) === "wrong" ? "border-hero-red" : "border-transparent")} style={{ width: `${v * 10}%`, background: colors[i] }} data-testid="measure-item">
            <span className="ms-auto me-1 text-2xl" aria-hidden>✏️</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Balance({ t, api }: { t: MeasureTask; api: MathApi }) {
  const { pick, state } = usePick(t, api);
  const [placed, setPlaced] = useState(false);
  // Tilt towards the heavier side (left = item 0).
  const tilt = placed ? (t.values[0] > t.values[1] ? -12 : 12) : 0;
  return (
    <div className="flex size-full flex-col items-center justify-center gap-4 p-4" dir="ltr" data-testid="measure-mass">
      <svg viewBox="0 0 300 200" className="h-56 w-80 md:h-64 md:w-96" role="img" aria-label="ميزان ذو كفتين">
        <rect x="140" y="80" width="20" height="100" fill="#868E96" />
        <rect x="100" y="178" width="100" height="14" rx="6" fill="#495057" />
        <g style={{ transform: `rotate(${tilt}deg)`, transformOrigin: "150px 80px", transformBox: "view-box", transition: "transform 1s cubic-bezier(.3,1.5,.5,1)" }} data-testid="balance-beam" data-tilt={tilt}>
          <rect x="30" y="74" width="240" height="12" rx="6" fill="#495057" />
          {[50, 250].map((x, i) => (
            <g key={x}>
              <line x1={x} y1="86" x2={x - 30} y2="130" stroke="#495057" strokeWidth="3" />
              <line x1={x} y1="86" x2={x + 30} y2="130" stroke="#495057" strokeWidth="3" />
              <path d={`M${x - 40} 130 Q${x} 160 ${x + 40} 130 Z`} fill="#ADB5BD" />
              {placed && <text x={x} y="128" textAnchor="middle" fontSize="40">{t.items[i]}</text>}
            </g>
          ))}
        </g>
      </svg>
      {!placed ? (
        <Button size="lg" onClick={() => setPlaced(true)} data-testid="balance-place">⚖️ ضعهما على الميزان</Button>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {t.items.map((it, i) => (
            <ChoiceButton key={i} disabled={api.locked} state={state(i)} onClick={() => pick(i)} className="min-w-32 text-6xl" testId="measure-item">{it}</ChoiceButton>
          ))}
        </div>
      )}
    </div>
  );
}

function Capacity({ t, api }: { t: MeasureTask; api: MathApi }) {
  const { pick, state } = usePick(t, api);
  const [filled, setFilled] = useState(false);
  return (
    <div className="flex size-full flex-col items-center justify-center gap-4 p-4" data-testid="measure-capacity">
      <div className="flex items-end gap-6">
        {t.items.map((it, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <ChoiceButton disabled={api.locked} state={state(i)} onClick={() => pick(i)} className="bg-white text-hero-ink" testId="measure-item">
              <span style={{ fontSize: `${2 + t.values[i] * 0.7}rem` }}>{it}</span>
            </ChoiceButton>
            {filled && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap justify-center gap-0.5 text-xl" style={{ maxWidth: 120 }} aria-label={`يملأ ${t.values[i]} أكواب`}>
                {Array.from({ length: t.values[i] }, (_, k) => <span key={k}>🥤</span>)}
              </motion.div>
            )}
          </div>
        ))}
      </div>
      {!filled && <Button variant="secondary" onClick={() => setFilled(true)}>💧 نملأ الأوعية بالأكواب</Button>}
    </div>
  );
}

function Units({ t, api }: { t: MeasureTask; api: MathApi }) {
  const len = t.values[0];
  const choices = useMemo(() => numberChoices(len, 1, 12), [len]);
  return (
    <div className="flex size-full flex-col items-center justify-center gap-4 p-4" data-testid="measure-units">
      <div className="flex flex-col items-start gap-1" dir="ltr">
        <div className="flex h-10 items-center rounded-r-full bg-[#FAB005]" style={{ width: len * 44 }} aria-label="قلم">
          <span className="ms-auto me-1" aria-hidden>✏️</span>
        </div>
        <div className="flex">{Array.from({ length: len }, (_, k) => <span key={k} className="w-11 text-center text-3xl" aria-hidden>📎</span>)}</div>
      </div>
      <Choices options={choices} answer={len} api={api} className="w-full max-w-3xl" />
    </div>
  );
}

/** Grades 2–3: read a length in centimetres off a ruler that starts at zero. */
function Ruler({ t, api }: { t: MeasureTask; api: MathApi }) {
  const len = t.values[0];
  const cm = 30; // px per cm on screen
  const choices = useMemo(() => numberChoices(len, 1, 20), [len]);
  return (
    <div className="flex size-full flex-col items-center justify-center gap-4 overflow-x-auto p-4" data-testid="measure-ruler" data-length={len}>
      <div className="flex flex-col items-start" dir="ltr">
        <div className="flex h-12 items-center justify-end rounded-r-full bg-gradient-to-r from-[#FFD43B] to-[#FAB005] pe-1 text-2xl" style={{ width: len * cm, marginLeft: 10 }} aria-label="الشيء المقيس">
          <span aria-hidden>{t.items[0]}</span>
        </div>
        <svg width={16 * cm + 20} height="56" className="rounded-lg bg-[#FFF3BF]" role="img" aria-label="مسطرة بالسنتيمتر">
          {Array.from({ length: 16 }, (_, k) => (
            <g key={k}>
              <line x1={10 + k * cm} y1="0" x2={10 + k * cm} y2="22" stroke="#25304B" strokeWidth="2" />
              {k < 15 && <line x1={10 + k * cm + cm / 2} y1="0" x2={10 + k * cm + cm / 2} y2="12" stroke="#25304B" strokeWidth="1" />}
              <text x={10 + k * cm} y="44" textAnchor="middle" fontSize="15" fontWeight="800" fontFamily="Cairo, sans-serif">{api.fmt(k)}</text>
            </g>
          ))}
        </svg>
        <span className="mt-1 text-sm text-hero-muted">سم</span>
      </div>
      <Choices options={choices} answer={len} api={api} className="w-full max-w-3xl" render={(v) => `${api.fmt(v)} سم`} />
    </div>
  );
}

/** Grades 2–3: choose the right unit, or complete a conversion. */
function TextChoice({ t, api }: { t: MeasureTask; api: MathApi }) {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-5 p-4" data-testid={`measure-${t.kind}`}>
      {t.items[0] && <span className="text-[7rem] leading-none" aria-hidden>{t.items[0]}</span>}
      {t.kind === "convert" && <span className="rounded-3xl bg-white px-6 py-3 font-display text-4xl font-extrabold shadow-soft">{t.text!.replace(/\d+/g, (d) => api.fmt(d))}</span>}
      <Choices options={t.choices!} answer={t.answer!} api={api} className="w-full max-w-4xl" render={(c) => (t.kind === "convert" ? api.fmt(c) : c)} />
    </div>
  );
}
