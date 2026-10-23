"use client";
import { Trash2, Trophy } from "lucide-react";
import { useState } from "react";
import { RobotBuddy } from "@/components/Characters";
import { Button, Card, ConfirmDialog, EmptyState, Loading, PageHeader } from "@/components/ui";
import { gameMeta, gradeLabel, subjectLabel } from "@/lib/constants";
import { successRate } from "@/lib/scoring";
import { formatDuration, formatNum } from "@/lib/utils";
import { useData } from "@/store/data";
import { useSettings } from "@/store/settings";

export default function ResultsPage() {
  const { results, ready, clearResults } = useData();
  const numerals = useSettings((s) => s.numerals);
  const [confirm, setConfirm] = useState(false);
  const n = (v: number | string) => formatNum(v, numerals);

  if (!ready) return <Loading />;

  const totals = results.reduce((a, r) => ({ correct: a.correct + r.correct, wrong: a.wrong + r.wrong }), { correct: 0, wrong: 0 });
  const recent = results.slice(0, 12).reverse();

  return (
    <div>
      <PageHeader
        title="نتائج الألعاب"
        subtitle="ملخص الجولات التي لُعبت على هذا الجهاز. لا تُجمع أي بيانات شخصية عن الطلاب."
        actions={results.length > 0 && <Button variant="secondary" icon={<Trash2 className="size-5" />} onClick={() => setConfirm(true)}>مسح النتائج</Button>}
      />
      {results.length === 0 ? (
        <EmptyState art={<RobotBuddy size={120} mood="think" />} title="لا توجد نتائج بعد" hint="العب أي لعبة حتى نهايتها وستظهر نتيجتها هنا." />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "عدد الجولات", value: n(results.length), color: "#4361EE" },
              { label: "إجابات صحيحة", value: n(totals.correct), color: "#40C057" },
              { label: "إجابات خاطئة", value: n(totals.wrong), color: "#FA5252" },
              { label: "نسبة النجاح", value: `${n(successRate(totals.correct, totals.wrong))}٪`, color: "#7950F2" },
            ].map((s) => (
              <Card key={s.label} className="flex flex-col gap-1">
                <span className="text-hero-muted">{s.label}</span>
                <span className="font-display text-4xl font-extrabold" style={{ color: s.color }}>{s.value}</span>
              </Card>
            ))}
          </div>
          <Card>
            <h2 className="mb-4 text-xl font-extrabold">نسبة النجاح في آخر الجولات</h2>
            <div className="flex h-48 items-end gap-2" role="img" aria-label="رسم بياني لنسب النجاح">
              {recent.map((r) => {
                const rate = successRate(r.correct, r.wrong);
                return (
                  <div key={r.id} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                    <span className="text-sm font-bold">{n(rate)}٪</span>
                    <div className="w-full max-w-12 rounded-t-xl bg-gradient-to-t from-hero-blue to-hero-purple" style={{ height: `${Math.max(rate, 3)}%` }} title={r.gameTitle} />
                  </div>
                );
              })}
            </div>
          </Card>
          <div className="overflow-x-auto rounded-3xl bg-white shadow-soft">
            <table className="w-full min-w-[760px] text-start">
              <thead className="bg-hero-ink/5 font-display">
                <tr>
                  {["اللعبة", "الصف والمادة", "صحيحة", "خاطئة", "النقاط", "النجاح", "المدة", "الفائز", "التاريخ"].map((h) => (
                    <th key={h} className="px-4 py-3 text-start">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-t border-hero-ink/5">
                    <td className="px-4 py-3 font-bold">
                      {r.gameTitle}
                      <span className="block text-sm font-normal text-hero-muted">{gameMeta(r.type).name}</span>
                    </td>
                    <td className="px-4 py-3">{gradeLabel(r.grade)} • {subjectLabel(r.subject)}</td>
                    <td className="px-4 py-3 text-hero-green font-bold">{n(r.correct)}</td>
                    <td className="px-4 py-3 text-hero-red font-bold">{n(r.wrong)}</td>
                    <td className="px-4 py-3 font-bold">{n(r.score)}</td>
                    <td className="px-4 py-3">{n(successRate(r.correct, r.wrong))}٪</td>
                    <td className="px-4 py-3">{n(formatDuration(r.durationMs))}</td>
                    <td className="px-4 py-3">{r.winner ? <span className="inline-flex items-center gap-1"><Trophy className="size-4 text-hero-yellow" />{r.winner}</span> : "—"}</td>
                    <td className="px-4 py-3 text-sm text-hero-muted">{new Date(r.startedAt).toLocaleString("ar", { numberingSystem: numerals === "hindi" ? "arab" : "latn" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirm}
        title="مسح جميع النتائج؟"
        message="سيتم حذف سجل النتائج من هذا الجهاز نهائيًا. لن تتأثر الألعاب أو الأسئلة."
        confirmLabel="مسح"
        danger
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          await clearResults();
          setConfirm(false);
        }}
      />
    </div>
  );
}
