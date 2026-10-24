"use client";
import { AlertTriangle, Download, Upload, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "@/components/Toast";
import { Button, Card, PageHeader, Segmented } from "@/components/ui";
import { hasArabicVoice, sound } from "@/lib/audio";
import type { RestoreMode } from "@/lib/backup";
import { PLATFORM_LABELS, currentPlatform, desktop, type DesktopBridge } from "@/lib/platform";
import { APP_VERSION } from "@/lib/version";
import { formatNum, readFileAsText } from "@/lib/utils";
import { exportTeacherBackup, restoreTeacherBackup } from "@/store/backup";
import { useSettings } from "@/store/settings";

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => {
        sound.play("click");
        onChange(!checked);
      }}
      className={`relative h-11 w-20 shrink-0 cursor-pointer rounded-full transition ${checked ? "bg-hero-green" : "bg-hero-ink/20"}`}
    >
      <span className={`absolute top-1 size-9 rounded-full bg-white shadow transition-all ${checked ? "start-10" : "start-1"}`} />
    </button>
  );
}

function Row({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hero-ink/5 py-4 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-bold">{title}</p>
        {hint && <p className="text-hero-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const s = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<RestoreMode>("merge");
  const [platform, setPlatform] = useState<ReturnType<typeof currentPlatform>>("web");
  const [bridge, setBridge] = useState<DesktopBridge | null>(null);
  useEffect(() => {
    setPlatform(currentPlatform());
    setBridge(desktop());
  }, []);
  const [voiceAvailable, setVoiceAvailable] = useState(false);

  useEffect(() => {
    const check = () => setVoiceAvailable(hasArabicVoice());
    check();
    if (typeof speechSynthesis !== "undefined") speechSynthesis.addEventListener("voiceschanged", check);
    return () => {
      if (typeof speechSynthesis !== "undefined") speechSynthesis.removeEventListener("voiceschanged", check);
    };
  }, []);

  const doExport = async () => {
    try {
      if (await exportTeacherBackup()) toast("تم تصدير النسخة الاحتياطية");
    } catch {
      toast("تعذّر تصدير النسخة الاحتياطية", "error");
    }
  };

  const doImport = async (file: File) => {
    try {
      const r = await restoreTeacherBackup(await readFileAsText(file), mode);
      toast(`تمت الاستعادة: ${r.games} لعبة و${r.questions} سؤالًا و${r.lessons} حصة${r.warnings.length ? ` — ${r.warnings.join(" ")}` : ""}`);
    } catch (e) {
      toast(e instanceof Error && /[\u0600-\u06FF]/.test(e.message) ? e.message : "الملف غير صالح أو تالف", "error");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="الإعدادات" subtitle="تحكّم في الصوت والحركة والبيانات المحلية." />

      <Card>
        <h2 className="mb-2 text-2xl font-extrabold">الصوت</h2>
        <Row title="كتم الصوت" hint="إيقاف جميع المؤثرات الصوتية.">
          <Toggle label="كتم الصوت" checked={s.muted} onChange={(v) => s.set({ muted: v })} />
        </Row>
        <Row title="مستوى الصوت العام" hint={`${formatNum(Math.round(s.volume * 100), s.numerals)}٪`}>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={s.volume}
              aria-label="مستوى الصوت"
              onChange={(e) => s.set({ volume: Number(e.target.value) })}
              className="h-3 w-56 cursor-pointer accent-hero-blue"
            />
            <Button variant="secondary" size="sm" icon={<Volume2 className="size-5" />} silent onClick={() => sound.play("correct")}>
              تجربة
            </Button>
          </div>
        </Row>
        <Row title="مستوى المؤثرات الصوتية" hint="أصوات الأزرار والنجاح والفرقعة والقطار.">
          <input type="range" min={0} max={1} step={0.05} value={s.sfxVolume} aria-label="مستوى المؤثرات الصوتية" onChange={(e) => s.set({ sfxVolume: Number(e.target.value) })} className="h-3 w-56 cursor-pointer accent-hero-blue" />
        </Row>
        <Row title="مستوى التعليق الصوتي" hint="عبارات مثل «أحسنت!» و«هيا نبدأ!» عند تفعيلها.">
          <input type="range" min={0} max={1} step={0.05} value={s.voiceVolume} aria-label="مستوى التعليق الصوتي" onChange={(e) => s.set({ voiceVolume: Number(e.target.value) })} className="h-3 w-56 cursor-pointer accent-hero-blue" />
        </Row>
        <p className="py-2 text-sm text-hero-muted">الموسيقى الخلفية غير متوفرة في هذا الإصدار.</p>
        <Row
          title="العبارات التشجيعية المنطوقة"
          hint={
            voiceAvailable
              ? "تُنطق عبارات مثل «أحسنت!» بصوت عربي من الجهاز. تظهر العبارات مكتوبة دائمًا."
              : "لا يتوفر صوت عربي على هذا الجهاز؛ ستظهر العبارات التشجيعية مكتوبة فقط."
          }
        >
          <Toggle label="العبارات المنطوقة" checked={s.voice && voiceAvailable} onChange={(v) => { s.set({ voice: v }); if (v) setTimeout(() => sound.say("أحسنت!"), 50); }} />
        </Row>
      </Card>

      <Card>
        <h2 className="mb-2 text-2xl font-extrabold">العرض والحركة</h2>
        <Row title="تقليل الحركة" hint="يخفف الحركات والمؤثرات للطلاب الذين يتشتت انتباههم أو للأجهزة الضعيفة.">
          <Toggle label="تقليل الحركة" checked={s.reducedMotion} onChange={(v) => s.set({ reducedMotion: v })} />
        </Row>
        <Row title="شكل الأرقام" hint="في النقاط والمؤقتات والنتائج.">
          <Segmented value={s.numerals} onChange={(v) => s.set({ numerals: v })} options={[{ value: "arabic", label: "1 2 3" }, { value: "hindi", label: "١ ٢ ٣" }]} />
        </Row>
        <Row title="جودة الرسوم الثلاثية الأبعاد" hint="«تلقائي» يخفض الجودة عند بطء الجهاز.">
          <Segmented
            value={s.quality}
            onChange={(v) => s.set({ quality: v })}
            options={[{ value: "auto", label: "تلقائي" }, { value: "high", label: "عالية" }, { value: "low", label: "منخفضة" }]}
          />
        </Row>
      </Card>

      <Card>
        <h2 className="mb-2 text-2xl font-extrabold">البيانات والنسخ الاحتياطي</h2>
        <div className="mb-4 flex gap-3 rounded-2xl bg-hero-yellow/25 p-4">
          <AlertTriangle className="size-6 shrink-0 text-[#E67700]" />
          {platform === "web" ? (
            <p>
              تُحفظ الألعاب والأسئلة والنتائج <b>على هذا المتصفح فقط</b>. حذف بيانات المتصفح أو استخدام التصفح الخفي قد يؤدي إلى فقدانها.
              صدّر نسخة احتياطية بانتظام واحتفظ بها في مكان آمن.
            </p>
          ) : (
            <p>
              تُحفظ بياناتك في المجلد أدناه، ويحفظ التطبيق نسخة احتياطية تلقائية بعد كل تغيير.
              {platform === "portable" && " انسخ هذا المجلد مع البرنامج عند نقل الذاكرة (USB)."} صدّر نسخة احتياطية أيضًا واحتفظ بها في مكان آخر.
            </p>
          )}
        </div>
        <p className="mb-3 text-sm text-hero-muted" data-testid="platform-info">
          {PLATFORM_LABELS[platform]} • الإصدار {APP_VERSION}
          {bridge && (
            <>
              {" • "}مجلد البيانات: <span dir="ltr" className="font-mono">{bridge.dataDir}</span>
              {!bridge.writable && <b className="text-hero-red"> — لا يمكن الكتابة في هذا المجلد! انقل البرنامج إلى مكان قابل للكتابة.</b>}
            </>
          )}
        </p>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="font-bold">عند الاستعادة:</span>
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: "merge", label: "دمج مع بياناتي (لا يحذف شيئًا)" },
              { value: "replace", label: "استبدال بياناتي (تُحفظ نسخة أمان أولًا)" },
            ]}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button icon={<Download className="size-5" />} onClick={doExport}>
            تصدير نسخة احتياطية
          </Button>
          <Button variant="secondary" icon={<Upload className="size-5" />} onClick={() => fileRef.current?.click()}>
            استعادة من نسخة احتياطية
          </Button>
          {bridge && (
            <Button variant="ghost" onClick={() => void bridge.openDataDir()}>
              فتح مجلد البيانات
            </Button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            data-testid="restore-input"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void doImport(f);
              e.target.value = "";
            }}
          />
        </div>
      </Card>
    </div>
  );
}
