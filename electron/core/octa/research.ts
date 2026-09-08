import { EventEmitter } from 'node:events'
import { randomUUID } from 'node:crypto'
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync
} from 'node:fs'
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from 'node:path'
import {
  buildCodexExecArgv,
  getJobRunner,
  type JobHandle,
  type JobRunner,
  type JobRunnerArgvContext,
  type JobSpec
} from '../jobs/runner'
import { JobsRepository } from '../../db/jobs'
import type { AppSettings, JobEvent, JobResult } from '../../types'
import {
  parseSourcesJsonl,
  validateCitations,
  type DepthGateResult,
  type LanguagePlanInput,
  type ReportInput,
  type SourceLedgerEntry
} from './sources'
import {
  createResearchBrowser,
  type BrowserChallengeEvent,
  type ResearchBrowser,
  type ResearchBrowserSiteStatus,
  type ResearchBrowserStatus,
  type ResearchLoginSite,
  RESEARCH_LOGIN_SITES
} from './browser'
import { MCP_SERVER_NAME } from './mcp-server'

export const DEFAULT_RESEARCH_BUDGET_MS = 45 * 60 * 1_000
export const DEFAULT_RESEARCH_BUDGET_MINUTES = 45
export const REAL_RUN_RESEARCH_BUDGET_MS = 15 * 60 * 1_000
export const DEFAULT_OCTA_HOME = 'C:\\Octa'

export const REQUIRED_RESEARCH_LANGUAGES = ['ar', 'en', 'fr', 'de', 'ru'] as const

export const RESEARCH_PROTOCOL = `
1. Frame. Restate the question, the decision it serves, and what "done" looks like.
2. Language plan. Start from the fixed five (ar, en, fr, de, ru), add any other language the topic lives in, and say why. Write 15–30 queries per language, written natively in that language (not translated word for word), including slang and local terms. Egyptian Arabic search terms differ from MSA; German and Russian forums use their own product names.
3. Harvest. Run the queries across web search, Reddit (old.reddit.com and /search.json), YouTube (transcripts), app stores, review sites, marketplaces, and public LinkedIn/X pages. Read Facebook groups only from screenshots supplied by the owner or public pages; never log in from the scout prompt.
4. Ledger as you go. Append every fetched source to evidence/sources.jsonl immediately. Save extracted text to evidence/pages/<n>.md.
5. Extract. For each source, record 3–10 claims. Every claim has a quote of no more than 25 words, language, date, and a confidence tag.
6. Cross-check. Cluster claims, count independent confirmations, and mark single-source claims as such.
7. Gap check. If any target is unmet, return to harvesting with new queries. Do not stop at 100 if the last 20 sources still added new claims. Stop only after 20 consecutive sources add nothing new (saturation) or when the budget is reached.
8. Report. Write evidence/report.md in the conversation language: answer first, themes ranked by frequency × intensity, persona or competitor tables, verbatim customer language bilingually, contradictions, unknowns, and the full source list. Every report claim must cite a source number.
`.trim()

export const SOURCE_LEDGER_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    n: { type: 'integer', minimum: 1 },
    url: { type: 'string' },
    domain: { type: 'string' },
    title: { type: 'string' },
    lang: { type: 'string' },
    type: { type: 'string' },
    published: { type: 'string' },
    fetched: { type: 'string' },
    words: { type: 'number', minimum: 0 },
    claims: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          text: { type: 'string' },
          quote: { type: 'string', maxLength: 250 },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          topic: { type: 'string' }
        },
        required: ['text', 'quote', 'confidence', 'topic']
      }
    },
    relevance: { type: 'number', minimum: 0, maximum: 1 },
    notes: { type: 'string' }
  },
  required: ['n', 'url', 'domain', 'title', 'lang', 'type', 'published', 'fetched', 'words', 'claims', 'relevance', 'notes']
} as const

const LANGUAGE_PLAN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    language: { type: 'string' },
    status: { type: 'string', enum: ['material', 'no material'] },
    reason: { type: 'string' },
    queries: { type: 'array', items: { type: 'string' } }
  },
  required: ['language', 'status', 'reason', 'queries']
} as const

export const EVIDENCE_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'Octa research evidence',
  type: 'object',
  additionalProperties: false,
  properties: {
    frame: {
      type: 'object',
      additionalProperties: false,
      properties: {
        question: { type: 'string' },
        decision: { type: 'string' },
        done: { type: 'string' }
      },
      required: ['question', 'decision', 'done']
    },
    language_plan: {
      type: 'array',
      items: LANGUAGE_PLAN_SCHEMA
    },
    sources: { type: 'array', items: SOURCE_LEDGER_SCHEMA },
    themes: { type: 'array', items: { type: 'string' } },
    contradictions: { type: 'array', items: { type: 'string' } },
    unknowns: { type: 'array', items: { type: 'string' } },
    report_path: { type: 'string' }
  },
  required: ['frame', 'language_plan', 'sources', 'themes', 'contradictions', 'unknowns', 'report_path']
} as const

export interface ResearchLanguagePlanEntry {
  language: string
  reason: string
  queries: string[]
  status?: 'material' | 'no material'
}

export interface ResearchPromptOptions {
  conversationLanguage?: string
  extraLanguages?: readonly string[]
  languagePlan?: LanguagePlanInput
  budgetMs?: number
  budgetMinutes?: number
  preset?: 'persona' | 'competitor'
  presetText?: string
}

export function normalizeResearchLanguage(language: string): string {
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

export function detectConversationLanguage(text: string): string {
  const ratios = scriptRatios(text)
  if (ratios.arabicLetters > 0 && ratios.arabicRatio >= ratios.latinRatio && ratios.arabicRatio >= ratios.cyrillicRatio) return 'ar'
  if (ratios.cyrillicLetters > 0 && ratios.cyrillicRatio > ratios.latinRatio) return 'ru'
  return 'en'
}

function languageCodes(options: ResearchPromptOptions): string[] {
  const extras = options.extraLanguages ?? []
  return [...new Set([...REQUIRED_RESEARCH_LANGUAGES, ...extras.map(normalizeResearchLanguage).filter(Boolean)])]
}

function languagePlanDescription(options: ResearchPromptOptions): string {
  const entries = languageCodes(options).map((code) => {
    if (code === 'ar') return '- ar: Arabic, including Modern Standard Arabic and Egyptian Arabic (العربية الفصحى والمصرية).'
    if (code === 'en') return '- en: English.'
    if (code === 'fr') return '- fr: French.'
    if (code === 'de') return '- de: German.'
    if (code === 'ru') return '- ru: Russian.'
    return `- ${code}: an additional market language requested by the plan.`
  })
  return entries.join('\n')
}

function promptLanguage(options: ResearchPromptOptions, task: string): string {
  return options.conversationLanguage?.trim() || detectConversationLanguage(task)
}

function budgetMinutes(options: ResearchPromptOptions): number {
  if (options.budgetMinutes !== undefined) return Math.max(1, Math.trunc(options.budgetMinutes))
  return Math.max(1, Math.round((options.budgetMs ?? DEFAULT_RESEARCH_BUDGET_MS) / 60_000))
}

function readPreset(kind: 'persona' | 'competitor'): string {
  const filename = `research-${kind}.md`
  const candidates = [
    join(process.cwd(), 'electron', 'core', 'octa', 'prompts', filename),
    join(process.cwd(), 'out', 'main', 'prompts', filename)
  ]
  if (typeof __dirname === 'string') candidates.unshift(join(__dirname, 'prompts', filename))
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      try { return readFileSync(candidate, 'utf8') } catch { /* try the next candidate */ }
    }
  }
  return ''
}

/** Assemble the full scout prompt required by the runtime contract. */
export function buildResearchPrompt(task: string, options: ResearchPromptOptions = {}): string {
  const language = promptLanguage(options, task)
  const minutes = budgetMinutes(options)
  const preset = options.presetText?.trim() || (options.preset ? readPreset(options.preset) : '')
  const inputPlan = options.languagePlan ? `\nPlanner-supplied language plan (expand it to 15–30 native queries per language):\n${JSON.stringify(options.languagePlan, null, 2)}\n` : ''
  return [
    '# Octa multilingual research scout',
    '',
    `Task: ${task.trim()}`,
    `Conversation/report language: ${language}`,
    `Time budget: ${minutes} minutes (default is ${DEFAULT_RESEARCH_BUDGET_MINUTES} minutes). Treat this as a hard stop.`,
    '',
    '## Mandatory language rule (D17)',
    'Always search all five languages below. Add any extra language the topic or market lives in, explain why, and give it 15–30 native queries. Aim for at least 10 fetched sources per language with material. If a language has no relevant material after exactly 15 tried queries, write a language-plan entry with status "no material" and include all 15 queries.',
    languagePlanDescription(options),
    inputPlan,
    '## Full research protocol §2',
    RESEARCH_PROTOCOL,
    '',
    '## Ledger schema §3',
    'Append one JSON object per fetched and read source to evidence/sources.jsonl immediately. Save page text to evidence/pages/<n>.md. Use this shape:',
    JSON.stringify({
      n: 37,
      url: 'https://example.com/page',
      domain: 'example.com',
      title: 'Page title',
      lang: 'ar-EG',
      type: 'forum',
      published: '2026-03-12',
      fetched: '2026-09-05T20:11:00Z',
      words: 1840,
      claims: [{ text: '...', quote: '≤25 words', confidence: 'high|medium|low', topic: 'pricing' }],
      relevance: 0.8,
      notes: '...'
    }, null, 2),
    '',
    '## Structured final response',
    'Return an object matching evidence.schema.json with exactly these top-level fields: frame, language_plan, sources, themes, contradictions, unknowns, report_path. The ledger and report on disk are authoritative; keep them even if the time budget stops the run.',
    '',
    '## Quality gates enforced by Octa code',
    'Octa will reject the result unless it has at least 100 distinct fetched URLs, at least 40 domains, no more than 8 counted URLs per domain, the language requirements above, valid source-number citations, and a report whose script matches the conversation language. Saturation and the budget are your instructions; these gates are code.',
    preset ? `\n## Job preset\n${preset.trim()}` : ''
  ].filter((part) => part !== '').join('\n') + '\n'
}

function safeId(value?: string): string {
  if (!value) return randomUUID()
  const id = value.trim()
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) throw new Error('Research job id must contain only letters, numbers, hyphens, and underscores.')
  return id
}

function tomlString(value: string): string {
  return JSON.stringify(value)
}

function tomlArray(values: readonly string[]): string {
  return `[${values.map(tomlString).join(', ')}]`
}

export interface McpServerLaunch {
  command: string
  args: string[]
  env: Record<string, string>
  scriptPath: string
}

export interface McpServerLaunchOptions {
  homePath: string
  jobId: string
  jobFolder: string
  serverPath?: string
  command?: string
}

export function resolveMcpServerScript(explicit?: string): string {
  const candidates = [
    explicit,
    process.env.OCTA_MCP_SERVER_PATH,
    join(process.cwd(), 'out', 'main', 'mcp-server.js'),
    join(process.cwd(), 'out', 'main', 'mcp-server.mjs'),
    join(process.cwd(), 'electron', 'core', 'octa', 'mcp-server.ts')
  ].filter((candidate): candidate is string => Boolean(candidate?.trim()))
  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0] ?? join(process.cwd(), 'electron', 'core', 'octa', 'mcp-server.ts')
}

export function buildMcpServerLaunch(options: McpServerLaunchOptions): McpServerLaunch {
  const scriptPath = resolveMcpServerScript(options.serverPath)
  const nodeCommand = options.command?.trim() || process.env.OCTA_NODE_BINARY?.trim() || (process.versions.electron ? 'node' : process.execPath)
  const isTypeScript = extname(scriptPath).toLowerCase() === '.ts'
  const args = isTypeScript ? ['--import', 'tsx', scriptPath] : [scriptPath]
  return {
    command: nodeCommand,
    args,
    scriptPath,
    env: {
      OCTA_MCP_SERVER: '1',
      OCTA_HOME: options.homePath,
      OCTA_RESEARCH_JOB_ID: options.jobId,
      OCTA_RESEARCH_JOB_DIR: options.jobFolder
    }
  }
}

export function buildClaudeMcpArgs(configPath: string): string[] {
  return ['--mcp-config', configPath]
}

export const buildResearchClaudeMcpArgs = buildClaudeMcpArgs

export function buildCodexMcpConfigArgs(launch: Pick<McpServerLaunch, 'command' | 'args'>): string[] {
  return [
    '-c', `${MCP_SERVER_CONFIG_KEY}.command=${tomlString(launch.command)}`,
    '-c', `${MCP_SERVER_CONFIG_KEY}.args=${tomlArray(launch.args)}`
  ]
}

export interface ResearchCodexArgvOptions extends JobRunnerArgvContext {
  mcpLaunch: Pick<McpServerLaunch, 'command' | 'args'>
}

const MCP_SERVER_CONFIG_KEY = `mcp_servers.${MCP_SERVER_NAME}`

/** Codex scout argv: the spec-001 executor contract plus the octa-tools server. */
export function buildResearchCodexArgv(options: ResearchCodexArgvOptions): string[] {
  return [...buildCodexExecArgv({ ...options, outputSchema: options.outputSchema ?? 'evidence.schema.json' }), ...buildCodexMcpConfigArgs(options.mcpLaunch)]
}

export const buildCodexScoutArgv = buildResearchCodexArgv

export interface ScriptRatios {
  arabicLetters: number
  latinLetters: number
  cyrillicLetters: number
  totalLetters: number
  arabicRatio: number
  latinRatio: number
  cyrillicRatio: number
}

export function scriptRatios(text: string): ScriptRatios {
  // URLs, markdown destinations, and e-mail addresses are metadata rather
  // than report prose. Excluding them keeps a source list from changing the
  // language result while preserving bilingual customer quotations.
  const prose = text
    .replace(/https?:\/\/[^\s)\]>]+|www\.[^\s)\]>]+/giu, ' ')
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/gu, ' ')
  const arabicLetters = (prose.match(/[\u0600-\u06ff]/gu) ?? []).length
  const latinLetters = (prose.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/gu) ?? []).length
  const cyrillicLetters = (prose.match(/[\u0400-\u04ff]/gu) ?? []).length
  const totalLetters = arabicLetters + latinLetters + cyrillicLetters
  return {
    arabicLetters,
    latinLetters,
    cyrillicLetters,
    totalLetters,
    arabicRatio: totalLetters > 0 ? arabicLetters / totalLetters : 0,
    latinRatio: totalLetters > 0 ? latinLetters / totalLetters : 0,
    cyrillicRatio: totalLetters > 0 ? cyrillicLetters / totalLetters : 0
  }
}

export interface ReportLanguageCheck {
  ok: boolean
  expected: string
  ratios: ScriptRatios
  reason?: string
}

export function checkReportLanguage(report: ReportInput, conversationLanguage: string): ReportLanguageCheck {
  const text = typeof report === 'string' ? report : 'text' in report ? report.text : report.content
  const expected = normalizeResearchLanguage(conversationLanguage || detectConversationLanguage(text))
  const ratios = scriptRatios(text)
  const threshold = 0.2
  const ok = expected === 'ar'
    ? ratios.arabicRatio >= threshold
    : expected === 'ru'
      ? ratios.cyrillicRatio >= threshold
      : expected === 'mixed'
        ? ratios.totalLetters > 0 && Math.max(ratios.arabicRatio, ratios.latinRatio, ratios.cyrillicRatio) >= threshold
        : ratios.latinRatio >= threshold
  return {
    ok,
    expected,
    ratios,
    reason: ok ? undefined : `Report script does not match ${expected}; Arabic ${(ratios.arabicRatio * 100).toFixed(1)}%, Latin ${(ratios.latinRatio * 100).toFixed(1)}%, Cyrillic ${(ratios.cyrillicRatio * 100).toFixed(1)}%.`
  }
}

function canonicalUrl(value: string): string {
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    url.hash = ''
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, '')
    return url.toString()
  } catch {
    return ''
  }
}

function canonicalDomain(entry: SourceLedgerEntry): string {
  const supplied = typeof entry.domain === 'string' ? entry.domain.trim() : ''
  if (supplied) return supplied.toLowerCase().replace(/^www\./, '').replace(/\.$/, '')
  try { return new URL(entry.url).hostname.toLowerCase().replace(/^www\./, '') } catch { return '' }
}

function uniqueLedger(ledger: readonly SourceLedgerEntry[]): SourceLedgerEntry[] {
  const seen = new Set<string>()
  return ledger.filter((entry) => {
    const url = canonicalUrl(entry.url)
    if (!url || seen.has(url)) return false
    seen.add(url)
    return true
  })
}

function languageEntryCode(value: Record<string, unknown>): string {
  const candidate = value.language ?? value.lang ?? value.code
  return typeof candidate === 'string' ? normalizeResearchLanguage(candidate) : ''
}

function languageEntryQueries(value: Record<string, unknown>): string[] {
  for (const key of ['queries', 'triedQueries', 'attemptedQueries', 'tried_queries']) {
    const candidate = value[key]
    if (Array.isArray(candidate)) return candidate.filter((item): item is string => typeof item === 'string')
    if (typeof candidate === 'number' && Number.isInteger(candidate) && candidate > 0) return Array.from({ length: candidate }, () => '')
  }
  for (const key of ['queriesTried', 'queries_tried', 'queryCount']) {
    const candidate = value[key]
    if (typeof candidate === 'number' && Number.isInteger(candidate) && candidate > 0) return Array.from({ length: candidate }, () => '')
  }
  return []
}

function noMaterial(value: Record<string, unknown>): boolean {
  const status = typeof value.status === 'string' ? value.status.toLowerCase().replace(/[_-]/g, ' ') : ''
  const material = value.material
  return value.noMaterial === true || value.no_material === true || material === false || status.includes('no material') || (typeof material === 'string' && ['none', 'no material', 'no_material'].includes(material.toLowerCase()))
}

interface NormalizedPlanEntry {
  code: string
  queries: string[]
  noMaterial: boolean
}

function normalizePlan(plan: LanguagePlanInput | undefined): NormalizedPlanEntry[] {
  if (!plan) return REQUIRED_RESEARCH_LANGUAGES.map((code) => ({ code, queries: [], noMaterial: false }))
  if (Array.isArray(plan)) {
    return plan.flatMap((item) => {
      if (typeof item === 'string') return [{ code: normalizeResearchLanguage(item), queries: [], noMaterial: false }]
      if (!item || typeof item !== 'object') return []
      const value = item as Record<string, unknown>
      const code = languageEntryCode(value)
      return code ? [{ code, queries: languageEntryQueries(value), noMaterial: noMaterial(value) }] : []
    })
  }
  return Object.entries(plan).flatMap(([key, raw]) => {
    const code = normalizeResearchLanguage(key)
    if (typeof raw === 'string') return [{ code, queries: [], noMaterial: raw.toLowerCase().includes('no material') }]
    if (typeof raw === 'number') return [{ code, queries: [], noMaterial: false }]
    if (Array.isArray(raw)) return [{ code, queries: raw.filter((item): item is string => typeof item === 'string'), noMaterial: false }]
    if (!raw || typeof raw !== 'object') return []
    const value = raw as Record<string, unknown>
    return [{ code: code || languageEntryCode(value), queries: languageEntryQueries(value), noMaterial: noMaterial(value) }]
  }).filter((entry) => entry.code)
}

function sourceClaimCitationFailures(ledger: readonly SourceLedgerEntry[]): string[] {
  const existing = new Set(ledger.map((entry) => entry.n))
  const failures: string[] = []
  const citationPattern = /\[([0-9٠-٩۰-۹]+)\]|\(\s*source\s+([0-9٠-٩۰-۹]+)\s*\)/giu
  const normalizeNumber = (value: string): number => Number(value.replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - '٠'.charCodeAt(0))).replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - '۰'.charCodeAt(0))))
  for (const entry of ledger) {
    for (const claim of entry.claims) {
      for (const field of [claim.text, claim.quote]) {
        for (const match of field.matchAll(citationPattern)) {
          const number = normalizeNumber(match[1] ?? match[2] ?? '')
          if (!existing.has(number)) failures.push(`Claim in source ${entry.n} cites missing source ${number}.`)
        }
      }
      const extra = claim as unknown as Record<string, unknown>
      for (const key of ['source', 'source_n', 'sourceNumber', 'source_number', 'sources', 'sourceNumbers', 'source_numbers', 'citations']) {
        const candidate = extra[key]
        const values = Array.isArray(candidate) ? candidate : [candidate]
        for (const value of values) {
          const number = typeof value === 'number'
            ? value
            : typeof value === 'string' && /^\s*[0-9٠-٩۰-۹]+\s*$/.test(value)
              ? normalizeNumber(value)
              : undefined
          if (number !== undefined && !existing.has(number)) failures.push(`Claim in source ${entry.n} cites missing source ${number}.`)
        }
      }
    }
  }
  return failures
}

export interface ResearchDepthGateResult extends DepthGateResult {
  rawDistinctUrls: number
  countedDistinctUrls: number
  maxSourcesPerDomain: number
  perDomainCounts: Record<string, number>
}

function uniqueLanguageCounts(ledger: readonly SourceLedgerEntry[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const entry of uniqueLedger(ledger)) {
    const language = normalizeResearchLanguage(entry.lang || 'und')
    counts[language] = (counts[language] ?? 0) + 1
  }
  return counts
}

function languageGateFailures(
  ledger: readonly SourceLedgerEntry[],
  languagePlan: LanguagePlanInput | undefined,
  requiredLanguages: readonly string[],
  minSourcesPerLanguage: number,
  noMaterialQueryMinimum: number
): string[] {
  if (!languagePlan) return requiredLanguages.map((language) => `language plan missing ${language}.`)
  const counts = uniqueLanguageCounts(ledger)
  const entries = normalizePlan(languagePlan)
  const byLanguage = new Map(entries.map((entry) => [entry.code, entry]))
  const failures: string[] = []
  for (const language of requiredLanguages) {
    const entry = byLanguage.get(language)
    if (!entry) {
      failures.push(`language plan missing ${language}.`)
      continue
    }
    const count = counts[language] ?? 0
    if (entry.noMaterial && count === 0) {
      if (entry.queries.length < noMaterialQueryMinimum) failures.push(`language ${language} marked no material but only ${entry.queries.length} queries were tried; minimum is ${noMaterialQueryMinimum}.`)
    } else if (count < minSourcesPerLanguage) {
      failures.push(`language ${language} has ${count} sources; minimum is ${minSourcesPerLanguage} when material is available.`)
    }
  }
  for (const entry of entries) {
    if (requiredLanguages.includes(entry.code)) continue
    const count = counts[entry.code] ?? 0
    if (entry.noMaterial && count === 0) {
      if (entry.queries.length < noMaterialQueryMinimum) failures.push(`language ${entry.code} marked no material but only ${entry.queries.length} queries were tried; minimum is ${noMaterialQueryMinimum}.`)
    } else if (count < minSourcesPerLanguage) {
      failures.push(`language ${entry.code} has ${count} sources; minimum is ${minSourcesPerLanguage} when material is available.`)
    }
  }
  return failures
}

export interface ResearchGateOptions {
  languagePlan?: LanguagePlanInput
  requiredLanguages?: readonly string[]
  conversationLanguage?: string
  report?: ReportInput
  minDistinctUrls?: number
  minDomains?: number
  minSourcesPerLanguage?: number
  noMaterialQueryMinimum?: number
  maxSourcesPerDomain?: number
}

interface LedgerDocument {
  sources: readonly SourceLedgerEntry[]
  language_plan?: LanguagePlanInput
  languagePlan?: LanguagePlanInput
}

function isLedgerDocument(value: unknown): value is LedgerDocument {
  return isRecord(value) && Array.isArray(value.sources)
}

function ledgerEntries(input: readonly SourceLedgerEntry[] | LedgerDocument | string): SourceLedgerEntry[] {
  if (typeof input === 'string') return parseSourcesJsonl(input)
  if (isLedgerDocument(input)) return [...input.sources]
  return [...input]
}

/** Research-specific depth gate. It reuses spec-012 parsing and citation validators and adds the eight-pages/domain cap. */
export function researchDepthGate(ledgerInput: readonly SourceLedgerEntry[] | LedgerDocument | string, options: ResearchGateOptions = {}): ResearchDepthGateResult {
  const ledger = ledgerEntries(ledgerInput)
  const unique = uniqueLedger(ledger)
  const maxSourcesPerDomain = Math.max(1, Math.trunc(options.maxSourcesPerDomain ?? 8))
  const perDomainSets = new Map<string, Set<string>>()
  for (const entry of unique) {
    const domain = canonicalDomain(entry)
    if (!domain) continue
    const set = perDomainSets.get(domain) ?? new Set<string>()
    set.add(canonicalUrl(entry.url))
    perDomainSets.set(domain, set)
  }
  const perDomainCounts = Object.fromEntries([...perDomainSets.entries()].map(([domain, urls]) => [domain, urls.size]))
  const countedDistinctUrls = [...perDomainSets.values()].reduce((total, urls) => total + Math.min(urls.size, maxSourcesPerDomain), 0)
  const requiredLanguages = (options.requiredLanguages ?? [...REQUIRED_RESEARCH_LANGUAGES]).map(normalizeResearchLanguage)
  const documentPlan = isLedgerDocument(ledgerInput) ? ledgerInput.language_plan ?? ledgerInput.languagePlan : undefined
  const languagePlan = options.languagePlan ?? documentPlan
  const minSourcesPerLanguage = options.minSourcesPerLanguage ?? 10
  const noMaterialQueryMinimum = options.noMaterialQueryMinimum ?? 15
  const failures = languageGateFailures(ledger, languagePlan, requiredLanguages, minSourcesPerLanguage, noMaterialQueryMinimum)
  const minDistinctUrls = options.minDistinctUrls ?? 100
  const minDomains = options.minDomains ?? 40
  if (countedDistinctUrls < minDistinctUrls) failures.unshift(`distinct URLs ${countedDistinctUrls} below minimum ${minDistinctUrls} after the ${maxSourcesPerDomain}-per-domain cap.`)
  if (perDomainSets.size < minDomains) failures.push(`domains ${perDomainSets.size} below minimum ${minDomains}.`)
  const result: ResearchDepthGateResult = {
    ok: failures.length === 0,
    failures: [...new Set(failures)],
    distinctUrls: countedDistinctUrls,
    domains: perDomainSets.size,
    languageCounts: uniqueLanguageCounts(ledger),
    requiredLanguages,
    rawDistinctUrls: new Set(unique.map((entry) => canonicalUrl(entry.url))).size,
    countedDistinctUrls,
    maxSourcesPerDomain,
    perDomainCounts
  }
  result.ok = result.failures.length === 0
  return result
}

export interface ResearchGateResult {
  ok: boolean
  failures: string[]
  depth: ResearchDepthGateResult
  citations: ReturnType<typeof validateCitations>
  reportLanguage: ReportLanguageCheck
  claimFailures: string[]
}

export function validateResearchGates(
  ledgerInput: readonly SourceLedgerEntry[] | LedgerDocument | string,
  options: ResearchGateOptions = {}
): ResearchGateResult {
  const ledger = ledgerEntries(ledgerInput)
  const depth = researchDepthGate(ledgerInput, options)
  const report = options.report ?? ''
  const citations = validateCitations(report, ledger)
  const claimFailures = sourceClaimCitationFailures(ledger)
  const reportLanguage = checkReportLanguage(report, options.conversationLanguage ?? detectConversationLanguage(typeof report === 'string' ? report : ''))
  const failures = [
    ...depth.failures,
    ...citations.failures,
    ...claimFailures,
    ...(reportLanguage.ok ? [] : [reportLanguage.reason ?? 'Report language does not match the conversation language.'])
  ]
  return { ok: failures.length === 0, failures: [...new Set(failures)], depth, citations, reportLanguage, claimFailures }
}

export const checkResearchGates = validateResearchGates
export const validateResearchOutput = validateResearchGates
export const parseResearchLedger = parseSourcesJsonl

export type ResearchRunStatus = 'running' | 'ok' | 'failed: depth' | 'failed: runner' | 'cancelled'

export interface ResearchResult {
  jobId: string
  folder: string
  status: Exclude<ResearchRunStatus, 'running'>
  task: string
  conversationLanguage: string
  budgetMinutes: number
  reportPath: string
  sourcesPath: string
  sourceCount: number
  domainCount: number
  languagePlan: unknown[]
  ledger: SourceLedgerEntry[]
  gate: ResearchGateResult
  agent: JobResult
  partialReport: boolean
}

export type ResearchEvent = JobEvent | BrowserChallengeEvent

export interface ResearchHandle {
  id: string
  jobId: string
  folder: string
  events: EventEmitter
  promise: Promise<ResearchResult>
  result: Promise<ResearchResult>
  jobPromise: Promise<JobResult>
  onEvent(listener: (event: ResearchEvent) => void): () => void
  cancel(): Promise<boolean>
}

export interface ResearchRunner {
  startJob(spec: JobSpec): JobHandle
}

export interface RunResearchOptions extends ResearchPromptOptions {
  homePath?: string
  octaHome?: string
  jobId?: string
  workflowRunId?: string
  stepId?: string
  runner?: ResearchRunner
  jobRunner?: ResearchRunner
  jobs?: JobsRepository
  settings?: Partial<Pick<AppSettings, 'octaHomePath' | 'braveSearchApiKey'>> & Partial<ResearchSettingsLike>
  getSettings?: () => AppSettings
  mcpServerPath?: string
  mcpCommand?: string
  maxRetries?: number
  inputTokenBudget?: number
  onEvent?: (event: ResearchEvent) => void
  onChallenge?: (event: BrowserChallengeEvent) => void
  reportPath?: string
  now?: () => Date
}

interface ResearchSettingsLike {
  getValue<T>(key: string): T | undefined
  setValue(key: string, value: unknown): void
}

function getHome(options: RunResearchOptions): string {
  const configured = options.homePath ?? options.octaHome ?? options.getSettings?.().octaHomePath ?? options.settings?.octaHomePath ?? process.env.OCTA_HOME
  return resolve(configured?.trim() || DEFAULT_OCTA_HOME)
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readJson(path: string): unknown {
  if (!existsSync(path)) return undefined
  try { return JSON.parse(readFileSync(path, 'utf8')) as unknown } catch { return undefined }
}

function hasEvidenceShape(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) return false
  // The generic spec-001 result also has a string `sources` field. Require an
  // evidence-shaped array/plan/path so that result.json cannot hide the
  // structured scout response that follows in log.jsonl.
  return Array.isArray(value.sources)
    || Array.isArray(value.language_plan)
    || isRecord(value.language_plan)
    || typeof value.report_path === 'string'
}

function structuredFromText(text: string): Record<string, unknown> | undefined {
  const candidates = [text.trim(), ...(text.match(/```(?:json)?\s*([\s\S]*?)\s*```/gi) ?? []).map((value) => value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, ''))]
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown
      if (hasEvidenceShape(parsed)) return parsed
    } catch { /* continue */ }
  }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(text.slice(start, end + 1)) as unknown
      if (hasEvidenceShape(parsed)) return parsed
    } catch { /* diagnostic text can contain braces */ }
  }
  return undefined
}

function readEvidence(folder: string): Record<string, unknown> {
  const candidates = [
    join(folder, 'evidence', 'evidence.json'),
    join(folder, 'evidence', 'result.json'),
    join(folder, 'out', 'evidence.json'),
    join(folder, 'out', 'result.json'),
    join(folder, 'result.json')
  ]
  for (const candidate of candidates) {
    const parsed = readJson(candidate)
    if (hasEvidenceShape(parsed)) return parsed
  }
  const logPath = join(folder, 'log.jsonl')
  if (existsSync(logPath)) {
    const lines = readFileSync(logPath, 'utf8').split(/\r?\n/).reverse()
    for (const line of lines) {
      try {
        const event = JSON.parse(line) as { type?: string; text?: string }
        if (event.type === 'text' && event.text) {
          const parsed = structuredFromText(event.text)
          if (parsed) return parsed
        }
      } catch { /* ignore runner diagnostics */ }
    }
  }
  return {}
}

function reportPathFor(folder: string, requested: unknown): string {
  const candidate = typeof requested === 'string' && requested.trim() ? requested.trim() : join('evidence', 'report.md')
  const absolute = isAbsolute(candidate) ? resolve(candidate) : resolve(folder, candidate)
  const root = resolve(folder)
  const rel = relative(root, absolute)
  return rel && !rel.startsWith('..') && !isAbsolute(rel) ? absolute : join(folder, 'evidence', 'report.md')
}

function sourcesPathFor(folder: string): string {
  return join(folder, 'evidence', 'sources.jsonl')
}

function evidenceSources(value: unknown): SourceLedgerEntry[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is SourceLedgerEntry => isRecord(item) && typeof item.n === 'number' && typeof item.url === 'string')
}

function ensureLedger(folder: string, evidence: Record<string, unknown>): { path: string; ledger: SourceLedgerEntry[] } {
  const path = sourcesPathFor(folder)
  mkdirSync(dirname(path), { recursive: true })
  if (!existsSync(path) && Array.isArray(evidence.sources) && evidence.sources.length > 0) {
    writeFileSync(path, `${evidence.sources.map((source) => JSON.stringify(source)).join('\n')}\n`, 'utf8')
  }
  try {
    return { path, ledger: existsSync(path) ? parseSourcesJsonl(path) : evidenceSources(evidence.sources) }
  } catch {
    return { path, ledger: [] }
  }
}

function reportText(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf8') : ''
}

function languagePlanFor(evidence: Record<string, unknown>, fallback: LanguagePlanInput | undefined): LanguagePlanInput | undefined {
  return Array.isArray(evidence.language_plan) || isRecord(evidence.language_plan) ? evidence.language_plan as LanguagePlanInput : fallback
}

function ensurePartialReport(
  path: string,
  task: string,
  language: string,
  ledger: readonly SourceLedgerEntry[],
  gate: ResearchGateResult
): { path: string; partial: boolean } {
  mkdirSync(dirname(path), { recursive: true })
  const exists = existsSync(path)
  let report = exists ? reportText(path) : `# Partial research report\n\nTask: ${task}\n\nThe scout stopped before the quality gates passed.\n`
  const marker = '## Octa gate summary'
  if (!report.includes(marker)) {
    report += `\n${marker}\n\n- Conversation language: ${language}\n- Sources read: ${ledger.length}\n- Distinct URLs counted: ${gate.depth.countedDistinctUrls}\n- Domains: ${gate.depth.domains}\n- Gate status: ${gate.ok ? 'passed' : 'failed: depth'}\n${gate.failures.map((failure) => `- ${failure}`).join('\n')}\n`
  }
  if (!exists || report !== reportText(path)) writeFileSync(path, report, 'utf8')
  return { path, partial: !gate.ok || !exists }
}

function readBrowserChallenges(folder: string, offset: { value: number }, onChallenge: (event: BrowserChallengeEvent) => void): void {
  const path = join(folder, 'browser-events.jsonl')
  if (!existsSync(path)) return
  const lines = readFileSync(path, 'utf8').split(/\r?\n/).filter(Boolean)
  while (offset.value < lines.length) {
    try {
      const event = JSON.parse(lines[offset.value]) as BrowserChallengeEvent
      if (event.type === 'browser:challenge') onChallenge(event)
    } catch { /* leave malformed bridge lines ignored */ }
    offset.value += 1
  }
}

/** Start a Codex scout and validate its evidence after the process exits. */
export function runResearch(task: string, options: RunResearchOptions = {}): ResearchHandle {
  const trimmedTask = task.trim()
  if (!trimmedTask) throw new Error('Research task is required.')
  const id = safeId(options.jobId)
  const home = getHome(options)
  const folder = join(home, 'jobs', id)
  mkdirSync(join(folder, 'evidence'), { recursive: true })
  mkdirSync(join(folder, 'out'), { recursive: true })
  const language = promptLanguage(options, trimmedTask)
  const launch = buildMcpServerLaunch({
    homePath: home,
    jobId: id,
    jobFolder: folder,
    serverPath: options.mcpServerPath,
    command: options.mcpCommand
  })
  const claudeConfigPath = join(folder, 'claude-mcp-config.json')
  writeJson(claudeConfigPath, {
    mcpServers: {
      [MCP_SERVER_NAME]: {
        type: 'stdio',
        command: launch.command,
        args: launch.args,
        env: launch.env
      }
    }
  })
  writeJson(join(folder, 'evidence.schema.json'), EVIDENCE_SCHEMA)
  const prompt = buildResearchPrompt(trimmedTask, options)
  const runner: ResearchRunner = options.runner ?? options.jobRunner ?? getJobRunner()
  const jobSpec: JobSpec = {
    id,
    workflowRunId: options.workflowRunId,
    runner: 'codex-scout',
    input: {
      task: trimmedTask,
      conversation_language: language,
      language_plan: languageCodes(options),
      budget_minutes: budgetMinutes(options)
    },
    brief: prompt,
    prompt,
    workflow: 'research',
    stepId: options.stepId ?? 'research',
    language,
    timeBudgetMs: options.budgetMs ?? (options.budgetMinutes !== undefined ? Math.max(1, Math.trunc(options.budgetMinutes)) * 60_000 : DEFAULT_RESEARCH_BUDGET_MS),
    inputTokenBudget: options.inputTokenBudget,
    maxRetries: options.maxRetries,
    environment: {
      ...launch.env,
      OCTA_CLAUDE_MCP_CONFIG: claudeConfigPath,
      PLAYWRIGHT_BROWSERS_PATH: join(home, 'browser', 'playwright')
    },
    argsOverride: buildResearchCodexArgv({
      workspace: folder,
      outputSchema: 'evidence.schema.json',
      mcpLaunch: launch
    })
  }
  const jobHandle = runner.startJob(jobSpec)
  const events = new EventEmitter()
  const unsubscribe = jobHandle.onEvent((event) => {
    events.emit('event', event)
    options.onEvent?.(event)
  })
  const challengeOffset = { value: 0 }
  const challengeHandler = (event: BrowserChallengeEvent): void => {
    events.emit('event', event)
    options.onChallenge?.(event)
    options.onEvent?.(event)
  }
  const challengeTimer = setInterval(() => readBrowserChallenges(folder, challengeOffset, challengeHandler), 750)
  const timerWithUnref = challengeTimer as unknown as { unref?: () => void }
  timerWithUnref.unref?.()

  const jobPromise = jobHandle.promise
  const promise = (async (): Promise<ResearchResult> => {
    const agent = await jobPromise
    clearInterval(challengeTimer)
    readBrowserChallenges(folder, challengeOffset, challengeHandler)
    const evidence = readEvidence(folder)
    const evidencePath = join(folder, 'evidence', 'evidence.json')
    if (Object.keys(evidence).length > 0 && !existsSync(evidencePath)) writeJson(evidencePath, evidence)
    const ledgerResult = ensureLedger(folder, evidence)
    const reportPath = reportPathFor(folder, options.reportPath ?? evidence.report_path)
    const plan = languagePlanFor(evidence, options.languagePlan)
    const report = reportText(reportPath)
    const gate = validateResearchGates(ledgerResult.ledger, {
      languagePlan: plan,
      conversationLanguage: language,
      report,
      minDistinctUrls: 100,
      minDomains: 40,
      minSourcesPerLanguage: 10,
      noMaterialQueryMinimum: 15,
      maxSourcesPerDomain: 8
    })
    const reportState = ensurePartialReport(reportPath, trimmedTask, language, ledgerResult.ledger, gate)
    const finalStatus: ResearchRunStatus = agent.status === 'cancelled'
      ? 'cancelled'
      : agent.status !== 'ok'
        ? 'failed: runner'
        : gate.ok
          ? 'ok'
          : 'failed: depth'
    const result: ResearchResult = {
      jobId: id,
      folder,
      status: finalStatus === 'failed: runner' && gate.failures.length > 0 ? 'failed: depth' : finalStatus,
      task: trimmedTask,
      conversationLanguage: language,
      budgetMinutes: budgetMinutes(options),
      reportPath: reportState.path,
      sourcesPath: ledgerResult.path,
      sourceCount: ledgerResult.ledger.length,
      domainCount: gate.depth.domains,
      languagePlan: Array.isArray(evidence.language_plan) ? evidence.language_plan : [],
      ledger: ledgerResult.ledger,
      gate,
      agent,
      partialReport: reportState.partial
    }
    writeJson(join(folder, 'research-result.json'), result)
    if (options.jobs) {
      options.jobs.updateJob(id, {
        status: result.status === 'ok' ? 'ok' : result.status === 'cancelled' ? 'cancelled' : 'failed',
        sourceCount: result.sourceCount,
        result: {
          ...agent,
          status: result.status === 'ok' ? 'ok' : result.status === 'cancelled' ? 'cancelled' : 'failed',
          sources: relative(folder, ledgerResult.path),
          metrics: { ...agent.metrics, source_count: result.sourceCount },
          notes: `${agent.notes}${agent.notes ? '\n' : ''}Research gate: ${result.status}. ${gate.failures.join(' ')}`
        },
        error: result.status === 'ok' || result.status === 'cancelled' ? null : gate.failures.join(' ') || agent.notes
      })
    }
    return result
  })().finally(() => {
    clearInterval(challengeTimer)
    unsubscribe()
  })

  return {
    id,
    jobId: id,
    folder,
    events,
    promise,
    result: promise,
    jobPromise,
    onEvent: (listener) => {
      events.on('event', listener)
      return () => events.removeListener('event', listener)
    },
    cancel: () => jobHandle.cancel()
  }
}

export interface ResearchJobStatus {
  jobId: string
  folder: string
  status: ResearchRunStatus
  sourceCount: number
  domainCount: number
  reportPath: string | null
  sources: SourceLedgerEntry[]
  gate?: ResearchGateResult
  task?: string
}

export interface ResearchStartRequest {
  task: string
  conversationLanguage?: string
  extraLanguages?: string[]
  budgetMinutes?: number
  budgetMs?: number
  preset?: 'persona' | 'competitor'
  languagePlan?: LanguagePlanInput
  jobId?: string
}

export interface ResearchStartResponse {
  id: string
  folder: string
}

export interface ResearchStatusResponse {
  browser: ResearchBrowserStatus
  jobs: ResearchJobStatus[]
  job: ResearchJobStatus | null
}

export interface ResearchManagerOptions {
  runner?: ResearchRunner
  jobs?: JobsRepository
  getSettings: () => AppSettings
  settings?: ResearchSettingsLike
  onEvent?: (event: ResearchEvent) => void
  onChallenge?: (event: BrowserChallengeEvent) => void
}

export class ResearchManager {
  private readonly runner?: ResearchRunner
  private readonly jobs?: JobsRepository
  private readonly getSettings: () => AppSettings
  private readonly settings?: ResearchSettingsLike
  private readonly onEvent?: (event: ResearchEvent) => void
  private readonly onChallenge?: (event: BrowserChallengeEvent) => void
  private readonly active = new Map<string, ResearchHandle>()
  private readonly completed = new Map<string, ResearchResult>()
  private browser?: ResearchBrowser
  private browserHome?: string

  constructor(options: ResearchManagerOptions) {
    this.runner = options.runner
    this.jobs = options.jobs
    this.getSettings = options.getSettings
    this.settings = options.settings
    this.onEvent = options.onEvent
    this.onChallenge = options.onChallenge
  }

  start(task: string, options: Omit<RunResearchOptions, 'runner' | 'jobRunner' | 'jobs' | 'getSettings' | 'settings' | 'onEvent' | 'onChallenge'> = {}): ResearchHandle {
    const handle = runResearch(task, {
      ...options,
      runner: this.runner,
      jobs: this.jobs,
      getSettings: this.getSettings,
      settings: this.settings,
      onEvent: (event) => this.onEvent?.(event),
      onChallenge: (event) => this.onChallenge?.(event)
    })
    this.active.set(handle.id, handle)
    void handle.promise.then((result) => {
      this.active.delete(handle.id)
      this.completed.set(handle.id, result)
    }).catch(() => this.active.delete(handle.id))
    return handle
  }

  private getResearchBrowser(): ResearchBrowser {
    const home = resolve(this.getSettings().octaHomePath || DEFAULT_OCTA_HOME)
    if (!this.browser || this.browserHome !== home) {
      if (this.browser) void this.browser.close()
      this.browserHome = home
      this.browser = createResearchBrowser({
        octaHome: home,
        settings: this.settings,
        onChallenge: (event) => {
          this.onChallenge?.(event)
          this.onEvent?.(event)
        }
      })
    }
    return this.browser
  }

  async loginStart(site: ResearchLoginSite): Promise<ResearchBrowserStatus> {
    return this.getResearchBrowser().startLogin(site)
  }

  loginDone(site: ResearchLoginSite): ResearchBrowserStatus {
    return this.getResearchBrowser().confirmLogin(site)
  }

  challengeResolved(site: string): ResearchBrowserStatus {
    return this.getResearchBrowser().resolveChallenge(site)
  }

  status(jobId?: string): ResearchStatusResponse {
    const browser = this.getResearchBrowser().status()
    const jobs = [...this.completed.values()].map((result) => this.toJobStatus(result))
    for (const handle of this.active.values()) {
      if (jobs.some((job) => job.jobId === handle.id)) continue
      jobs.push({ jobId: handle.id, folder: handle.folder, status: 'running', sourceCount: 0, domainCount: 0, reportPath: null, sources: [] })
    }
    jobs.sort((a, b) => a.jobId.localeCompare(b.jobId))
    return { browser, jobs, job: jobId ? jobs.find((item) => item.jobId === jobId) ?? this.readCompletedJob(jobId) : null }
  }

  async close(): Promise<void> {
    await this.browser?.close()
    this.browser = undefined
    await Promise.all([...this.active.values()].map((handle) => handle.cancel().catch(() => false)))
  }

  private toJobStatus(result: ResearchResult): ResearchJobStatus {
    return {
      jobId: result.jobId,
      folder: result.folder,
      status: result.status,
      sourceCount: result.sourceCount,
      domainCount: result.domainCount,
      reportPath: result.reportPath,
      sources: result.ledger,
      gate: result.gate,
      task: result.task
    }
  }

  private readCompletedJob(jobId: string): ResearchJobStatus | null {
    const path = join(resolve(this.getSettings().octaHomePath || DEFAULT_OCTA_HOME), 'jobs', jobId, 'research-result.json')
    const value = readJson(path)
    if (!isRecord(value) || typeof value.jobId !== 'string' || !Array.isArray(value.ledger)) return null
    return {
      jobId: value.jobId,
      folder: typeof value.folder === 'string' ? value.folder : dirname(path),
      status: typeof value.status === 'string' ? value.status as ResearchRunStatus : 'failed: depth',
      sourceCount: typeof value.sourceCount === 'number' ? value.sourceCount : value.ledger.length,
      domainCount: typeof value.domainCount === 'number' ? value.domainCount : 0,
      reportPath: typeof value.reportPath === 'string' ? value.reportPath : null,
      sources: value.ledger as SourceLedgerEntry[],
      gate: isRecord(value.gate) ? value.gate as unknown as ResearchGateResult : undefined,
      task: typeof value.task === 'string' ? value.task : undefined
    }
  }
}

export { RESEARCH_LOGIN_SITES }
export type { ResearchLoginSite }
