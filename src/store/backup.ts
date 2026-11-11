"use client";
import { backupFileName, collectBackupData, makeBackup, parseBackup, restoreBackup, type Backup, type RestoreMode } from "@/lib/backup";
import { currentPlatform, desktop } from "@/lib/platform";
import { downloadJSON } from "@/lib/utils";
import { useData } from "./data";
import { useSettings, type SettingsState } from "./settings";

function currentSettings() {
  const { volume, sfxVolume, voiceVolume, muted, voice, reducedMotion, numerals, quality } = useSettings.getState() as SettingsState;
  return { volume, sfxVolume, voiceVolume, muted, voice, reducedMotion, numerals, quality };
}

/** A full backup of the teacher's data on this device, in the shared format. */
export async function buildBackup(): Promise<Backup> {
  return makeBackup(await collectBackupData({ settings: currentSettings() }), currentPlatform());
}

/** Saves a backup file: the Windows "Save as" dialog on desktop, a download on the web. */
export async function exportTeacherBackup(): Promise<boolean> {
  return downloadJSON(backupFileName(), await buildBackup());
}

/**
 * Restores a backup file's text. In "replace" mode a safety copy of the
 * current data is kept first (an automatic snapshot on desktop, a downloaded
 * file on the web), so nothing is lost by mistake.
 */
export async function restoreTeacherBackup(text: string, mode: RestoreMode) {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("الملف ليس بصيغة JSON صالحة.");
  }
  const parsed = parseBackup(raw);
  if (mode === "replace") {
    const safety = JSON.stringify(await buildBackup(), null, 2);
    const bridge = desktop();
    if (bridge) await bridge.snapshot(safety);
    else await downloadJSON(`heroes-world-before-restore-${new Date().toISOString().slice(0, 10)}.json`, JSON.parse(safety));
  }
  const r = await restoreBackup(parsed, mode);
  if (r.settings) useSettings.getState().set(r.settings);
  await useData.getState().refresh();
  return { ...r, warnings: parsed.warnings };
}
