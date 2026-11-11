#!/usr/bin/env node
/*
 * Serves the static web release (`out/`) the way a production static host
 * does: clean URLs (`/play` → `/play/index.html`), the 404 page, long caching
 * for hashed assets and the same security headers as `deploy/web/`.
 * Usage: node scripts/serve-static.mjs [dir=out] [port=3100]
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? "out");
const port = Number(process.argv[3] ?? process.env.PORT ?? 3100);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8",
  ".wasm": "application/wasm",
};

const HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "SAMEORIGIN",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

/** Maps a URL path to a file inside root (never outside it). */
function resolve(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  const base = path.join(root, path.normalize(clean).replace(/^(\.\.[/\\])+/, ""));
  if (!base.startsWith(root)) return null;
  for (const f of [base, `${base}.html`, path.join(base, "index.html")]) {
    try {
      if (fs.statSync(f).isFile()) return f;
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

http
  .createServer((req, res) => {
    const file = resolve(req.url ?? "/");
    const target = file ?? path.join(root, "404.html");
    const type = MIME[path.extname(target)] ?? "application/octet-stream";
    const immutable = target.includes(`${path.sep}_next${path.sep}static${path.sep}`);
    res.writeHead(file ? 200 : 404, {
      ...HEADERS,
      "Content-Type": type,
      "Cache-Control": immutable ? "public, max-age=31536000, immutable" : "no-cache",
    });
    fs.createReadStream(target).pipe(res);
  })
  .listen(port, () => console.log(`Heroes World web build: http://localhost:${port} (${root})`));
