#!/usr/bin/env node
/* sheet.mjs — contact sheet.
 *
 * Rendering a post one PNG at a time hides the only thing that matters at the
 * account level: whether the slides read as ONE document, and whether this
 * post looks like the last one. A sheet answers both in a single glance.
 *
 *   node sheet.mjs                        every post in ./out
 *   node sheet.mjs --cols=5               force the column count
 *   node sheet.mjs --glob="../st/0*"      one row per project, covers only
 *   node sheet.mjs --out=sheets/all.png
 *
 * With --glob the sheet becomes a FORM AUDIT: each row is a post, so two rows
 * with the same silhouette mean two posts with the same design, whatever
 * colours they use. That is the check this file exists for.
 */

import fs from "node:fs";
import path from "node:path";
import { requireDep } from "./_lib.mjs";

const sharp = await requireDep("sharp");

const arg = (k, d) => {
  const hit = process.argv.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.slice(k.length + 3) : d;
};

const CELL = Number(arg("cell", 300)); // width of one slide in the sheet
const GAP = Number(arg("gap", 14));
const PAD = 26;
const LABEL = 30;

const cwd = process.cwd();

/* ── collect rows ───────────────────────────────────────────── */
// A row is { title, files[] }. Either every slide of one post, or the first
// N slides of each project matched by --glob.
function postsIn(dir) {
  const out = path.join(dir, "out");
  if (!fs.existsSync(out)) return [];
  return fs
    .readdirSync(out, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => {
      const d = path.join(out, e.name);
      const files = fs
        .readdirSync(d)
        .filter((f) => /^\d+\.png$/.test(f))
        .sort()
        .map((f) => path.join(d, f));
      return { title: e.name, files };
    })
    .filter((r) => r.files.length);
}

let rows = [];
const globArg = arg("glob");
if (globArg) {
  // shells on Windows do not expand this for us, so resolve it here
  const base = path.resolve(cwd, path.dirname(globArg));
  const pat = new RegExp("^" + path.basename(globArg).replace(/\*/g, ".*") + "$");
  for (const e of fs.readdirSync(base, { withFileTypes: true })) {
    if (!e.isDirectory() || !pat.test(e.name)) continue;
    for (const p of postsIn(path.join(base, e.name))) {
      rows.push({ title: `${e.name}  ·  ${p.title}`, files: p.files });
    }
  }
} else {
  rows = postsIn(cwd);
}

if (!rows.length) {
  console.error("sheet: nothing rendered yet — run render.mjs first.");
  process.exit(1);
}

const cols = Number(arg("cols", Math.max(...rows.map((r) => r.files.length))));
const first = await sharp(rows[0].files[0]).metadata();
const cellH = Math.round((CELL * first.height) / first.width);

const W = PAD * 2 + cols * CELL + (cols - 1) * GAP;
const H = PAD + rows.length * (LABEL + cellH + GAP * 2);

const layers = [];
for (const [r, row] of rows.entries()) {
  const rowTop = PAD + r * (LABEL + cellH + GAP * 2);
  layers.push({
    input: Buffer.from(
      `<svg width="${W}" height="${LABEL}">
         <text x="0" y="20" font-family="Segoe UI, sans-serif" font-size="17"
               font-weight="700" fill="#6D6D78">${row.title}</text>
       </svg>`
    ),
    top: rowTop,
    left: PAD,
  });
  for (const [c, file] of row.files.slice(0, cols).entries()) {
    layers.push({
      input: await sharp(file).resize(CELL, cellH, { fit: "cover" }).png().toBuffer(),
      top: rowTop + LABEL + GAP,
      left: PAD + c * (CELL + GAP),
    });
  }
}

const out = path.resolve(cwd, arg("out", "out/SHEET.png"));
fs.mkdirSync(path.dirname(out), { recursive: true });
await sharp({
  create: { width: W, height: H, channels: 3, background: "#FFFFFF" },
})
  .composite(layers)
  .png()
  .toFile(out);

const widths = new Set(rows.map((r) => r.files.length));
console.log(`sheet → ${out}`);
console.log(`  ${rows.length} row(s), ${cols} col(s), cell ${CELL}×${cellH}`);
if (rows.length > 1 && widths.size === 1) {
  console.log(
    "  note: every row is the same length — check the SHAPES differ, " +
      "not just the colours. → references/archetypes.md"
  );
}
