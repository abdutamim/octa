import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join, relative } from 'node:path'
import type { WorkflowStepState } from './workflows'

export interface WorkflowAcceptanceContext {
  workflowId: string
  workflow: string
  brief: unknown
  folder: string
  steps: WorkflowStepState[]
  acceptance?: string[]
  language?: string
  startedAt?: string
  finishedAt?: string
}

export interface WorkflowAcceptanceCheck {
  criterion: string
  passed: boolean
  detail: string
}

export interface WorkflowAcceptanceResult {
  passed: boolean
  checks: WorkflowAcceptanceCheck[]
  checkedAt: string
  durationMs?: number
}

export type WorkflowAcceptanceRunner = (
  context: WorkflowAcceptanceContext
) => Promise<WorkflowAcceptanceResult> | WorkflowAcceptanceResult

const DEFAULT_CRITERIA: Record<string, string[]> = {
  W1: [
    'The report exists in the conversation language.',
    'Every score has a rationale and every fix has an effort estimate.',
    'The review completes within 20 minutes when no competitors are supplied.'
  ],
  W2: [
    'The preview URL opens.',
    'Home performance and SEO score at least 90.',
    'All sitemap pages exist.',
    'RTL is correct when required.'
  ],
  W3: [
    'Persona and competitor reports pass the depth gate.',
    'The plan includes budget math.',
    "The first week's content is in the conversation language.",
    'Nothing is published without approval.'
  ],
  W4: [
    'The memo is in the conversation language.',
    'The memo compares at least three options.',
    'The recommendation states explicit assumptions.',
    'Tasks are created only after go.'
  ],
  W5: [
    'Invoice numbers reconcile with time tracking.',
    'The PDF uses the client brand.',
    'No invoice is sent without approval.',
    'Follow-ups appear in tasks.'
  ]
}

interface LooseRecord {
  [key: string]: unknown
}

function isRecord(value: unknown): value is LooseRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function json(value: unknown): string {
  try { return JSON.stringify(value) } catch { return String(value) }
}

function filesUnder(root: string): string[] {
  if (!existsSync(root)) return []
  const result: string[] = []
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) visit(path)
      else if (/\.(md|markdown|json|jsonl|txt|url|csv|html?|pdf)$/i.test(entry.name)) result.push(path)
    }
  }
  try { visit(root) } catch { return result }
  return result
}

function textFiles(root: string): Array<{ path: string; text: string }> {
  return filesUnder(root).map((path) => {
    try { return { path, text: readFileSync(path, 'utf8') } } catch { return { path, text: '' } }
  })
}

function corpus(context: WorkflowAcceptanceContext): string {
  const stepText = context.steps.map((step) => json({ output: step.output, result: step.result, outputs: step.outputs })).join('\n')
  const fileText = textFiles(context.folder).map((file) => `\n## ${relative(context.folder, file.path)}\n${file.text}`).join('\n')
  return `${json(context.brief)}\n${stepText}\n${fileText}`
}

function languageOf(context: WorkflowAcceptanceContext): string {
  if (context.language?.trim()) return context.language.trim().toLowerCase()
  if (isRecord(context.brief) && typeof context.brief.language === 'string') return context.brief.language.trim().toLowerCase()
  return 'en'
}

function hasArabic(value: string): boolean {
  return /[\u0600-\u06ff]/u.test(value)
}

function hasLatin(value: string): boolean {
  return /[a-z]/i.test(value)
}

function matchesLanguage(value: string, language: string): boolean {
  if (language.startsWith('ar')) return hasArabic(value)
  if (language === 'mixed') return hasArabic(value) && hasLatin(value)
  return hasLatin(value)
}

function hasFile(context: WorkflowAcceptanceContext, names: string[]): string | undefined {
  const wanted = names.map((name) => name.replaceAll('\\', '/').toLowerCase())
  return textFiles(context.folder).find((file) => {
    const relativePath = relative(context.folder, file.path).replaceAll('\\', '/').toLowerCase()
    return wanted.some((name) => relativePath === name || relativePath.endsWith(`/${name}`) || basename(relativePath) === name)
  })?.path
}

function artifactText(context: WorkflowAcceptanceContext, names: string[]): string {
  const file = hasFile(context, names)
  if (!file) return ''
  try { return readFileSync(file, 'utf8') } catch { return '' }
}

function check(criterion: string, passed: boolean, detail: string): WorkflowAcceptanceCheck {
  return { criterion, passed, detail }
}

function scoreAndFixCheck(context: WorkflowAcceptanceContext, criterion: string): WorkflowAcceptanceCheck {
  const report = artifactText(context, ['out/review.md', 'review.md', 'out/report.md']) || corpus(context)
  const scoreLines = report.split(/\r?\n/).filter((line) => /(?:score|scorecard|درجة|تقييم)\s*[:#-]?\s*\d/i.test(line))
  const fixLines = report.split(/\r?\n/).filter((line) => /(?:fix|quick win|recommend|إصلاح|تحسين|تعديل)/i.test(line) && !/^\s*#/.test(line))
  const rationaleOk = scoreLines.length > 0 && scoreLines.every((line) => /rationale|reason|why|because|مبرر|السبب|لأن/i.test(line))
  const effortOk = fixLines.length > 0 && fixLines.every((line) => /effort|estimate|minute|min\b|hour|دقيقة|ساعة|مجهود/i.test(line))
  return check(criterion, rationaleOk && effortOk, `scores=${scoreLines.length}, score rationales=${rationaleOk ? 'yes' : 'no'}, fixes=${fixLines.length}, effort estimates=${effortOk ? 'yes' : 'no'}`)
}

function elapsedMs(context: WorkflowAcceptanceContext): number | undefined {
  if (!context.startedAt || !context.finishedAt) return undefined
  const start = Date.parse(context.startedAt)
  const end = Date.parse(context.finishedAt)
  return Number.isFinite(start) && Number.isFinite(end) && end >= start ? end - start : undefined
}

function numericValue(value: unknown, keys: string[]): number | undefined {
  if (!isRecord(value)) return undefined
  for (const key of keys) {
    const candidate = value[key]
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate
  }
  return undefined
}

function jsonValues(context: WorkflowAcceptanceContext): unknown[] {
  return filesUnder(context.folder)
    .filter((path) => /\.json$/i.test(path))
    .flatMap((path) => {
      try { return [JSON.parse(readFileSync(path, 'utf8')) as unknown] } catch { return [] }
    })
}

function isRoute(value: string): boolean {
  return value === '/' || /^\/(?:[^\s"',]|%[0-9a-f]{2})+$/i.test(value) || /^https?:\/\//i.test(value)
}

function sitemapRoutes(context: WorkflowAcceptanceContext): string[] {
  const routes = new Set<string>()
  const routeKeys = new Set(['sitemap', 'sitemappages', 'routes', 'pages', 'urls', 'paths'])
  const visit = (value: unknown, key = ''): void => {
    if (typeof value === 'string') {
      if (routeKeys.has(key.toLowerCase()) && isRoute(value.trim())) routes.add(value.trim())
      return
    }
    if (Array.isArray(value)) {
      for (const item of value) visit(item, key)
      return
    }
    if (!isRecord(value)) return
    for (const [childKey, childValue] of Object.entries(value)) {
      const normalized = childKey.toLowerCase().replace(/[_ -]/g, '')
      if (routeKeys.has(normalized)) visit(childValue, normalized)
      else if (routeKeys.has(key.toLowerCase())) visit(childValue, normalized)
    }
  }
  for (const value of jsonValues(context)) visit(value)
  const text = corpus(context)
  const sitemapText = text.match(/sitemap[\s\S]{0,1_200}/i)?.[0] ?? ''
  for (const match of sitemapText.matchAll(/(?:^|["'\s])((?:\/[^\s"',}]*)|https?:\/\/[^\s"',}]+)/g)) routes.add(match[1])
  return [...routes]
}

function previewUrl(context: WorkflowAcceptanceContext, text: string): string | undefined {
  const file = artifactText(context, ['out/preview.url', 'preview.url']).trim()
  if (file) return file
  return text.match(/["']?preview(?:Url| URL)?["']?\s*[:=]\s*["']([^"']+)["']/i)?.[1]
}

function depthGate(context: WorkflowAcceptanceContext): { sources: number; domains: number } {
  const sourceMatches = corpus(context).match(/(?:source[_ ]?count|sources?|urls?)\s*["']?\s*[:=]\s*(\d{1,5})/gi) ?? []
  const domainMatches = corpus(context).match(/(?:domain[_ ]?count|domains?)\s*["']?\s*[:=]\s*(\d{1,5})/gi) ?? []
  const parseMax = (matches: string[]): number => Math.max(0, ...matches.map((item) => Number(item.match(/\d+/)?.[0] ?? 0)))
  let sources = parseMax(sourceMatches)
  let domains = parseMax(domainMatches)
  for (const step of context.steps) {
    const values = [step.output, step.result]
    for (const value of values) {
      sources = Math.max(sources, numericValue(value, ['sourceCount', 'source_count', 'urlCount', 'urls']) ?? 0)
      domains = Math.max(domains, numericValue(value, ['domainCount', 'domain_count', 'domains']) ?? 0)
    }
  }
  return { sources, domains }
}

function runChecks(context: WorkflowAcceptanceContext): WorkflowAcceptanceCheck[] {
  const criteria = context.acceptance?.length ? context.acceptance : DEFAULT_CRITERIA[context.workflowId] ?? ['The workflow completed.']
  const textCorpus = corpus(context)
  switch (context.workflowId) {
    case 'W1': {
      const report = artifactText(context, ['out/review.md', 'review.md', 'out/report.md'])
      const first = check(criteria[0] ?? DEFAULT_CRITERIA.W1[0], Boolean(report.trim()) && matchesLanguage(report, languageOf(context)), report.trim() ? `Report language matches ${languageOf(context)}.` : 'No review report was found.')
      const second = scoreAndFixCheck(context, criteria[1] ?? DEFAULT_CRITERIA.W1[1])
      const duration = elapsedMs(context)
      const noCompetitors = !isRecord(context.brief) || !(Array.isArray(context.brief.competitors) && context.brief.competitors.length > 0) && !(typeof context.brief.competitors === 'string' && context.brief.competitors.trim())
      const third = check(criteria[2] ?? DEFAULT_CRITERIA.W1[2], !noCompetitors || duration !== undefined && duration <= 20 * 60 * 1_000, duration === undefined ? 'Timing was not recorded.' : `Elapsed ${Math.round(duration / 1_000)} seconds.`)
      return [first, second, third]
    }
    case 'W2': {
      const preview = previewUrl(context, textCorpus)?.replace(/[),.;]+$/, '')
      let opens = Boolean(preview)
      if (preview?.startsWith('file://')) {
        try { opens = existsSync(decodeURIComponent(new URL(preview).pathname.replace(/^\/(?:[A-Za-z]:)/, (value) => value.slice(1)))) } catch { opens = false }
      }
      const first = check(criteria[0] ?? DEFAULT_CRITERIA.W2[0], opens, preview ? `Preview recorded at ${preview}.` : 'No preview URL was returned.')
      const performance = textCorpus.match(/(?:performance|perf)[^\d]{0,24}(\d{2,3})/i)?.[1]
      const seo = textCorpus.match(/(?:seo)[^\d]{0,24}(\d{2,3})/i)?.[1]
      const scorePass = Number(performance) >= 90 && Number(seo) >= 90
      const second = check(criteria[1] ?? DEFAULT_CRITERIA.W2[1], scorePass, `Performance=${performance ?? 'missing'}, SEO=${seo ?? 'missing'}.`)
      const routes = sitemapRoutes(context)
      const third = check(criteria[2] ?? DEFAULT_CRITERIA.W2[2], routes.length >= 2, `Sitemap evidence contains ${routes.length} page references.`)
      const rtlRequired = languageOf(context).startsWith('ar') || (isRecord(context.brief) && context.brief.rtl === true) || /arabic|عربي/i.test(textCorpus)
      const rtlPass = !rtlRequired || /dir\s*=\s*["']?rtl|direction\s*:\s*rtl|["']rtl["']\s*:\s*true/i.test(textCorpus)
      const fourth = check(criteria[3] ?? DEFAULT_CRITERIA.W2[3], rtlPass, rtlRequired ? 'RTL marker was checked.' : 'RTL was not required for this brief.')
      return [first, second, third, fourth]
    }
    case 'W3': {
      const depth = depthGate(context)
      const first = check(criteria[0] ?? DEFAULT_CRITERIA.W3[0], depth.sources >= 100 && depth.domains >= 40, `Depth gate: ${depth.sources} sources across ${depth.domains} domains.`)
      const budget = /budget/i.test(textCorpus) && /(?:math|allocation|total|sum|=|\d+[.,]?\d*)/i.test(textCorpus)
      const second = check(criteria[1] ?? DEFAULT_CRITERIA.W3[1], budget, budget ? 'Budget and allocation evidence is present.' : 'Budget math is missing.')
      const weekOne = /first week|week\s*1|7[- ]day|الأسبوع الأول|الأسبوع ١/i.test(textCorpus) && /post|content|campaign|محتوى|منشور/i.test(textCorpus) && matchesLanguage(textCorpus, languageOf(context))
      const third = check(criteria[2] ?? DEFAULT_CRITERIA.W3[2], weekOne, 'Checked first-week content and conversation language.')
      const published = /published["']?\s*[:=]\s*true|status["']?\s*[:=]\s*["']published/i.test(textCorpus)
      const approved = /approved["']?\s*[:=]\s*true|approval(?:ed)?["']?\s*[:=]\s*true|gate[\s_-]*(?:status|decision)["']?\s*[:=]\s*["']?approved|موافقة/i.test(textCorpus)
      const fourth = check(criteria[3] ?? DEFAULT_CRITERIA.W3[3], !published || approved, published && !approved ? 'A published item was detected without approval.' : 'Only approved/dry-run queue evidence was detected.')
      return [first, second, third, fourth]
    }
    case 'W4': {
      const memo = artifactText(context, ['out/memo.md', 'memo.md', 'out/decision-memo.md']) || textCorpus
      const first = check(criteria[0] ?? DEFAULT_CRITERIA.W4[0], matchesLanguage(memo, languageOf(context)), `Memo language checked as ${languageOf(context)}.`)
      const options = Math.max((memo.match(/^\s*(?:\d+[.)]|Option\s+\d+)/gim) ?? []).length, (memo.match(/option\s*:/gi) ?? []).length)
      const second = check(criteria[1] ?? DEFAULT_CRITERIA.W4[1], options >= 3, `${options} decision options found.`)
      const third = check(criteria[2] ?? DEFAULT_CRITERIA.W4[2], /recommend[^\n]*(?:assum|because|given|if)|assum[^\n]*(?:recommend|because|given|if)|افتراض|توصية/i.test(memo), 'Recommendation and assumption language was checked.')
      const taskText = /task|مهمة/i.test(textCorpus)
      const go = /\bgo\b|approved|approve|موافق|انطلق/i.test(textCorpus)
      const fourth = check(criteria[3] ?? DEFAULT_CRITERIA.W4[3], !taskText || go, taskText ? (go ? 'Tasks are accompanied by an explicit go/approval.' : 'Tasks were present without an explicit go.') : 'No tasks were created before go.')
      return [first, second, third, fourth]
    }
    case 'W5': {
      const pdfFiles = filesUnder(context.folder).filter((path) => /\.pdf$/i.test(path))
      const validPdf = pdfFiles.some((path) => {
        try { return readFileSync(path).subarray(0, 4).toString() === '%PDF' } catch { return false }
      })
      const reconciled = /reconciled["']?\s*[:=]\s*true|time tracking|tracked seconds|time_tracking/i.test(textCorpus)
      const first = check(criteria[0] ?? DEFAULT_CRITERIA.W5[0], reconciled, reconciled ? 'Invoice totals include a time-tracking reconciliation.' : 'No time-tracking reconciliation was recorded.')
      const branded = validPdf && /brand|wordmark|client brand|signature/i.test(textCorpus)
      const second = check(criteria[1] ?? DEFAULT_CRITERIA.W5[1], branded, branded ? `A branded PDF was found (${pdfFiles.length} PDF file(s)).` : 'No branded PDF evidence was found.')
      const sent = /sent["']?\s*[:=]\s*true|status["']?\s*[:=]\s*["']sent|sent_at|sent record/i.test(textCorpus)
      const approved = /approved["']?\s*[:=]\s*true|gate.*approved|approved_at/i.test(textCorpus)
      const third = check(criteria[2] ?? DEFAULT_CRITERIA.W5[2], !sent || approved, sent && !approved ? 'A send was recorded without approval.' : sent ? 'The send record follows approval evidence.' : 'No send occurred before approval.')
      const followUps = /\+7/i.test(textCorpus) && /\+14/i.test(textCorpus) && /\+21/i.test(textCorpus) && (/(?:tasks?|مهمات|recurring)/i.test(textCorpus))
      const fourth = check(criteria[3] ?? DEFAULT_CRITERIA.W5[3], followUps, followUps ? 'Three dated follow-up tasks/jobs are recorded.' : 'The +7/+14/+21 follow-up tasks/jobs are missing.')
      return [first, second, third, fourth]
    }
    default:
      return criteria.map((criterion) => check(criterion, true, 'All workflow steps completed.'))
  }
}

export function runWorkflowAcceptance(context: WorkflowAcceptanceContext): WorkflowAcceptanceResult {
  const checkedAt = new Date().toISOString()
  const checks = runChecks(context)
  const durationMs = elapsedMs(context)
  return {
    passed: checks.every((item) => item.passed),
    checks,
    checkedAt,
    ...(durationMs === undefined ? {} : { durationMs })
  }
}

export const checkWorkflowAcceptance = runWorkflowAcceptance
