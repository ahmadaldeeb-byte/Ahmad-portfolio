/**
 * Where the app is running. The Windows app (Electron) exposes a small,
 * typed bridge on `window.heroesDesktop` from its preload script; the web
 * build has none. Everything else in the app is the same code.
 */
export type Platform = "web" | "desktop" | "portable";

export interface DesktopSnapshotInfo {
  file: string;
  savedAt: number;
}

export interface DesktopBridge {
  platform: "desktop" | "portable";
  appVersion: string;
  /** Folder that holds the teacher's data and automatic snapshots. */
  dataDir: string;
  /** False when the data folder cannot be written (e.g. a locked USB stick). */
  writable: boolean;
  /** Native "Save as" dialog. Resolves false when the teacher cancels. */
  saveFile: (suggestedName: string, text: string) => Promise<boolean>;
  /** Writes an automatic snapshot into the data folder (keeps the latest few). */
  snapshot: (text: string) => Promise<DesktopSnapshotInfo | null>;
  /** The newest automatic snapshot, if any. */
  latestSnapshot: () => Promise<{ info: DesktopSnapshotInfo; text: string } | null>;
  /** Opens the data folder in Windows Explorer. */
  openDataDir: () => Promise<void>;
  setFullscreen: (on: boolean) => Promise<void>;
  /** Called when the window is about to close (the app waits up to 3 s for it). */
  onBeforeClose: (fn: (() => Promise<void>) | null) => void;
  /** Updates of the installed app (missing in builds older than 1.0.0). */
  updates?: DesktopUpdates;
}

export type UpdateState = "unsupported" | "idle" | "checking" | "latest" | "available" | "downloading" | "downloaded" | "installing" | "offline" | "unreachable" | "error";

export interface UpdateStatus {
  state: UpdateState;
  /** Installed version. */
  current: string;
  /** The new version (available, downloading, downloaded). */
  version?: string;
  percent?: number;
  transferred?: number;
  total?: number;
  notes?: string;
  message?: string;
  /** The teacher pressed «فحص التحديثات» (vs. the quiet check at start-up). */
  manual?: boolean;
  /** Why updates are off: the portable copy or a development run. */
  reason?: "portable" | "development";
}

export interface DesktopUpdates {
  status: () => Promise<UpdateStatus>;
  check: () => Promise<UpdateStatus>;
  download: () => Promise<UpdateStatus>;
  /** Closes the app, installs the downloaded update and opens the app again. */
  install: () => Promise<UpdateStatus>;
  onStatus: (fn: (s: UpdateStatus) => void) => () => void;
}

export function desktop(): DesktopBridge | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { heroesDesktop?: DesktopBridge }).heroesDesktop ?? null;
}

export function currentPlatform(): Platform {
  return desktop()?.platform ?? "web";
}

/** Shown in the settings page next to the data controls. */
export const PLATFORM_LABELS: Record<Platform, string> = {
  web: "نسخة الويب",
  desktop: "نسخة ويندوز المثبّتة",
  portable: "النسخة المحمولة (USB)",
};
