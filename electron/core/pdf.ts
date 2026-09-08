import { BrowserWindow } from 'electron'
import { mkdir, readFile } from 'node:fs/promises'
import { dirname } from 'node:path'

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export async function brandedDocument(
  title: string,
  content: string,
  arabicFontPath?: string
): Promise<string> {
  let fontFace = ''
  if (arabicFontPath) {
    try {
      const font = (await readFile(arabicFontPath)).toString('base64')
      fontFace = `@font-face{font-family:PingAR;src:url(data:font/otf;base64,${font}) format('opentype')}`
    } catch {
      // Segoe UI covers Arabic on ordinary Windows installations.
    }
  }
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
${fontFace}
@page{size:A4;margin:18mm}
*{box-sizing:border-box}
body{margin:0;color:#23151f;font-family:PingAR,"Segoe UI",Tahoma,Arial,sans-serif;font-size:11pt;line-height:1.55}
header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:18px;border-bottom:3px solid #782344}
.brand{font-size:21pt;font-weight:700;color:#782344}.muted{color:#796d75}.cream{background:#faf5eb}
h1,h2,h3{color:#50203d;line-height:1.2}h1{font-size:24pt;margin:24px 0 8px}h2{font-size:15pt;margin-top:24px}
table{width:100%;border-collapse:collapse;margin:18px 0}th,td{padding:10px;border-bottom:1px solid #ded5da;text-align:start}
th{color:#782344;background:#faf5eb}.total{font-weight:700;font-size:14pt}
.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;margin:20px 0}
.payment{padding:12px;border:1px solid #cfb3c0;border-radius:8px;background:#faf5eb}
footer{position:fixed;bottom:0;color:#8a7c84;font-size:8pt}
.proposal-body{white-space:pre-wrap}.rtl{direction:rtl;text-align:right}
</style></head><body>${content}<footer>Tamim OS · Abdullah Tamim</footer></body></html>`
}

export class PdfRenderer {
  async render(html: string, outputPath: string): Promise<string> {
    await mkdir(dirname(outputPath), { recursive: true })
    const window = new BrowserWindow({
      show: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    })
    try {
      await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
      await documentFontsReady(window)
      const pdf = await window.webContents.printToPDF({
        pageSize: 'A4',
        printBackground: true,
        margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 }
      })
      const { writeFile } = await import('node:fs/promises')
      await writeFile(outputPath, pdf)
      return outputPath
    } finally {
      if (!window.isDestroyed()) window.destroy()
    }
  }
}

async function documentFontsReady(window: BrowserWindow): Promise<void> {
  await window.webContents.executeJavaScript('document.fonts.ready')
}

export function invoiceBody(input: {
  number: string
  client: string
  currency: string
  issued: string
  due: string
  items: Array<{ description: string; qty: number; unitPrice: number }>
  notes: string
  paymentLink: string
}): string {
  const money = (minor: number): string =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: input.currency }).format(minor / 100)
  const total = input.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
  const rows = input.items.map((item) => `<tr>
    <td dir="auto">${escapeHtml(item.description)}</td>
    <td>${item.qty}</td><td>${money(item.unitPrice)}</td><td>${money(item.qty * item.unitPrice)}</td>
  </tr>`).join('')
  return `<header><div><div class="brand">TAMIM OS</div><div class="muted">Independent software services</div></div><strong>INVOICE</strong></header>
  <h1>Invoice ${escapeHtml(input.number)}</h1>
  <div class="meta"><div><span class="muted">Bill to</span><br><strong>${escapeHtml(input.client)}</strong></div>
  <div><span class="muted">Issued</span><br>${escapeHtml(input.issued)}</div>
  <div><span class="muted">Currency</span><br>${escapeHtml(input.currency)}</div>
  <div><span class="muted">Due</span><br>${escapeHtml(input.due)}</div></div>
  <table><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${rows}</tbody>
  <tfoot><tr><td colspan="3" class="total">Total</td><td class="total">${money(total)}</td></tr></tfoot></table>
  ${input.notes ? `<h2>Notes</h2><p dir="auto">${escapeHtml(input.notes)}</p>` : ''}
  ${input.paymentLink ? `<div class="payment">Payment link: ${escapeHtml(input.paymentLink)}</div>` : ''}`
}

export function proposalBody(title: string, client: string, markdown: string): string {
  const blocks = escapeHtml(markdown)
    .split(/\r?\n/)
    .map((line) => {
      if (line.startsWith('### ')) return `<h3>${line.slice(4)}</h3>`
      if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`
      if (line.startsWith('# ')) return `<h1>${line.slice(2)}</h1>`
      if (line.startsWith('- ')) return `<p>◆ ${line.slice(2)}</p>`
      return line ? `<p dir="auto">${line}</p>` : '<br>'
    })
    .join('')
  return `<header><div><div class="brand">TAMIM OS</div><div class="muted">Abdullah Tamim · Full-stack developer</div></div><strong>PROPOSAL DRAFT</strong></header>
  <h1 dir="auto">${escapeHtml(title)}</h1>
  <p class="muted" dir="auto">Prepared for ${escapeHtml(client)}</p>
  <main class="proposal-body">${blocks}</main>
  <div class="payment"><strong>Review required.</strong> This proposal is a draft until Abdullah approves and sends it.</div>`
}
