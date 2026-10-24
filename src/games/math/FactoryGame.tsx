"use client";
import { motion } from "motion/react";
import { Minus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui";
import { sound } from "@/lib/audio";
import { factoryTasks, type FactoryTask } from "@/lib/math/games";
import type { GameProps } from "../types";
import { Choices, MathShell, type MathApi } from "./MathShell";
import { useMathTasks } from "./useMath";

export default function FactoryGame({ game, paused, onFinish }: GameProps) {
  const tasks = useMathTasks(game, factoryTasks);
  return (
    <MathShell
      game={game}
      paused={paused}
      onFinish={onFinish}
      tasks={tasks}
      prompt={(t, fmt) => (t.mode === "build" ? `ابنِ العدد ${fmt(t.target)} بالحزم والمكعبات` : "ما العدد المبني في المصنع؟")}
      skill={(t) => (t.mode === "build" ? "place-value-build" : "place-value-read")}
      hint={(t) => (t.mode === "build" ? `العدد ${t.target}: الرقم الأيسر يخبرك بعدد العشرات، والأيمن بعدد الآحاد.` : "عُدّ الحزم عشرات (١٠، ٢٠، ٣٠...) ثم أضف المكعبات.")}
    >
      {(t, api) => <FactoryTaskView t={t} api={api} />}
    </MathShell>
  );
}

function Rod({ onClick, label }: { onClick?: () => void; label: string }) {
  return (
    <motion.button type="button" aria-label={label} onClick={onClick} initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex cursor-pointer flex-col gap-px rounded-md border-2 border-[#1864AB] bg-[#1864AB] p-px" data-testid="factory-rod">
      {Array.from({ length: 10 }, (_, i) => <span key={i} className="size-4 rounded-[3px] bg-[#4DABF7] md:size-5" />)}
    </motion.button>
  );
}
function Cube({ onClick, label }: { onClick?: () => void; label: string }) {
  return <motion.button type="button" aria-label={label} onClick={onClick} initial={{ scale: 0 }} animate={{ scale: 1 }} className="size-6 cursor-pointer rounded-md border-2 border-[#E67700] bg-[#FFD43B] md:size-7" data-testid="factory-cube" />;
}

function FactoryTaskView({ t, api }: { t: FactoryTask; api: MathApi }) {
  const build = t.mode === "build";
  const [tens, setTens] = useState(build ? 0 : Math.floor(t.target / 10));
  const [ones, setOnes] = useState(build ? 0 : t.target % 10);
  const [spin, setSpin] = useState(0);
  const add = (kind: "t" | "o") => {
    if (api.locked) return;
    sound.play("click");
    setSpin((s) => s + 1);
    if (kind === "t") setTens((x) => Math.min(9, x + 1));
    else setOnes((x) => Math.min(19, x + 1));
  };
  const value = tens * 10 + ones;
  return (
    <div className="flex size-full flex-col items-center gap-4 p-3" data-testid="factory">
      <div className="flex flex-wrap items-center justify-center gap-4">
        {build && (
          <>
            <Machine label="آلة الحزم: أضف عشرة" spin={spin} onClick={() => add("t")} disabled={api.locked}>
              <span className="flex gap-0.5">{[0, 1, 2].map((k) => <span key={k} className="h-12 w-3 rounded bg-[#4DABF7]" />)}</span> + ١٠
            </Machine>
            <Machine label="آلة المكعبات: أضف واحدًا" spin={spin} onClick={() => add("o")} disabled={api.locked}>
              <span className="size-6 rounded bg-[#FFD43B]" /> + ١
            </Machine>
          </>
        )}
        {build && <span className="font-display text-7xl font-extrabold text-hero-blue" dir="ltr" data-testid="factory-target">{api.fmt(t.target)}</span>}
      </div>
      <div className="flex min-h-64 w-full max-w-4xl flex-wrap items-end justify-center gap-6 rounded-[2rem] bg-[#E9ECEF] p-4 shadow-inner" dir="ltr" aria-label="صينية المصنع">
        <div className="flex items-end gap-2">{Array.from({ length: tens }, (_, i) => <Rod key={i} label="حزمة عشرة (اضغط للإزالة)" onClick={build ? () => setTens((x) => x - 1) : undefined} />)}</div>
        <div className="grid grid-cols-5 gap-1.5">{Array.from({ length: ones }, (_, i) => <Cube key={i} label="مكعب واحد (اضغط للإزالة)" onClick={build ? () => setOnes((x) => x - 1) : undefined} />)}</div>
        {tens + ones === 0 && <p className="self-center text-hero-muted">الصينية فارغة. استخدم الآلات!</p>}
      </div>
      {/* Place-value table: tens on the left, ones on the right, as numbers are written. */}
      <table className="font-display text-2xl" dir="ltr">
        <thead><tr><th className="rounded-tl-xl bg-[#1864AB] px-6 py-1 text-white">عشرات</th><th className="rounded-tr-xl bg-[#E67700] px-6 py-1 text-white">آحاد</th></tr></thead>
        <tbody><tr className="bg-white text-center font-extrabold"><td className="py-2" data-testid="factory-tens">{build || api.revealed ? api.fmt(tens) : "؟"}</td><td data-testid="factory-ones">{build || api.revealed ? api.fmt(ones) : "؟"}</td></tr></tbody>
      </table>
      {build ? (
        <div className="flex items-center gap-3">
          <span className="font-display text-2xl font-bold">المبني: {api.fmt(value)}</span>
          <Button size="lg" variant="success" disabled={api.locked} onClick={() => {
            const ok = tens === Math.floor(t.target / 10) && ones === t.target % 10;
            api.submit(ok, ok ? undefined : value === t.target ? "استبدل كل ١٠ مكعبات بحزمة واحدة!" : undefined);
          }}>
            تحقق
          </Button>
          <Button variant="ghost" size="sm" icon={<Minus className="size-5" />} onClick={() => { setTens(0); setOnes(0); }}>تفريغ</Button>
        </div>
      ) : (
        <Choices options={t.choices} answer={t.target} api={api} className="w-full max-w-2xl" />
      )}
      {api.revealed && build && <p className="font-bold text-hero-red">الصحيح: {api.fmt(Math.floor(t.target / 10))} عشرات و{api.fmt(t.target % 10)} آحاد</p>}
    </div>
  );
}

function Machine({ label, onClick, disabled, spin, children }: { label: string; onClick: () => void; disabled: boolean; spin: number; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className="btn-3d flex min-h-24 cursor-pointer items-center gap-3 rounded-3xl bg-[#495057] px-5 font-display text-2xl font-extrabold text-white" data-testid="factory-machine">
      <motion.span animate={{ rotate: spin * 90 }} className="text-4xl" aria-hidden>⚙️</motion.span>
      {children}
    </button>
  );
}
