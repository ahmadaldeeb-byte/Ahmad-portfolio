"use client";
import Link from "next/link";
import { Copy, Download, Pencil, Play, Sparkles, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { RobotBuddy } from "@/components/Characters";
import { toast } from "@/components/Toast";
import { Badge, Button, ConfirmDialog, EmptyState, IconButton, Loading, PageHeader } from "@/components/ui";
import { duplicatePlan, totalMinutes } from "@/lib/lessons/engine";
import { lessonToFile, parseLessonFile } from "@/lib/lessons/transfer";
import { SEGMENT_META, type LessonPlan } from "@/lib/lessons/types";
import { downloadJSON, readFileAsText } from "@/lib/utils";
import { useData } from "@/store/data";

export function LessonsList() {
  const { lessons, ready, saveLesson, deleteLesson } = useData();
  const [toDelete, setToDelete] = useState<LessonPlan | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <PageHeader
        title="تحضير الحصص"
        subtitle="جهّز حصة تفاعلية من ١٥ دقيقة: تمهيد، ثم لعبة رئيسية، ثم تحدٍّ ختامي."
        actions={
          <>
            <Button variant="secondary" icon={<Upload className="size-5" />} onClick={() => fileRef.current?.click()}>استيراد حصة</Button>
            <Link href="/lessons/new" className="btn-3d inline-flex min-h-12 items-center gap-2 rounded-2xl bg-gradient-to-l from-hero-purple to-hero-pink px-5 font-display text-lg font-bold text-white">
              <Sparkles className="size-5" /> حضّر حصتك الآن ✨
            </Link>
          </>
        }
      />
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        data-testid="import-lesson-input"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          try {
            const plan = parseLessonFile(JSON.parse(await readFileAsText(f)));
            await saveLesson(plan);
            toast(`تم استيراد «${plan.title}»`);
          } catch (err) {
            toast(err instanceof Error && err.message.length < 80 ? err.message : "تعذّر قراءة الملف", "error");
          }
        }}
      />
      {!ready ? (
        <Loading />
      ) : lessons.length === 0 ? (
        <EmptyState
          art={<RobotBuddy size={120} />}
          title="لم تحضّر أي حصة بعد"
          hint="اختر درسًا وستجهّز المنصة حصة كاملة يمكنك تعديلها قبل تشغيلها."
          action={
            <Link href="/lessons/new" className="btn-3d mt-2 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-gradient-to-l from-hero-purple to-hero-pink px-6 font-display text-lg font-bold text-white">
              <Sparkles className="size-5" /> حضّر حصتك الآن ✨
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {lessons.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-4 rounded-3xl bg-white p-4 shadow-soft">
              <div className="min-w-56 flex-1">
                <h3 className="text-xl font-extrabold">{l.title}</h3>
                <p className="text-hero-muted">{l.unitTitle} • {totalMinutes(l)} دقيقة</p>
                <div className="mt-2 flex h-3 w-full max-w-sm overflow-hidden rounded-full" aria-hidden>
                  {l.segments.map((s) => (
                    <span key={s.kind} style={{ flex: s.minutes, background: SEGMENT_META[s.kind].color }} />
                  ))}
                </div>
                <Badge color="#868E96" className="mt-2">آخر تعديل: {new Date(l.updatedAt).toLocaleDateString("ar")}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/lesson-run?id=${l.id}`} className="btn-3d inline-flex min-h-12 items-center gap-2 rounded-2xl bg-hero-green px-5 font-display text-lg font-bold text-white">
                  <Play className="size-5 fill-current" /> ابدأ الحصة
                </Link>
                <Link href={`/lessons/edit?id=${l.id}`} aria-label="تعديل الحصة" title="تعديل الحصة" className="grid size-12 place-items-center rounded-2xl bg-hero-ink/5 hover:bg-hero-ink/10">
                  <Pencil className="size-5" />
                </Link>
                <IconButton label="نسخ الحصة" className="bg-hero-ink/5 shadow-none" onClick={async () => { await saveLesson(duplicatePlan(l)); toast("تم نسخ الحصة"); }}>
                  <Copy className="size-5" />
                </IconButton>
                <IconButton label="تصدير الحصة" className="bg-hero-ink/5 shadow-none" onClick={() => downloadJSON(`heroes-world-lesson-${l.id}.json`, lessonToFile(l))}>
                  <Download className="size-5" />
                </IconButton>
                <IconButton label="حذف الحصة" className="bg-hero-red/10 text-hero-red shadow-none" onClick={() => setToDelete(l)}>
                  <Trash2 className="size-5" />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={!!toDelete}
        title="حذف الحصة؟"
        message={`سيتم حذف «${toDelete?.title ?? ""}» نهائيًا من هذا الجهاز.`}
        confirmLabel="حذف"
        danger
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) await deleteLesson(toDelete.id);
          setToDelete(null);
        }}
      />
    </div>
  );
}
