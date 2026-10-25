import type { NextConfig } from "next";

/*
 * Static export: `next build` writes plain HTML/CSS/JS to `out/`. The same
 * folder is the web release (any HTTPS static host) and the content of the
 * Windows desktop app (served by Electron from inside the package).
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true },
};

export default nextConfig;
