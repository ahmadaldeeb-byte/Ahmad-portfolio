"use client";
import { motion } from "motion/react";
import dynamic from "next/dynamic";
import { Loading } from "@/components/ui";
import { PLANE_NAMES, shapeTasks, type Plane, type ShapeTask } from "@/lib/math/games";
import type { GameProps } from "../types";
import { Choices, MathShell } from "./MathShell";
import { useMathTasks } from "./useMath";

const SolidView = dynamic(() => import("./SolidView"), { ssr: false, loading: () => <Loading label="" /> });
const COLORS = ["#4361EE", "#40C057", "#FF922B", "#FF6B9A", "#7950F2", "#20A4C9"];

function regular(n: number): [number, number][] {
  return Array.from({ length: n }, (_, k) => {
    const a = (k / n) * Math.PI * 2 - Math.PI / 2;
    return [Math.round(60 + Math.cos(a) * 50), Math.round(62 + Math.sin(a) * 50)];
  });
}

export function PlaneShape({ shape, size = 120, color = "#7950F2", dots, dashed }: { shape: Plane; size?: number; color?: string; dots?: boolean; dashed?: boolean }) {
  const stroke = dashed ? { stroke: "#25304B", strokeWidth: 4, strokeDasharray: "10 8", fill: "#ffffff" } : { fill: color, stroke: "#25304B", strokeWidth: 4 };
  const pts: Record<Exclude<Plane, "circle">, [number, number][]> = {
    square: [[20, 20], [100, 20], [100, 100], [20, 100]],
    rectangle: [[6, 34], [114, 34], [114, 86], [6, 86]],
    triangle: [[60, 12], [110, 104], [10, 104]],
    pentagon: regular(5),
    hexagon: regular(6),
  };
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={PLANE_NAMES[shape]}>
      {shape === "circle" ? <circle cx="60" cy="60" r="48" {...stroke} /> : <polygon points={pts[shape].map((p) => p.join(",")).join(" ")} {...stroke} />}
      {dots && shape !== "circle" && pts[shape].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="7" fill="#FFD43B" stroke="#25304B" strokeWidth="2" />)}
    </svg>
  );
}

export default function ShapesGame({ game, paused, onFinish }: GameProps) {
  const tasks = useMathTasks(game, shapeTasks);
  return (
    <MathShell
      game={game}
      paused={paused}
      onFinish={onFinish}
      tasks={tasks}
      prompt={(t) => promptFor(t)}
      skill={(t) => t.kind}
      hint={(t) => hintFor(t)}
      stage={({ solved }) => <ShapeCity solved={solved} />}
    >
      {(t, api) => (
        <div className="flex size-full flex-col items-center justify-center gap-4 p-4" data-testid={`shape-${t.kind}`}>
          <Visual t={t} />
          <Choices options={t.choices} answer={t.answer} api={api} className="w-full max-w-4xl" render={(c) => (t.kind === "sides" || t.kind === "solid-props" ? api.fmt(c) : t.kind === "perimeter" ? `${api.fmt(c)} سم` : c)} />
        </div>
      )}
    </MathShell>
  );
}

function promptFor(t: ShapeTask) {
  switch (t.kind) {
    case "solid-name": return "ما اسم هذا المجسم؟";
    case "object-solid": return `${t.object.name} يشبه أيّ مجسم؟`;
    case "plane-name": return "ما اسم هذا الشكل؟";
    case "sides": return t.corners ? `كم رأسًا لل${PLANE_NAMES[t.plane]}؟` : `كم ضلعًا لل${PLANE_NAMES[t.plane]}؟`;
    case "pattern": return "ما الشكل التالي في النمط؟";
    case "build": return "أيّ شكل يكمل المبنى؟";
    case "solid-props": return t.text;
    case "perimeter": return t.w === t.h ? "ما محيط المربع؟" : "ما محيط المستطيل؟";
  }
}
function hintFor(t: ShapeTask) {
  switch (t.kind) {
    case "solid-name":
    case "object-solid": return "الكرة مستديرة من كل الجهات، والمكعب له وجوه مربعة، والأسطوانة لها قاعدتان دائريتان، والمخروط له رأس مدبب.";
    case "plane-name": return "المثلث له ٣ أضلاع، والمربع أضلاعه الأربعة متساوية، والمستطيل له ضلعان طويلان وضلعان قصيران.";
    case "sides": return "عُدّ النقاط الصفراء (الرؤوس) أو الخطوط (الأضلاع) واحدًا واحدًا.";
    case "pattern": return "ابحث عن الجزء الذي يتكرر في النمط.";
    case "build": return "انظر إلى شكل الجزء الناقص المرسوم بالخط المتقطع.";
    case "solid-props": return "الوجه سطح مستوٍ، والحرف خط يلتقي فيه وجهان، والرأس نقطة تلتقي فيها الأحرف. أدِر المجسم وعُدّ.";
    case "perimeter": return "المحيط هو مجموع أطوال الأضلاع كلها: اجمع الأضلاع الأربعة.";
  }
}

function Visual({ t }: { t: ShapeTask }) {
  switch (t.kind) {
    case "solid-name":
    case "solid-props":
      return <div className="h-56 w-56 md:h-64 md:w-64" data-testid="solid-3d"><SolidView solid={t.solid} /></div>;
    case "perimeter":
      return <Perimeter w={t.w} h={t.h} />;
    case "object-solid":
      return <motion.span className="text-[8rem] leading-none" animate={{ rotate: [0, -6, 6, 0] }} transition={{ duration: 3, repeat: Infinity }} aria-label={t.object.name}>{t.object.emoji}</motion.span>;
    case "plane-name":
      return <PlaneShape shape={t.plane} size={200} />;
    case "sides":
      return <PlaneShape shape={t.plane} size={200} dots={t.corners} color="#20A4C9" />;
    case "pattern":
      return (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {t.seq.map((s, i) => <PlaneShape key={i} shape={s} size={70} color={COLORS[["square", "rectangle", "triangle", "circle"].indexOf(s)]} />)}
          <span className="grid size-[70px] place-items-center rounded-xl border-4 border-dashed border-hero-orange font-display text-4xl font-extrabold text-hero-orange">؟</span>
        </div>
      );
    case "build":
      return <Building part={t.part} />;
  }
}

/** Rectangle drawn to scale with its side lengths in cm. */
function Perimeter({ w, h }: { w: number; h: number }) {
  const unit = 160 / Math.max(w, h);
  const W = w * unit;
  const H = h * unit;
  const x = (220 - W) / 2;
  const y = (200 - H) / 2;
  const label = (v: number) => `${v} سم`;
  return (
    <svg viewBox="0 0 220 200" className="h-60" role="img" aria-label={`مستطيل طوله ${w} سم وعرضه ${h} سم`}>
      <rect x={x} y={y} width={W} height={H} fill="#C5F6FA" stroke="#0B7285" strokeWidth="4" />
      <text x={110} y={y - 6} textAnchor="middle" fontSize="15" fontWeight="800" fontFamily="Cairo, sans-serif">{label(w)}</text>
      <text x={110} y={y + H + 18} textAnchor="middle" fontSize="15" fontWeight="800" fontFamily="Cairo, sans-serif">{label(w)}</text>
      <text x={x - 6} y={100} textAnchor="end" fontSize="15" fontWeight="800" fontFamily="Cairo, sans-serif">{label(h)}</text>
      <text x={x + W + 6} y={100} textAnchor="start" fontSize="15" fontWeight="800" fontFamily="Cairo, sans-serif">{label(h)}</text>
    </svg>
  );
}

/** A building with one part missing (dashed outline). */
function Building({ part }: { part: Plane }) {
  const dashed = { fill: "#fff", stroke: "#25304B", strokeWidth: 4, strokeDasharray: "10 8" };
  return (
    <svg viewBox="0 0 200 220" className="h-60" role="img" aria-label="مبنى ينقصه شكل">
      {part === "triangle" ? <polygon points="30,80 100,20 170,80" {...dashed} /> : <polygon points="30,80 100,20 170,80" fill="#FA5252" stroke="#25304B" strokeWidth="4" />}
      <rect x="40" y="80" width="120" height="130" fill="#FFD43B" stroke="#25304B" strokeWidth="4" />
      {part === "circle" ? <circle cx="100" cy="115" r="20" {...dashed} /> : <circle cx="100" cy="115" r="20" fill="#74C0FC" stroke="#25304B" strokeWidth="3" />}
      {part === "square" ? <rect x="52" y="140" width="34" height="34" {...dashed} /> : <rect x="52" y="140" width="34" height="34" fill="#74C0FC" stroke="#25304B" strokeWidth="3" />}
      {part === "rectangle" ? <rect x="112" y="150" width="34" height="60" {...dashed} /> : <rect x="112" y="150" width="34" height="60" fill="#8B5E3C" stroke="#25304B" strokeWidth="3" />}
    </svg>
  );
}

/** Each right answer adds a building to the city. */
export function ShapeCity({ solved, empty = "أجب لتبني مدينة الأشكال!" }: { solved: number; empty?: string }) {
  return (
    <div className="mx-2 mt-2 flex h-24 items-end justify-center gap-2 overflow-hidden rounded-3xl bg-gradient-to-b from-[#D0EBFF] to-[#E7F5FF] px-4 md:h-28" data-testid="shape-city" data-built={solved}>
      {Array.from({ length: Math.min(solved, 12) }, (_, i) => (
        <motion.svg key={i} viewBox="0 0 40 70" className="h-full w-10" initial={{ y: 80 }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 160, damping: 12 }} aria-hidden>
          <rect x="6" y={26 - (i % 3) * 6} width="28" height={44 + (i % 3) * 6} fill={COLORS[i % COLORS.length]} stroke="#25304B" strokeWidth="2" />
          {i % 2 ? <polygon points={`2,${27 - (i % 3) * 6} 20,${8 - (i % 3) * 6} 38,${27 - (i % 3) * 6}`} fill="#FA5252" stroke="#25304B" strokeWidth="2" /> : <circle cx="20" cy={20 - (i % 3) * 6} r="7" fill="#FFD43B" stroke="#25304B" strokeWidth="2" />}
          <rect x="15" y="54" width="10" height="16" fill="#fff" />
        </motion.svg>
      ))}
      {solved === 0 && <span className="self-center text-hero-muted">{empty}</span>}
    </div>
  );
}
