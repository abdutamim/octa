// Hand-written review of every folder in skills-library/skills.
// Run: node scripts/skills-review.mjs  -> writes skills-library/REVIEW.md and stamps MANIFEST.json
// verdict: core | keep | merge:<target> | reference | client | drop
// autonomy: auto (can run on a schedule) | assisted (agent drafts, human approves) | led (human does it, agent advises)
import fs from 'node:fs';

const LIB = 'C:/Users/Admin/Desktop/Projects/octa/skills-library';

// dept, verdict, autonomy, where it plugs into Tamim OS
const R = {
  // ---------- SALES / DEALS ----------
  'prospecting':        ['sales', 'core', 'auto', 'Weekly lead-list job: ICP from company brain → candidate list → scored CSV into Clients page as "prospects". Feeds cold-email.'],
  'cold-email':         ['sales', 'core', 'assisted', 'Drafts first-touch + follow-up sequence per prospect; queued in Inbox for approval before send.'],
  'sales-operator': ['sales', 'core', 'assisted', 'Operative sales coach: classify stage/channel/signal, ethics check, smallest useful output (next question, CRM note, follow-up). Runs after every client call note.'],
  'sales-operator-controlled': ['sales', 'reference', 'led', 'Governance-gated controlled draft (ethics screen, buyer-state map, stall diagnosis) + 14 book summaries (SPIN, Challenger, Gap Selling, Getting to Yes, Influence, JOLT) + real-estate briefing template. Research library behind sales-operator; not a job.'],
  'sales-enablement':   ['deals', 'keep', 'assisted', 'One-pagers, objection docs, demo scripts per service. Output goes to DocumentEditor.'],
  'offers':             ['deals', 'core', 'led', 'Offer design (value stack, guarantee, scarcity) before any proposal. Runs once per service, result stored in company brain.'],
  'pricing':            ['deals', 'keep', 'led', 'Tiering and price-increase logic for Tamim services; pairs with offers.'],
  'revops':             ['deals', 'keep', 'assisted', 'Lead lifecycle stages + scoring model for the Clients page pipeline. Use once to design the stages.'],
  'lead-magnets':       ['sales', 'keep', 'assisted', 'Plan gated PDFs/templates; PDF module renders them.'],
  'signup':             ['sales', 'keep', 'led', 'Client-site signup flow audits (for web clients).'],
  'onboarding':         ['operations', 'keep', 'assisted', 'Client onboarding checklist generator after a deal closes → tasks created automatically.'],
  'referrals':          ['sales', 'keep', 'led', 'Referral program design for Tamim and for clients.'],

  // ---------- MARKETING (strategy) ----------
  'marketing-os-workflow': ['marketing', 'core', 'assisted', 'Master sequence for a full client marketing OS. This is the "Marketing department head": routes to every other marketing skill.'],
  'marketing-plan':     ['marketing', 'core', 'assisted', '13-section AARRR plan per client. Output = the client deliverable, stored as a document.'],
  'performance-marketer': ['marketing', 'core', 'assisted', 'Own Arabic diagnosis protocol A→Z (intake, persona, gap, offer, copy, funnel, ads, analytics). Default brain for any ads/growth request. 53 files incl. assists/ prompts and 2 book summaries.'],
  'growth-os':          ['marketing', 'core', 'assisted', 'Own Growth OS v3: strategy → production → publishing (Gemini images, Remotion reels, Meta publish). Has tamim profiles (30 posts, 10 videos, 60-day plan). This is the Tamim brand content engine.'],
  'brand-building':     ['marketing', 'core', 'led', 'Own 9-stage personal-brand methodology (niche, profile, pillars, hooks, filming, algorithm). Used by personal-branding and bedo-brand-engine.'],
  'personal-branding':  ['marketing', 'core', 'led', 'Arabic personal-brand system (mindset, niche, pillars, viral script, monetization). Overlaps brand-building; keep both, brand-building is the newer structure.'],
  'bedo-brand-engine':  ['marketing', 'client', 'assisted', 'Client-specific: Bedo Mousa real-estate brand. Template for how a per-client "brand engine" skill looks. Do not run for other clients.'],
  'content-strategy':   ['marketing', 'keep', 'assisted', 'Pillars + topic clusters for a client site/blog.'],
  'marketing-ideas':    ['marketing', 'keep', 'led', '139-idea library; used by marketing-plan cross-reference.'],
  'marketing-psychology': ['marketing', 'keep', 'led', 'Mental models reference for copy and offers.'],
  'product-marketing':  ['marketing', 'core', 'led', 'Creates the product/positioning context doc = the company-brain intake for a client. Run first for every new client.'],
  'customer-research':  ['intelligence', 'keep', 'assisted', 'Persona/VOC synthesis from transcripts, reviews, Reddit. Feeds performance-marketer step 3.'],
  'competitor-profiling': ['intelligence', 'core', 'auto', 'Monthly competitor dossiers from URLs. Needs Firecrawl/DataForSEO or fall back to WebFetch. Stored in vault.'],
  'competitors':        ['marketing', 'keep', 'assisted', '"X alternative" / "vs" pages from profiles. Client SEO deliverable.'],
  'launch':             ['marketing', 'keep', 'assisted', 'Launch plan (ORB channels, 5 phases) for client products and for Tamim OS itself.'],
  'co-marketing':       ['marketing', 'keep', 'led', 'Partner campaign ideas. Low priority.'],
  'community-marketing': ['marketing', 'keep', 'led', 'Community playbooks. Low priority for a services business.'],
  'public-relations':   ['marketing', 'keep', 'assisted', 'Press page, journalist pitches, newsjacking. Occasional.'],
  'free-tools':         ['marketing', 'keep', 'led', 'Engineering-as-marketing ideas (calculators, graders). Pairs with the build path (octa-code).'],

  // ---------- MARKETING (execution) ----------
  'copywriting':        ['marketing', 'core', 'assisted', 'Landing/hero/pricing copy in brand voice. Used by proposals, client sites, Tamim site.'],
  'copy-editing':       ['marketing', 'core', 'auto', 'Seven-sweeps pass on any draft. Run automatically on every outbound text before approval.'],
  'stop-slop':          ['marketing', 'core', 'auto', 'Strip AI tells from prose. Chain after copy-editing on every generated text (Arabic needs its own phrase list).'],
  'social':             ['marketing', 'core', 'assisted', 'Posts, threads, reels scripts, repurposing, social listening. Feeds the social queue → PHP publisher.'],
  'ads':                ['marketing', 'core', 'assisted', 'Campaign structure, targeting, bidding for Meta/Google. Client ads work.'],
  'ad-creative':        ['marketing', 'core', 'assisted', 'Bulk ad copy variations + iterate from performance data. Pair with Zeely-style static-ad prompt templates.'],
  'ab-testing':         ['marketing', 'keep', 'led', 'Experiment design and sample size. Client CRO work.'],
  'analytics':          ['marketing', 'keep', 'led', 'GA4/GTM tracking plans for client sites.'],
  'emails':             ['marketing', 'keep', 'assisted', 'Lifecycle/drip sequences for clients (welcome, nurture, win-back).'],
  'sms':                ['marketing', 'keep', 'led', 'SMS flows + compliance. Rare in Egypt market; keep for ecommerce clients.'],
  'popups':             ['marketing', 'keep', 'led', 'Popup/overlay CRO for client sites.'],
  'paywalls':           ['marketing', 'keep', 'led', 'In-app upgrade screens. Only for SaaS clients.'],
  'churn-prevention':   ['customer', 'keep', 'led', 'Cancel flows and dunning. SaaS/subscription clients only.'],
  'cro':                ['marketing', 'core', 'assisted', 'Page conversion audit from a URL. Runs as the first step on any client site.'],
  'seo-audit':          ['marketing', 'core', 'auto', 'Technical + on-page audit from a URL. Can run monthly per client site.'],
  'ai-seo':             ['marketing', 'keep', 'assisted', 'AI-search visibility (llms.txt, OKF). Newest, most complete version.'],
  'schema':             ['marketing', 'keep', 'auto', 'JSON-LD generator for client pages.'],
  'programmatic-seo':   ['marketing', 'keep', 'assisted', 'Template pages at scale (city/keyword). Client SEO projects.'],
  'site-architecture':  ['marketing', 'keep', 'assisted', 'Sitemap + navigation + URL plan for new client sites. First step of a web project.'],
  'directory-submissions': ['marketing', 'keep', 'auto', 'Backlink directory campaign with tracker CSV. Launch-time job.'],
  'aso':                ['marketing', 'keep', 'led', 'App-store listing audits. Only for app clients.'],
  'image':              ['design', 'keep', 'assisted', 'Marketing image generation/optimization guide (model choice, prompts, WebP). Pairs with growth-os rendering.'],
  'video':              ['design', 'keep', 'assisted', 'AI/programmatic video (Remotion, HeyGen, Veo). growth-os already uses Remotion; this is the reference.'],

  // ---------- DESIGN ----------
  'carousel-forge':     ['design', 'core', 'assisted', 'Own measured carousel system (94 slides, 7 laws, HTML→PNG renderer, image gen). Production engine for posts. 17 MB corpus.'],
  'carousel-studio':    ['design', 'core', 'assisted', 'Arabic carousel workflow for any brand: diagnosis → hook → chassis → render. Front door to carousel-forge.'],
  'tamim-carousel':     ['design', 'core', 'assisted', 'Same workflow locked to Tamim brand rules and pillars. Use for Tamim posts only.'],
  'photoshop-posts':    ['design', 'core', 'assisted', 'HTML design → layered PSD with live text → client-editable variants. Deliverable pipeline for design clients.'],
  'photoshop-driver':   ['design', 'core', 'assisted', 'Low-level Photoshop automation (ExtendScript, psd-tools, Arabic). Used by photoshop-posts.'],
  'ui-forge':           ['design', 'core', 'assisted', 'Own UI system from 50 video teardowns with measured rules. Use for client landing pages/dashboards and for Tamim OS itself. 15 MB corpus.'],
  'frontend-ui-polisher': ['design', 'keep', 'assisted', 'Command-based UI polish (audit/bolder/clarify/animate). Apache. Use on existing client UIs.'],
  'web-ui-designer':    ['design', 'keep', 'led', 'Style/palette/font databases (CSV) + stack rules. Reference when starting a design system.'],

  // ---------- COMMERCE ----------
  'prism-store-builder': ['commerce', 'keep', 'assisted', 'HTML design → PRISM Shopify theme. Shopify client projects.'],

  // ---------- DOCUMENTS ----------
  'docx':               ['documents', 'core', 'auto', 'Word contracts/reports. Alternative to the in-app PDF path when clients want editable files.'],
  'xlsx':               ['documents', 'core', 'auto', 'Invoices/quotes/trackers as spreadsheets; financial models.'],
  'pptx':               ['documents', 'core', 'assisted', 'Pitch decks and client presentations from sales-enablement output.'],
  'pdf':                ['documents', 'core', 'auto', 'Read/merge/fill PDFs; extract data from client-sent PDFs into tasks/invoices.'],

  // ---------- THINKING ----------
  'lateral':            ['thinking', 'keep', 'led', 'Router to the other de Bono tools. Use in strategy sessions.'],
  'concept-fan':        ['thinking', 'keep', 'led', 'Widen a decision.'],
  'inversion':          ['thinking', 'keep', 'led', 'Flip assumptions.'],
  'provocation':        ['thinking', 'keep', 'led', 'Po technique.'],
  'random-stimulus':    ['thinking', 'keep', 'led', 'Force-fit ideation; good for hooks and campaign angles.'],
  'scamper':            ['thinking', 'keep', 'led', 'Variations of an existing idea (offers, posts).'],
  'six-hats':           ['thinking', 'keep', 'led', 'Structured decision review.'],
  'worst-idea':         ['thinking', 'keep', 'led', 'Reverse brainstorming.'],
  'fact-checker':       ['intelligence', 'keep', 'auto', 'Verify claims in proposals/content before publishing. Chain into the approval gate.'],

  // ---------- ENGINEERING ----------
  'skill-creator':      ['engineering', 'core', 'assisted', 'The master agent uses this to author new skills + evals when no skill fits. Build path #1.'],
  'mcp-server-builder': ['engineering', 'keep', 'assisted', 'When a client integration needs an MCP server (Notion, CRM). Build path #2 helper.'],
  'speckit-specify':    ['engineering', 'keep', 'assisted', 'Spec-kit flow: spec → plan → tasks → implement. Lighter alternative to octa-code for small tools.'],
  'speckit-plan':       ['engineering', 'keep', 'assisted', 'See speckit-specify.'],
  'speckit-tasks':      ['engineering', 'keep', 'assisted', 'See speckit-specify.'],
  'speckit-implement':  ['engineering', 'keep', 'assisted', 'See speckit-specify.'],
  'speckit-analyze':    ['engineering', 'keep', 'auto', 'Consistency check across spec/plan/tasks.'],
  'speckit-checklist':  ['engineering', 'keep', 'auto', 'Requirement checklists.'],
  'speckit-constitution': ['engineering', 'keep', 'led', 'Project principles doc.'],
  'speckit-taskstoissues': ['engineering', 'keep', 'auto', 'Tasks → GitHub issues.'],
  'speckit-git-commit': ['engineering', 'reference', 'auto', 'Git helper; octa-code covers this.'],
  'speckit-git-feature': ['engineering', 'reference', 'auto', 'Git helper.'],
  'speckit-git-initialize': ['engineering', 'reference', 'auto', 'Git helper.'],
  'speckit-git-remote': ['engineering', 'reference', 'auto', 'Git helper.'],
  'speckit-git-validate': ['engineering', 'reference', 'auto', 'Git helper.'],
  'cloudflare':         ['engineering', 'reference', 'led', '320-file Cloudflare docs mirror. Needed only when deploying client sites/workers on Cloudflare.'],
  'agents-sdk':         ['engineering', 'reference', 'led', 'Cloudflare Agents SDK. Only if Tamim OS ever gets a cloud agent runtime.'],
  'durable-objects':    ['engineering', 'reference', 'led', 'Cloudflare DO reference.'],
  'workers-best-practices': ['engineering', 'reference', 'led', 'Cloudflare Workers review rules.'],
  'wrangler':           ['engineering', 'reference', 'led', 'Cloudflare CLI reference.'],
  'cloudflare-email-service': ['engineering', 'reference', 'led', 'Transactional email via Cloudflare. Possible send path for cold-email later.'],
  'turnstile-spin':     ['engineering', 'reference', 'led', 'CAPTCHA setup for client forms.'],
  'web-perf':           ['engineering', 'keep', 'auto', 'Core Web Vitals audit via Chrome DevTools. Pairs with seo-audit for client sites.'],
  'sandbox-stable':     ['engineering', 'drop', 'led', 'Cloudflare Sandbox SDK. No use in this app.'],
  'sandbox-next':       ['engineering', 'drop', 'led', 'No use.'],
  'sandbox-migrate-to-next': ['engineering', 'drop', 'led', 'No use.'],
  'cloudflare-one':     ['engineering', 'drop', 'led', 'Zero Trust networking. No use.'],
  'cloudflare-one-migrations': ['engineering', 'drop', 'led', 'No use.'],

  // ---------- PERSONAL OS ----------
  'morning':            ['operations', 'keep', 'auto', 'Morning brief as HTML. The existing daily-brief.ts does this natively; borrow its section design.'],
  'schedule':           ['operations', 'reference', 'auto', 'Claude-app scheduled tasks. Tamim OS has its own triggers; reference for the workflow builder UX.'],
  'consolidate-memory': ['operations', 'reference', 'auto', 'Memory hygiene pattern; apply to the company brain (vault) monthly.'],
  'import-memory':      ['operations', 'drop', 'led', 'Claude-app specific.'],
  'explain-usage':      ['operations', 'drop', 'led', 'Claude-app specific.'],
  'setup-cowork':       ['operations', 'drop', 'led', 'Claude-app onboarding. Not applicable.'],
};

const manifest = JSON.parse(fs.readFileSync(`${LIB}/MANIFEST.json`, 'utf8'));
const missing = manifest.skills.filter(s => !R[s.folder]).map(s => s.folder);
const extra = Object.keys(R).filter(k => !manifest.skills.find(s => s.folder === k));
if (missing.length || extra.length) { console.error('unreviewed:', missing, 'unknown:', extra); process.exit(1); }

for (const s of manifest.skills) {
  const [dept, verdict, autonomy, use] = R[s.folder];
  Object.assign(s, { department: dept, verdict, autonomy, use });
}
fs.writeFileSync(`${LIB}/MANIFEST.json`, JSON.stringify(manifest, null, 2));

const V = { core: 'Core: wire into a workflow now', keep: 'Keep: available in the library, run on demand', merge: 'Merge: delete this variant, keep the target', reference: 'Reference: docs the agent may read, never a job', client: 'Client-specific: template for per-client skills', drop: 'Drop: no use in Tamim OS' };
const byV = {}; for (const s of manifest.skills) (byV[s.verdict.split(':')[0]] ||= []).push(s);
const byD = {}; for (const s of manifest.skills.filter(s => !s.verdict.startsWith('merge') && s.verdict !== 'drop')) (byD[s.department] ||= []).push(s);

let md = `# Skills review\n\nReviewed ${manifest.generated.slice(0, 10)}: ${manifest.skills.length} folders. Every folder has a verdict, an autonomy grade and the place it plugs into Tamim OS.\n\n`;
md += `| Verdict | Count | Meaning |\n|---|---|---|\n`;
for (const [k, v] of Object.entries(V)) md += `| ${k} | ${(byV[k] || []).length} | ${v} |\n`;
md += `\nAutonomy: **auto** = can run on a schedule and report; **assisted** = agent produces the deliverable, human approves; **led** = human does the job, skill advises.\n\n`;
md += `## Working set by department\n\n`;
for (const [d, list] of Object.entries(byD).sort()) {
  md += `### ${d} (${list.length})\n\n| Skill | Verdict | Autonomy | Use in Tamim OS |\n|---|---|---|---|\n`;
  for (const s of list.sort((a, b) => (a.verdict === 'core' ? 0 : 1) - (b.verdict === 'core' ? 0 : 1) || a.name.localeCompare(b.name))) md += `| \`${s.folder}\` | ${s.verdict} | ${s.autonomy} | ${s.use} |\n`;
  md += '\n';
}
md += `## Merge list (delete after checking references/)\n\n| Variant | Keep instead | Note |\n|---|---|---|\n`;
for (const s of byV.merge || []) md += `| \`${s.folder}\` | \`${s.verdict.slice(6)}\` | ${s.use} |\n`;
md += `\n## Drop list\n\n`;
for (const s of byV.drop || []) md += `- \`${s.folder}\` — ${s.use}\n`;
fs.writeFileSync(`${LIB}/REVIEW.md`, md);
console.log('reviewed', manifest.skills.length, Object.fromEntries(Object.entries(byV).map(([k, v]) => [k, v.length])));
