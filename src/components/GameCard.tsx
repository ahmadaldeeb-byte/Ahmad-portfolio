"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { Play, Settings2, Box, Square, Hourglass } from "lucide-react";
import type { ReactNode } from "react";
import { DIFFICULTY_LABELS, gameMeta, gameMetaFor, gradeLabel, subjectLabel } from "@/lib/constants";
import type { GameConfig, GameType } from "@/lib/types";
import { sound } from "@/lib/audio";
import { GameArt } from "./GameArt";
import { Badge } from "./ui";

/** Number of questions a game will ask (generated games use their settings). */
export function questionCount(game: GameConfig) {
  if (game.type === "train") return game.settings.train?.count ?? 0;
  if (game.settings.math) return game.settings.math.count;
  return game.questions.length;
}

export function playHref(id: string) {
  return `/play?id=${encodeURIComponent(id)}`;
}

export function customizeHref(game: GameConfig) {
  return game.builtin ? `/create?from=${encodeURIComponent(game.id)}` : `/create?edit=${encodeURIComponent(game.id)}`;
}

function Shell({ type, children, index = 0 }: { type: GameType; children: ReactNode; index?: number }) {
  const meta = gameMeta(type);
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4), type: "spring", stiffness: 260, damping: 24 }}
      whileHover={{ y: -6, rotate: index % 2 ? 0.6 : -0.6 }}
      className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-soft"
      style={{ boxShadow: `0 14px 30px -16px ${meta.accent}aa` }}
    >
      <div className="relative overflow-hidden">
        <GameArt type={type} className="aspect-[16/10] w-full transition duration-500 group-hover:scale-105" />
        <span className="absolute start-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-sm font-bold">
          {meta.dimension === "3D" ? <Box className="size-4" /> : <Square className="size-4" />}
          {meta.dimension === "3D" ? "ثلاثي الأبعاد" : "ثنائي الأبعاد"}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">{children}</div>
    </motion.article>
  );
}

export function GameCard({ game, index }: { game: GameConfig; index?: number }) {
  const meta = gameMetaFor(game.type, game.subject);
  return (
    <Shell type={game.type} index={index}>
      <div className="flex flex-wrap gap-2">
        <Badge color={meta.accent === "#FFD43B" ? "#E67700" : meta.accent}>{meta.genre}</Badge>
        <Badge color="#40C057">{DIFFICULTY_LABELS[game.difficulty]}</Badge>
        {!game.builtin && <Badge color="#7950F2">من إنشائي</Badge>}
      </div>
      <h3 className="text-xl font-extrabold leading-snug">{game.title}</h3>
      <p className="text-hero-muted">{meta.description}</p>
      <p className="text-sm text-hero-muted">
        {gradeLabel(game.grade)} • {subjectLabel(game.subject)} • {questionCount(game)} سؤالًا
      </p>
      <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
        <Link
          href={playHref(game.id)}
          onClick={() => sound.play("click")}
          className="btn-3d inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-hero-green font-display text-lg font-bold text-white"
        >
          <Play className="size-5 fill-current" /> العب الآن
        </Link>
        <Link
          href={customizeHref(game)}
          onClick={() => sound.play("click")}
          className="btn-3d inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-hero-ink/5 font-display text-lg font-bold"
        >
          <Settings2 className="size-5" /> تخصيص اللعبة
        </Link>
      </div>
    </Shell>
  );
}

/** Card for a game type that is not playable yet in this release. */
export function UpcomingGameCard({ type, index }: { type: GameType; index?: number }) {
  const meta = gameMeta(type);
  return (
    <Shell type={type} index={index}>
      <div className="flex flex-wrap gap-2">
        <Badge color="#868E96">
          <Hourglass className="size-4" /> قيد التطوير
        </Badge>
        <Badge color={meta.accent}>{meta.genre}</Badge>
      </div>
      <h3 className="text-xl font-extrabold">{meta.name}</h3>
      <p className="text-hero-muted">{meta.description}</p>
      <p className="mt-auto rounded-2xl bg-hero-ink/5 p-3 text-sm text-hero-muted">
        ستتوفر هذه اللعبة في المرحلة القادمة. يمكنك من الآن إضافة أسئلتها إلى بنك الأسئلة.
      </p>
    </Shell>
  );
}
