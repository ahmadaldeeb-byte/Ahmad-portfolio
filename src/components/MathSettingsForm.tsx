"use client";
import { useState } from "react";
import type { MathSettings } from "@/lib/math/common";
import type { Grade } from "@/lib/types";
import { MATH_GAME_INFO, type MathGameType } from "@/lib/math/meta";
import { Field, Segmented, inputClass } from "./ui";

/** Teacher settings shared by the math games (levels depend on the grade). */
export function MathSettingsForm({ type, grade, value, onChange }: { type: MathGameType; grade: Grade; value: MathSettings; onChange: (v: MathSettings) => void }) {
  const info = MATH_GAME_INFO[type];
  const set = (patch: Partial<MathSettings>) => onChange({ ...value, ...patch });
  const presets = [5, 8, 10, 15];
  const [custom, setCustom] = useState(!presets.includes(value.count));
  return (
    <div className="flex flex-col gap-5">
      <Field label="المستوى" group>
        <Segmented value={value.level} onChange={(level) => set({ level })} options={info.levels[grade].map((label, i) => ({ value: (i + 1) as 1 | 2 | 3, label }))} />
      </Field>
      {type !== "raceAdd" && (
        <Field label="عدد المهام" group>
          <Segmented
            value={custom ? 0 : value.count}
            onChange={(c) => {
              setCustom(c === 0);
              if (c) set({ count: c });
            }}
            options={[...presets.map((c) => ({ value: c, label: String(c) })), { value: 0, label: "عدد مخصص" }]}
          />
          {custom && (
            <input type="number" min={1} max={30} aria-label="عدد المهام المخصص" className={`${inputClass} mt-2 w-28`} value={value.count} onChange={(e) => set({ count: Math.round(Number(e.target.value) || 1) })} />
          )}
        </Field>
      )}
      {type !== "raceAdd" && (
        <Field label="طريقة اللعب" group>
          <Segmented value={value.learning ? 1 : 0} onChange={(v) => set({ learning: v === 1 })} options={[{ value: 1, label: "تعليمي: محاولات بلا خصم" }, { value: 0, label: "اختبار: محاولة واحدة" }]} />
        </Field>
      )}
    </div>
  );
}
