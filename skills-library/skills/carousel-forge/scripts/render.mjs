#!/usr/bin/env node
/* render.mjs — HTML slides → PNG, plus contact sheets and a layout audit.
 *
 *   node render.mjs                     # render every post in ./data.js
 *   node render.mjs --post=01           # one post
 *   node render.mjs --post=01 --slide=3 # one slide (fast iteration)
 *   node render.mjs --dir=../my-project --out=renders
 *
 * Reads <dir>/data.js which must set `window.POSTS = [...]`
 * (legacy `window.CAROUSEL_POSTS` / `window.CAFE_POSTS` also accepted).
 *
 * Emits per post:  out/<id>-<slug>/01..NN.png  +  PREVIEW.png (contact sheet)
 * Emits globally:  out/COVERS.png, out/ALL-SLIDES.png, out/manifest.json
 *
 * AUDIT: after each slide it checks for copy that overflows the card, collides
 * with the fixed furniture, or renders at a contrast too low to read, and prints
 * warnings. Warnings are not fatal — you still have to look at the PNG.
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { requireDep } from "./_lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const sharp = requireDep("sharp", { optional: true });

const args = {};
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--([^=]+)(?:=([\s\S]*))?$/);
  if (m) args[m[1]] = m[2] === undefined ? true : m[2];
}

const projectDir = path.resolve(process.cwd(), args.dir || ".");
const outDir = path.resolve(projectDir, args.out || "out");
const W = Number(args.w || 1080);
const H = Number(args.h || 1350);

/* ---------- playwright ---------- */
const { chromium } = requireDep("playwright", { projectDir });

/* ---------- data ---------- */
const dataPath = path.join(projectDir, "data.js");
if (!fs.existsSync(dataPath)) {
  console.error(`render.mjs: no data.js in ${projectDir}`);
  process.exit(1);
}
/* Projects are made by copying template/. If the skill's template moves on
   afterwards, the project silently keeps rendering with the old renderer —
   which costs an hour of debugging CSS that was never the problem. */
for (const f of ["index.html", "style.css"]) {
  const mine = path.join(projectDir, f);
  const src = path.resolve(here, "..", "template", f);
  try {
    if (fs.statSync(src).mtimeMs > fs.statSync(mine).mtimeMs + 1000)
      console.warn(
        `  ! ${f} is older than the skill's template/${f}.\n` +
          `    Copy it over before you debug anything: cp <skill>/template/${f} .`
      );
  } catch {}
}
/* A missing @font-face file fails silently and falls back to a system font
   with different metrics — which shows up as mysterious clipped lines, not as
   a font error. Check every url() the stylesheet asks for. */
try {
  const css = fs.readFileSync(path.join(projectDir, "style.css"), "utf8");

  /* CSS discards an invalid declaration WITHOUT saying anything. One stray
     control character inside `--ground:` kills the brand colour and the whole
     deck quietly falls back to the placeholder palette — which looks like a
     design problem, not a text-encoding one. Editing scripts put it there. */
  const ctrl = [...css.matchAll(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g)];
  if (ctrl.length) {
    const line = (i) => css.slice(0, i).split("\n").length;
    console.warn(
      `  ! style.css contains ${ctrl.length} control character(s) — ` +
        `line(s) ${[...new Set(ctrl.map((m) => line(m.index)))].join(", ")}.\n` +
        `    Those declarations are silently dead. Replace each with a space.`
    );
  }

  const missing = [...css.matchAll(/@font-face[^}]*url\(["']?([^"')]+)/g)]
    .map((m) => m[1])
    .filter((u) => !/^(https?:|data:)/.test(u))
    .filter((u) => !fs.existsSync(path.resolve(projectDir, u)));
  if (missing.length)
    console.warn(
      `  ! ${missing.length} font file(s) referenced by style.css are missing:\n` +
        missing.map((m) => `      ${m}`).join("\n") +
        `\n    They fall back to a system font with different metrics — expect\n` +
        `    clipped lines and wrong measure. Copy <skill>/template/fonts/ over,\n` +
        `    or repoint the @font-face rules at your own files.`
    );
} catch {}

const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(dataPath, "utf8"), sandbox);
let posts =
  sandbox.window.POSTS || sandbox.window.CAROUSEL_POSTS || sandbox.window.CAFE_POSTS;
if (!Array.isArray(posts)) {
  console.error("render.mjs: data.js must set window.POSTS = [ ... ]");
  process.exit(1);
}
if (args.post) posts = posts.filter((p) => String(p.id) === String(args.post));
if (!posts.length) {
  console.error(`render.mjs: no post matched --post=${args.post}`);
  process.exit(1);
}

/* ---------- static server ---------- */
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split("?")[0]);
  const resolved = path.resolve(projectDir, `.${rel}`);
  if (!resolved.startsWith(projectDir)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  fs.readFile(resolved, (err, data) => {
    if (err) {
      res.writeHead(404).end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(resolved).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(data);
  });
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

/* ---------- layout audit (runs inside the page) ---------- */
const AUDIT = () => {
  const problems = [];
  const card = document.querySelector(".card") || document.querySelector(".slide");
  if (!card) return [{ kind: "no-card", detail: "no .card element" }];
  const cb = card.getBoundingClientRect();

  const bleed = (el, name) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    const over = [];
    if (r.left < cb.left - 1) over.push(`left by ${Math.round(cb.left - r.left)}px`);
    if (r.right > cb.right + 1) over.push(`right by ${Math.round(r.right - cb.right)}px`);
    if (r.top < cb.top - 1) over.push(`top by ${Math.round(cb.top - r.top)}px`);
    if (r.bottom > cb.bottom + 1) over.push(`bottom by ${Math.round(r.bottom - cb.bottom)}px`);
    if (over.length) problems.push({ kind: "overflow", el: name, detail: over.join(", ") });
  };

  document.querySelectorAll(".headline, .body, .copy, .hookgrid, .offer").forEach((el, i) => {
    bleed(el, `${el.className.split(" ")[0]}#${i}`);
  });

  // headline lines that are clipped by white-space:nowrap
  document.querySelectorAll(".headline .ln").forEach((el, i) => {
    if (el.scrollWidth > el.clientWidth + 2)
      problems.push({
        kind: "clipped-line",
        el: `line ${i + 1}`,
        detail: `"${el.textContent.slice(0, 40)}" needs ${el.scrollWidth - el.clientWidth}px more`,
      });
  });

  // copy colliding with the fixed furniture (handle / arrow / save pill)
  const furniture = [...document.querySelectorAll(".handle, .arrow, .savepill, .sign")];
  const copy = [...document.querySelectorAll(".headline, .body, .offer, .hookgrid")];
  const hit = (a, b) =>
    !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  for (const f of furniture) {
    const fr = f.getBoundingClientRect();
    if (!fr.width) continue;
    for (const c of copy) {
      const cr = c.getBoundingClientRect();
      if (!cr.width) continue;
      if (hit(fr, cr))
        problems.push({
          kind: "collision",
          el: `${c.className.split(" ")[0]} ↔ ${f.className.split(" ")[0]}`,
          detail: "copy overlaps fixed furniture",
        });
    }
  }
  return problems;
};

/* ---------- legibility audit ----------
 * Geometry is not legibility. A block can sit perfectly inside the card and
 * still be invisible because the pixels behind it are a busy mid-tone.
 * So: hide the copy, photograph what is actually behind it, and measure.
 * This is the check that catches "الكلام مخبي على الخلفية". */

const COPY_SELECTOR = ".headline, .bodytxt, .kicker, .hook, .cta .lead, .cta .key, .cta .pre, .cta .post";
// what comes off the plate before it is measured — copy plus its own marks
const PLATE_HIDE = COPY_SELECTOR + ", .marks";

const srgbToLin = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const relLum = (r, g, b) =>
  0.2126 * srgbToLin(r) + 0.7152 * srgbToLin(g) + 0.0722 * srgbToLin(b);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

async function legibility(page, slideLocator) {
  if (!sharp) return [];

  const boxes = await page.evaluate((sel) => {
    const card = document.querySelector(".card") || document.querySelector(".slide");
    const cb = card.getBoundingClientRect();
    return [...document.querySelectorAll(sel)]
      .filter((el) => el.textContent.trim() && el.getBoundingClientRect().width > 8)
      .map((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const m = cs.color.match(/\d+/g).map(Number);
        return {
          name: el.className.split(" ")[0] || el.tagName.toLowerCase(),
          text: el.textContent.trim().slice(0, 32),
          color: [m[0], m[1], m[2]],
          size: parseFloat(cs.fontSize) || 16,
          bold: (parseInt(cs.fontWeight, 10) || 400) >= 700,
          shadow: cs.textShadow && cs.textShadow !== "none",
          x: Math.max(0, Math.round(r.left - cb.left)),
          y: Math.max(0, Math.round(r.top - cb.top)),
          w: Math.round(r.width),
          h: Math.round(r.height),
        };
      });
  }, COPY_SELECTOR);
  if (!boxes.length) return [];

  /* Photograph the slide with every text layer hidden. Hand-drawn marks come
     off too: a circle or a strike is FOREGROUND decoration that deliberately
     overlaps its target, so leaving it in makes the audit report the mark as a
     busy background and flag a slide that is actually correct. */
  await page.evaluate((sel) => {
    document.querySelectorAll(sel).forEach((el) => (el.style.visibility = "hidden"));
  }, PLATE_HIDE);
  const plate = await slideLocator.screenshot({ animations: "disabled" });
  await page.evaluate((sel) => {
    document.querySelectorAll(sel).forEach((el) => (el.style.visibility = ""));
  }, PLATE_HIDE);

  const img = sharp(plate);
  const meta = await img.metadata();
  const problems = [];

  for (const b of boxes) {
    const left = Math.min(Math.max(0, b.x), meta.width - 2);
    const top = Math.min(Math.max(0, b.y), meta.height - 2);
    const width = Math.max(2, Math.min(b.w, meta.width - left));
    const height = Math.max(2, Math.min(b.h, meta.height - top));

    const { data, info } = await img
      .clone()
      .extract({ left, top, width, height })
      .resize(Math.min(64, width), Math.min(64, height), { fit: "fill" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let sum = 0;
    let sum2 = 0;
    let worst = 1;
    const n = info.width * info.height;
    const tl = relLum(...b.color);
    for (let i = 0; i < data.length; i += 3) {
      const Y = relLum(data[i], data[i + 1], data[i + 2]);
      sum += Y;
      sum2 += Y * Y;
      const r = ratio(tl, Y);
      if (r < worst) worst = r;
    }
    const mean = sum / n;
    const sd = Math.sqrt(Math.max(0, sum2 / n - mean * mean));
    const mid = ratio(tl, mean);

    /* Threshold scales with size, the way WCAG does: "large text" (≥24px, or
       ≥19px bold) needs 3:1, everything else 4.5:1. On a 1080-wide canvas a
       headline is 90–200px — holding it to the body-copy floor flags type that
       is perfectly legible. A text-shadow halo buys roughly one more stop. */
    const large = b.size >= 24 || (b.bold && b.size >= 19);
    const floor = (large ? 3.0 : 4.5) - (b.shadow ? 0.9 : 0);
    if (mid < floor)
      problems.push({
        kind: "low-contrast",
        el: b.name,
        detail: `"${b.text}" sits at ${mid.toFixed(1)}:1 against its background (need ${floor}:1)`,
      });
    else if (worst < 2.2 && sd > 0.06)
      problems.push({
        kind: "busy-behind",
        el: b.name,
        detail: `"${b.text}" — background varies a lot; the worst patch is only ${worst.toFixed(1)}:1`,
      });
  }
  return problems;
}

/* ---------- contact sheet ---------- */
function sheet(rows, { columns, thumb, title, label = "slide" }) {
  const cards = rows
    .flatMap((row) =>
      row.files.map(
        (f, i) => `<figure><img src="${f}" alt=""><figcaption>${
          label === "post" ? `${row.id} · ${row.title}` : `${row.id} · ${String(i + 1).padStart(2, "0")}`
        }</figcaption></figure>`
      )
    )
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}
    html,body{margin:0;background:#0b0b0c;color:#f2efe9;font:14px/1.4 -apple-system,Segoe UI,sans-serif}
    body{padding:40px}
    header{display:flex;align-items:end;justify-content:space-between;margin-bottom:26px}
    h1{margin:0;font-size:30px;letter-spacing:-.02em}
    p{margin:0;color:#8b8b93;font-size:13px}
    main{display:grid;grid-template-columns:repeat(${columns},${thumb}px);gap:16px}
    figure{margin:0;background:#151517;border:1px solid #2a2a2e;border-radius:10px;overflow:hidden}
    img{display:block;width:${thumb}px;height:${Math.round((thumb * H) / W)}px;object-fit:cover;background:#0f0f11}
    figcaption{height:34px;display:flex;align-items:center;padding:0 10px;color:#9b9ba3;font-size:11px}
  </style></head><body>
    <header><h1>${title}</h1><p>${W} × ${H}</p></header><main>${cards}</main>
  </body></html>`;
}

/* ---------- render ---------- */
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const pageErrors = [];
const manifest = [];
let warnCount = 0;

try {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => pageErrors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") pageErrors.push(m.text());
  });

  for (const post of posts) {
    const dirName = `${post.id}-${post.slug}`;
    const postOut = path.join(outDir, dirName);
    fs.mkdirSync(postOut, { recursive: true });

    /* Drop slides from a previous, longer version of this post. Without this a
       cut slide keeps shipping: it stays in out/, lands in the contact sheet,
       and gets uploaded. Skipped for --slide, which renders one on purpose. */
    if (!args.slide) {
      for (const f of fs.readdirSync(postOut)) {
        const m = /^(\d+)\.png$/.exec(f);
        if (m && Number(m[1]) > post.slides.length) {
          fs.unlinkSync(path.join(postOut, f));
          console.log(`  – removed stale ${dirName}/${f}`);
        }
      }
    }

    const files = [];

    const indexes = args.slide
      ? [Number(args.slide) - 1]
      : post.slides.map((_, i) => i);

    for (const i of indexes) {
      if (!post.slides[i]) continue;
      await page.goto(`${base}/index.html?post=${post.id}&slide=${i}`, {
        waitUntil: "networkidle",
      });
      await page.waitForFunction(() => window.__ready === true, null, { timeout: 15000 });

      const slide = page.locator(".slide");
      const box = await slide.boundingBox();
      if (!box || Math.round(box.width) !== W || Math.round(box.height) !== H)
        throw new Error(
          `${post.id}/${i + 1}: slide is ${Math.round(box?.width)}×${Math.round(box?.height)}, expected ${W}×${H}`
        );

      const problems = [
        ...(await page.evaluate(AUDIT)),
        ...(await legibility(page, slide)),
      ];
      for (const p of problems) {
        warnCount += 1;
        console.warn(`  ! ${post.id}/${String(i + 1).padStart(2, "0")} ${p.kind}: ${p.el} — ${p.detail}`);
      }

      const name = `${String(i + 1).padStart(2, "0")}.png`;
      await slide.screenshot({ path: path.join(postOut, name), animations: "disabled" });
      files.push(`${base}/${path.relative(projectDir, path.join(postOut, name)).split(path.sep).join("/")}`);
      console.log(`  ✓ ${post.id}/${name}`);
    }

    manifest.push({ id: post.id, slug: post.slug, title: post.title, dir: dirName, files });
  }

  /* contact sheets */
  const sheetPage = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
  for (const post of manifest) {
    await sheetPage.setContent(
      sheet([post], { columns: 5, thumb: 260, title: `${post.id} · ${post.title}` }),
      { waitUntil: "networkidle" }
    );
    await sheetPage.screenshot({ path: path.join(outDir, post.dir, "PREVIEW.png"), fullPage: true });
  }
  if (manifest.length > 1) {
    await sheetPage.setContent(
      sheet(manifest.map((r) => ({ ...r, files: [r.files[0]] })), {
        columns: 4,
        thumb: 300,
        title: "Covers — the grid test",
        label: "post",
      }),
      { waitUntil: "networkidle" }
    );
    await sheetPage.screenshot({ path: path.join(outDir, "COVERS.png"), fullPage: true });

    await sheetPage.setContent(
      sheet(manifest, { columns: 6, thumb: 200, title: "All slides" }),
      { waitUntil: "networkidle" }
    );
    await sheetPage.screenshot({ path: path.join(outDir, "ALL-SLIDES.png"), fullPage: true });
  }
  await sheetPage.close();

  fs.writeFileSync(
    path.join(outDir, "manifest.json"),
    JSON.stringify(
      manifest.map((p) => ({ ...p, files: p.files.map((f) => f.replace(`${base}/`, "")) })),
      null,
      2
    ) + "\n"
  );
} finally {
  await browser.close();
  server.close();
}

if (pageErrors.length) {
  console.error("\nBROWSER ERRORS:\n  " + [...new Set(pageErrors)].join("\n  "));
  process.exit(1);
}
console.log(
  `\ndone → ${outDir}` +
    (warnCount ? `\n${warnCount} layout warning(s) above — open the PNGs.` : "") +
    `\nNow LOOK at PREVIEW.png. The audit catches geometry, not taste.`
);
