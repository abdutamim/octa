#!/usr/bin/env node
/* init.mjs — scaffold a carousel project anywhere.
 *
 *   node <skill>/scripts/init.mjs my-brand
 *   node <skill>/scripts/init.mjs .            # scaffold into the current dir
 *   node <skill>/scripts/init.mjs my-brand --force
 *
 * Copies the template (renderer, stylesheet, fonts), writes a starter data.js,
 * and checks that the deps the scripts need are actually reachable from here.
 */
import fs from "node:fs";
import path from "node:path";
import { requireDep, skillDir, sharedDeps } from "./_lib.mjs";

const args = process.argv.slice(2);
const force = args.includes("--force");
const target = path.resolve(process.cwd(), args.find((a) => !a.startsWith("--")) || ".");
const name = path.basename(target);

const templateDir = path.join(skillDir, "template");
if (!fs.existsSync(templateDir)) {
  console.error(`init: no template at ${templateDir}`);
  process.exit(1);
}

fs.mkdirSync(target, { recursive: true });

/* ---------- copy the renderer + identity ---------- */
const copied = [];
const skipped = [];

function copyFile(from, to) {
  if (fs.existsSync(to) && !force) {
    skipped.push(path.relative(target, to));
    return;
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  copied.push(path.relative(target, to));
}

for (const f of ["index.html", "style.css", "brand.css"]) {
  copyFile(path.join(templateDir, f), path.join(target, f));
}

/* ---------- the kit: six grammar axes ----------
 * The single most important thing this script does. Defaulting every project
 * to card/rail/glow is what made every brand look like the last one, so an
 * unspecified kit is NOT a default — it is chosen to avoid what the roster
 * already contains.  → references/grammar.md
 */
const AXES = {
  shell:   ["card", "full", "frame", "panel", "passe", "band"],
  chrome:  ["rail", "foot", "corner", "spine", "index", "none"],
  ground:  ["glow", "flat", "paper", "rules", "vignette", "wash"],
  eyebrow: ["wobble", "caps", "rule", "chip", "numeral", "none"],
  accent:  ["text", "mark", "rule", "bar", "none"],
  anchor:  ["top", "third", "mid", "base"],
};
/* Only these three change the shape at feed size, so only these three
   constitute a collision. Two brands may share an eyebrow; they may not
   share a silhouette. */
const SIGNATURE = ["shell", "chrome", "ground"];

const rosterPath = path.join(skillDir, "roster.json");
const readRoster = () => {
  try { return JSON.parse(fs.readFileSync(rosterPath, "utf8")); } catch { return {}; }
};
const roster = readRoster();
const sigOf = (k) => SIGNATURE.map((a) => k[a]).join("/");
const taken = new Set(
  Object.entries(roster).filter(([b]) => b !== name).map(([, k]) => sigOf(k))
);

const kitArg = args.find((a) => a.startsWith("--kit="));
const explicit = {};
if (kitArg) {
  for (const pair of kitArg.slice(6).split(",")) {
    const [axis, value] = pair.split(":").map((x) => x && x.trim());
    if (!AXES[axis]) { console.error(`init: unknown kit axis "${axis}"`); process.exit(1); }
    if (!AXES[axis].includes(value)) {
      console.error(`init: --kit ${axis}:${value} — pick one of ${AXES[axis].join(" · ")}`);
      process.exit(1);
    }
    explicit[axis] = value;
  }
}

/* Seed from the project name so a re-run is reproducible, then walk forward
   until the silhouette is one nobody else owns. */
let seed = 0;
for (const ch of name) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
const pick = (axis, n) => AXES[axis][(seed + n * 7) % AXES[axis].length];

let kit = null;
for (let n = 0; n < 64 && !kit; n += 1) {
  const cand = {};
  for (const axis of Object.keys(AXES)) cand[axis] = explicit[axis] ?? pick(axis, n);
  // an explicit kit is the designer's call — never silently walked away from
  const fullyExplicit = SIGNATURE.every((a) => explicit[a]);
  if (fullyExplicit || !taken.has(sigOf(cand))) kit = cand;
}
kit = kit || { ...Object.fromEntries(Object.keys(AXES).map((a) => [a, AXES[a][0]])), ...explicit };

const collision = taken.has(sigOf(kit))
  ? Object.entries(roster).find(([b, k]) => b !== name && sigOf(k) === sigOf(kit))?.[0]
  : null;

roster[name] = kit;
try {
  fs.writeFileSync(rosterPath, JSON.stringify(roster, null, 2) + "\n", "utf8");
} catch (e) {
  console.warn(`  ⚠ could not write roster (${e.code}) — collision checks are off`);
}

const kitBlock =
  `/* ── THE KIT — this brand's silhouette. → references/grammar.md ──\n` +
  `   shell   how content meets the frame\n` +
  `   chrome  the persistent identity marks\n` +
  `   ground  the surface treatment\n` +
  `   eyebrow the kicker form\n` +
  `   accent  how the accent colour touches type\n` +
  `   anchor  default vertical position of the copy block            */\n` +
  `window.KIT = ${JSON.stringify(kit, null, 2)};\n\n`;

const fontsSrc = path.join(templateDir, "fonts");
if (fs.existsSync(fontsSrc)) {
  for (const f of fs.readdirSync(fontsSrc))
    copyFile(path.join(fontsSrc, f), path.join(target, "fonts", f));
}

fs.mkdirSync(path.join(target, "assets", "gen"), { recursive: true });
fs.mkdirSync(path.join(target, "assets", "cut"), { recursive: true });

/* ---------- the vibe lock ----------
   Six levers written once. Appended to every gen.mjs prompt so twenty images
   come out of one world instead of twenty separate good pictures. */
const vibePath = path.join(target, "vibe.json");
if (!fs.existsSync(vibePath) || force) {
  fs.writeFileSync(
    vibePath,
    JSON.stringify(
      {
        _: "Six levers. Fill them once. gen.mjs appends this to every prompt.",
        subject: "describe the recurring person: hair, build, wardrobe",
        lock: {
          stock: "Kodak Portra 400",
          light: "hard amber key from low left, deep falloff to near-black",
          grade: "warm amber and near-black only, no cool tones",
          lens: "50mm, shallow depth of field",
          camera: "static, locked off, eye level",
          composition: "subject low and off-centre, empty upper third",
        },
        signature: "one warm practical lamp somewhere in frame",
        antiStyle:
          "no stock-photo gloss, no teal-and-orange grade, no lens flare, no floating UI cards",
        realism: false,
      },
      null,
      2
    ) + "\n",
    "utf8"
  );
  copied.push("vibe.json");
} else {
  skipped.push("vibe.json");
}

/* ---------- starter content ----------
   Copied from template/data.js so there is one source of truth. Falls back to
   an inline stub only if the template file is missing. */
const dataPath = path.join(target, "data.js");
const templateData = path.join(templateDir, "data.js");
if ((!fs.existsSync(dataPath) || force) && fs.existsSync(templateData)) {
  // starter content, with this project's kit prepended — the kit has to be
  // visible in the file the designer actually opens, not buried in a config
  const starter = fs.readFileSync(templateData, "utf8").replace(/^window\.KIT[\s\S]*?\n\n/, "");
  fs.writeFileSync(dataPath, kitBlock + starter, "utf8");
  copied.push("data.js");
} else if (!fs.existsSync(dataPath) || force) {
  fs.writeFileSync(
    dataPath,
    kitBlock +
      `/* ${name} — carousel content.
   Read the skill first. The short version:
     · three colours only (edit :root in style.css)
     · one accent word per slide
     · run probe.mjs on every photo BEFORE writing coordinates here
     · never put copy on a face; the CTA slide has no photo          */

const BRAND = {
  handle: "@YOURHANDLE",
  site: "yoursite.com",
  sign: "",
  railLeft: "2026",
  railRight: "TOPIC",       // Latin only — the rail is direction:ltr
};

window.POSTS = [
  {
    ...BRAND,
    id: "01",
    slug: "first-post",
    title: "First post",
    // latin: true, rtl: false,   // uncomment for an English post

    slides: [
      {
        type: "promise",        // type-led cover, no photo needed
        plain: true,
        at: { t: 262, l: 78, r: 78 },
        hsize: 200,
        lines: [
          { text: "Your hook", accent: true },
          { text: "goes here." },
        ],
      },
      {
        type: "teach",          // designed background, no coverage problems
        step: "1",
        kicker: "the mirror",
        at: { t: 240, l: 78, r: 78 },
        hsize: 110,
        lines: [
          { text: "One idea" },
          { text: "per slide.", accent: true, in: 1 },
        ],
        ruleT: 646,
        bodyAt: { t: 712, l: 78, w: 830 },
        body: "Two sentences maximum. A third means a second idea, which means a second slide.",
      },
      {
        type: "grid",           // the slide that earns the save
        step: "2",
        kicker: "the payload",
        at: { t: 140, l: 78, r: 78 },
        hsize: 104,
        lines: [
          { text: "Four points," },
          { text: "one glance.", accent: true, in: 1 },
        ],
        gridAt: { t: 420, l: 72, r: 72 },
        hooks: [
          { name: "Label", text: "One sentence someone can act on today." },
          { name: "Label", text: "Concrete beats abstract, every time." },
          { name: "Label", text: "Name the thing. Do not describe it." },
          { name: "Label", text: "If you can cut it, it was filler." },
        ],
      },
      {
        type: "cta",
        bare: true,             // no photo. see law 3.
        pre: "Want the full thing?",
        lead: "comment the word",
        key: "KEYWORD",
        post: "and I'll send it over. Free, no strings.",
      },
    ],
  },
];
`,
    "utf8"
  );
  copied.push("data.js");
} else {
  skipped.push("data.js");
}

/* ---------- dependency check ---------- */
const deps = [
  ["playwright", "render.mjs"],
  ["sharp", "probe.mjs · grade.mjs · the legibility audit"],
];
const missing = deps.filter(([d]) => !requireDep(d, { projectDir: target, optional: true }));

/* ---------- report ---------- */
const rel = (p) => path.relative(process.cwd(), p) || ".";
console.log(`\ncarousel-forge → ${rel(target)}\n`);
if (copied.length) console.log(`  created  ${copied.length} file(s): ${copied.slice(0, 6).join(", ")}${copied.length > 6 ? " …" : ""}`);
if (skipped.length) console.log(`  kept     ${skipped.length} existing file(s) — pass --force to overwrite`);

console.log(
  `\n  kit      ${Object.entries(kit).map(([a, v]) => `${a}:${v}`).join("  ")}` +
    `\n           silhouette ${sigOf(kit)}   ` +
    (kitArg ? "(yours)" : "(chosen to miss every brand in the roster)")
);
if (collision) {
  console.log(
    `\n  ⚠ SILHOUETTE COLLISION with "${collision}" — same shell/chrome/ground.\n` +
      `    At feed size these two brands will look like the same account.\n` +
      `    Change one axis:  --kit=shell:${AXES.shell.find((v) => v !== kit.shell)}`
  );
}
const others = Object.keys(roster).filter((b) => b !== name);
if (others.length)
  console.log(`  roster   ${others.length} other brand(s): ${others.slice(0, 8).join(", ")}`);

if (missing.length) {
  console.log(`\n  ⚠ missing deps:`);
  for (const [d, why] of missing) console.log(`      ${d}  (needed by ${why})`);
  console.log(
    `\n    install once, reused by every future project:\n` +
      `      npm i --prefix "${path.dirname(sharedDeps)}" ${missing.map(([d]) => d).join(" ")}` +
      (missing.some(([d]) => d === "playwright") ? `\n      npx playwright install chromium` : "")
  );
} else {
  console.log(`  deps     playwright + sharp reachable`);
}

// relative paths get absurd across drives/temp dirs — print whichever is shorter
const shortest = (p) => {
  const r = path.relative(process.cwd(), p);
  return !r || r.length < p.length ? r || "." : p;
};
const s = (p) => path.join(shortest(skillDir), "scripts", p).split(path.sep).join("/");
console.log(`
  next:
    0. read the kit above. Is that silhouette right for THIS brand? Change it
       with --kit=shell:…,chrome:…,ground:…  → references/grammar.md
    1. edit vibe.json  → the six levers. Do this BEFORE generating anything.
    2. edit brand.css  → colours, fonts, geometry. NEVER edit style.css:
                         it holds no brand decisions, only the grammar.
    3. edit data.js    → window.KIT at the top, then your copy
    4. photos?         node ${s("gen.mjs")} --out=assets/gen/a.png --ref=<you>.png --preset=face-lock-back --prompt="..."
                        node ${s("probe.mjs")} assets/gen/a.png            ← where copy may go
                        node ${s("probe.mjs")} --set assets/gen/*.png      ← do they read as one shoot?
    5. node ${s("render.mjs")}
    6. open out/PREVIEW.png and out/COVERS.png. Actually look at them.
`);
