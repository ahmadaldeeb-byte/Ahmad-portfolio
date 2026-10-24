"use client";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { GameCard, UpcomingGameCard } from "@/components/GameCard";
import { EmptyState, Loading, PageHeader, Segmented, inputClass } from "@/components/ui";
import { GAMES, GRADES, SUBJECTS } from "@/lib/constants";
import type { GameType, Grade, Subject } from "@/lib/types";
import { useData } from "@/store/data";

export default function LibraryPage() {
  const { builtins, games, ready } = useData();
  const [grade, setGrade] = useState<Grade | 0>(0);
  const [subject, setSubject] = useState<Subject | "all">("all");
  const [type, setType] = useState<GameType | "all">("all");
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const q = query.trim();
    return [...games, ...builtins].filter(
      (g) =>
        (grade === 0 || g.grade === grade) &&
        (subject === "all" || g.subject === subject) &&
        (type === "all" || g.type === type) &&
        (!q || g.title.includes(q) || g.lesson.includes(q)),
    );
  }, [games, builtins, grade, subject, type, query]);

  return (
    <div>
      <PageHeader title="مكتبة الألعاب" subtitle={`${GAMES.filter((g) => g.ready).length} لعبة تعليمية جاهزة لكل الصفوف والمواد. ألعاب الرياضيات تولّد مهامها، وفي المواد الأخرى تلعب أسئلة بنك الأسئلة.`} />
      <div className="mb-6 flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-soft">
        <div className="relative">
          <Search className="absolute start-4 top-1/2 size-5 -translate-y-1/2 text-hero-muted" />
          <input className={`${inputClass} ps-12`} placeholder="ابحث باسم اللعبة أو الدرس..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-3">
          <Segmented value={grade} onChange={setGrade} options={[{ value: 0 as const, label: "كل الصفوف" }, ...GRADES.map((g) => ({ value: g.id, label: g.short }))]} />
          <Segmented value={subject} onChange={setSubject} options={[{ value: "all" as const, label: "كل المواد" }, ...SUBJECTS.map((s) => ({ value: s.id, label: s.label }))]} />
        </div>
        <Segmented
          value={type}
          onChange={setType}
          options={[{ value: "all" as const, label: "كل الأنواع" }, ...GAMES.filter((g) => g.ready).map((g) => ({ value: g.type, label: g.name }))]}
        />
      </div>
      {!ready ? (
        <Loading />
      ) : list.length === 0 ? (
        <EmptyState title="لا توجد ألعاب مطابقة" hint="جرّب تغيير خيارات التصفية أو كلمة البحث." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {list.slice(0, 60).map((g, i) => (
            <GameCard key={g.id} game={g} index={i} />
          ))}
        </div>
      )}
      {type === "all" && GAMES.some((g) => !g.ready) && (
        <>
          <h2 className="mb-4 mt-12 text-2xl font-extrabold">ألعاب قادمة</h2>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {GAMES.filter((g) => !g.ready).map((g, i) => (
              <UpcomingGameCard key={g.type} type={g.type} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
