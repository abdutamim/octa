/* Shared resolution for the carousel-forge scripts.
 * The scripts run from whatever project you point them at, so nothing here
 * may assume it lives next to the project's node_modules or its .env. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/** Walk up from `start` collecting every node_modules/<name> that exists. */
function walkUpFor(start, name) {
  const hits = [];
  let dir = path.resolve(start);
  for (let i = 0; i < 12; i += 1) {
    const p = path.join(dir, "node_modules", name);
    if (fs.existsSync(p)) hits.push(p);
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return hits;
}

/**
 * Load a native dep (sharp, playwright) from wherever it happens to live.
 * Order: explicit env override → bare require → up from the project →
 * up from the skill → any sibling project on this machine that has it.
 */
export const sharedDeps = path.join(os.homedir(), ".carousel-forge", "node_modules");

export function requireDep(name, { projectDir = process.cwd(), optional = false } = {}) {
  const envKey = `CAROUSEL_${name.toUpperCase()}_PATH`;
  const candidates = [
    process.env[envKey],
    name,
    ...walkUpFor(projectDir, name),
    path.join(sharedDeps, name), // install once, use from every project
    ...walkUpFor(here, name),
  ].filter(Boolean);

  for (const c of candidates) {
    try {
      return require(c);
    } catch {}
  }

  if (optional) return null;
  console.error(
    `carousel-forge: could not load "${name}".\n` +
      `  Install once for every project:  npm i --prefix "${path.dirname(sharedDeps)}" ${name}\n` +
      `  or just in this project:         npm i ${name}\n` +
      `  or point at an existing copy:    set ${envKey}=<path to node_modules/${name}>`
  );
  process.exit(1);
}

/**
 * Find a Gemini API key. Prints where it came from, because a silent fallback
 * to the wrong key costs an hour of 429s that look like rate limits.
 */
export function loadGeminiKey({ quiet = false } = {}) {
  const readKey = (file) => {
    try {
      const m = fs
        .readFileSync(file, "utf8")
        .match(/^\s*GEMINI_API_KEY\s*=\s*(.+)$/m);
      return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
    } catch {
      return null;
    }
  };

  if (process.env.GEMINI_API_KEY) {
    if (!quiet) console.log("  key: $GEMINI_API_KEY");
    return process.env.GEMINI_API_KEY.trim();
  }

  const files = [
    process.env.GEMINI_ENV_FILE,
    path.join(process.cwd(), ".env"),
    path.join(os.homedir(), ".carousel-forge.env"),
    path.resolve(here, "..", ".env"),
  ].filter(Boolean);

  for (const f of files) {
    const k = readKey(f);
    if (k) {
      if (!quiet) console.log(`  key: ${f}`);
      return k;
    }
  }

  console.error(
    "carousel-forge: no GEMINI_API_KEY found. Set one of:\n" +
      "  $env:GEMINI_API_KEY = '...'\n" +
      `  ${path.join(os.homedir(), ".carousel-forge.env")}   (GEMINI_API_KEY=...)\n` +
      "  ./.env in the project\n" +
      "  $GEMINI_ENV_FILE=<path to an env file>\n\n" +
      "NOTE: image generation needs a key with BILLING ENABLED. A free-tier key\n" +
      "returns 429 with 'limit: 0' on every image model — waiting will not help."
  );
  process.exit(1);
}

export const skillDir = path.resolve(here, "..");
