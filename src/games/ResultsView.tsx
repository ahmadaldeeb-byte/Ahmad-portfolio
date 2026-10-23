"use client";
import { motion } from "motion/react";
import { Home, RotateCcw, Star, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { HeroKid, RobotBuddy } from "@/components/Characters";
import { Confetti } from "@/components/Confetti";
import { Button } from "@/components/ui";
import { starsFor, successRate, winners } from "@/lib/scoring";
import type { GameConfig } from "@/lib/types";
import { formatDuration, formatNum } from "@/lib/utils";
import { useSettings } from "@/store/settings";
import { AnimatedNumber } from "./shared/AnimatedNumber";
import type { GameSummary } from "./types";

export function ResultsView({
  summary,
  durationMs,
  game,
  preview,
  onReplay,
  onExit,
}: {
  summary: GameSummary;
  durationMs: number;
  game: GameConfig;
  preview: boolean;
  onReplay: () => void;
  onExit: () => void;
}) {
  const numerals = useSettings((s) => s.numerals);
  const n = (v: number | string) => formatNum(v, numerals);
  const rate = successRate(summary.correct, summary.wrong);
  const stars = starsFor(rate);
  const [fire, setFire] = useState(0);
  const teams = summary.teams && summary.teams.length > 1 ? summary.teams : null;
  const top = teams ? winners(teams) : [];
  const maxScore = teams ? Math.max(1, ...teams.map((t) => t.score)) : 1;

  useEffect(() => setFire(Date.now()), []);

  const played = summary.correct + summary.wrong > 0;
  const headline = !played
    ? "انتهت الجولة!"
    : teams
    ? top.length > 1
      ? "تعادل رائع بين الأبطال!"
      : `فاز ${top[0]?.name}!`
    : rate >= 60
      ? "أنتم أبطال حقيقيون!"
      : "أحسنتم المحاولة!";

  return (
    <div className="flex size-full flex-col items-center gap-5 overflow-y-auto p-5 md:p-8" data-testid="results">
      <Confetti fire={fire} />
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }} className="flex items-end">
        <HeroKid size={130} mood="cheer" />
        <RobotBuddy size={110} mood="cheer" className="-ms-4" />
      </motion.div>
      <h2 className="text-center font-display text-4xl font-extrabold md:text-6xl">
        {teams && <Trophy className="mb-2 inline size-12 text-hero-yellow" />} {headline}
      </h2>
      {!teams && played && (
        <div className="flex gap-2" aria-label={`${stars} من ٣ نجوم`}>
          {[0, 1, 2].map((i) => (
            <motion.span key={i} initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.3 + i * 0.2, type: "spring", stiffness: 260, damping: 12 }}>
              <Star className={`size-16 ${i < stars ? "fill-hero-yellow text-hero-yellow" : "text-hero-ink/15"}`} />
            </motion.span>
          ))}
        </div>
      )}

      {teams && (
        <div className="flex w-full max-w-3xl flex-col gap-3 rounded-3xl bg-white p-5 shadow-soft">
          {[...teams].sort((a, b) => b.score - a.score).map((t, i) => (
            <div key={t.name} className="flex items-center gap-3">
              <span className="w-36 shrink-0 truncate font-display text-xl font-bold">{t.name}</span>
              <div className="h-12 flex-1 overflow-hidden rounded-2xl bg-hero-ink/5">
                <motion.div
                  className="flex h-full items-center justify-end rounded-2xl px-3 font-display text-xl font-extrabold text-white"
                  style={{ background: t.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(8, (t.score / maxScore) * 100)}%` }}
                  transition={{ delay: 0.2 + i * 0.15, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                >
                  {n(t.score)}
                </motion.div>
              </div>
              <span className="w-24 shrink-0 text-sm text-hero-muted">✔ {n(t.correct)} • ✘ {n(t.wrong)}</span>
            </div>
          ))}
        </div>
      )}

      {played && <div className="grid w-full max-w-3xl grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="النقاط" color="#7950F2"><AnimatedNumber value={summary.score} /></Stat>
        <Stat label="صحيحة" color="#40C057">{n(summary.correct)}</Stat>
        <Stat label="خاطئة" color="#FA5252">{n(summary.wrong)}</Stat>
        <Stat label="نسبة النجاح" color="#4361EE">{n(rate)}٪</Stat>
        <Stat label="الوقت" color="#E67700">{n(formatDuration(durationMs))}</Stat>
      </div>}
      {preview && <p className="text-hero-muted">هذه معاينة؛ لم تُسجَّل النتيجة.</p>}
      <div className="flex flex-wrap justify-center gap-4 pb-4">
        <Button size="lg" variant="success" icon={<RotateCcw className="size-6" />} onClick={onReplay}>العب مرة أخرى</Button>
        <Button size="lg" variant="secondary" icon={<Home className="size-6" />} onClick={onExit}>{preview ? "العودة للتعديل" : "لوحة التحكم"}</Button>
      </div>
      <span className="sr-only">{game.title}</span>
    </div>
  );
}

function Stat({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl bg-white p-4 shadow-soft">
      <span className="font-display text-4xl font-extrabold tabular-nums" style={{ color }}>{children}</span>
      <span className="text-hero-muted">{label}</span>
    </div>
  );
}
