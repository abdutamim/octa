import { EventEmitter } from 'node:events'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'
import {
  EVIDENCE_SCHEMA,
  REAL_RUN_RESEARCH_BUDGET_MS,
  REQUIRED_RESEARCH_LANGUAGES,
  buildClaudeMcpArgs,
  buildMcpServerLaunch,
  buildResearchCodexArgv,
  buildResearchPrompt,
  checkReportLanguage,
  parseResearchLedger,
  researchDepthGate,
  runResearch,
  validateResearchGates,
  type ResearchRunner
} from '../electron/core/octa/research'
import type { JobHandle } from '../electron/core/jobs/runner'
import type { JobResult } from '../electron/types'
import type { LanguagePlanInput, SourceLedgerEntry } from '../electron/core/octa/sources'

function sourceEntry(n: number, language: string, domainNumber: number): SourceLedgerEntry {
  const domain = `research-${domainNumber}.example.test`
  return {
    n,
    url: `https://${domain}/page-${n}`,
    domain,
    title: `Source ${n}`,
    lang: language,
    type: 'forum',
    published: '2026-08-01',
    fetched: '2026-09-05T20:11:00Z',
    words: 500,
    claims: [{ text: `Claim ${n}`, quote: `Quote ${n}`, confidence: 'medium', topic: 'testing' }],
    relevance: 0.8
  }
}

function ledgerWithCounts(counts: Record<string, number>): SourceLedgerEntry[] {
  const ledger: SourceLedgerEntry[] = []
  let n = 1
  for (const [language, count] of Object.entries(counts)) {
    for (let index = 0; index < count; index += 1) {
      ledger.push(sourceEntry(n, language, (n - 1) % 40))
      n += 1
    }
  }
  return ledger
}

function languagePlan(): LanguagePlanInput {
  return REQUIRED_RESEARCH_LANGUAGES.map((language) => ({
    language,
    status: 'material',
    queries: Array.from({ length: 15 }, (_, index) => `${language} native query ${index + 1}`)
  }))
}

function jobResult(jobId: string): JobResult {
  return {
    job_id: jobId,
    step_id: 'research',
    status: 'ok',
    outputs: [],
    sources: 'evidence/sources.jsonl',
    metrics: { source_count: 0, languages: [], tokens_in: 0, tokens_out: 0, seconds: 0, cost_usd: 0 },
    questions: [],
    notes: ''
  }
}

describe('research gates and prompt assembly', () => {
  it('passes the complete multilingual depth fixture with the domain cap', () => {
    const ledger = ledgerWithCounts({ ar: 20, en: 20, fr: 20, de: 20, ru: 20 })
    const depth = researchDepthGate(ledger, { languagePlan: languagePlan() })
    const result = validateResearchGates(ledger, {
      languagePlan: languagePlan(),
      conversationLanguage: 'ar',
      report: 'هذه خلاصة موثقة [1].'
    })

    expect(depth).toMatchObject({ ok: true, distinctUrls: 100, countedDistinctUrls: 100, domains: 40 })
    expect(result.ok).toBe(true)
    expect(result.failures).toEqual([])
  })

  it('fails a shallow depth fixture after the eight-per-domain cap', () => {
    const ledger = ledgerWithCounts({ ar: 20, en: 20, fr: 20, de: 20, ru: 19 })
    const result = researchDepthGate(ledger, { languagePlan: languagePlan() })

    expect(result.ok).toBe(false)
    expect(result.countedDistinctUrls).toBe(99)
    expect(result.failures.some((failure) => failure.includes('distinct URLs'))).toBe(true)
  })

  it('fails when a material language is below ten sources', () => {
    const ledger = ledgerWithCounts({ ar: 25, en: 25, fr: 0, de: 25, ru: 25 })
    const result = researchDepthGate(ledger, { languagePlan: languagePlan() })

    expect(result.ok).toBe(false)
    expect(result.failures.some((failure) => failure.includes('language fr'))).toBe(true)
  })

  it('allows no material only after fifteen recorded queries', () => {
    const ledger = ledgerWithCounts({ ar: 25, en: 25, de: 25, ru: 25 })
    const plan: LanguagePlanInput = REQUIRED_RESEARCH_LANGUAGES.map((language) => language === 'fr'
      ? { language, status: 'no material', queries: Array.from({ length: 15 }, (_, index) => `fr query ${index + 1}`) }
      : { language, status: 'material', queries: [] })
    const result = researchDepthGate(ledger, { languagePlan: plan })

    expect(result.ok).toBe(true)
    expect(result.languageCounts.fr ?? 0).toBe(0)
  })

  it('rejects a report citation that points to a missing source number', () => {
    const result = validateResearchGates(ledgerWithCounts({ ar: 20, en: 20, fr: 20, de: 20, ru: 20 }), {
      languagePlan: languagePlan(),
      conversationLanguage: 'en',
      report: 'The decision is supported by source [999].'
    })

    expect(result.ok).toBe(false)
    expect(result.citations.missing).toEqual([999])
  })

  it('parses the JSONL ledger alias and validates the report script', () => {
    const entry = sourceEntry(1, 'ar-EG', 0)
    expect(parseResearchLedger(`${JSON.stringify(entry)}\n`)).toEqual([entry])
    expect(checkReportLanguage('هذا تقرير بحثي واضح.', 'ar').ok).toBe(true)
    expect(checkReportLanguage('This is an English report.', 'ar').ok).toBe(false)
  })

  it('assembles the full protocol, five-language rule, ledger schema, budget, and preset', () => {
    const prompt = buildResearchPrompt('dream buyer persona لعيادة أسنان في القاهرة', {
      conversationLanguage: 'ar',
      budgetMs: REAL_RUN_RESEARCH_BUDGET_MS,
      presetText: 'Persona preset marker'
    })

    expect(prompt).toContain('dream buyer persona لعيادة أسنان في القاهرة')
    expect(prompt).toContain('Full research protocol §2')
    expect(prompt).toContain('ar, en, fr, de, ru')
    expect(prompt).toContain('evidence/sources.jsonl')
    expect(prompt).toContain('Persona preset marker')
    expect(prompt).toContain('Time budget: 15 minutes')
    expect(prompt).toContain('at least 100 distinct fetched URLs')
    expect(EVIDENCE_SCHEMA.required).toEqual(['frame', 'language_plan', 'sources', 'themes', 'contradictions', 'unknowns', 'report_path'])
  })
})

describe('research runner wiring', () => {
  it('writes the evidence schema and registers MCP for the Codex scout', async () => {
    const home = mkdtempSync(join(tmpdir(), 'octa-research-test-'))
    try {
      let captured: Parameters<ResearchRunner['startJob']>[0] | undefined
      const runner: ResearchRunner = {
        startJob(spec): JobHandle {
          captured = spec
          const events = new EventEmitter()
          const promise = Promise.resolve(jobResult(spec.id ?? 'research-test'))
          return {
            id: spec.id ?? 'research-test',
            jobId: spec.id ?? 'research-test',
            folder: join(home, 'jobs', spec.id ?? 'research-test'),
            events,
            promise,
            result: promise,
            onEvent: (listener) => {
              events.on('event', listener)
              return () => events.removeListener('event', listener)
            },
            cancel: async () => false
          }
        }
      }

      const handle = runResearch('test research', { homePath: home, jobId: 'research-test', runner })
      const result = await handle.promise

      expect(result.status).toBe('failed: depth')
      expect(captured?.argsOverride).toEqual(expect.arrayContaining([
        '--output-schema',
        'evidence.schema.json',
        '-c',
        expect.stringContaining('mcp_servers.octa-tools.command')
      ]))
      expect(captured?.environment?.OCTA_MCP_SERVER).toBe('1')
      expect(readFileSync(join(handle.folder, 'evidence.schema.json'), 'utf8')).toContain('Octa research evidence')
      expect(readFileSync(result.reportPath, 'utf8')).toContain('Octa gate summary')
      expect(buildClaudeMcpArgs(join(handle.folder, 'claude-mcp-config.json'))).toEqual([
        '--mcp-config',
        join(handle.folder, 'claude-mcp-config.json')
      ])
      expect(buildResearchCodexArgv({
        workspace: handle.folder,
        mcpLaunch: buildMcpServerLaunch({ homePath: home, jobId: handle.id, jobFolder: handle.folder })
      })).toContain('evidence.schema.json')
    } finally {
      rmSync(home, { recursive: true, force: true })
    }
  })
})
