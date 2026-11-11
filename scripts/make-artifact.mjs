// Turns the single-file standalone build into a page body for hosting
// environments that add their own <html>/<head>/<body> wrapper.
import fs from "node:fs";

const [input = "dist-standalone/index.html", output = "dist-standalone/heroes-world.html"] = process.argv.slice(2);
const html = fs.readFileSync(input, "utf8");
const styles = [...html.matchAll(/<style[^>]*>[\s\S]*?<\/style>/g)].map((m) => m[0]);
const scripts = [...html.matchAll(/<script[^>]*>[\s\S]*?<\/script>/g)].map((m) => m[0]);
const page = [
  "<title>عالم الأبطال التعليمي</title>",
  ...styles,
  '<div id="heroes-root"></div>',
  ...scripts,
].join("\n");
fs.writeFileSync(output, page);
console.log(`${output}: ${(page.length / 1024 / 1024).toFixed(2)} MB, ${styles.length} style, ${scripts.length} script`);
