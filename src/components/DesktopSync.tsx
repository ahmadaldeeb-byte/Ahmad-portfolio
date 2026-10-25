"use client";
import { useEffect, useRef, useState } from "react";
import { desktop, type DesktopSnapshotInfo } from "@/lib/platform";
import { buildBackup, restoreTeacherBackup } from "@/store/backup";
import { useData } from "@/store/data";
import { useSettings } from "@/store/settings";
import { RobotBuddy } from "./Characters";
import { toast } from "./Toast";
import { Button, Modal } from "./ui";

const SNAPSHOT_DELAY = 1500;

/**
 * Windows app only (renders nothing on the web):
 * - writes an automatic snapshot of the teacher's data to the data folder when
 *   the app opens, a moment after every change and before the window closes,
 *   so the data does not depend on browser storage alone;
 * - when the app starts with empty storage but a snapshot exists (e.g. the
 *   storage was cleared or damaged), offers to restore it.
 */
export function DesktopSync() {
  const [offer, setOffer] = useState<{ info: DesktopSnapshotInfo; text: string } | null>(null);
  const [decided, setDecided] = useState(false);
  const ready = useData((d) => d.ready);
  const firstRun = useData((d) => d.firstRun);
  const timer = useRef<number | undefined>(undefined);

  // Startup: offer the latest snapshot when the local storage was empty.
  useEffect(() => {
    const bridge = desktop();
    if (!bridge || !ready) return;
    if (!firstRun) return setDecided(true);
    void bridge.latestSnapshot().then((snap) => {
      if (snap) setOffer(snap);
      else setDecided(true);
    });
  }, [ready, firstRun]);

  // After every change: a debounced snapshot.
  useEffect(() => {
    const bridge = desktop();
    if (!bridge || !decided) return;
    let dirty = false;
    const snapshotNow = async () => {
      window.clearTimeout(timer.current);
      dirty = false;
      try {
        const saved = await bridge.snapshot(JSON.stringify(await buildBackup(), null, 2));
        if (!saved) toast("تعذّر حفظ النسخة التلقائية في مجلد البيانات", "error");
      } catch {
        toast("تعذّر حفظ النسخة التلقائية في مجلد البيانات", "error");
      }
    };
    const save = () => {
      dirty = true;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void snapshotNow(), SNAPSHOT_DELAY);
    };
    // A snapshot of the data as it is now, and a last one when the window closes.
    void snapshotNow();
    bridge.onBeforeClose(async () => {
      if (dirty) await snapshotNow();
    });
    const unsubData = useData.subscribe((s, p) => {
      if (s.games !== p.games || s.questions !== p.questions || s.results !== p.results || s.lessons !== p.lessons || s.titleOverrides !== p.titleOverrides || s.curricula !== p.curricula) save();
    });
    const unsubSettings = useSettings.subscribe(save);
    return () => {
      unsubData();
      unsubSettings();
      bridge.onBeforeClose(null);
      window.clearTimeout(timer.current);
    };
  }, [decided]);

  if (!offer) return null;
  const when = new Date(offer.info.savedAt).toLocaleString("ar");
  return (
    <Modal open title="وجدنا بياناتك المحفوظة" onClose={() => { setOffer(null); setDecided(true); }}>
      <div className="flex flex-col items-center gap-4 text-center" data-testid="snapshot-offer">
        <RobotBuddy size={110} />
        <p className="text-lg">
          التخزين في هذا الجهاز فارغ، لكن في مجلد البيانات نسخة محفوظة تلقائيًا بتاريخ <b>{when}</b>. هل تريد استعادتها؟
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            variant="success"
            onClick={async () => {
              try {
                const r = await restoreTeacherBackup(offer.text, "merge");
                toast(`تمت الاستعادة: ${r.games} لعبة و${r.questions} سؤالًا و${r.lessons} حصة`);
              } catch {
                toast("تعذّرت استعادة النسخة التلقائية", "error");
              }
              setOffer(null);
              setDecided(true);
            }}
          >
            استعادة بياناتي
          </Button>
          <Button variant="secondary" onClick={() => { setOffer(null); setDecided(true); }}>
            البدء من جديد
          </Button>
        </div>
      </div>
    </Modal>
  );
}
