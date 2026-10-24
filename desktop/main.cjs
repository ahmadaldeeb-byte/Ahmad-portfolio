/*
 * Heroes World — Windows desktop shell (Electron).
 *
 * Loads the same static release as the web version (`out/`) through a private
 * `app://heroes` protocol, fully offline. Teacher data lives in IndexedDB
 * inside a data folder chosen here, and automatic JSON snapshots are written
 * next to it so the data never depends on browser storage alone:
 *   - portable (HeroesWorld-Portable.exe): <folder of the exe>\HeroesWorld-Data
 *   - installed (HeroesWorld-Setup.exe):   %APPDATA%\HeroesWorld
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
    createWindow();
  });
  app.on("window-all-closed", () => app.quit());
}
