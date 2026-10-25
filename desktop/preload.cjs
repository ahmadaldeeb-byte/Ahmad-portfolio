/*
 * The only bridge between the app page and Windows: a few file operations,
 * exposed as `window.heroesDesktop` (see src/lib/platform.ts for the types).
 * The page gets no Node.js access.
 */
const { contextBridge, ipcRenderer } = require("electron");

const info = ipcRenderer.sendSync("heroes:info");

// The page registers what to do before the window closes (write a last snapshot).
let flushHandler = null;
ipcRenderer.on("heroes:flush", async () => {
  try {
    if (flushHandler) await flushHandler();
  } finally {
    ipcRenderer.send("heroes:flushed");
  }
});

contextBridge.exposeInMainWorld("heroesDesktop", {
  platform: info.platform,
  appVersion: info.appVersion,
  dataDir: info.dataDir,
  writable: info.writable,
  saveFile: (name, text) => ipcRenderer.invoke("heroes:save-file", String(name), String(text)),
  snapshot: (text) => ipcRenderer.invoke("heroes:snapshot", String(text)),
  latestSnapshot: () => ipcRenderer.invoke("heroes:latest-snapshot"),
  openDataDir: () => ipcRenderer.invoke("heroes:open-data-dir"),
  setFullscreen: (on) => ipcRenderer.invoke("heroes:set-fullscreen", !!on),
  onBeforeClose: (fn) => {
    flushHandler = typeof fn === "function" ? fn : null;
  },
  updates: {
    status: () => ipcRenderer.invoke("heroes:update-status"),
    check: () => ipcRenderer.invoke("heroes:update-check"),
    download: () => ipcRenderer.invoke("heroes:update-download"),
    install: () => ipcRenderer.invoke("heroes:update-install"),
    onStatus: (fn) => {
      const listener = (_e, s) => fn(s);
      ipcRenderer.on("heroes:update-status", listener);
      return () => ipcRenderer.removeListener("heroes:update-status", listener);
    },
  },
});
