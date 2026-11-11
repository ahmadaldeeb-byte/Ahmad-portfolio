"use client";
import { CheckCircle2, Circle, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { useRef } from "react";
import { KIND_LABELS } from "@/lib/constants";
import { evaluateArithmetic, validateQuestion } from "@/lib/questions";
import type { Question, QuestionKind } from "@/lib/types";
import { cn, readImageAsDataURL } from "@/lib/utils";
import { toast } from "./Toast";
import { IconButton, Segmented, inputClass } from "./ui";

const ALL_KINDS: QuestionKind[] = ["mcq", "truefalse", "arithmetic", "order", "match"];

export function switchKind(q: Question, kind: QuestionKind): Question {
  if (kind === q.kind) return q;
  const next: Question = { ...q, kind };
  if (kind === "mcq") next.choices = q.choices.length >= 2 && q.kind === "mcq" ? q.choices : ["", "", "", ""];
  if (kind === "truefalse") next.choices = ["صح", "خطأ"];
  if (kind === "mcq" || kind === "truefalse") next.correctIndex = 0;
  if (kind === "match" && !q.pairs?.length) next.pairs = [{ a: "", b: "" }, { a: "", b: "" }];
  return next;
}

export function QuestionEditor({
  value,
  onChange,
  kinds = ALL_KINDS,
  showErrors,
}: {
  value: Question;
  onChange: (q: Question) => void;
  kinds?: QuestionKind[];
  showErrors?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const q = value;
  const set = (patch: Partial<Question>) => onChange({ ...q, ...patch });
  const errors = showErrors ? validateQuestion(q) : [];
  const isEnglish = q.subject === "english";

  const upload = async (file: File) => {
    try {
      set({ image: await readImageAsDataURL(file) });
    } catch (e) {
      toast(e instanceof Error ? e.message : "تعذّر رفع الصورة", "error");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {kinds.length > 1 && (
        <Segmented value={q.kind} onChange={(k) => onChange(switchKind(q, k))} options={kinds.map((k) => ({ value: k, label: KIND_LABELS[k] }))} />
      )}

      <div className="flex flex-wrap items-start gap-3">
        <label className="flex min-w-60 flex-1 flex-col gap-1.5">
          <span className="font-display font-bold">
            {q.kind === "arithmetic" ? "العملية الحسابية" : q.kind === "truefalse" ? "العبارة" : "نص السؤال"}
          </span>
          {q.kind === "arithmetic" ? (
            <input
              dir="ltr"
              className={cn(inputClass, "text-center font-display text-2xl")}
              placeholder="7 + 5"
              value={q.prompt}
              onChange={(e) => set({ prompt: e.target.value })}
            />
          ) : (
            <textarea
              rows={2}
              dir={isEnglish ? "auto" : "rtl"}
              className={cn(inputClass, "py-3")}
              placeholder={q.kind === "order" ? "مثال: رتّب الحروف لتكوّن كلمة" : "اكتب السؤال هنا..."}
              value={q.prompt}
              onChange={(e) => set({ prompt: e.target.value })}
            />
          )}
          {q.kind === "arithmetic" && (
            <span className="text-sm text-hero-muted">
              {evaluateArithmetic(q.prompt) !== null
                ? `الناتج الصحيح: ${evaluateArithmetic(q.prompt)} — تُولَّد الخيارات الخاطئة تلقائيًا.`
                : "استخدم + أو - أو × أو ÷ بين عددين."}
            </span>
          )}
        </label>
        <div className="flex flex-col items-center gap-1.5">
          <span className="font-display font-bold">صورة (اختياري)</span>
          {q.image ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={q.image} alt="صورة السؤال" className="h-24 w-32 rounded-2xl object-cover" />
              <button
                type="button"
                aria-label="إزالة الصورة"
                onClick={() => set({ image: undefined })}
                className="absolute -end-2 -top-2 grid size-8 cursor-pointer place-items-center rounded-full bg-hero-red text-white"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="grid h-24 w-32 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-hero-ink/20 text-hero-muted hover:border-hero-blue hover:text-hero-blue"
            >
              <ImagePlus className="size-8" />
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {q.kind === "mcq" && (
        <div className="flex flex-col gap-2">
          <span className="font-display font-bold">الإجابات — اضغط الدائرة لتحديد الإجابة الصحيحة</span>
          <div className="grid gap-2 md:grid-cols-2">
            {q.choices.map((c, i) => (
              <div key={i} className={cn("flex items-center gap-2 rounded-2xl border-2 p-1.5 ps-2", i === q.correctIndex ? "border-hero-green bg-hero-green/5" : "border-hero-ink/10")}>
                <button
                  type="button"
                  aria-label={`اجعل الخيار ${i + 1} هو الإجابة الصحيحة`}
                  aria-pressed={i === q.correctIndex}
                  onClick={() => set({ correctIndex: i })}
                  className="grid size-10 shrink-0 cursor-pointer place-items-center"
                >
                  {i === q.correctIndex ? <CheckCircle2 className="size-8 text-hero-green" /> : <Circle className="size-8 text-hero-ink/30" />}
                </button>
                <input
                  dir={isEnglish ? "auto" : "rtl"}
                  className="min-h-11 w-full bg-transparent text-lg outline-none"
                  placeholder={`الخيار ${i + 1}`}
                  value={c}
                  onChange={(e) => set({ choices: q.choices.map((x, j) => (j === i ? e.target.value : x)) })}
                />
                {q.choices.length > 2 && (
                  <IconButton
                    label="حذف الخيار"
                    className="size-10 bg-transparent shadow-none"
                    onClick={() => {
                      const choices = q.choices.filter((_, j) => j !== i);
                      const correctIndex = i === q.correctIndex ? 0 : i < q.correctIndex ? q.correctIndex - 1 : q.correctIndex;
                      set({ choices, correctIndex });
                    }}
                  >
                    <X className="size-5" />
                  </IconButton>
                )}
              </div>
            ))}
          </div>
          {q.choices.length < 4 && (
            <button type="button" onClick={() => set({ choices: [...q.choices, ""] })} className="inline-flex w-fit cursor-pointer items-center gap-2 font-bold text-hero-blue">
              <Plus className="size-5" /> إضافة خيار
            </button>
          )}
        </div>
      )}

      {q.kind === "truefalse" && (
        <Segmented value={q.correctIndex} onChange={(v) => set({ correctIndex: v })} options={[{ value: 0, label: "✔ العبارة صحيحة" }, { value: 1, label: "✘ العبارة خاطئة" }]} />
      )}

      {q.kind === "order" && (
        <label className="flex flex-col gap-1.5">
          <span className="font-display font-bold">الكلمة أو الجملة الصحيحة</span>
          <input dir={isEnglish ? "auto" : "rtl"} className={cn(inputClass, "font-display text-2xl")} placeholder="مثال: قَلَم" value={q.answer ?? ""} onChange={(e) => set({ answer: e.target.value })} />
          <span className="text-sm text-hero-muted">تُقسَّم الكلمة إلى حروف مع الحفاظ على التشكيل، وتُخلط للطلاب في لعبة «صانع الكلمات».</span>
        </label>
      )}

      {q.kind === "match" && (
        <div className="flex flex-col gap-2">
          <span className="font-display font-bold">أزواج المطابقة</span>
          {(q.pairs ?? []).map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <input className={inputClass} placeholder="العنصر" value={p.a} onChange={(e) => set({ pairs: q.pairs!.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)) })} />
              <span className="text-2xl text-hero-muted">↔</span>
              <input className={inputClass} placeholder="ما يطابقه" value={p.b} onChange={(e) => set({ pairs: q.pairs!.map((x, j) => (j === i ? { ...x, b: e.target.value } : x)) })} />
              <IconButton label="حذف الزوج" className="bg-transparent shadow-none" onClick={() => set({ pairs: q.pairs!.filter((_, j) => j !== i) })}>
                <Trash2 className="size-5" />
              </IconButton>
            </div>
          ))}
          <button type="button" onClick={() => set({ pairs: [...(q.pairs ?? []), { a: "", b: "" }] })} className="inline-flex w-fit cursor-pointer items-center gap-2 font-bold text-hero-blue">
            <Plus className="size-5" /> إضافة زوج
          </button>
        </div>
      )}

      {errors.length > 0 && (
        <ul className="rounded-2xl bg-hero-red/10 p-3 text-hero-red" role="alert">
          {errors.map((e) => (
            <li key={e}>• {e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
