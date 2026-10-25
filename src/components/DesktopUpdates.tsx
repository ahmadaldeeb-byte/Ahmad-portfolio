"use client";
import { Download, RefreshCw, RotateCcw, Sparkles, WifiOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { desktop, type UpdateStatus } from "@/lib/platform";
import { Button, Card, ConfirmDialog } from "./ui";

/** Live update status of the installed Windows app (null on the web and in old builds). */
export function useUpdateStatus() {
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  useEffect(() => {
    const u = desktop()?.updates;
    if (!u) return;
    void u.status().then(setStatus);
    return u.onStatus(setStatus);
  }, []);
  return status;
}

const mb = (n?: number) => (n ? `${(n / 1024 / 1024).toFixed(1)} م.ب` : "");

function describe(s: UpdateStatus): string {
  switch (s.state) {
    case "unsupported":
      return s.reason === "portable"
        ? "النسخة المحمولة لا تُحدَّث تلقائيًا: نزّل الإصدار الجديد واستبدل ملف البرنامج؛ بياناتك في مجلد HeroesWorld-Data تبقى كما هي."
        : "التحديثات التلقائية تعمل في النسخة المثبّتة على ويندوز فقط.";
    case "idle":
      return "لم يُفحص عن تحديثات بعد.";
    case "checking":
      return "جارٍ البحث عن تحديثات...";
    case "latest":
      return "لديك أحدث إصدار.";
    case "available":
      return `يتوفر الإصدار ${s.version}.`;
    case "downloading":
      return `جارٍ تنزيل الإصدار ${s.version ?? ""}: ${s.percent ?? 0}٪ ${s.total ? `(${mb(s.transferred)} من ${mb(s.total)})` : ""}`;
    case "downloaded":
      return `الإصدار ${s.version} جاهز للتثبيت.`;
    case "installing":
      return "جارٍ إغلاق البرنامج وتثبيت التحديث، ثم يُفتح من جديد...";
    case "offline":
      return "لا يوجد اتصال بالإنترنت. البرنامج يعمل كاملًا دون إنترنت؛ افحص التحديثات لاحقًا.";
    case "unreachable":
      return "تعذّر الوصول إلى خادم التحديثات. حاول لاحقًا.";
    case "error":
      return "تعذّر إكمال التحديث. بياناتك لم تتأثر، ويمكنك المحاولة من جديد.";
  }
}

/** Settings → «التحديثات»: version, check, download with progress, restart to install (after a confirmation). */
export function UpdatesCard() {
  const status = useUpdateStatus();
  const [confirm, setConfirm] = useState(false);
  const u = desktop()?.updates;
  if (!status || !u) return null;
  const busy = ["checking", "downloading", "installing"].includes(status.state);
  return (
    <Card>
      <h2 id="updates" className="mb-2 scroll-mt-6 text-2xl font-extrabold">التحديثات</h2>
      <p className="mb-3" data-testid="update-version">
        الإصدار المثبّت: <b dir="ltr">{status.current}</b>
      </p>
      <p
        className={`mb-3 flex items-center gap-2 rounded-2xl p-3 ${status.state === "error" ? "bg-hero-red/10 text-hero-red" : status.state === "available" || status.state === "downloaded" ? "bg-hero-green/10" : "bg-hero-ink/5"}`}
        role="status"
        data-testid="update-status"
        data-state={status.state}
      >
        {status.state === "offline" && <WifiOff className="size-5 shrink-0" />}
        {describe(status)}
      </p>
      {status.state === "error" && status.message && <p className="mb-3 text-sm text-hero-muted" dir="ltr">{status.message}</p>}
      {status.state === "downloading" && (
        <div className="mb-3 h-4 w-full overflow-hidden rounded-full bg-hero-ink/10" role="progressbar" aria-valuenow={status.percent ?? 0} aria-valuemin={0} aria-valuemax={100} data-testid="update-progress">
          <div className="h-full bg-hero-green transition-all" style={{ width: `${status.percent ?? 0}%` }} />
        </div>
      )}
      {status.notes && (status.state === "available" || status.state === "downloaded") && <p className="mb-3 whitespace-pre-line text-sm">{status.notes}</p>}
      {status.state !== "unsupported" && (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={<RefreshCw className="size-5" />} disabled={busy} onClick={() => void u.check()}>
            فحص التحديثات الآن
          </Button>
          {(status.state === "available" || (status.version && ["error", "offline", "unreachable"].includes(status.state))) && (
            <Button icon={<Download className="size-5" />} onClick={() => void u.download()}>
              {status.state === "available" ? "تنزيل التحديث" : "إعادة محاولة التنزيل"}
            </Button>
          )}
          {status.state === "downloaded" && (
            <Button variant="success" icon={<RotateCcw className="size-5" />} onClick={() => setConfirm(true)}>
              إعادة التشغيل وتثبيت التحديث
            </Button>
          )}
        </div>
      )}
      <p className="mt-3 text-sm text-hero-muted">
        التحديث لا يحذف ألعابك أو حصصك أو أسئلتك أو مناهجك أو إعداداتك: تبقى في مجلد البيانات، ويحفظ البرنامج نسخة احتياطية منها قبل التثبيت.
      </p>
      <ConfirmDialog
        open={confirm}
        title="تثبيت التحديث الآن؟"
        message={`سيُغلق البرنامج ويُثبَّت الإصدار ${status.version ?? ""} ثم يُفتح من جديد خلال دقيقة تقريبًا. تُحفظ بياناتك قبل الإغلاق ولن يُحذف شيء.`}
        confirmLabel="أعد التشغيل وثبّت"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          void u.install();
        }}
      />
    </Card>
  );
}

/** A small notice in the dashboard when a new version can be downloaded or installed (never during a game or lesson). */
export function UpdateNotice() {
  const status = useUpdateStatus();
  const [hidden, setHidden] = useState<string | null>(null);
  if (!status || !["available", "downloaded"].includes(status.state) || hidden === `${status.state}-${status.version}`) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-3xl bg-hero-green/15 p-3" role="status" data-testid="update-notice">
      <Sparkles className="size-6 text-hero-green" />
      <span className="flex-1 font-bold">
        {status.state === "available" ? `يتوفر إصدار جديد من البرنامج (${status.version}).` : `التحديث ${status.version} جاهز للتثبيت.`}
      </span>
      <Link href="/settings/#updates" className="btn-3d inline-flex min-h-11 items-center rounded-2xl bg-hero-green px-4 font-bold text-white">
        عرض التحديث
      </Link>
      <Button variant="secondary" size="sm" onClick={() => setHidden(`${status.state}-${status.version}`)}>
        لاحقًا
      </Button>
    </div>
  );
}
