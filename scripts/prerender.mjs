// Prerender public routes (listed in public/sitemap.xml) into static HTML in dist/.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const sitemap = fs.readFileSync(path.join(root, "public/sitemap.xml"), "utf8");
const routes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
  const p = new URL(m[1].trim()).pathname;
  return p.length > 1 ? p.replace(/\/$/, "") : "/";
});
if (!routes.length) {
  console.error("[prerender] no routes found in sitemap.xml");
  process.exit(1);
}

const shell = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const types = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml",
  ".ico": "image/x-icon", ".webp": "image/webp", ".woff2": "font/woff2", ".xml": "application/xml", ".txt": "text/plain",
};
const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const file = path.join(dist, urlPath);
  if (file.startsWith(dist) && fs.existsSync(file) && fs.statSync(file).isFile()) {
    res.writeHead(200, { "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  } else {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(shell);
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;

let failed = false;
const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
try {
  for (const route of routes) {
    const page = await browser.newPage();
    try {
      await page.goto(origin + route, { waitUntil: "networkidle0", timeout: 60000 });
      await page.waitForSelector("h1, main", { timeout: 15000 });
      await new Promise((r) => setTimeout(r, 500));
      // Remove shell defaults (first occurrence) when the page added its own duplicate.
      await page.evaluate(() => {
        const sels = [
          'meta[name="description"]', 'meta[property="og:title"]', 'meta[property="og:description"]',
          'meta[name="twitter:title"]', 'meta[name="twitter:description"]', 'link[rel="canonical"]',
        ];
        for (const s of sels) {
          const els = document.head.querySelectorAll(s);
          for (let i = 0; i < els.length - 1; i++) els[i].remove();
        }
        // Sync twitter title/description to the page's own values set by the SEO hook.
        const d = document.querySelector('meta[name="description"]')?.getAttribute("content");
        const tt = document.querySelector('meta[name="twitter:title"]');
        const td = document.querySelector('meta[name="twitter:description"]');
        if (tt) tt.setAttribute("content", document.title);
        if (td && d) td.setAttribute("content", d);
      });
      const html = "<!doctype html>\n" + (await page.evaluate(() => document.documentElement.outerHTML));
      const out = route === "/" ? path.join(dist, "index.html") : path.join(dist, route.slice(1), "index.html");
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, html);
      console.log(`[prerender] ${route} -> ${path.relative(root, out)} (${Buffer.byteLength(html)} bytes)`);
    } catch (e) {
      failed = true;
      console.error(`[prerender] FAILED ${route}: no h1/main or error — ${e.message}`);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
  server.close();
}
process.exit(failed ? 1 : 0);
