import { describe, expect, it } from 'vitest'
import { splitLines } from '../electron/core/documents'
import { arabicDate, escapeHtml, money } from '../electron/core/document-theme'

describe('document text helpers', () => {
  it('splits a scope list on newlines and Arabic commas', () => {
    // Bedo types scope items either on separate lines or comma-separated in
    // Arabic; both have to become the same bullet list.
    expect(splitLines('تصميم الواجهة، برمجة الصفحات\nالربط مع الدفع')).toEqual([
      'تصميم الواجهة',
      'برمجة الصفحات',
      'الربط مع الدفع'
    ])
  })

  it('drops empty entries left by trailing separators', () => {
    expect(splitLines('واحد،،اتنين\n\n')).toEqual(['واحد', 'اتنين'])
  })

  it('returns nothing for empty input rather than one blank bullet', () => {
    expect(splitLines('   ')).toEqual([])
  })
})

describe('escaping', () => {
  it('neutralises markup a client name could carry into the document', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;'
    )
  })

  it('leaves Arabic untouched', () => {
    expect(escapeHtml('شركة تميم للتقنية')).toBe('شركة تميم للتقنية')
  })

  it('escapes markup inside a heading rather than rendering it', () => {
    // The proposal headline used to accept raw <em> from its caller, which
    // printed the tags as literal text on the page. Accent text is now its own
    // field and everything from outside stays escaped.
    expect(escapeHtml('متجر <em>يبيع</em>')).toBe('متجر &lt;em&gt;يبيع&lt;/em&gt;')
  })
})

describe('money formatting', () => {
  it('renders minor units as a currency amount', () => {
    // Amounts are stored as integer piastres/cents; rendering them raw would
    // show 125000 instead of 1,250.00.
    expect(money(125_000, 'EGP')).toContain('1,250.00')
    expect(money(99, 'USD')).toContain('0.99')
  })

  it('always shows two decimals', () => {
    expect(money(500_000, 'EGP')).toContain('5,000.00')
  })
})

describe('Arabic dates', () => {
  it('formats in Arabic with a full month name', () => {
    const formatted = arabicDate(new Date(2026, 7, 1, 12).getTime())
    expect(formatted).toMatch(/٢٠٢٦|2026/)
    expect(formatted.length).toBeGreaterThan(6)
  })
})
