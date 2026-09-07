import { existsSync, readFileSync } from 'node:fs'

export const REQUIRED_LANGUAGES = ['ar', 'en', 'fr', 'de', 'ru'] as const

export type RequiredLanguage = (typeof REQUIRED_LANGUAGES)[number]

export interface SourceClaim {
  text: string
  quote: string
  confidence: 'high' | 'medium' | 'low'
  topic: string
}

/** One parsed line from evidence/sources.jsonl. */
export interface SourceLedgerEntry {
  n: number
  url: string
  domain: string
  title: string
  lang: string
  type: string
  published: string
  fetched: string
  words: number
  claims: SourceClaim[]
  relevance: number
  notes?: string
  [key: string]: unknown
}

export interface LanguagePlanEntry {
  language?: string
  lang?: string
  code?: string
  status?: string
  noMaterial?: boolean
  no_material?: boolean
  material?: boolean | string
  queries?: readonly string[] | number
  triedQueries?: readonly string[] | number
  attemptedQueries?: readonly string[] | number
  tried_queries?: readonly string[] | number
  queriesTried?: number
  queries_tried?: number
  queryCount?: number
  [key: string]: unknown
}

export type LanguagePlanInput =
  | readonly (string | LanguagePlanEntry)[]
  | Record<string, string | number | LanguagePlanEntry | readonly string[]>

export interface SourcesDocument {
  sources: readonly SourceLedgerEntry[]
  language_plan?: LanguagePlanInput
  languagePlan?: LanguagePlanInput
  [key: string]: unknown
}

export type LedgerInput = readonly SourceLedgerEntry[] | SourcesDocument | string

export type ReportInput = string | { text: string } | { content: string }

export interface CitationReference {
  number: number
  raw: string
  line: string
  lineNumber: number
}

export interface CitationValidationResult {
  ok: boolean
  citations: number[]
  references: CitationReference[]
  missing: number[]
  missingCitations: number[]
  failures: string[]
}

export interface UnsourcedNumberMatch {
  line: string
  lineNumber: number
  match: string
}

export interface UnsourcedValidationResult {
  ok: boolean
  valid: boolean
  blocked: boolean
  rejected: boolean
  failures: string[]
  citations: CitationReference[]
  missingCitations: number[]
  unsourcedLines: string[]
  quotedLines: string[]
}

export interface DepthGateOptions {
  languagePlan?: LanguagePlanInput
  requiredLanguages?: readonly string[]
  minDistinctUrls?: number
  minDomains?: number
  minSourcesPerLanguage?: number
  noMaterialQueryMinimum?: number
}

export interface DepthGateResult {
  ok: boolean
  failures: string[]
  distinctUrls: number
  domains: number
  languageCounts: Record<string, number>
  requiredLanguages: string[]
}

export class SourcesParseError extends Error {
  constructor(
    message: string,
    public readonly lineNumber?: number,
    public readonly sourcePath?: string
  ) {
    super(message)
    this.name = 'SourcesParseError'
  }
}

const DIGITS = '0-9٠-٩۰-۹'
const NUMBER_TOKEN = `[-+]?[${DIGITS}]+(?:[.,٬٫][${DIGITS}]+)*`
const DIGIT_TOKEN = `[${DIGITS}]+`
const CURRENCY_WORD =
  '(?:USD|EUR|GBP|EGP|AED|SAR|QAR|KWD|JOD|MAD|TND|DZD|TRY|RUB|INR|دولار(?:اً|ا)?|جنيه(?:اً|ا)?|ريال|درهم|يورو|ليرة|روبل)'

/**
 * A broad candidate pattern. The detector applies numeric-value checks to the
 * final alternative so ordinary numbers below 100 do not get flagged.
 */
export const UNSOURCED_NUMBER_PATTERN = new RegExp(
  `(?:[$€£¥₹₽₺₦]\\s*${NUMBER_TOKEN}|${CURRENCY_WORD}\\s*${NUMBER_TOKEN}|${NUMBER_TOKEN}\\s*${CURRENCY_WORD}|${NUMBER_TOKEN}\\s*[%٪]|${NUMBER_TOKEN}\\s*(?:x|×|times?|مرة|مرات|أضعاف)|${NUMBER_TOKEN}\\s*(?:k|m|bn|million|billion|ألف|مليون|مليار)|${NUMBER_TOKEN})`,
  'iu'
)

const CITATION_PATTERN = new RegExp(
  `\\[(${DIGIT_TOKEN})\\]|\\(\\s*source\\s+(${DIGIT_TOKEN})\\s*\\)`,
  'giu'
)
const URL_PATTERN = /https?:\/\/[^\s)\]>]+|www\.[^\s)\]>]+/giu
const PERCENTAGE_PATTERN = new RegExp(`${NUMBER_TOKEN}\\s*[%٪]`, 'iu')
const CURRENCY_PATTERN = new RegExp(
  `(?:[$€£¥₹₽₺₦]\\s*${NUMBER_TOKEN}|${CURRENCY_WORD}\\s*${NUMBER_TOKEN}|${NUMBER_TOKEN}\\s*${CURRENCY_WORD})`,
  'iu'
)
const MULTIPLIER_PATTERN = new RegExp(
  `${NUMBER_TOKEN}\\s*(?:x|×|times?|مرة|مرات|أضعاف)`,
  'iu'
)
const SCALED_COUNT_PATTERN = new RegExp(
  `${NUMBER_TOKEN}\\s*(?:k|m|bn|million|billion|ألف|مليون|مليار)`,
  'iu'
)
const COUNT_PATTERN = new RegExp(
  `(?<![\\p{L}\\p{N}_])${NUMBER_TOKEN}(?![\\p{L}\\p{N}_])`,
  'gu'
)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - '٠'.charCodeAt(0)))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - '۰'.charCodeAt(0)))
}

function parseNumericValue(value: string): number {
  const normalized = normalizeDigits(value)
    .replace(/[٬,]/g, '')
    .replace(/٫/g, '.')
    .replace(/\s/g, '')
  return Number(normalized)
}

function getReportText(report: ReportInput): string {
  if (typeof report === 'string') return report
  if ('text' in report) return report.text
  return report.content
}

function getLineAt(text: string, index: number): { line: string; lineNumber: number } {
  const lineStart = text.lastIndexOf('\n', index - 1) + 1
  const lineEnd = text.indexOf('\n', index)
  const end = lineEnd === -1 ? text.length : lineEnd
  return {
    line: text.slice(lineStart, end).replace(/\r$/, ''),
    lineNumber: text.slice(0, lineStart).split('\n').length
  }
}

function toCitationNumber(value: string): number {
  return Number(normalizeDigits(value))
}

function maskMatches(text: string, pattern: RegExp): string {
  return text.replace(pattern, (match) => ' '.repeat(match.length))
}

function maskCitationAndUrlText(line: string): string {
  let masked = maskMatches(line, CITATION_PATTERN)
  masked = maskMatches(masked, URL_PATTERN)
  return masked
}

function isLikelyYear(line: string, start: number, token: string): boolean {
  const normalized = normalizeDigits(token).replace(/^[-+]/, '')
  const value = Number(normalized)
  if (!/^\d{4}$/.test(normalized) || value < 1000 || value > 2099) return false

  const before = line.slice(0, start)
  const after = line.slice(start + token.length)
  return (
    /(?:\b(?:in|since|from|during|year|on)\s*|\b(?:في|منذ|خلال|عام|سنة|بتاريخ)\s*)$/iu.test(before) ||
    /^\s*(?:year|عام|سنة)\b/iu.test(after) ||
    /^\s*[-/.]\s*[0-9٠-٩۰-۹]{1,4}(?:[-/.]|$)/u.test(after) ||
    /(?:^|\s)[0-9٠-٩۰-۹]{1,4}[-/.]\s*$/u.test(before)
  )
}

function hasUnsourcedNumericSignal(line: string): { found: boolean; match: string } {
  const masked = maskCitationAndUrlText(line)

  const specialPatterns = [PERCENTAGE_PATTERN, CURRENCY_PATTERN, MULTIPLIER_PATTERN, SCALED_COUNT_PATTERN]
  for (const pattern of specialPatterns) {
    const match = masked.match(pattern)
    if (match?.[0]) return { found: true, match: match[0] }
  }

  for (const match of masked.matchAll(COUNT_PATTERN)) {
    const token = match[0]
    if (isLikelyYear(masked, match.index ?? 0, token)) continue
    if (Math.abs(parseNumericValue(token)) >= 100) {
      return { found: true, match: token }
    }
  }

  return { found: false, match: '' }
}

function getSourcePathOrText(input: string): { text: string; sourcePath?: string } {
  try {
    if (existsSync(input)) {
      return { text: readFileSync(input, 'utf8'), sourcePath: input }
    }
  } catch {
    // Treat a non-readable path as JSONL text; the parser below reports the
    // useful line-level error instead of hiding it behind an fs exception.
  }
  return { text: input }
}

function parseClaim(value: unknown, lineNumber: number): SourceClaim {
  if (!isRecord(value)) {
    throw new SourcesParseError(`Claim on line ${lineNumber} must be an object.`, lineNumber)
  }

  const confidence = value.confidence
  return {
    text: typeof value.text === 'string' ? value.text : '',
    quote: typeof value.quote === 'string' ? value.quote : '',
    confidence: confidence === 'high' || confidence === 'medium' || confidence === 'low' ? confidence : 'low',
    topic: typeof value.topic === 'string' ? value.topic : ''
  }
}

function parseLedgerEntry(value: unknown, lineNumber: number): SourceLedgerEntry {
  if (!isRecord(value)) {
    throw new SourcesParseError(`Source on line ${lineNumber} must be an object.`, lineNumber)
  }

  if (typeof value.n !== 'number' || !Number.isInteger(value.n) || value.n < 1) {
    throw new SourcesParseError(`Source on line ${lineNumber} has an invalid n.`, lineNumber)
  }
  if (typeof value.url !== 'string' || !value.url.trim()) {
    throw new SourcesParseError(`Source on line ${lineNumber} has an invalid url.`, lineNumber)
  }

  const url = value.url
  let derivedDomain = ''
  try {
    derivedDomain = new URL(url).hostname
  } catch {
    // Keep the ledger parseable so the depth gate can still report the URL.
  }

  const claims = value.claims
  if (claims !== undefined && !Array.isArray(claims)) {
    throw new SourcesParseError(`Source on line ${lineNumber} has invalid claims.`, lineNumber)
  }

  return {
    ...value,
    n: value.n,
    url,
    domain: typeof value.domain === 'string' && value.domain.trim() ? value.domain : derivedDomain,
    title: typeof value.title === 'string' ? value.title : '',
    lang: typeof value.lang === 'string' && value.lang.trim() ? value.lang : 'und',
    type: typeof value.type === 'string' ? value.type : 'unknown',
    published: typeof value.published === 'string' ? value.published : '',
    fetched: typeof value.fetched === 'string' ? value.fetched : '',
    words: typeof value.words === 'number' && Number.isFinite(value.words) ? value.words : 0,
    claims: Array.isArray(claims) ? claims.map((claim) => parseClaim(claim, lineNumber)) : [],
    relevance: typeof value.relevance === 'number' && Number.isFinite(value.relevance) ? value.relevance : 0,
    ...(typeof value.notes === 'string' ? { notes: value.notes } : {})
  }
}

/** Parse the one-JSON-object-per-line source ledger format. */
export function parseSourcesJsonl(sourceOrPath: string): SourceLedgerEntry[] {
  const { text, sourcePath } = getSourcePathOrText(sourceOrPath)
  const entries: SourceLedgerEntry[] = []

  for (const [index, rawLine] of text.split(/\r?\n/).entries()) {
    const lineNumber = index + 1
    const line = rawLine.replace(/^\uFEFF/, '').trim()
    if (!line) continue

    let parsed: unknown
    try {
      parsed = JSON.parse(line) as unknown
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'invalid JSON'
      throw new SourcesParseError(`Invalid JSON on line ${lineNumber}: ${detail}`, lineNumber, sourcePath)
    }

    if (Array.isArray(parsed)) {
      for (const item of parsed) entries.push(parseLedgerEntry(item, lineNumber))
    } else {
      entries.push(parseLedgerEntry(parsed, lineNumber))
    }
  }

  return entries
}

export function parseSourcesFile(sourcePath: string): SourceLedgerEntry[] {
  return parseSourcesJsonl(sourcePath)
}

export const readSourcesJsonl = parseSourcesFile
export const parseSources = parseSourcesJsonl

function ledgerFromInput(input: LedgerInput): SourceLedgerEntry[] {
  if (Array.isArray(input)) return [...input]
  if (typeof input === 'string') {
    const { text } = getSourcePathOrText(input)
    const trimmed = text.trim()
    if (!trimmed) return []

    if (trimmed.startsWith('{') && !trimmed.includes('\n')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown
        if (isRecord(parsed) && Array.isArray(parsed.sources)) {
          return parsed.sources.map((entry, index) => parseLedgerEntry(entry, index + 1))
        }
      } catch {
        // Fall through to the JSONL parser for a line-specific error.
      }
    }
    return parseSourcesJsonl(input)
  }
  if (isRecord(input) && Array.isArray(input.sources)) return [...input.sources] as SourceLedgerEntry[]
  return []
}

export function extractCitations(report: ReportInput): CitationReference[] {
  const text = getReportText(report)
  const references: CitationReference[] = []

  for (const match of text.matchAll(CITATION_PATTERN)) {
    const rawNumber = match[1] ?? match[2]
    if (!rawNumber) continue
    const position = match.index ?? 0
    const location = getLineAt(text, position)
    references.push({
      number: toCitationNumber(rawNumber),
      raw: match[0],
      line: location.line,
      lineNumber: location.lineNumber
    })
  }

  return references
}

export function validateCitations(report: ReportInput, ledger: LedgerInput): CitationValidationResult {
  const references = extractCitations(report)
  const existing = new Set(ledgerFromInput(ledger).map((entry) => entry.n))
  const missingReferences = references.filter((reference) => !existing.has(reference.number))
  const missing = [...new Set(missingReferences.map((reference) => reference.number))]
  const failures = missingReferences.map(
    (reference) =>
      `Citation ${reference.raw} on line ${reference.lineNumber} has no matching source ledger entry: ${reference.line}`
  )

  return {
    ok: failures.length === 0,
    citations: references.map((reference) => reference.number),
    references,
    missing,
    missingCitations: missing,
    failures
  }
}

export const validateReportCitations = validateCitations

/** Return every report line containing a percentage, currency, multiplier, or count >= 100. */
export function detectUnsourcedNumbers(report: ReportInput): string[] {
  return inspectUnsourcedNumbers(report).map((match) => match.line)
}

export const detectUnsourcedNumberLines = detectUnsourcedNumbers
export const findUnsourcedNumbers = detectUnsourcedNumbers

export function inspectUnsourcedNumbers(report: ReportInput): UnsourcedNumberMatch[] {
  const text = getReportText(report)
  const matches: UnsourcedNumberMatch[] = []

  for (const [index, line] of text.split(/\r?\n/).entries()) {
    // The planner validator checks whether the citation exists in the ledger;
    // this detector only needs to distinguish cited claims from unsourced ones.
    if (maskMatches(line, CITATION_PATTERN) !== line) continue
    const signal = hasUnsourcedNumericSignal(line)
    if (!signal.found) continue
    matches.push({ line, lineNumber: index + 1, match: signal.match })
  }

  return matches
}

/**
 * Planner-facing validator. A citation on a line makes its numeric claim
 * sourced; invalid citations are still rejected by validateCitations.
 */
export function rejectUnsourced(report: ReportInput, ledger: LedgerInput): UnsourcedValidationResult {
  const citationResult = validateCitations(report, ledger)
  const unsourcedLines = detectUnsourcedNumbers(report)
  const failures = [...citationResult.failures, ...unsourcedLines]

  return {
    ok: failures.length === 0,
    valid: failures.length === 0,
    blocked: failures.length > 0,
    rejected: failures.length > 0,
    failures,
    citations: citationResult.references,
    missingCitations: citationResult.missing,
    unsourcedLines,
    quotedLines: unsourcedLines
  }
}

export interface ReportValidationResult extends UnsourcedValidationResult {
  citationValidation: CitationValidationResult
}

export function validateReport(report: ReportInput, ledger: LedgerInput): ReportValidationResult {
  const citationValidation = validateCitations(report, ledger)
  const unsourcedLines = detectUnsourcedNumbers(report)
  const failures = [...citationValidation.failures, ...unsourcedLines]

  return {
    ok: failures.length === 0,
    valid: failures.length === 0,
    blocked: failures.length > 0,
    rejected: failures.length > 0,
    failures,
    citations: citationValidation.references,
    missingCitations: citationValidation.missing,
    unsourcedLines,
    quotedLines: unsourcedLines,
    citationValidation
  }
}

function normalizeLanguage(language: string): string {
  const normalized = language.trim().toLowerCase().replace(/_/g, '-')
  const base = normalized.split('-')[0]
  const aliases: Record<string, string> = {
    arabic: 'ar',
    english: 'en',
    french: 'fr',
    german: 'de',
    russian: 'ru'
  }
  return aliases[base] ?? base
}

function languageEntryCode(entry: LanguagePlanEntry): string {
  const value = entry.language ?? entry.lang ?? entry.code ?? ''
  return normalizeLanguage(value)
}

function languageEntryQueries(entry: LanguagePlanEntry): string[] {
  const candidate = entry.queries ?? entry.triedQueries ?? entry.attemptedQueries ?? entry.tried_queries
  if (Array.isArray(candidate)) {
    return candidate.filter((query): query is string => typeof query === 'string')
  }

  const queryCount =
    typeof candidate === 'number'
      ? candidate
      : entry.queriesTried ?? entry.queries_tried ?? entry.queryCount ?? 0
  return Number.isInteger(queryCount) && queryCount > 0 ? Array.from({ length: queryCount }, () => '') : []
}

function languageEntryIsNoMaterial(entry: LanguagePlanEntry): boolean {
  const status = typeof entry.status === 'string' ? entry.status.toLowerCase().replace(/[_-]/g, ' ') : ''
  return (
    entry.noMaterial === true ||
    entry.no_material === true ||
    entry.material === false ||
    status.includes('no material') ||
    (typeof entry.material === 'string' && ['none', 'no material', 'no_material'].includes(entry.material.toLowerCase()))
  )
}

interface NormalizedLanguagePlan {
  code: string
  noMaterial: boolean
  queries: string[]
}

function normalizeLanguagePlan(plan: LanguagePlanInput | undefined): NormalizedLanguagePlan[] {
  if (!plan) {
    return REQUIRED_LANGUAGES.map((code) => ({ code, noMaterial: false, queries: [] }))
  }

  if (Array.isArray(plan)) {
    return plan.flatMap((item) => {
      if (typeof item === 'string') {
        return [{ code: normalizeLanguage(item), noMaterial: false, queries: [] }]
      }
      const code = languageEntryCode(item)
      return code ? [{ code, noMaterial: languageEntryIsNoMaterial(item), queries: languageEntryQueries(item) }] : []
    })
  }

  return Object.entries(plan).flatMap(([key, value]) => {
    if (typeof value === 'string') {
      return [{ code: normalizeLanguage(key), noMaterial: value.toLowerCase().includes('no material'), queries: [] }]
    }
    if (typeof value === 'number') {
      return [{ code: normalizeLanguage(key), noMaterial: false, queries: [] }]
    }
    if (Array.isArray(value)) {
      return [{ code: normalizeLanguage(key), noMaterial: false, queries: value.filter((item): item is string => typeof item === 'string') }]
    }
    const entry = value as LanguagePlanEntry
    const code = normalizeLanguage(key) || languageEntryCode(entry)
    return code ? [{ code, noMaterial: languageEntryIsNoMaterial(entry), queries: languageEntryQueries(entry) }] : []
  })
}

function depthOptions(
  languagePlanOrOptions: LanguagePlanInput | DepthGateOptions | undefined,
  documentPlan: LanguagePlanInput | undefined
): Required<Pick<DepthGateOptions, 'minDistinctUrls' | 'minDomains' | 'minSourcesPerLanguage' | 'noMaterialQueryMinimum'>> &
  Pick<DepthGateOptions, 'requiredLanguages' | 'languagePlan'> {
  if (
    isRecord(languagePlanOrOptions) &&
    ('languagePlan' in languagePlanOrOptions ||
      'requiredLanguages' in languagePlanOrOptions ||
      'minDistinctUrls' in languagePlanOrOptions ||
      'minDomains' in languagePlanOrOptions ||
      'minSourcesPerLanguage' in languagePlanOrOptions ||
      'noMaterialQueryMinimum' in languagePlanOrOptions)
  ) {
    const options = languagePlanOrOptions as DepthGateOptions
    return {
      languagePlan: options.languagePlan ?? documentPlan,
      requiredLanguages: options.requiredLanguages,
      minDistinctUrls: options.minDistinctUrls ?? 100,
      minDomains: options.minDomains ?? 40,
      minSourcesPerLanguage: options.minSourcesPerLanguage ?? 10,
      noMaterialQueryMinimum: options.noMaterialQueryMinimum ?? 15
    }
  }

  return {
    languagePlan: languagePlanOrOptions as LanguagePlanInput | undefined ?? documentPlan,
    requiredLanguages: undefined,
    minDistinctUrls: 100,
    minDomains: 40,
    minSourcesPerLanguage: 10,
    noMaterialQueryMinimum: 15
  }
}

function canonicalUrl(value: string): string {
  try {
    const url = new URL(value.trim())
    url.hash = ''
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, '')
    return url.toString()
  } catch {
    return value.trim()
  }
}

function canonicalDomain(entry: SourceLedgerEntry): string {
  const supplied = typeof entry.domain === 'string' ? entry.domain.trim() : ''
  if (supplied) return supplied.toLowerCase().replace(/^www\./, '').replace(/\.$/, '')
  try {
    return new URL(entry.url).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}

function languageCountsFor(ledger: readonly SourceLedgerEntry[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const entry of ledger) {
    const language = normalizeLanguage(typeof entry.lang === 'string' ? entry.lang : 'und')
    counts[language] = (counts[language] ?? 0) + 1
  }
  return counts
}

/** Enforce the source-count, domain, and multilingual research gates. */
export function depthGate(
  ledgerInput: LedgerInput,
  languagePlanOrOptions?: LanguagePlanInput | DepthGateOptions
): DepthGateResult {
  const documentPlan =
    isRecord(ledgerInput) ? (ledgerInput.language_plan as LanguagePlanInput | undefined) ?? (ledgerInput.languagePlan as LanguagePlanInput | undefined) : undefined
  const ledger = ledgerFromInput(ledgerInput)
  const options = depthOptions(languagePlanOrOptions, documentPlan)
  const requiredLanguages = (options.requiredLanguages ?? [...REQUIRED_LANGUAGES]).map(normalizeLanguage)
  const urls = new Set(ledger.map((entry) => canonicalUrl(entry.url)).filter(Boolean))
  const domains = new Set(ledger.map(canonicalDomain).filter(Boolean))
  const languageCounts = languageCountsFor(ledger)
  const failures: string[] = []

  if (urls.size < options.minDistinctUrls) {
    failures.push(`distinct URLs ${urls.size} below minimum ${options.minDistinctUrls}.`)
  }
  if (domains.size < options.minDomains) {
    failures.push(`domains ${domains.size} below minimum ${options.minDomains}.`)
  }

  const plan = normalizeLanguagePlan(options.languagePlan)
  const planByLanguage = new Map(plan.map((entry) => [entry.code, entry]))

  for (const language of requiredLanguages) {
    const entry = planByLanguage.get(language)
    if (!entry) {
      failures.push(`language plan missing ${language}.`)
      continue
    }

    const count = languageCounts[language] ?? 0
    if (entry.noMaterial) {
      if (entry.queries.length < options.noMaterialQueryMinimum) {
        failures.push(
          `language ${language} marked no material but only ${entry.queries.length} queries were tried; minimum is ${options.noMaterialQueryMinimum}.`
        )
      }
    } else if (count < options.minSourcesPerLanguage) {
      failures.push(
        `language ${language} has ${count} sources; minimum is ${options.minSourcesPerLanguage} when material is available.`
      )
    }
  }

  return {
    ok: failures.length === 0,
    failures,
    distinctUrls: urls.size,
    domains: domains.size,
    languageCounts,
    requiredLanguages
  }
}

export const validateDepth = depthGate
export const validateResearchDepth = depthGate
export const checkDepthGate = depthGate
export const passesDepthGate = depthGate
