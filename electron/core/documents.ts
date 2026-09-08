import {
  arabicDate,
  brandHeader,
  documentAssets,
  documentFooter,
  documentShell,
  escapeHtml,
  money,
  signatureBlock,
  slot,
  type ShellOptions
} from './document-theme'
import type { DocumentBrand, InvoiceRecord } from '../types'

/**
 * Every generator takes the same four arguments: the data, the brand printing
 * it, whether the output is being edited or exported, and any text the user has
 * already overridden on the page.
 */
export interface RenderContext {
  brand: DocumentBrand
  options?: ShellOptions
  overrides?: Record<string, string>
}

function list(items: string[]): string {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
}

/** Splits free text on newlines or Arabic/Latin separators into list items. */
export function splitLines(value: string): string[] {
  return value
    .split(/\r?\n|،|;/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function editableList(
  name: string,
  value: string,
  context: RenderContext
): string {
  const text = context.overrides?.[name] ?? value
  if (!context.options?.editable) return list(splitLines(text))
  // Edited as one block rather than per bullet: splitting a list into separate
  // editable nodes makes adding or removing an item impossible in place.
  return `<div data-slot="${escapeHtml(name)}" data-multiline="true" contenteditable="true" style="white-space:pre-wrap">${escapeHtml(text)}</div>`
}

function paragraphs(name: string, value: string, context: RenderContext): string {
  const text = context.overrides?.[name] ?? value
  if (context.options?.editable) {
    return `<div data-slot="${escapeHtml(name)}" data-multiline="true" contenteditable="true" style="white-space:pre-wrap;font-size:8.3pt;line-height:1.7;color:var(--mut)">${escapeHtml(text)}</div>`
  }
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => `<p>${escapeHtml(line.trim())}</p>`)
    .join('')
}

export async function invoiceDocument(
  invoice: InvoiceRecord,
  context: RenderContext
): Promise<string> {
  const { brand, options = {}, overrides = {} } = context
  const rows = invoice.items
    .map(
      (item, index) => `<tr>
      <td>${slot(`item.${index}.description`, item.description, options, overrides)}</td>
      <td class="num">${item.qty}</td>
      <td class="money">${money(item.unitPrice, invoice.currency)}</td>
      <td class="money">${money(item.qty * item.unitPrice, invoice.currency)}</td>
    </tr>`
    )
    .join('')

  const statusLabel =
    invoice.status === 'paid'
      ? 'مدفوعة'
      : invoice.status === 'overdue'
        ? 'متأخرة'
        : invoice.status === 'sent'
          ? 'بانتظار الدفع'
          : 'مسودة'

  const page = `<section class="page"><div class="content">
${brandHeader(brand, 'INVOICE', 'فاتورة خدمات احترافية')}
<div style="padding:10mm 0 5mm">
  <div class="eyebrow">فاتورة رقم ${escapeHtml(invoice.number)}</div>
  <h1>${slot('headline', 'فاتورة', options, overrides)} <em>${slot('headlineAccent', 'خدمات رقمية.', options, overrides)}</em></h1>
</div>
<div class="grid2">
  <div class="card"><h3>صادرة إلى</h3><p><b style="color:#fff">${slot('clientName', invoice.clientName, options, overrides)}</b></p></div>
  <div class="card"><h3>بيانات الفاتورة</h3><p>
    تاريخ الإصدار: ${arabicDate(invoice.issuedAt)}<br>
    تاريخ الاستحقاق: ${arabicDate(invoice.dueAt)}<br>
    حالة الفاتورة: <span style="color:var(--orange)">${statusLabel}</span>
  </p></div>
</div>
<div class="section-title"><span>تفاصيل الخدمات</span><i></i></div>
<table class="table">
  <thead><tr><th>الخدمة</th><th class="num">الكمية</th><th class="money">سعر الوحدة</th><th class="money">الإجمالي</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div style="display:grid;grid-template-columns:1fr 70mm;gap:5mm;margin-top:5mm">
  <div class="note">${slot('notes', invoice.notes || 'يرجى تحويل المبلغ قبل تاريخ الاستحقاق مع ذكر رقم الفاتورة في بيان التحويل.', options, overrides)}</div>
  <div class="totals">
    <div><span>الإجمالي الفرعي</span><span>${money(invoice.total, invoice.currency)}</span></div>
    <div class="grand"><span>الإجمالي المستحق</span><b>${money(invoice.total, invoice.currency)}</b></div>
  </div>
</div>
${invoice.paymentLink ? `<div class="callout" style="margin-top:5mm"><h3>الدفع الإلكتروني</h3><p style="direction:ltr;text-align:left">${escapeHtml(invoice.paymentLink)}</p></div>` : ''}
${documentFooter(brand, invoice.number)}
</div></section>`

  return documentShell(brand, `فاتورة ${invoice.number}`, page, options)
}

export interface ContractInput {
  reference: string
  clientName: string
  clientDetails: string
  projectName: string
  subject: string
  scopeIn: string
  scopeOut: string
  phases: Array<{ title: string; detail: string }>
  amountMinor: number
  currency: string
  paymentTerms: string
  revisions: string
  deliverables: string
  startAt: number
  durationDays: number
}

export async function contractDocument(
  input: ContractInput,
  context: RenderContext
): Promise<string> {
  const { brand, options = {}, overrides = {} } = context
  const assets = await documentAssets()
  const phases = input.phases
    .map(
      (phase, index) =>
        `<div class="step"><div><h4>${slot(`phase.${index}.title`, phase.title, options, overrides)}</h4><p>${slot(`phase.${index}.detail`, phase.detail, options, overrides)}</p></div></div>`
    )
    .join('')

  const first = `<section class="page"><div class="content">
${brandHeader(brand, 'CONTRACT', 'عقد خدمات رقمية')}
<div style="padding:10mm 0 5mm">
  <div class="eyebrow">مرجع العقد ${escapeHtml(input.reference)}</div>
  <h1>${slot('headline', 'اتفاق', options, overrides)} <em>${slot('headlineAccent', 'واضح.', options, overrides)}</em></h1>
  <p class="lead">حُرِّر هذا العقد بتاريخ ${arabicDate(input.startAt)} بين الطرفين المذكورين أدناه، وينظّم تنفيذ المشروع الموضّح في بنوده.</p>
</div>
<div class="grid2">
  <div class="card"><h3>الطرف الأول — العميل</h3><p><b style="color:#fff">${slot('clientName', input.clientName, options, overrides)}</b><br>${slot('clientDetails', input.clientDetails, options, overrides)}</p></div>
  <div class="card"><h3>الطرف الثاني — مقدم الخدمة</h3><p><b style="color:#fff">${escapeHtml(brand.signatureName)}</b><br>${escapeHtml(brand.signatureRole)}<br>${escapeHtml(brand.website)}</p></div>
</div>
<div class="section-title"><span>بيانات المشروع</span><i></i></div>
<div class="grid2">
  <div class="card"><h3>موضوع الاتفاق</h3><p>${slot('projectName', input.projectName, options, overrides)}</p><p style="margin-top:2mm">${slot('subject', input.subject, options, overrides)}</p></div>
  <div class="card"><h3>المدة</h3><p>مدة التنفيذ ${input.durationDays} يومًا من تاريخ استلام المتطلبات كاملة.</p></div>
</div>
<div class="section-title"><span>النطاق المختصر</span><i></i></div>
<div class="grid2">
  <div class="card"><h3>داخل النطاق</h3>${editableList('scopeIn', input.scopeIn, context)}</div>
  <div class="card"><h3>خارج النطاق</h3>${editableList('scopeOut', input.scopeOut, context)}</div>
</div>
${documentFooter(brand, input.reference)}
</div></section>`

  const second = `<section class="page"><div class="content">
<div class="section-title"><span>مراحل التنفيذ</span><i></i></div>
<div class="steps">${phases}</div>
<div class="section-title"><span>المقابل والدفعات</span><i></i></div>
<div class="grid2">
  <div class="kpi"><span>قيمة المشروع</span><b>${money(input.amountMinor, input.currency)}</b><small>شاملة التسليمات المذكورة في النطاق</small></div>
  <div class="card"><h3>شروط الدفع</h3><p>${slot('paymentTerms', input.paymentTerms, options, overrides)}</p></div>
</div>
<div class="section-title"><span>التعديلات والتسليمات</span><i></i></div>
<div class="grid2">
  <div class="card"><h3>التعديلات والاعتماد</h3><p>${slot('revisions', input.revisions, options, overrides)}</p></div>
  <div class="card"><h3>ما يستلمه العميل</h3>${editableList('deliverables', input.deliverables, context)}</div>
</div>
<div class="section-title"><span>الشروط العامة</span><i></i></div>
<div class="grid2">
  <div class="term"><h4><b>١</b>الملكية الفكرية</h4><p>${slot('term.1', 'تنتقل ملكية التسليمات النهائية إلى الطرف الأول بعد سداد كامل المقابل المتفق عليه.', options, overrides)}</p></div>
  <div class="term"><h4><b>٢</b>السرية</h4><p>${slot('term.2', 'يلتزم الطرفان بعدم إفشاء أي معلومات أو بيانات يطّلع عليها أحدهما بحكم تنفيذ هذا الاتفاق.', options, overrides)}</p></div>
  <div class="term"><h4><b>٣</b>التأخير من جهة العميل</h4><p>${slot('term.3', 'تُمدَّد المدة بما يعادل فترة تأخر الطرف الأول في تسليم المتطلبات أو الاعتمادات.', options, overrides)}</p></div>
  <div class="term"><h4><b>٤</b>إنهاء الاتفاق</h4><p>${slot('term.4', 'لأي طرف إنهاء الاتفاق بإشعار مكتوب، على أن يُسدَّد مقابل ما أُنجز فعليًا حتى تاريخ الإنهاء.', options, overrides)}</p></div>
</div>
<div class="section-title"><span>التوقيعات</span><i></i></div>
${signatureBlock(brand, assets, overrides.clientName ?? input.clientName)}
${documentFooter(brand, input.reference)}
</div></section>`

  return documentShell(brand, `عقد ${input.projectName}`, first + second, options)
}

export interface ProposalInput {
  reference: string
  clientName: string
  /** Plain text. Never HTML — client-supplied strings are always escaped. */
  title: string
  /**
   * The tail of the headline, rendered in the accent colour. Kept as its own
   * field so the design keeps its two-tone heading without ever un-escaping
   * markup that came from outside.
   */
  titleAccent?: string
  understanding: string
  objectives: Array<{ title: string; detail: string }>
  scope: Array<{ title: string; items: string }>
  plan: Array<{ title: string; detail: string }>
  clientNeeds: string
  includes: string
  excludes: string
  amountMinor: number
  currency: string
  durationDays: number
  nextStep: string
}

export async function proposalDocument(
  input: ProposalInput,
  context: RenderContext
): Promise<string> {
  const { brand, options = {}, overrides = {} } = context
  const assets = await documentAssets()
  const objectives = input.objectives
    .map(
      (item, index) =>
        `<div class="card"><h3>${slot(`objective.${index}.title`, item.title, options, overrides)}</h3><p>${slot(`objective.${index}.detail`, item.detail, options, overrides)}</p></div>`
    )
    .join('')
  const scope = input.scope
    .map(
      (item, index) =>
        `<div class="card"><h3>${slot(`scope.${index}.title`, item.title, options, overrides)}</h3>${editableList(`scope.${index}.items`, item.items, context)}</div>`
    )
    .join('')
  const plan = input.plan
    .map(
      (item, index) =>
        `<div class="step"><div><h4>${slot(`plan.${index}.title`, item.title, options, overrides)}</h4><p>${slot(`plan.${index}.detail`, item.detail, options, overrides)}</p></div></div>`
    )
    .join('')

  const first = `<section class="page"><div class="content">
${brandHeader(brand, 'PROPOSAL', 'عرض خدمات رقمية')}
<div style="padding:10mm 0 5mm">
  <div class="eyebrow">مقدم إلى ${slot('clientName', input.clientName, options, overrides)}</div>
  <h1>${slot('title', input.title, options, overrides)}${input.titleAccent ? ` <em>${slot('titleAccent', input.titleAccent, options, overrides)}</em>` : ''}</h1>
</div>
<div class="section-title"><span>فهم المشروع</span><i></i></div>
<div class="card">${paragraphs('understanding', input.understanding, context)}</div>
<div class="section-title"><span>الأهداف الرئيسية</span><i></i></div>
<div class="grid2">${objectives}</div>
${documentFooter(brand, input.reference)}
</div></section>`

  const second = `<section class="page"><div class="content">
<div class="section-title"><span>نطاق العمل المقترح</span><i></i></div>
<div class="grid2">${scope}</div>
<div class="section-title"><span>خطة التنفيذ</span><i></i></div>
<div class="steps">${plan}</div>
<div class="section-title"><span>المطلوب من العميل</span><i></i></div>
<div class="card">${editableList('clientNeeds', input.clientNeeds, context)}</div>
${documentFooter(brand, input.reference)}
</div></section>`

  const third = `<section class="page"><div class="content">
<div class="section-title"><span>المدة والاستثمار</span><i></i></div>
<div class="grid2">
  <div class="kpi"><span>مدة التنفيذ</span><b>${input.durationDays}</b><small>يومًا من تاريخ البدء</small></div>
  <div class="kpi"><span>قيمة العرض</span><b>${money(input.amountMinor, input.currency)}</b><small>شاملة ما ورد في النطاق</small></div>
</div>
<div class="grid2" style="margin-top:4mm">
  <div class="card"><h3>يشمل العرض</h3>${editableList('includes', input.includes, context)}</div>
  <div class="card"><h3>لا يشمل العرض</h3>${editableList('excludes', input.excludes, context)}</div>
</div>
<div class="section-title"><span>الخطوة التالية</span><i></i></div>
<div class="callout"><h3>جاهزون للبدء</h3><p>${slot('nextStep', input.nextStep, options, overrides)}</p></div>
${signatureBlock(brand, assets, overrides.clientName ?? input.clientName)}
${documentFooter(brand, input.reference)}
</div></section>`

  return documentShell(
    brand,
    `${input.title}${input.titleAccent ? ` ${input.titleAccent}` : ''}`,
    first + second + third,
    options
  )
}
