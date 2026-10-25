"use client";
import { motion } from "motion/react";
import { Minus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui";
import { sound } from "@/lib/audio";
import { PLACE_NAMES, factoryTasks, type FactoryTask } from "@/lib/math/games";
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
      prompt={(t, fmt) => (t.mode === "build" ? `ابنِ العدد ${fmt(t.target)} ${t.places.length > 2 ? "بقطع المنازل" : "بالحزم والمكعبات"}` : "ما العدد المبني في المصنع؟")}
      skill={(t) => (t.mode === "build" ? "place-value-build" : "place-value-read")}
      hint={(t) =>
        t.places.length > 2
          ? "كل رقم في العدد يخبرك بعدد قطع منزلته: من اليسار الآلاف ثم المئات ثم العشرات ثم الآحاد."
          : t.mode === "build" ? `العدد ${t.target}: الرقم الأيسر يخبرك بعدد العشرات، والأيمن بعدد الآحاد.` : "عُدّ الحزم عشرات (١٠، ٢٠، ٣٠...) ثم أضف المكعبات."
      }
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
/** A hundred: a 10 × 10 flat. */
function Flat({ onClick, label }: { onClick?: () => void; label: string }) {
  return (
    <motion.button type="button" aria-label={label} onClick={onClick} initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="size-16 cursor-pointer rounded-md border-2 border-[#2B8A3E] md:size-20" style={{ background: "repeating-linear-gradient(0deg,#69DB7C 0 5px,#2B8A3E 5px 6px),#69DB7C", backgroundBlendMode: "multiply" }} data-testid="factory-flat">
      <span className="block size-full" style={{ background: "repeating-linear-gradient(90deg,transparent 0 5px,#2B8A3E 5px 6px)" }} />
    </motion.button>
  );
}
/** A thousand: a big cube (ten flats). */
function Block({ onClick, label }: { onClick?: () => void; label: string }) {
  return (
    <motion.button type="button" aria-label={label} onClick={onClick} initial={{ scale: 0 }} animate={{ scale: 1 }} className="relative size-20 cursor-pointer md:size-24" data-testid="factory-block">
      <svg viewBox="0 0 100 100" className="size-full" aria-hidden>
        <polygon points="10,30 70,30 70,90 10,90" fill="#B197FC" stroke="#5F3DC4" strokeWidth="3" />
        <polygon points="10,30 30,10 90,10 70,30" fill="#D0BFFF" stroke="#5F3DC4" strokeWidth="3" />
        <polygon points="70,30 90,10 90,70 70,90" fill="#9775FA" stroke="#5F3DC4" strokeWidth="3" />
        <text x="40" y="66" textAnchor="middle" fontSize="18" fontWeight="800" fill="#25304B">1000</text>
      </svg>
    </motion.button>
  );
}

const PIECE: Record<number, { name: string; color: string; Piece: typeof Rod; machine: string }> = {
  1000: { name: "ألف", color: "#5F3DC4", Piece: Block, machine: "+ ١٠٠٠" },
  100: { name: "مئة", color: "#2B8A3E", Piece: Flat, machine: "+ ١٠٠" },
  10: { name: "عشرة", color: "#1864AB", Piece: Rod, machine: "+ ١٠" },
  1: { name: "واحد", color: "#E67700", Piece: Cube, machine: "+ ١" },
};
const digitsOf = (n: number, places: number[]) => places.map((p, k) => (k === 0 ? Math.floor(n / p) : Math.floor((n % places[k - 1]) / p)));

function FactoryTaskView({ t, api }: { t: FactoryTask; api: MathApi }) {
  const build = t.mode === "build";
  const places = t.places;
  const [counts, setCounts] = useState(() => (build ? places.map(() => 0) : digitsOf(t.target, places)));
  const [spin, setSpin] = useState(0);
  const change = (k: number, d: number) => setCounts((c) => c.map((x, j) => (j === k ? Math.max(0, Math.min(j === 0 ? 9 : 19, x + d)) : x)));
  const add = (k: number) => {
    if (api.locked) return;
    sound.play("click");
    setSpin((s) => s + 1);
    change(k, 1);
  };
  const value = counts.reduce((sum, c, k) => sum + c * places[k], 0);
  const want = digitsOf(t.target, places);
  const tidy = (k: number) => (places[k] === 10 ? "tens" : places[k] === 1 ? "ones" : String(places[k]));
  return (
    <div className="flex size-full flex-col items-center gap-4 p-3" data-testid="factory">
      <div className="flex flex-wrap items-center justify-center gap-4">
        {build &&
          places.map((p, k) => (
            <Machine key={p} label={`آلة ${PIECE[p].name}: أضف ${PIECE[p].name}`} spin={spin} onClick={() => add(k)} disabled={api.locked}>
              <span className="size-6 rounded" style={{ background: PIECE[p].color }} /> {PIECE[p].machine}
            </Machine>
          ))}
        {build && <span className="font-display text-7xl font-extrabold text-hero-blue" dir="ltr" data-testid="factory-target">{api.fmt(t.target)}</span>}
      </div>
      <div className="flex min-h-64 w-full max-w-5xl flex-wrap items-end justify-center gap-6 rounded-[2rem] bg-[#E9ECEF] p-4 shadow-inner" dir="ltr" aria-label="صينية المصنع">
        {places.map((p, k) => {
          const { Piece } = PIECE[p];
          return (
            <div key={p} className={p === 1 ? "grid grid-cols-5 gap-1.5" : "flex flex-wrap items-end gap-2"}>
              {Array.from({ length: counts[k] }, (_, i) => <Piece key={i} label={`${PIECE[p].name} (اضغط للإزالة)`} onClick={build ? () => change(k, -1) : undefined} />)}
            </div>
          );
        })}
        {value === 0 && <p className="self-center text-hero-muted">الصينية فارغة. استخدم الآلات!</p>}
      </div>
      {/* Place-value table: the largest place on the left, as numbers are written. */}
      <table className="font-display text-2xl" dir="ltr">
        <thead>
          <tr>{places.map((p, k) => <th key={p} className={`px-5 py-1 text-white ${k === 0 ? "rounded-tl-xl" : ""} ${k === places.length - 1 ? "rounded-tr-xl" : ""}`} style={{ background: PIECE[p].color }}>{PLACE_NAMES[p]}</th>)}</tr>
        </thead>
        <tbody>
          <tr className="bg-white text-center font-extrabold">
            {places.map((p, k) => <td key={p} className="py-2" data-testid={`factory-${tidy(k)}`}>{build || api.revealed ? api.fmt(counts[k]) : "؟"}</td>)}
          </tr>
        </tbody>
      </table>
      {build ? (
        <div className="flex items-center gap-3">
          <span className="font-display text-2xl font-bold">المبني: {api.fmt(value)}</span>
          <Button size="lg" variant="success" disabled={api.locked} onClick={() => {
            const ok = counts.every((c, k) => c === want[k]);
            api.submit(ok, ok ? undefined : value === t.target ? "استبدل كل ١٠ قطع صغيرة بقطعة واحدة من المنزلة الأكبر!" : undefined);
          }}>
            تحقق
          </Button>
          <Button variant="ghost" size="sm" icon={<Minus className="size-5" />} onClick={() => setCounts(places.map(() => 0))}>تفريغ</Button>
        </div>
      ) : (
        <Choices options={t.choices} answer={t.target} api={api} className="w-full max-w-2xl" />
      )}
      {api.revealed && build && <p className="font-bold text-hero-red">الصحيح: {places.map((p, k) => `${api.fmt(want[k])} ${PLACE_NAMES[p]}`).join(" و")}</p>}
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
