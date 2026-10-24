"use client";
import { carCount, validateTrainSettings, type TrainDifficulty, type TrainMode, type TrainSettings } from "@/lib/train";
import { Field, Segmented, inputClass } from "./ui";

const RANGES = [
  { id: "0-10", min: 0, max: 10, label: "٠ إلى ١٠" },
  { id: "0-20", min: 0, max: 20, label: "٠ إلى ٢٠" },
  { id: "0-99", min: 0, max: 99, label: "٠ إلى ٩٩" },
];
const COUNTS = [5, 10, 15];

/** Teacher settings for «قطار الأرقام السحري». */
export function TrainSettingsForm({ value, onChange }: { value: TrainSettings; onChange: (v: TrainSettings) => void }) {
  const set = (patch: Partial<TrainSettings>) => onChange({ ...value, ...patch });
  const preset = RANGES.find((r) => r.min === value.min && r.max === value.max)?.id ?? "custom";
  const countPreset = COUNTS.includes(value.count) ? value.count : 0;
  const errors = validateTrainSettings(value);
  return (
    <div className="flex flex-col gap-5">
      <Field label="نوع الأسئلة" group>
        <Segmented<TrainMode>
          value={value.mode}
          onChange={(mode) => set({ mode })}
          options={[
            { value: "prev", label: "السابق فقط" },
            { value: "next", label: "التالي فقط" },
            { value: "missing", label: "العدد الناقص" },
            { value: "mix", label: "مزيج من الأنواع" },
          ]}
        />
      </Field>
      <Field label="نطاق الأعداد" group>
        <Segmented
          value={preset}
          onChange={(id) => {
            const r = RANGES.find((x) => x.id === id);
            if (r) set({ min: r.min, max: r.max });
            else set({ min: value.min, max: value.max === 10 || value.max === 20 || value.max === 99 ? value.max + 1 : value.max });
          }}
          options={[...RANGES.map((r) => ({ value: r.id, label: r.label })), { value: "custom", label: "نطاق مخصص" }]}
        />
        {preset === "custom" && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2">
              من
              <input type="number" min={0} max={999} className={`${inputClass} w-28`} value={value.min} onChange={(e) => set({ min: Math.max(0, Math.round(Number(e.target.value) || 0)) })} aria-label="بداية النطاق" />
            </label>
            <label className="flex items-center gap-2">
              إلى
              <input type="number" min={0} max={999} className={`${inputClass} w-28`} value={value.max} onChange={(e) => set({ max: Math.min(999, Math.round(Number(e.target.value) || 0)) })} aria-label="نهاية النطاق" />
            </label>
          </div>
        )}
      </Field>
      <Field label="عدد الأسئلة" group>
        <Segmented value={countPreset} onChange={(c) => set({ count: c || value.count })} options={[...COUNTS.map((c) => ({ value: c, label: String(c) })), { value: 0, label: "عدد مخصص" }]} />
        {countPreset === 0 && (
          <input type="number" min={1} max={50} className={`${inputClass} mt-2 w-28`} value={value.count} onChange={(e) => set({ count: Math.round(Number(e.target.value) || 1) })} aria-label="عدد الأسئلة المخصص" />
        )}
      </Field>
      <Field label="مستوى الصعوبة" hint={`عدد العربات: سهل ${carCount("prev", "easy")}، متوسط ${carCount("prev", "medium")}، متقدم ${carCount("prev", "advanced")}. «تحدي الأبطال» بخمس عربات وعددين ناقصين يظهر في المزيج المتوسط والمتقدم.`} group>
        <Segmented<TrainDifficulty>
          value={value.difficulty}
          onChange={(difficulty) => set({ difficulty })}
          options={[
            { value: "easy", label: "سهل" },
            { value: "medium", label: "متوسط" },
            { value: "advanced", label: "متقدم" },
          ]}
        />
      </Field>
      <Field label="طريقة اللعب" group>
        <Segmented
          value={value.learning ? 1 : 0}
          onChange={(v) => set({ learning: v === 1 })}
          options={[
            { value: 1, label: "تعليمي: محاولات بلا خصم" },
            { value: 0, label: "اختبار: محاولة واحدة" },
          ]}
        />
      </Field>
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
