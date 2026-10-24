"use client";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GAMES, GRADES, SUBJECTS, gradeLabel, subjectLabel } from "@/lib/constants";
import type { Grade, Subject } from "@/lib/types";
import { sound } from "@/lib/audio";
import { useData } from "@/store/data";
import { HeroKid, RobotBuddy } from "./Characters";
import { GameCard, UpcomingGameCard } from "./GameCard";
import { Button } from "./ui";

function parseGrade(v: string | null): Grade | null {
  return v === "1" || v === "2" || v === "3" ? (Number(v) as Grade) : null;
}
function parseSubject(v: string | null): Subject | null {
  return SUBJECTS.some((s) => s.id === v) ? (v as Subject) : null;
}

export function HomeView() {
  const params = useSearchParams();
  const router = useRouter();
  const grade = parseGrade(params.get("grade"));
  const subject = grade ? parseSubject(params.get("subject")) : null;
  const { builtins, games } = useData();

  const go = (g: Grade | null, s: Subject | null) => {
    sound.play("whoosh");
    const q = new URLSearchParams();
    if (g) q.set("grade", String(g));
    if (s) q.set("subject", s);
    router.push(q.size ? `/?${q}` : "/", { scroll: false });
  };

  const list = grade && subject ? [...games, ...builtins].filter((g) => g.grade === grade && g.subject === subject && !g.lessonId) : [];

  return (
    <div className="flex flex-col gap-8">
      <section
        className={`relative overflow-hidden rounded-[2.5rem] bg-gradient-to-l from-hero-blue via-[#5a4ff0] to-hero-purple text-white shadow-soft transition-all ${grade ? "p-5 md:p-6" : "p-6 md:p-10"}`}
      >
        <div className="dots-bg absolute inset-0 opacity-60" />
        <div className="anim-drift absolute -top-10 start-1/3 size-40 rounded-full bg-hero-yellow/30 blur-2xl" />
        <div className="anim-drift absolute -bottom-16 end-10 size-56 rounded-full bg-hero-pink/30 blur-2xl" style={{ animationDelay: "-3s" }} />
        <div className="relative flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div className="max-w-xl text-center md:text-start">
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 font-bold"
            >
              <Sparkles className="size-5 text-hero-yellow" /> تعلّم، العب، واكتشف!
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring" }}
              className={`font-extrabold leading-tight ${grade ? "text-3xl md:text-4xl" : "text-4xl md:text-6xl"}`}
            >
              مرحبًا بك في عالم الأبطال!
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-3 text-xl text-white/90 md:text-2xl">
              جاهز لحصة مليئة بالمرح والتعلم؟
            </motion.p>
            <div className={`mt-6 flex-wrap justify-center gap-3 md:justify-start ${grade ? "hidden" : "flex"}`}>
              <Link href="/lessons/new" className="btn-3d inline-flex min-h-14 items-center gap-2 rounded-2xl bg-hero-yellow px-6 font-display text-xl font-bold text-hero-ink">
                حضّر حصتك الآن ✨
              </Link>
              <Link href="/create" className="btn-3d inline-flex min-h-14 items-center gap-2 rounded-2xl bg-white/20 px-6 font-display text-xl font-bold">
                أنشئ لعبة جديدة
              </Link>
              <Link href="/library" className="btn-3d inline-flex min-h-14 items-center gap-2 rounded-2xl bg-white/20 px-6 font-display text-xl font-bold">
                تصفّح الألعاب
              </Link>
            </div>
          </div>
          <div className={`items-end ${grade ? "hidden md:flex" : "flex"}`}>
            <HeroKid size={grade ? 90 : 170} mood="cheer" />
            <RobotBuddy size={grade ? 80 : 150} className="-ms-6" />
          </div>
        </div>
      </section>

      <AnimatePresence mode="wait">
        {!grade && (
          <motion.section key="grades" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <h2 className="mb-4 text-3xl font-extrabold">اختر الصف</h2>
            <div className="grid gap-5 md:grid-cols-3">
              {GRADES.map((g, i) => (
                <motion.button
                  key={g.id}
                  type="button"
                  onClick={() => go(g.id, null)}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.08, type: "spring", stiffness: 220, damping: 20 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className={`relative flex min-h-48 cursor-pointer flex-col items-start justify-between overflow-hidden rounded-[2rem] bg-gradient-to-br ${g.gradient} p-6 text-start text-white shadow-soft`}
                >
                  <div className="dots-bg absolute inset-0 opacity-40" />
                  <span className="relative font-display text-8xl font-extrabold leading-none opacity-90">{["١", "٢", "٣"][i]}</span>
                  <span className="relative font-display text-3xl font-extrabold">{g.label}</span>
                  <span className="relative text-lg text-white/85">٤ مواد • ألعاب جاهزة</span>
                </motion.button>
              ))}
            </div>
          </motion.section>
        )}

        {grade && !subject && (
          <motion.section key="subjects" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Button variant="secondary" size="sm" icon={<ArrowRight className="size-5" />} onClick={() => go(null, null)}>
                الصفوف
              </Button>
              <h2 className="text-3xl font-extrabold">{gradeLabel(grade)}: اختر المادة</h2>
            </div>
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {SUBJECTS.map((s, i) => (
                <motion.button
                  key={s.id}
                  type="button"
                  onClick={() => go(grade, s.id)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 18 }}
                  whileHover={{ y: -6 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-[2rem] bg-white p-5 shadow-soft"
                  style={{ borderBottom: `8px solid ${s.color}` }}
                >
                  <span className="grid size-20 place-items-center rounded-3xl text-5xl" style={{ background: `${s.color}1a` }}>
                    {s.emoji}
                  </span>
                  <span className="font-display text-2xl font-extrabold">{s.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.section>
        )}

        {grade && subject && (
          <motion.section key="games" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Button variant="secondary" size="sm" icon={<ArrowRight className="size-5" />} onClick={() => go(grade, null)}>
                المواد
              </Button>
              <h2 className="text-3xl font-extrabold">
                ألعاب {subjectLabel(subject)} — {gradeLabel(grade)}
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((g, i) => (
                <GameCard key={g.id} game={g} index={i} />
              ))}
              {GAMES.filter((m) => !m.ready).map((m, i) => (
                <UpcomingGameCard key={m.type} type={m.type} index={list.length + i} />
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
