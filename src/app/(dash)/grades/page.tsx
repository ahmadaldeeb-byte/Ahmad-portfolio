"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { PageHeader } from "@/components/ui";
import { GRADES, SUBJECTS } from "@/lib/constants";
import { useData } from "@/store/data";

export default function GradesPage() {
  const { questions, games, builtins } = useData();
  return (
    <div>
      <PageHeader title="الصفوف الدراسية" subtitle="نظرة على المحتوى المتوفر لكل صف ومادة." />
      <div className="flex flex-col gap-8">
        {GRADES.map((g, gi) => (
          <motion.section
            key={g.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.08 }}
            className="overflow-hidden rounded-[2rem] bg-white shadow-soft"
          >
            <div className={`bg-gradient-to-l ${g.gradient} p-5 text-white`}>
              <h2 className="text-3xl font-extrabold">{g.label}</h2>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
              {SUBJECTS.map((s) => {
                const qs = questions.filter((q) => q.grade === g.id && q.subject === s.id);
                const lessons = [...new Set(qs.map((q) => q.lesson).filter(Boolean))];
                const gameCount = [...games, ...builtins].filter((x) => x.grade === g.id && x.subject === s.id).length;
                return (
                  <Link
                    key={s.id}
                    href={`/?grade=${g.id}&subject=${s.id}`}
                    className="flex flex-col gap-2 rounded-3xl border-2 border-hero-ink/5 p-4 transition hover:-translate-y-1 hover:shadow-soft"
                  >
                    <span className="flex items-center gap-2 font-display text-xl font-extrabold">
                      <span className="text-3xl">{s.emoji}</span> {s.label}
                    </span>
                    <span className="text-hero-muted">
                      {qs.length} سؤالًا • {gameCount} لعبة
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      {lessons.slice(0, 6).map((l) => (
                        <span key={l} className={`rounded-full px-3 py-1 text-sm font-bold ${s.id === "english" ? "ltr-content" : ""}`} style={{ background: `${s.color}18`, color: s.color }}>
                          {l}
                        </span>
                      ))}
                    </span>
                  </Link>
                );
              })}
            </div>
          </motion.section>
        ))}
      </div>
    </div>
  );
}
