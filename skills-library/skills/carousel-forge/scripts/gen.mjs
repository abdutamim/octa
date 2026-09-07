#!/usr/bin/env node
/* gen.mjs — Gemini image generator/editor for carousel art.
 *
 *   node gen.mjs --out=assets/p01.png --prompt="..."
 *   node gen.mjs --out=assets/p01.png --ref=ref/me.jpg --preset=face-lock --prompt="..."
 *   node gen.mjs --out=assets/p01.png --ref=wide.jpg --preset=outpaint --prompt="..."
 *   node gen.mjs --batch=shots.json
 *
 * Flags
 *   --out=      output path (required unless --batch). --n>1 appends -1 -2 ...
 *   --prompt=   the scene description. NEVER put headline text in here (see NO-TEXT).
 *   --ref=      comma-separated reference images. First = pose/composition, rest = identity.
 *   --preset=   face-lock | face-lock-back | outpaint | cutout-ready | plate | none
 *               face-lock-back also forces a turned/obscured face — use it for
 *               anything that is not a deliberate portrait. AI face fidelity
 *               falls off fast the moment the face is large and front-on.
 *   --ar=       4:5 (default) | 1:1 | 9:16 | 16:9 | 3:1
 *   --n=        how many variants (default 1)
 *   --model=    default gemini-3-pro-image
 *   --raw       skip all preset/system scaffolding, send --prompt verbatim
 *   --vibe=     path to the vibe file (default: ./vibe.json, then ../vibe.json)
 *   --novibe    ignore it for this run
 *   --dry       print the assembled prompt and exit. Costs nothing. Use it
 *               before any batch — a bad lock string times eight is expensive.
 *   --realism   swap the film stock for "iPhone" — the single lever that turns
 *               "nice AI render" into "they actually shot this"
 *   --style=    photoreal | char3d | soft3d | cartoon | collage | riso |
 *               render | neon.   Also settable as "style" in vibe.json.
 *               The lock keeps the WORLD consistent; the style decides the
 *               MEDIUM. char3d and cartoon give you a character with no
 *               likeness risk at all — nothing real is being reproduced.
 *
 * vibe.json — write it ONCE per brand, it is appended to every prompt:
 *   {
 *     "subject":   "a man with dense curly black hair, plain black button shirt",
 *     "lock": {
 *       "stock":       "Kodak Portra 400",       // strongest single lock
 *       "light":       "hard amber key from low left, deep falloff",
 *       "grade":       "warm amber and near-black, no cool tones",
 *       "lens":        "50mm, shallow depth of field",
 *       "camera":      "static, locked off, eye level",
 *       "composition": "subject low-right, empty upper third"
 *     },
 *     "signature": "one warm practical lamp somewhere in frame",
 *     "antiStyle": "no stock-photo gloss, no teal-and-orange, no lens flare",
 *     "realism":   false
 *   }
 *
 * Key resolution: $GEMINI_API_KEY, then ./.env, then ../.env, then $GEMINI_ENV_FILE.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadGeminiKey, requireDep } from "./_lib.mjs";

/* Image models like to render a "photograph" complete with a printed white
   mat around it. That border wrecks every downstream measurement — probe reads
   the edge as high-variance and rejects the whole frame. Trim it on the way in.
   sharp is optional: without it we just warn. */
const sharpLib = requireDep("sharp", { optional: true });

async function trimBorder(file) {
  if (!sharpLib) return null;
  try {
    const before = await sharpLib(file).metadata();
    const buf = await sharpLib(file).trim({ threshold: 18 }).toBuffer();
    const after = await sharpLib(buf).metadata();
    const shrank =
      (before.width - after.width) / before.width > 0.02 ||
      (before.height - after.height) / before.height > 0.02;
    if (!shrank) return null;
    fs.writeFileSync(file, buf);
    return `${before.width}×${before.height} → ${after.width}×${after.height}`;
  } catch {
    return null;
  }
}

const dir = path.dirname(fileURLToPath(import.meta.url));
const cwd = process.cwd();

/* ---------- args ---------- */
const args = { _: [] };
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--([^=]+)(?:=([\s\S]*))?$/);
  if (m) args[m[1]] = m[2] === undefined ? true : m[2];
  else args._.push(a);
}

function die(msg) {
  console.error(`gen.mjs: ${msg}`);
  process.exit(1);
}

/* ---------- key ---------- */
// resolution + the free-tier warning live in _lib.mjs so every script agrees

/* ---------- prompt scaffolding ----------
 * These clauses are the difference between a usable plate and a wasted call.
 * Learned the hard way; see references/photo-direction.md. */

const NO_TEXT =
  "Render NO text, NO letters, NO words, NO numbers, NO logos, NO watermarks, " +
  "NO signage anywhere in the frame. Typography is added later in code.";

const PLATE =
  "Photographic plate for a poster: leave one large uncluttered region of clean " +
  "negative space (roughly one third of the frame) where headline type will sit. " +
  "Do not centre the subject if that would fill the whole frame.";

const FACE_LOCK =
  "IDENTITY LOCK — READ THIS BEFORE THE SCENE DESCRIPTION.\n" +
  "The attached reference photograph(s) show ONE specific real person. Your task is " +
  "to place THAT EXACT PERSON into a new scene. This is not a person 'similar to' or " +
  "'inspired by' the reference — it is the same individual, and a viewer who knows " +
  "them must recognise them immediately.\n" +
  "- The reference image is the ONLY source of truth for the face. Copy the face from " +
  "the pixels, not from any written description.\n" +
  "- Preserve exactly: the proportions and spacing of the eyes, the eyebrow shape, the " +
  "nose bridge and tip, the mouth width and lip shape, the jaw and chin outline, the " +
  "cheekbones, the hairline, the exact curl pattern and volume of the hair, the facial " +
  "hair pattern, and the skin tone.\n" +
  "- Do NOT beautify, slim, widen, age, youthen, lighten, symmetrise, or ethnically " +
  "shift the face. Do not average it toward a generic attractive model.\n" +
  "- Only pose, framing, wardrobe, lighting and environment may change.\n" +
  "- If the requested pose would hide the face anyway, still keep the head shape, hair " +
  "silhouette and body proportions faithful to the reference.";

// Identity survives far better when the face is small, turned, or obscured.
// Prefer this for anything that is not a deliberate portrait.
const FACELESS =
  "Frame the person so their face is NOT the subject: back to camera, three-quarters " +
  "away, in profile, cropped above the chin, obscured, or small in the frame. The " +
  "silhouette, hair and posture carry the recognition, not the facial features.";

const OUTPAINT =
  "Extend/outpaint this image. Preserve every existing pixel exactly — do not " +
  "re-render, re-light, recolour or crop the original content. Continue the existing " +
  "background, grain, perspective and lighting seamlessly into the new area, and leave " +
  "the new area visually calm so headline type can sit on it.";

const CUTOUT_READY =
  "Separate the subject cleanly from the background: crisp unambiguous silhouette edge, " +
  "clear tonal separation between subject and backdrop, no motion blur on the subject " +
  "outline, no background element overlapping or merging with the subject's contour, " +
  "no fine flyaway hair dissolving into a busy backdrop. This image will be " +
  "background-removed programmatically.";

/* `lead` clauses go BEFORE the scene, `tail` clauses after.
   Identity has to lead — a model that reads the scene first will invent a face
   to fit the scene and then treat the reference as a style hint. */
const PRESETS = {
  "face-lock": { lead: [FACE_LOCK], tail: [PLATE, NO_TEXT] },
  "face-lock-back": { lead: [FACE_LOCK, FACELESS], tail: [PLATE, NO_TEXT] },
  outpaint: { lead: [OUTPAINT], tail: [NO_TEXT] },
  "cutout-ready": { lead: [], tail: [CUTOUT_READY, PLATE, NO_TEXT] },
  plate: { lead: [], tail: [PLATE, NO_TEXT] },
  none: { lead: [], tail: [NO_TEXT] },
};

/* ---------- the lock string ----------
 * Six levers, written once, appended to every prompt in the project. This is
 * what makes twenty images read as one shoot instead of twenty good pictures.
 * Hand-writing the "look" into each prompt drifts — a file cannot.
 * Lives at <project>/vibe.json, or pass --vibe=<path>. */
const LEVERS = ["stock", "light", "grade", "lens", "camera", "composition"];

function loadVibe(explicit) {
  const file = explicit
    ? path.resolve(cwd, explicit)
    : [path.join(cwd, "vibe.json"), path.join(cwd, "..", "vibe.json")].find((f) =>
        fs.existsSync(f)
      );
  if (!file || !fs.existsSync(file)) return null;
  try {
    const v = JSON.parse(fs.readFileSync(file, "utf8"));
    return { ...v, _file: file };
  } catch (e) {
    die(`vibe file is not valid JSON: ${file}\n  ${e.message}`);
  }
}

function lockString(vibe, realism) {
  if (!vibe?.lock) return null;
  const l = { ...vibe.lock };
  // an influencer is not carrying cinema gear — swapping the stock for a phone
  // is the single lever that turns "nice AI render" into "they shot this"
  if (realism ?? vibe.realism) l.stock = "iPhone";
  const parts = LEVERS.map((k) => l[k]).filter(Boolean);
  if (!parts.length) return null;
  const head = l.stock ? `Shot on ${parts.shift()}` : parts.shift();
  return [head, ...parts].join(", ") + ".";
}

/* ---------- image style ----------
 * The lock keeps the WORLD consistent. The style decides what MEDIUM that
 * world is rendered in. Photoreal is one option out of eight, and for a brand
 * that wants a character without generating a real person, char3d and cartoon
 * sidestep the likeness problem completely. One style per carousel. */
const STYLES = {
  photoreal:
    "Photographic. Real optics, real depth of field, natural imperfection in " +
    "the surfaces. Not a render, not an illustration.",
  char3d:
    "A stylised 3D character caricature: oversized head, simplified hands, " +
    "smooth matte-clay surfacing with soft subsurface scattering, exaggerated " +
    "but readable proportions, big clean silhouette. Pixar-adjacent form " +
    "language, NOT photoreal skin and NOT a realistic human.",
  soft3d:
    "Soft-body 3D render: rounded matte objects with subsurface scattering, " +
    "gentle specular highlights, no hard edges, no sharp reflections. Toy-like " +
    "and tactile, clean studio falloff, no visible polygon or wireframe.",
  cartoon:
    "Flat 2D vector illustration: bold confident outlines of even weight, " +
    "limited flat fills, no gradients, no photographic texture, generous " +
    "negative space. Editorial illustration, not clip art.",
  collage:
    "Analogue collage: cut-paper edges with visible torn fibre, halftone " +
    "photocopy texture, strips of tape, slight misalignment between layers, " +
    "a paper ground with real tooth. Handmade, not a digital filter.",
  riso:
    "Risograph screenprint: two ink layers only, visible misregistration " +
    "between them, coarse grain, flat spot colours, paper showing through the " +
    "ink. Print artefacts are wanted, not faults.",
  render:
    "Clean studio product render: one controlled surface, soft large key light, " +
    "accurate materials, precise contact shadow, nothing else in frame. " +
    "Catalogue-grade, cold and exact.",
  neon:
    "The subject built as physical light: glass neon tubing on a mounted panel " +
    "with visible brackets and cabling, hot core and wide soft halo, realistic " +
    "spill onto the surface behind it.",
};

const AR_HINT = {
  "4:5": "Vertical 4:5 portrait framing (1080x1350).",
  "1:1": "Square 1:1 framing (1080x1080).",
  "9:16": "Tall 9:16 vertical framing (1080x1920).",
  "16:9": "Wide 16:9 landscape framing (1920x1080).",
  "3:1": "Ultra-wide 3:1 panorama framing, composed to survive being cut into three squares.",
};

function buildPrompt(scene, preset, ar, raw, vibe) {
  if (raw) return scene;
  const p = PRESETS[preset] || PRESETS.none;
  const arHint = AR_HINT[ar] || AR_HINT["4:5"];
  const parts = [...p.lead];
  if (p.lead.length) parts.push("--- THE SCENE ---");
  parts.push(scene.trim());
  const style = STYLES[vibe?._style];
  if (style) parts.push(`MEDIUM — how this image is made: ${style}`);
  if (vibe?.subject) parts.push(`The subject is ${vibe.subject}.`);
  if (vibe?._lock)
    parts.push(`LOCKED VISUAL STYLE — apply exactly, every time: ${vibe._lock}`);
  // a recurring motif is cheap continuity: it makes twenty frames one series
  if (vibe?.signature)
    parts.push(`SIGNATURE ELEMENT — include somewhere in frame: ${vibe.signature}`);
  // naming the generic default you reject is what stops the model reverting to it
  if (vibe?.antiStyle) parts.push(`AVOID — this is not the look: ${vibe.antiStyle}`);
  parts.push(arHint, ...p.tail);
  // repeat the identity anchor last: first and last instructions carry most weight
  if (p.lead.includes(FACE_LOCK))
    parts.push(
      "FINAL CHECK: the face in your output must be the face in the reference " +
        "photograph. If it is not, you have failed the task."
    );
  return parts.join("\n\n");
}

/* ---------- one call ---------- */
async function generate({ out, prompt, refs, preset, ar, model, raw, vibe }) {
  const parts = [];
  for (const r of refs) {
    const abs = path.resolve(cwd, r);
    if (!fs.existsSync(abs)) die(`ref not found: ${abs}`);
    const ext = path.extname(abs).toLowerCase();
    const mime =
      ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    parts.push({
      inline_data: { mime_type: mime, data: fs.readFileSync(abs).toString("base64") },
    });
  }
  const finalPrompt = buildPrompt(prompt, preset, ar, raw, vibe);
  if (DRY) {
    console.log(
      `\n${"─".repeat(72)}\n${finalPrompt}\n${"─".repeat(72)}\n` +
        `  ${refs.length} reference image(s) attached · ${finalPrompt.length} chars · NOT SENT\n`
    );
    return;
  }
  parts.push({ text: finalPrompt });

  const body = {
    contents: [{ parts }],
    generationConfig: { responseModalities: ["IMAGE"] },
  };
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${KEY}`;

  let json;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    json = await res.json();
    if (res.ok) break;
    const retriable = res.status === 429 || res.status >= 500;
    console.error(`  attempt ${attempt} → ${res.status} ${JSON.stringify(json).slice(0, 240)}`);
    if (!retriable || attempt === 3) process.exit(1);
    await new Promise((r) => setTimeout(r, attempt * 4000));
  }

  const outParts = json.candidates?.[0]?.content?.parts || [];
  const imgPart = outParts.find((p) => p.inlineData || p.inline_data);
  if (!imgPart) {
    const reason = json.candidates?.[0]?.finishReason || "unknown";
    const textBack = outParts.find((p) => p.text)?.text?.slice(0, 300) || "";
    die(`no image returned (finishReason=${reason}) ${textBack}`);
  }

  const absOut = path.resolve(cwd, out);
  fs.mkdirSync(path.dirname(absOut), { recursive: true });
  fs.writeFileSync(absOut, Buffer.from((imgPart.inlineData || imgPart.inline_data).data, "base64"));
  const trimmed = args.notrim ? null : await trimBorder(absOut);
  console.log(
    `  ✓ ${out}  ${(fs.statSync(absOut).size / 1024).toFixed(0)}kb` +
      (trimmed ? `  · trimmed a rendered border ${trimmed}` : "")
  );
}

/* ---------- run ---------- */
const DRY = Boolean(args.dry);
const KEY = DRY ? "dry-run" : loadGeminiKey();
const model = args.model || process.env.MODEL || "gemini-3-pro-image";

const vibe = args.novibe ? null : loadVibe(args.vibe);
if (vibe) {
  vibe._lock = lockString(vibe, args.realism ? true : undefined);
  vibe._style = args.style || vibe.style || null;
  if (vibe._style && !STYLES[vibe._style])
    die(`unknown --style=${vibe._style}. One of: ${Object.keys(STYLES).join(", ")}`);
  console.log(`  vibe: ${path.relative(cwd, vibe._file) || vibe._file}`);
  if (vibe._lock) console.log(`  lock: ${vibe._lock}`);
} else if (args.style) {
  // style without a vibe file still works
  if (!STYLES[args.style]) die(`unknown --style=${args.style}. One of: ${Object.keys(STYLES).join(", ")}`);
} else if (!args.novibe) {
  console.warn(
    "  ! no vibe.json — every image will drift into its own look.\n" +
      "    Write one (six levers) before you generate a set. See references/photo-direction.md."
  );
}

const jobs = [];
if (args.batch) {
  const spec = JSON.parse(fs.readFileSync(path.resolve(cwd, args.batch), "utf8"));
  for (const j of spec.shots || spec) {
    jobs.push({
      out: j.out,
      prompt: j.prompt,
      refs: (j.ref ? String(j.ref).split(",") : spec.ref ? String(spec.ref).split(",") : []).filter(Boolean),
      preset: j.preset || spec.preset || "none",
      ar: j.ar || spec.ar || "4:5",
      model: j.model || spec.model || model,
      raw: Boolean(j.raw),
      vibe: vibe || (j.style || spec.style ? { _style: j.style || spec.style } : null),
    });
  }
} else {
  if (!args.out) die("--out is required");
  if (!args.prompt) die("--prompt is required");
  const n = Number(args.n || 1);
  const refs = (args.ref ? String(args.ref).split(",") : []).filter(Boolean);
  const preset = args.preset || "none";
  if (preset.startsWith("face-lock") && refs.length === 0)
    die(`--preset=${preset} requires --ref=<photo of the real person>`);
  if (preset === "face-lock" && Number(args.n || 1) === 1)
    console.warn(
      "  note: front-on AI faces drift. Consider --n=3 and pick the closest,\n" +
        "        or --preset=face-lock-back if the face is not the point."
    );
  for (let i = 0; i < n; i += 1) {
    const out =
      n === 1
        ? args.out
        : args.out.replace(/(\.[a-z]+)$/i, `-${i + 1}$1`);
    jobs.push({ out, prompt: args.prompt, refs, preset, ar: args.ar || "4:5", model, raw: Boolean(args.raw),
                vibe: vibe || (args.style ? { _style: args.style } : null) });
  }
}

console.log(`gen.mjs · ${model} · ${jobs.length} image(s)`);
for (const job of jobs) {
  console.log(`→ ${job.out}  [${job.preset}${job.refs.length ? ` · ${job.refs.length} ref` : ""}]`);
  await generate(job);
}
console.log("done");
