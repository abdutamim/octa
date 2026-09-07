import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  REQUIRED_LANGUAGES,
  depthGate,
  detectUnsourcedNumbers,
  parseSourcesJsonl,
  rejectUnsourced,
  validateCitations,
  type LanguagePlanInput,
  type SourceLedgerEntry
} from '../electron/core/octa/sources'

function sourceEntry(n: number, lang = 'en', domainNumber = n % 40): SourceLedgerEntry {
  const domain = `source-${domainNumber}.example.test`
  return {
    n,
    url: `https://${domain}/page-${n}`,
    domain,
    title: `Source ${n}`,
    lang,
    type: 'report',
    published: '2026-08-01',
    fetched: '2026-09-05T20:11:00Z',
    words: 500,
    claims: [
      {
        text: `Claim ${n}`,
        quote: `Quote ${n}`,
        confidence: 'medium',
        topic: 'testing'
      }
    ],
    relevance: 0.8
  }
}

function ledgerWithCounts(counts: Record<string, number>): SourceLedgerEntry[] {
  const ledger: SourceLedgerEntry[] = []
  let n = 1
  for (const [lang, count] of Object.entries(counts)) {
    for (let i = 0; i < count; i += 1) {
      ledger.push(sourceEntry(n, lang, (n - 1) % 40))
      n += 1
    }
  }
  return ledger
}

function fullLanguagePlan(): LanguagePlanInput {
  return REQUIRED_LANGUAGES.map((language) => ({
    language,
    queries: Array.from({ length: 15 }, (_, index) => `${language} query ${index + 1}`)
  }))
}

describe('source ledger and report validation', () => {
  it('parses the sources.jsonl schema and ignores blank lines', () => {
    const entry = sourceEntry(37, 'ar-EG', 4)
    const parsed = parseSourcesJsonl(`\n${JSON.stringify(entry)}\n`)

    expect(parsed).toEqual([entry])
  })

  it('accepts existing [n] and (source n) citations and reports missing entries', () => {
    const ledger = [sourceEntry(1), sourceEntry(2)]
    const valid = validateCitations('The first claim [1]. The second claim (source 2).', ledger)
    const invalid = validateCitations('The missing claim [9].', ledger)

    expect(valid.ok).toBe(true)
    expect(valid.citations).toEqual([1, 2])
    expect(invalid.ok).toBe(false)
    expect(invalid.missing).toEqual([9])
    expect(invalid.failures[0]).toContain('[9]')
  })

  it('catches ten unsourced numeric lines and ignores ten safe lines', () => {
    const unsourced = [
      'Conversion reached 18%.',
      'The monthly fee is $49.',
      'The annual budget is €250.',
      'Users moved 3x faster.',
      'The team completed 4 times as many interviews.',
      'We interviewed 100 customers.',
      'The report covers 1,000 accounts.',
      'The waitlist has ٢٥٠ people.',
      'The market includes 2.5k buyers.',
      'The campaign produced 500 EGP in sales.'
    ]
    const safe = [
      'The process has 9 steps.',
      'Only 99 people joined.',
      'See source [12] for the methodology.',
      'The date is 2026-09-07.',
      'Version 2.4 is current.',
      'Use the 12-step checklist.',
      'The ratio is 0.5.',
      'Visit https://example.test/v2/page/100.',
      'The source note says (source 10).',
      'We tested three variants.'
    ]

    expect(detectUnsourcedNumbers(unsourced.join('\n'))).toEqual(unsourced)
    expect(detectUnsourcedNumbers(safe.join('\n'))).toEqual([])
  })

  it('blocks an unsourced statistic while allowing a cited statistic', () => {
    const ledger = [sourceEntry(1)]
    const blocked = rejectUnsourced('The conversion rate reached 18%.', ledger)
    const sourced = rejectUnsourced('The conversion rate reached 18% [1].', ledger)

    expect(blocked.ok).toBe(false)
    expect(blocked.blocked).toBe(true)
    expect(blocked.failures).toContain('The conversion rate reached 18%.')
    expect(blocked.unsourcedLines).toEqual(['The conversion rate reached 18%.'])
    expect(sourced.ok).toBe(true)
  })
})
describe('research depth gate', () => {
  it('passes 100 distinct URLs, 40 domains, and ten sources per language', () => {
    const ledger = ledgerWithCounts({ ar: 20, en: 20, fr: 20, de: 20, ru: 20 })
    const result = depthGate(ledger, fullLanguagePlan())

    expect(result).toMatchObject({ ok: true, distinctUrls: 100, domains: 40 })
    expect(result.failures).toEqual([])
    expect(result.languageCounts).toEqual({ ar: 20, en: 20, fr: 20, de: 20, ru: 20 })
  })

  it('allows a language with no material after fifteen tried queries', () => {
    const ledger = ledgerWithCounts({ ar: 25, en: 25, de: 25, ru: 25 })
    const languagePlan: LanguagePlanInput = [
      { language: 'ar', queries: [] },
      { language: 'en', queries: [] },
      { language: 'fr', status: 'no material', queries: Array.from({ length: 15 }, (_, i) => `fr ${i}`) },
      { language: 'de', queries: [] },
      { language: 'ru', queries: [] }
    ]
    const result = depthGate(ledger, languagePlan)

    expect(result.ok).toBe(true)
    expect(result.languageCounts.fr ?? 0).toBe(0)
  })

  it('reports each failed depth condition', () => {
    const ledger = ledgerWithCounts({ ar: 9, en: 30, fr: 20, de: 20, ru: 20 }).slice(0, 99)
    const shortNoMaterialPlan: LanguagePlanInput = REQUIRED_LANGUAGES.map((language) =>
      language === 'fr'
        ? { language, status: 'no material', queries: ['only one'] }
        : { language, queries: [] }
    )
    const result = depthGate(ledger, {
      languagePlan: shortNoMaterialPlan,
      minDomains: 40
    })

    expect(result.ok).toBe(false)
    expect(result.distinctUrls).toBe(99)
    expect(result.domains).toBe(40)
    expect(result.failures.some((failure) => failure.includes('distinct URLs'))).toBe(true)
    expect(result.failures.some((failure) => failure.includes('language ar'))).toBe(true)
    expect(result.failures.some((failure) => failure.includes('language fr') && failure.includes('no material'))).toBe(true)
  })
})

describe('Arabic stop-slop reference', () => {
  it('contains at least forty Arabic patterns and the seeded twenty tell phrases', () => {
    const referencePath = join(process.cwd(), 'skills-library', 'skills', 'stop-slop', 'references', 'phrases-ar.md')
    const skillPath = join(process.cwd(), 'skills-library', 'skills', 'stop-slop', 'SKILL.md')
    const reference = readFileSync(referencePath, 'utf8')
    const skill = readFileSync(skillPath, 'utf8')
    const bulletCount = reference.split(/\r?\n/).filter((line) => line.startsWith('- ')).length
    const seeded = [
      'في عالم اليوم',
      'لا يخفى على أحد',
      'من الجدير بالذكر',
      'دعونا نتعمق',
      'بكل تأكيد',
      'رحلة',
      'يعزز',
      'يسلط الضوء',
      'في عصرنا الحالي',
      'مما لا شك فيه',
      'تجدر الإشارة إلى',
      'في هذا السياق',
      'دعونا نستكشف',
      'في نهاية المطاف',
      'في الختام',
      'نقلة نوعية',
      'حلول متكاملة',
      'نهج شامل',
      '!!!',
      '🔥!!!'
    ]

    expect(bulletCount).toBeGreaterThanOrEqual(40)
    for (const phrase of seeded) expect(reference).toContain(phrase)
    expect(skill).toContain('references/phrases-ar.md')
    expect(skill).toContain('language')
  })
})
