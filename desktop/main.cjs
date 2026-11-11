/*
 * Heroes World — Windows desktop shell (Electron).
 *
 * Loads the same static release as the web version (`out/`) through a private
 * `app://heroes` protocol, fully offline. Teacher data lives in IndexedDB
 * inside a data folder chosen here, and automatic JSON snapshots are written
 * next to it so the data never depends on browser storage alone:
 *   - portable (HeroesWorld-Portable.exe): <folder of the exe>\HeroesWorld-Data
 *   - installed (Heroes-World-Setup-<version>.exe): %APPDATA%\HeroesWorld
 * The data folder is never inside the program folder, so installing an update
 * or uninstalling never touches it. Before a new version opens the data for
 * the first time, the browser storage folders are copied to backups/.
 *
 * Updates (installed app only): electron-updater reads the public GitHub
 * Releases feed set in electron-builder.yml; nothing is downloaded or
 * installed without the teacher's click. The app itself stays offline.
 */
const { app, BrowserWindow, dialog, ipcMain, net, protocol, session, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const SCHEME = "app";
const HOST = "heroes";
const ORIGIN = `${SCHEME}://${HOST}`;
const KEEP_SNAPSHOTS = 10;

/* ---------- where the data lives ---------- */

// electron-builder's portable launcher sets PORTABLE_EXECUTABLE_DIR to the folder of the .exe.
// HEROES_DATA_DIR overrides it (tests, or a teacher who wants another folder).
const portableDir = process.env.HEROES_DATA_DIR ? null : process.env.PORTABLE_EXECUTABLE_DIR;
const isPortable = !!portableDir || process.env.HEROES_PORTABLE === "1";
const wantedDataDir = process.env.HEROES_DATA_DIR || (portableDir ? path.join(portableDir, "HeroesWorld-Data") : null);

function canWrite(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    const probe = path.join(dir, `.write-test-${process.pid}`);
    fs.writeFileSync(probe, "ok");
    fs.rmSync(probe);
    return true;
  } catch {
    return false;
  }
}

// Pinned, so a future change of the product name can never move the teacher's data.
if (!wantedDataDir) app.setPath("userData", path.join(app.getPath("appData"), "HeroesWorld"));
let dataDir = wantedDataDir ?? app.getPath("userData");
let writable = canWrite(dataDir);
if (wantedDataDir && writable) {
  // Chromium's storage (IndexedDB, settings) goes inside the data folder too.
  app.setPath("userData", path.join(dataDir, "app"));
} else if (wantedDataDir) {
  // A locked / read-only stick: run from a temporary profile and tell the teacher.
  dataDir = path.join(app.getPath("temp"), "HeroesWorld-Data");
  canWrite(dataDir);
  app.setPath("userData", path.join(dataDir, "app"));
}
const backupsDir = () => path.join(dataDir, "backups");

/* ---------- backup before a new version opens the data ---------- */

const KEEP_UPGRADE_BACKUPS = 3;

/**
 * When this version runs for the first time on this data (an update, or the
 * first start after older builds), copy IndexedDB and Local Storage to
 * backups/before-<version>-… first: a new version may upgrade the database.
 */
function backupBeforeUpgrade() {
  const marker = path.join(dataDir, "last-version.json");
  let last = null;
  try {
    last = JSON.parse(fs.readFileSync(marker, "utf8")).version ?? null;
  } catch {
    /* first start */
  }
  const current = app.getVersion();
  const storage = ["IndexedDB", "Local Storage"].map((d) => path.join(app.getPath("userData"), d)).filter((d) => fs.existsSync(d));
  // Only when there is a database to protect (Chromium creates empty folders on a first start).
  const idb = path.join(app.getPath("userData"), "IndexedDB");
  const hasData = fs.existsSync(idb) && fs.readdirSync(idb).some((f) => f.includes("heroes"));
  if (last !== current && hasData) {
    const dest = path.join(backupsDir(), `before-${current}-from-${last ?? "older"}-${Date.now()}`);
    for (const src of storage) fs.cpSync(src, path.join(dest, path.basename(src)), { recursive: true });
    const old = fs
      .readdirSync(backupsDir())
      .filter((f) => f.startsWith("before-"))
      .map((f) => ({ f, t: Number(f.split("-").pop()) }))
      .sort((a, b) => b.t - a.t)
      .slice(KEEP_UPGRADE_BACKUPS);
    for (const o of old) fs.rmSync(path.join(backupsDir(), o.f), { recursive: true, force: true });
  }
  fs.writeFileSync(marker, JSON.stringify({ version: current, at: Date.now() }));
}

/* ---------- updates ---------- */

/** Network failures shown as "no internet" rather than as an error. */
const OFFLINE = /ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED|ERR_NETWORK_CHANGED|ERR_NETWORK_IO_SUSPENDED|ERR_ADDRESS_UNREACHABLE|ENOTFOUND|EAI_AGAIN|ENETUNREACH/;
const UNREACHABLE = /ERR_CONNECTION_REFUSED|ERR_CONNECTION_TIMED_OUT|ERR_TIMED_OUT|ECONNREFUSED|ETIMEDOUT|ECONNRESET/;

function setupUpdates(win) {
  // Only the installed app updates itself. HEROES_UPDATE_URL points a test at a local feed (localhost only).
  const testFeed = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(process.env.HEROES_UPDATE_URL ?? "") ? process.env.HEROES_UPDATE_URL : null;
  const supported = app.isPackaged && !isPortable;
  let status = { state: supported ? "idle" : "unsupported", reason: isPortable ? "portable" : app.isPackaged ? undefined : "development" };
  const send = (next) => {
    status = { ...next, current: app.getVersion() };
    if (!win.isDestroyed()) win.webContents.send("heroes:update-status", status);
  };
  status.current = app.getVersion();
  ipcMain.handle("heroes:update-status", () => status);
  if (!supported) {
    for (const ch of ["heroes:update-check", "heroes:update-download", "heroes:update-install"]) ipcMain.handle(ch, () => status);
    return;
  }

  const { autoUpdater } = require("electron-updater");
  const logFile = path.join(dataDir, "logs", "updates.log");
  const log = (level) => (...args) => {
    try {
      fs.mkdirSync(path.dirname(logFile), { recursive: true });
      fs.appendFileSync(logFile, `${new Date().toISOString()} [${level}] ${args.map(String).join(" ")}\n`);
    } catch {
      /* logging must never break updates */
    }
  };
  autoUpdater.logger = { info: log("info"), warn: log("warn"), error: log("error"), debug: () => {} };
  autoUpdater.autoDownload = false; // the teacher decides
  autoUpdater.autoInstallOnAppQuit = false; // and approves the restart
  autoUpdater.allowPrerelease = false;
  autoUpdater.allowDowngrade = false;
  if (testFeed) autoUpdater.setFeedURL({ provider: "generic", url: testFeed });

  let manual = false;
  let pending = null;
  autoUpdater.on("checking-for-update", () => send({ state: "checking", manual }));
  autoUpdater.on("update-available", (info) => {
    pending = info.version;
    send({ state: "available", version: info.version, notes: typeof info.releaseNotes === "string" ? info.releaseNotes.replace(/<[^>]+>/g, "").slice(0, 2000) : undefined });
  });
  autoUpdater.on("update-not-available", () => send({ state: "latest", manual }));
  autoUpdater.on("download-progress", (p) => send({ state: "downloading", version: pending, percent: Math.round(p.percent), transferred: p.transferred, total: p.total }));
  autoUpdater.on("update-downloaded", (info) => send({ state: "downloaded", version: info.version }));
  autoUpdater.on("error", (err) => {
    const msg = String(err?.message ?? err);
    const kind = OFFLINE.test(msg) ? "offline" : UNREACHABLE.test(msg) ? "unreachable" : "error";
    // A quiet check at start-up that finds no internet just says so; it never interrupts the lesson.
    send({ state: kind, manual, version: pending ?? undefined, message: msg.split("\n")[0].slice(0, 300) });
  });

  const check = (isManual) => {
    manual = !!isManual;
    return autoUpdater.checkForUpdates().catch(() => null);
  };
  ipcMain.handle("heroes:update-check", async () => {
    await check(true);
    return status;
  });
  ipcMain.handle("heroes:update-download", async () => {
    // After «available», or to retry a download that failed.
    if (!pending || ["checking", "downloading", "downloaded", "installing"].includes(status.state)) return status;
    send({ state: "downloading", version: pending, percent: 0 });
    await autoUpdater.downloadUpdate().catch(() => null);
    return status;
  });
  ipcMain.handle("heroes:update-install", () => {
    if (status.state !== "downloaded") return status;
    // The window's close handler writes a last snapshot first; then the installer runs silently and reopens the app.
    setImmediate(() => autoUpdater.quitAndInstall(true, true));
    return { ...status, state: "installing" };
  });
  // A quiet check shortly after start (skipped when there is no connection).
  setTimeout(() => void check(false), 8000);
}

/* ---------- the static release ---------- */

const webRoot = app.isPackaged ? path.join(process.resourcesPath, "web") : path.resolve(__dirname, "..", "out");

/** Maps /library/ → library/index.html; never leaves webRoot. */
function fileFor(urlPath) {
  const clean = path.normalize(decodeURIComponent(urlPath)).replace(/^([/\\])+/, "");
  const base = path.join(webRoot, clean);
  if (!base.startsWith(webRoot)) return null;
  for (const f of [base, `${base}.html`, path.join(base, "index.html")]) {
    try {
      if (fs.statSync(f).isFile()) return f;
    } catch {
      /* next candidate */
    }
  }
  return null;
}

// Classroom PCs with an old or blocked graphics driver: allow Chromium's software
// WebGL so the 3D games still draw (the app only runs its own local content).
app.commandLine.appendSwitch("enable-unsafe-swiftshader");

protocol.registerSchemesAsPrivileged([{ scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);

/* ---------- snapshots and files ---------- */

function listSnapshots() {
  try {
    return fs
      .readdirSync(backupsDir())
      .filter((f) => /^heroes-world-auto-\d+\.json$/.test(f))
      .map((f) => ({ file: path.join(backupsDir(), f), savedAt: Number(f.match(/\d+/)[0]) }))
      .sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
  }
}

function writeSnapshot(text) {
  JSON.parse(text); // never write a broken file
  fs.mkdirSync(backupsDir(), { recursive: true });
  const savedAt = Date.now();
  const file = path.join(backupsDir(), `heroes-world-auto-${savedAt}.json`);
  fs.writeFileSync(`${file}.tmp`, text, "utf8");
  fs.renameSync(`${file}.tmp`, file); // atomic: a pulled-out stick leaves the previous snapshot intact
  for (const old of listSnapshots().slice(KEEP_SNAPSHOTS)) fs.rmSync(old.file, { force: true });
  return { file, savedAt };
}

function registerIpc(win) {
  ipcMain.on("heroes:info", (e) => {
    e.returnValue = { platform: isPortable ? "portable" : "desktop", appVersion: app.getVersion(), dataDir, writable };
  });
  ipcMain.handle("heroes:save-file", async (_e, name, text) => {
    const defaultDir = isPortable && portableDir ? portableDir : app.getPath("documents");
    const r = await dialog.showSaveDialog(win, { defaultPath: path.join(defaultDir, path.basename(String(name))), filters: [{ name: "JSON", extensions: ["json"] }] });
    if (r.canceled || !r.filePath) return false;
    fs.writeFileSync(r.filePath, String(text), "utf8");
    return true;
  });
  ipcMain.handle("heroes:snapshot", (_e, text) => {
    try {
      return writeSnapshot(String(text));
    } catch {
      return null;
    }
  });
  ipcMain.handle("heroes:latest-snapshot", () => {
    for (const s of listSnapshots()) {
      try {
        const text = fs.readFileSync(s.file, "utf8");
        JSON.parse(text);
        return { info: s, text };
      } catch {
        /* damaged: try an older one */
      }
    }
    return null;
  });
  ipcMain.handle("heroes:open-data-dir", () => shell.openPath(dataDir));
  ipcMain.handle("heroes:set-fullscreen", (_e, on) => win.setFullScreen(!!on));
}

/* ---------- window ---------- */

function createWindow() {
  const win = new BrowserWindow({
    width: 1366,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    backgroundColor: "#F7F8FC",
    title: "عالم الأبطال التعليمي",
    autoHideMenuBar: true,
    fullscreen: process.argv.includes("--fullscreen"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      autoplayPolicy: "no-user-gesture-required",
    },
  });
  win.removeMenu();
  registerIpc(win);
  setupUpdates(win);
  win.once("ready-to-show", () => {
    if (!win.isFullScreen()) win.maximize();
    win.show();
  });

  const wc = win.webContents;
  // Smartboards: pinching must not zoom the whole app.
  wc.on("did-finish-load", () => void wc.setVisualZoomLevelLimits(1, 1));
  wc.on("before-input-event", (e, input) => {
    if (input.type !== "keyDown") return;
    if (input.key === "F11") {
      win.setFullScreen(!win.isFullScreen());
      e.preventDefault();
    } else if (input.key === "Escape" && win.isFullScreen()) win.setFullScreen(false);
    else if (input.control && ["+", "-", "=", "0"].includes(input.key)) e.preventDefault(); // no keyboard zoom
  });
  // Stay inside the app; real web links open in the teacher's browser.
  wc.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) void shell.openExternal(url);
    return { action: "deny" };
  });
  wc.on("will-navigate", (e, url) => {
    if (!url.startsWith(ORIGIN)) {
      e.preventDefault();
      if (/^https?:/.test(url)) void shell.openExternal(url);
    }
  });
  // Before closing, let the page write a last snapshot of any unsaved change (at most 3 s).
  let flushed = false;
  win.on("close", (e) => {
    if (flushed || wc.isDestroyed() || wc.isCrashed()) return;
    e.preventDefault();
    const done = () => {
      if (flushed) return;
      flushed = true;
      win.close();
    };
    ipcMain.once("heroes:flushed", done);
    wc.send("heroes:flush");
    setTimeout(done, 3000);
  });
  void win.loadURL(`${ORIGIN}/`);
  return win;
}

if (!app.requestSingleInstanceLock()) {
  app.quit(); // one copy at a time, so two windows never write the same data
} else {
  app.on("second-instance", () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w) {
      if (w.isMinimized()) w.restore();
      w.focus();
    }
  });

  app.whenReady().then(() => {
    const ses = session.defaultSession;
    protocol.handle(SCHEME, (req) => {
      const url = new URL(req.url);
      const file = url.host === HOST ? fileFor(url.pathname) : null;
      if (!file) return net.fetch(pathToFileURL(path.join(webRoot, "404.html")).toString()).then((r) => new Response(r.body, { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }));
      return net.fetch(pathToFileURL(file).toString());
    });
    // Offline by design: nothing leaves the computer.
    ses.webRequest.onBeforeRequest((details, cb) => cb({ cancel: /^(https?|wss?|ftp):/i.test(details.url) }));
    ses.setPermissionRequestHandler((_wc, permission, cb) => cb(permission === "fullscreen" || permission === "clipboard-sanitized-write"));
    try {
      backupBeforeUpgrade();
    } catch (e) {
      console.error("backup before upgrade failed", e);
    }
    createWindow();
  });
  app.on("window-all-closed", () => app.quit());
}
