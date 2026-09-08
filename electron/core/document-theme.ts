import { app } from 'electron'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { DocumentBrand } from '../types'

/**
 * The shared look for every client-facing document: invoices, contracts and
 * proposals. Lifted from Abdullah's business kit so what the app generates is
 * indistinguishable from what he sends by hand.
 *
 * RTL Arabic, near-black page, orange accent, Ping AR LT at weights 100/200.
 */

export interface DocumentAssets {
  fontThin: string
  fontExtraLight: string
  signature: string
}

let cached: DocumentAssets | undefined

function assetsDirectory(): string {
  // Bundled with the app rather than read from the user's Downloads folder: the
  // previous build loaded the Arabic font from a file that is trivially deleted
  // during a cleanup, and silently fell back to a different typeface.
  return app.isPackaged
    ? join(process.resourcesPath, 'documents')
    : join(app.getAppPath(), 'assets', 'documents')
}

async function readBase64(file: string): Promise<string> {
  return (await readFile(join(assetsDirectory(), file))).toString('base64')
}

export async function documentAssets(): Promise<DocumentAssets> {
  if (cached) return cached
  const [fontThin, fontExtraLight, signature] = await Promise.all([
    readBase64('PingAR-LT-Thin.otf').catch(() => ''),
    readBase64('PingAR-LT-ExtraLight.otf').catch(() => ''),
    readBase64('Abdullah-Tamim-Signature.png').catch(() => '')
  ])
  cached = { fontThin, fontExtraLight, signature }
  return cached
}

export function escapeHtml(value: string): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/** Arabic-Indic-friendly money formatting, always LTR so digits stay in order. */
export function money(minorUnits: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(minorUnits / 100)
}

export function arabicDate(ms: number): string {
  return new Intl.DateTimeFormat('ar-EG', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(new Date(ms))
}

/** Turns "#f25b1b" into "242,91,27" so the accent can drive rgba() shades too. */
function rgbChannels(hex: string): string {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim())
  if (!match) return '242,91,27'
  return [match[1], match[2], match[3]].map((part) => parseInt(part, 16)).join(',')
}

function styles(assets: DocumentAssets, brand: DocumentBrand): string {
  const face = (base64: string, weight: number): string =>
    base64
      ? `@font-face{font-family:PingKit;src:url(data:font/otf;base64,${base64}) format("opentype");font-weight:${weight}}`
      : ''
  const accent = /^#[0-9a-f]{6}$/i.test(brand.accent) ? brand.accent : '#f25b1b'
  const channels = rgbChannels(accent)
  return `
${face(assets.fontThin, 100)}
${face(assets.fontExtraLight, 200)}
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#0a0706;--card:#15110f;--card2:#100d0b;--white:#f6f2ee;--mut:#aaa19a;--mut2:#776e68;--orange:${accent};--accent-rgb:${channels};--line:rgba(255,255,255,.10)}
html,body{background:#171412;font-family:PingKit,"Noto Sans Arabic",Arial,sans-serif;font-weight:200;color:var(--white);-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{direction:rtl}
.page{position:relative;width:210mm;height:297mm;margin:0 auto;background:var(--bg);padding:14mm 14mm 13mm;overflow:hidden;page-break-after:always}
.page:last-of-type{page-break-after:auto}
.page:before{content:"";position:absolute;width:170mm;height:120mm;left:-45mm;top:-65mm;background:radial-gradient(circle,rgba(var(--accent-rgb),.28),rgba(var(--accent-rgb),.06) 45%,transparent 72%)}
.page:after{content:"";position:absolute;inset:0;background:linear-gradient(135deg,transparent 70%,rgba(var(--accent-rgb),.025));pointer-events:none}
.content{position:relative;z-index:2;height:100%}
.top{direction:ltr;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:5mm}
.brand{display:flex;flex-direction:column;gap:2px}
.brand strong{font:700 15pt Arial;color:var(--orange);letter-spacing:1px}
.brand small{font:8px Arial;color:var(--mut);letter-spacing:2px}
.meta{direction:rtl;text-align:right}
.meta b{display:block;color:var(--orange);font-size:9pt}
.meta span{font-size:7.5pt;color:var(--mut)}
.eyebrow{color:var(--orange);font-size:9pt;line-height:1.35;margin-bottom:3mm}
h1{font-size:31pt;line-height:1.25;font-weight:200}
h1 em{color:var(--orange);font-style:normal;font-weight:100}
.lead{font-size:10pt;line-height:1.85;color:var(--mut);margin-top:4mm}
.section-title{display:flex;align-items:center;gap:4mm;margin:7mm 0 4mm}
.section-title span{color:var(--orange);font-size:9.5pt;white-space:nowrap;line-height:1.3}
.section-title i{height:1px;flex:1;background:var(--line)}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:4mm}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm}
.card{background:var(--card);border:1px solid var(--line);border-radius:4mm;padding:5mm;break-inside:avoid}
.card h3{font-size:12pt;margin-bottom:2mm;font-weight:200}
.card p,.card li{font-size:8.3pt;line-height:1.7;color:var(--mut)}
.card ul{list-style:none}
.card li{position:relative;padding-right:4mm;margin:1mm 0}
.card li:before{content:"";position:absolute;right:0;top:2.4mm;width:1.6mm;height:1.6mm;border-radius:50%;background:var(--orange)}
.callout{background:linear-gradient(135deg,rgba(var(--accent-rgb),.15),rgba(var(--accent-rgb),.03));border:1px solid rgba(var(--accent-rgb),.4);border-radius:4mm;padding:5mm}
.callout h3{font-size:13pt;margin-bottom:2mm}
.callout p{font-size:8.5pt;line-height:1.75;color:var(--mut)}
.kpi{background:var(--card);border:1px solid var(--line);border-radius:4mm;padding:5mm}
.kpi b{display:block;color:var(--orange);font:700 22pt Arial;direction:ltr;text-align:right}
.kpi span{font-size:8.5pt}
.kpi small{display:block;color:var(--mut);font-size:7pt;margin-top:1mm}
.table{width:100%;border-collapse:separate;border-spacing:0;overflow:hidden;border:1px solid var(--line);border-radius:4mm;background:var(--card)}
.table th{background:rgba(var(--accent-rgb),.12);color:var(--orange);font-size:8pt;text-align:right;padding:3.2mm;border-bottom:1px solid var(--line)}
.table td{font-size:8.3pt;color:var(--mut);padding:3.3mm;border-bottom:1px solid var(--line)}
.table tr:last-child td{border-bottom:0}
.table .num{direction:ltr;text-align:center;font-family:Arial}
.table .money{direction:ltr;text-align:left;font-family:Arial;color:var(--white)}
.term{background:var(--card2);border:1px solid var(--line);border-radius:3.5mm;padding:4mm}
.term h4{font-size:9.5pt;margin-bottom:1.5mm}
.term h4 b{color:var(--orange);margin-left:1.5mm;font-family:Arial}
.term p{font-size:7.8pt;line-height:1.65;color:var(--mut)}
.steps{counter-reset:s}
.step{counter-increment:s;display:grid;grid-template-columns:10mm 1fr;gap:4mm;border-bottom:1px solid var(--line);padding:4mm 0}
.step:before{content:counter(s);display:grid;place-items:center;width:9mm;height:9mm;border-radius:50%;background:var(--orange);color:#160b06;font:700 12px Arial}
.step h4{font-size:10pt;margin-bottom:1mm}
.step p{font-size:8.2pt;line-height:1.65;color:var(--mut)}
.signs{display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-top:6mm}
.sign{position:relative;min-height:47mm;background:var(--card);border:1px solid var(--line);border-radius:4mm;padding:5mm}
.sign label{font-size:8pt;color:var(--orange)}
.sign h3{font-size:12pt;margin-top:2mm}
.sign img{position:absolute;width:50mm;max-height:18mm;object-fit:contain;left:50%;transform:translateX(-50%);bottom:15mm}
.sign .line{position:absolute;right:5mm;left:5mm;bottom:8mm;border-top:1px solid #ffffff35;padding-top:1.5mm;color:var(--mut);font-size:7.5pt}
.footer{position:absolute;right:14mm;left:14mm;bottom:7mm;z-index:3;direction:ltr;display:flex;justify-content:space-between;border-top:1px solid var(--line);padding-top:2mm;color:var(--mut2);font:7px Arial;letter-spacing:.5px}
.footer b{color:var(--orange)}
.note{border-right:3px solid var(--orange);padding:4mm;background:#ffffff08;color:var(--mut);font-size:8pt;line-height:1.7}
.totals{background:var(--card);border:1px solid var(--line);border-radius:4mm;padding:5mm}
.totals div{display:flex;justify-content:space-between;font-size:8.5pt;color:var(--mut);padding:1.6mm 0}
.totals .grand{border-top:1px solid var(--line);margin-top:2mm;padding-top:3mm;color:var(--white);font-size:11pt}
.totals .grand b{color:var(--orange);direction:ltr;font-family:Arial}
@page{size:A4;margin:0}
@media print{body{background:transparent}.page{margin:0}}
`
}

export function brandHeader(brand: DocumentBrand, kind: string, subtitle: string): string {
  return `<div class="top">
  <div class="brand"><strong>${escapeHtml(brand.name)}</strong><small>${escapeHtml(brand.tagline)}</small></div>
  <div class="meta"><b>${escapeHtml(kind)}</b><span>${escapeHtml(subtitle)}</span></div>
</div>`
}

export function documentFooter(brand: DocumentBrand, reference: string): string {
  const left = [brand.name, brand.website].filter(Boolean).join(' · ')
  return `<div class="footer"><span>${escapeHtml(left)}</span><b>${escapeHtml(reference)}</b></div>`
}

/**
 * The signature block. Only the provider's side is pre-signed — the client signs
 * on paper, which is why their card has a line and no image.
 */
export function signatureBlock(
  brand: DocumentBrand,
  assets: DocumentAssets,
  clientName: string
): string {
  // A brand can carry its own uploaded signature; the bundled one is the
  // fallback so a fresh install still prints something.
  const source =
    brand.signatureImage ??
    (assets.signature ? `data:image/png;base64,${assets.signature}` : null)
  const mark = source
    ? `<img src="${source}" style="width:${brand.signatureWidthMm}mm" alt="">`
    : ''
  return `<div class="signs">
  <div class="sign"><label>الطرف الثاني — مقدم الخدمة</label><h3>${escapeHtml(brand.signatureName)}</h3>${mark}<div class="line">التوقيع والتاريخ</div></div>
  <div class="sign"><label>الطرف الأول — العميل</label><h3>${escapeHtml(clientName)}</h3><div class="line">التوقيع والتاريخ</div></div>
</div>`
}

export interface ShellOptions {
  /**
   * Marks every editable slot with contenteditable and a data-slot attribute so
   * the same HTML can be previewed live and edited in place, then saved back as
   * overrides. Off for the PDF, where those attributes would be dead weight.
   */
  editable?: boolean
}

export async function documentShell(
  brand: DocumentBrand,
  title: string,
  pages: string,
  options: ShellOptions = {}
): Promise<string> {
  const assets = await documentAssets()
  const editing = options.editable
    ? `<style>
[data-slot]{outline:1px dashed rgba(255,122,48,.28);outline-offset:2px;border-radius:2px;min-width:12px;min-height:1em;display:inline-block}
[data-slot]:hover{background:rgba(var(--accent-rgb),.07)}
[data-slot]:focus{outline:2px solid var(--orange);background:rgba(var(--accent-rgb),.10)}
</style>`
    : ''
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<title>${escapeHtml(title)}</title><style>${styles(assets, brand)}</style>${editing}</head>
<body>${pages}</body></html>`
}

/** Wraps a value in an editable slot when the document is being edited. */
export function slot(
  name: string,
  value: string,
  options: ShellOptions,
  overrides: Record<string, string> = {}
): string {
  const text = overrides[name] ?? value
  if (!options.editable) return escapeHtml(text)
  return `<span data-slot="${escapeHtml(name)}" contenteditable="true">${escapeHtml(text)}</span>`
}

/** Resolves a slot's current text without any markup, for the PDF path. */
export function slotText(
  name: string,
  value: string,
  overrides: Record<string, string> = {}
): string {
  return overrides[name] ?? value
}
