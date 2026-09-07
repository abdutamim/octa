// Collects every skill/agent definition on this machine into tamim-os/skills-library
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const HOME = 'C:/Users/Admin';
const OUT = 'C:/Users/Admin/Desktop/Projects/octa/skills-library';
const CLAUDE_APP = `${HOME}/AppData/Roaming/Claude/local-agent-mode-sessions/skills-plugin/afea3e1f-024e-4308-87b9-f4e8b80e84c5/708f3dc2-784b-483d-88ed-ecef87a8724d/skills`;

// order = priority for the canonical name when contents are identical
const SOURCES = [
  { id: 'claude-app', label: 'Claude app uploaded skills', root: CLAUDE_APP },
  { id: 'claude-code', label: '~/.claude/skills (Claude Code user skills)', root: `${HOME}/.claude/skills` },
  { id: 'marketing-os', label: 'Documents/marketing-os (own Marketing OS plugin)', root: `${HOME}/Documents/marketing-os/skills` },
  { id: 'portfolio', label: 'Tamim Portfolio/.claude/skills (own carousel skills)', root: `${HOME}/Desktop/Tamim Portfolio/.claude/skills` },
  { id: 'outfred', label: 'Projects/Outfred/skill', root: `${HOME}/Desktop/Projects/Outfred/skill` },
  { id: 'codex', label: '~/.codex/skills', root: `${HOME}/.codex/skills` },
];
const SKIP_DIRS = new Set(['node_modules', '.git', '__pycache__', '.venv', '.DS_Store']);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}
function dirHash(dir) {
  const files = walk(dir).sort();
  const h = crypto.createHash('md5');
  let size = 0;
  for (const f of files) { const b = fs.readFileSync(f); size += b.length; h.update(path.relative(dir, f)); h.update(b); }
  return { hash: h.digest('hex').slice(0, 10), size, files: files.length };
}
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}
function frontmatter(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const fm = {}; let key = null;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (kv && !line.startsWith(' ')) { key = kv[1]; fm[key] = kv[2].replace(/^[>|]-?\s*$/, '').replace(/^"(.*)"$/, '$1'); }
    else if (key && /^\s+/.test(line)) fm[key] = (fm[key] + ' ' + line.trim()).trim();
  }
  return fm;
}

const DEPT_RULES = [
  ['sales', /^(cold-email|prospecting|sales-|lead-magnets|signup|onboarding|referrals|revops|bid-scout|proposal|client-researcher)/],
  ['marketing', /^(ads|ad-creative|ab-testing|ai-seo|ai-search|analytics|aso|brand-building|bedo-|bulk-seo|co-marketing|community|competitor|content-|copy|cro|customer-research|directory|emails|free-tools|growth-os|launch|marketing-|offers|page-conversion|paywalls|performance-marketer|personal-branding|popups|pricing|product-marketing|programmatic|public-relations|schema|seo-|site-architecture|sms|social|video|website-structure|churn|image$)/],
  ['design', /^(carousel|tamim-carousel|photoshop|ui-forge|ui-ux|web-ui|frontend-ui|impeccable|design)/],
  ['documents', /^(docx|pdf|pptx|xlsx)$/],
  ['thinking', /^(concept-fan|inversion|lateral|provocation|random-stimulus|scamper|six-hats|worst-idea|fact-checker)$/],
  ['engineering', /^(agents-sdk|cloudflare|durable|sandbox|turnstile|web-perf|workers|wrangler|mcp-server|speckit|skill-creator|code-reviewer)/],
  ['commerce', /^(prism-store|shopify)/],
  ['personal-os', /^(morning|schedule|consolidate-memory|import-memory|explain-usage|setup-cowork|stop-slop|vault-librarian)/],
];
const dept = (n) => (DEPT_RULES.find(([, r]) => r.test(n)) || ['other'])[0];

// only the generated trees are wiped; README.md, MERGE-LOG.md and REVIEW.md are hand-written and kept
fs.rmSync(`${OUT}/skills`, { recursive: true, force: true });
fs.rmSync(`${OUT}/agents`, { recursive: true, force: true });
fs.mkdirSync(`${OUT}/skills`, { recursive: true });
const manifest = { generated: new Date().toISOString(), sources: SOURCES.map(s => ({ id: s.id, label: s.label, root: s.root })), skills: [], agents: [], duplicates: [] };

// pass 1: scan every source, skip byte-identical copies
const found = []; const seen = new Map();
for (const src of SOURCES) {
  if (!fs.existsSync(src.root)) { console.warn('missing', src.root); continue; }
  for (const e of fs.readdirSync(src.root, { withFileTypes: true })) {
    const dir = path.join(src.root, e.name);
    if (!fs.statSync(dir).isDirectory() || !fs.existsSync(path.join(dir, 'SKILL.md'))) continue;
    const { hash, size, files } = dirHash(dir);
    const name = e.name.replace(/-main$/, '');
    if (seen.has(hash)) { manifest.duplicates.push({ name, source: src.id, identicalTo: seen.get(hash), path: dir }); continue; }
    seen.set(hash, { name, source: src.id });
    found.push({ name, source: src.id, dir, hash, size, files });
  }
}
// ---- merge decisions (reviewed by diff on 2026-09-05, see skills-library/MERGE-LOG.md) ----
// Same skill published under another name: fold into the canonical name.
const ALIAS = {
  'shopify-theme-builder': 'prism-store-builder', 'impeccable': 'frontend-ui-polisher', 'ui-ux-pro-max': 'web-ui-designer',
  'bulk-seo-pages': 'programmatic-seo', 'page-conversion-optimizer': 'cro', 'schema-markup-builder': 'schema',
  'seo-site-audit': 'seo-audit', 'website-structure-planner': 'site-architecture', 'ai-search-optimizer': 'ai-seo',
};
// Which source wins when the same name exists in several places with different content.
// marketing-os is Bedo's own plugin and carries v2.0.1 + cross-links; claude-app wins where it is the newer rewrite.
const PREFER = {
  'performance-marketer': 'claude-app', 'sales-enablement': 'marketing-os', 'ai-seo': 'marketing-os', 'social': 'marketing-os',
  'ads': 'marketing-os', 'image': 'marketing-os', 'video': 'marketing-os', 'pdf': 'claude-app',
};
const DEFAULT_PREFER = ['marketing-os', 'claude-app', 'claude-code', 'portfolio', 'outfred', 'codex'];
// Variants that are a different skill under the same name: keep them under a new name.
const KEEP_AS = { 'sales-operator@claude-app': 'sales-operator-controlled' };

// pass 2: resolve canonical per name; non-canonical variants are dropped (or renamed via KEEP_AS)
for (const f of found) f.name = ALIAS[f.name] || f.name;
const byName = {};
for (const f of found) (byName[f.name] ||= []).push(f);
const chosen = [];
for (const [name, list] of Object.entries(byName)) {
  const order = [PREFER[name], ...DEFAULT_PREFER].filter(Boolean);
  list.sort((a, b) => order.indexOf(a.source) - order.indexOf(b.source));
  list.forEach((f, i) => {
    const keep = KEEP_AS[`${name}@${f.source}`];
    if (i === 0) { f.folder = name; chosen.push(f); }
    else if (keep) { f.folder = keep; f.name = keep; chosen.push(f); }
    else manifest.duplicates.push({ name, source: f.source, identicalTo: name, path: f.dir, note: 'superseded variant (see MERGE-LOG.md)' });
  });
}
found.length = 0; found.push(...chosen);
for (const f of found) {
  copyDir(f.dir, `${OUT}/skills/${f.folder}`);
  const fm = frontmatter(fs.readFileSync(path.join(f.dir, 'SKILL.md'), 'utf8'));
  const rec = { name: f.name, folder: f.folder, source: f.source, sourcePath: f.dir, department: dept(f.name), description: (fm.description || '').slice(0, 400), sizeKB: Math.round(f.size / 1024), files: f.files, hash: f.hash };
  if (f.folder !== f.name) rec.variantOf = f.name;
  manifest.skills.push(rec);
}
for (const d of manifest.duplicates) if (typeof d.identicalTo === 'object') d.identicalTo = (found.find(f => f.name === (ALIAS[d.identicalTo.name] || d.identicalTo.name)) || {}).folder || d.name;

// post-merge ports: content that only existed in a dropped variant and is worth keeping
const PM_COURSE = `${HOME}/Documents/marketing-os/skills/performance-marketer/SKILL.md`;
if (fs.existsSync(PM_COURSE)) fs.copyFileSync(PM_COURSE, `${OUT}/skills/performance-marketer/references/98_Course_Edition_SKILL.md`);
// normalize CRLF -> LF in markdown so future diffs show real changes only
for (const f of walk(`${OUT}/skills`).filter(p => /\.(md|json|csv|txt)$/i.test(p))) {
  const b = fs.readFileSync(f); if (b.includes('\r\n')) fs.writeFileSync(f, b.toString('utf8').replace(/\r\n/g, '\n'));
}

// agents
fs.mkdirSync(`${OUT}/agents/claude`, { recursive: true });
fs.mkdirSync(`${OUT}/agents/codex`, { recursive: true });
for (const f of fs.readdirSync(`${HOME}/.claude/agents`)) {
  fs.copyFileSync(`${HOME}/.claude/agents/${f}`, `${OUT}/agents/claude/${f}`);
  const fm = frontmatter(fs.readFileSync(`${HOME}/.claude/agents/${f}`, 'utf8'));
  manifest.agents.push({ name: fm.name || f, runtime: 'claude-code', file: `agents/claude/${f}`, description: fm.description || '', department: dept(fm.name || f) });
}
for (const f of fs.readdirSync(`${HOME}/.codex/agents`)) {
  const t = fs.readFileSync(`${HOME}/.codex/agents/${f}`, 'utf8');
  fs.copyFileSync(`${HOME}/.codex/agents/${f}`, `${OUT}/agents/codex/${f}`);
  const name = (t.match(/^name\s*=\s*"(.*)"/m) || [])[1] || f;
  const description = (t.match(/^description\s*=\s*"(.*)"/m) || [])[1] || '';
  manifest.agents.push({ name, runtime: 'codex', file: `agents/codex/${f}`, description: description.slice(0, 300), department: f.split('-')[0] });
}

manifest.skills.sort((a, b) => a.department.localeCompare(b.department) || a.name.localeCompare(b.name));
fs.writeFileSync(`${OUT}/MANIFEST.json`, JSON.stringify(manifest, null, 2));

// catalog
const groups = {};
for (const s of manifest.skills) (groups[s.department] ||= []).push(s);
let md = `# Skills Library Catalog\n\nGenerated ${manifest.generated.slice(0, 10)}. ${manifest.skills.length} unique skills, ${manifest.agents.length} agents, ${manifest.duplicates.length} identical copies skipped.\n\nSources:\n${SOURCES.map(s => `- **${s.id}** — ${s.label}\n  \`${s.root}\``).join('\n')}\n\n`;
for (const [d, list] of Object.entries(groups)) {
  md += `## ${d} (${list.length})\n\n| Skill | Source | Size | Description |\n|---|---|---|---|\n`;
  for (const s of list) md += `| \`${s.folder}\` | ${s.source} | ${s.sizeKB} KB | ${s.description.replace(/\|/g, '/').slice(0, 180)} |\n`;
  md += '\n';
}
md += `## Agents (${manifest.agents.length})\n\n### Claude Code agents\n\n| Agent | Description |\n|---|---|\n`;
for (const a of manifest.agents.filter(a => a.runtime === 'claude-code')) md += `| \`${a.name}\` | ${a.description} |\n`;
md += `\n### Codex agent personas (${manifest.agents.filter(a => a.runtime === 'codex').length})\n\nGrouped by prefix: `;
const cx = {}; for (const a of manifest.agents.filter(a => a.runtime === 'codex')) cx[a.department] = (cx[a.department] || 0) + 1;
md += Object.entries(cx).map(([k, v]) => `${k} (${v})`).join(', ') + `. Full list in MANIFEST.json.\n\n## Skipped identical copies\n\n`;
for (const d of manifest.duplicates) md += `- \`${d.name}\` from ${d.source} = \`${d.identicalTo}\`\n`;
fs.writeFileSync(`${OUT}/CATALOG.md`, md);

console.log('skills', manifest.skills.length, 'agents', manifest.agents.length, 'dupes', manifest.duplicates.length);
console.log('variants:', manifest.skills.filter(s => s.variantOf).map(s => s.folder).join(', '));
console.log('total MB', (manifest.skills.reduce((a, s) => a + s.sizeKB, 0) / 1024).toFixed(1));
for (const [d, l] of Object.entries(groups)) console.log(d, l.length);
