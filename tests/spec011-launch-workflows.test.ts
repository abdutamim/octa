import { afterEach, describe, expect, it, vi } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

vi.mock('electron', () => {
  class FakeBrowserWindow {
    private destroyed = false
    webContents = {
      executeJavaScript: async (): Promise<void> => undefined,
      printToPDF: async (): Promise<Buffer> => Buffer.from('%PDF-1.7\nOcta test PDF\n%%EOF\n', 'utf8')
    }

    async loadURL(): Promise<void> {}
    isDestroyed(): boolean { return this.destroyed }
    destroy(): void { this.destroyed = true }
  }

  return {
    BrowserWindow: FakeBrowserWindow,
    app: { isPackaged: false, getAppPath: () => process.cwd() }
  }
})

import { PdfRenderer } from '../electron/core/pdf'
import {
  LAUNCH_WORKFLOWS,
  WorkflowRunner,
  type WorkflowStepRunRequest
} from '../electron/core/octa/workflows'
import {
  createLaunchWorkflowGateApprovalHandler,
  createLaunchWorkflowHandler
} from '../electron/core/octa/launch-handlers'
import { runWorkflowAcceptance, type WorkflowAcceptanceContext } from '../electron/core/octa/acceptance'
import { DocumentRepository } from '../electron/db/documents'
import { JobsRepository } from '../electron/db/jobs'
import { OperationsRepository } from '../electron/db/operations'
import { SocialQueueRepository } from '../electron/db/social-queue'
import { TaskRepository } from '../electron/db/tasks'
import type { TimeReport } from '../electron/types'
import type { TimeTracker } from '../electron/core/time-tracking'

const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

function fixtureDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'octa-spec-011-'))
  temporaryDirectories.push(directory)
  return directory
}

function acceptanceContext(
  workflowId: string,
  folder: string,
  brief: Record<string, unknown> = {},
  language = 'en'
): WorkflowAcceptanceContext {
  const workflow = LAUNCH_WORKFLOWS.find((item) => item.id === workflowId)!
  return {
    workflowId,
    workflow: workflow.name,
    brief,
    folder,
    steps: [],
    acceptance: workflow.acceptance,
    language,
    startedAt: '2026-09-08T10:00:00.000Z',
    finishedAt: '2026-09-08T10:01:00.000Z'
  }
}

function writeArtifact(folder: string, name: string, text: string): void {
  const path = join(folder, name)
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, text, 'utf8')
}

describe('spec-011 launch workflow contracts', () => {
  it('ships W1-W5 seeds without todo placeholders', () => {
    for (const workflow of LAUNCH_WORKFLOWS.filter((item) => /^W[1-5]$/.test(item.id))) {
      expect(JSON.stringify(workflow), workflow.id).not.toContain('"todo"')
    }
  })

  it('runs the acceptance checkers against workflow-shaped fixtures', () => {
    const w1 = fixtureDirectory()
    writeArtifact(w1, 'out/review.md', [
      '# Website review',
      '- Score: 8/10 — Rationale: evidence shows friction.',
      ...Array.from({ length: 10 }, (_, index) => `${index + 1}. Fix ${index + 1}: clarify the next action. Effort estimate: 15 minutes.`)
    ].join('\n'))
    expect(runWorkflowAcceptance(acceptanceContext('W1', w1)).passed).toBe(true)

    const w2 = fixtureDirectory()
    const preview = join(w2, 'preview', 'index.html')
    mkdirSync(join(preview, '..'), { recursive: true })
    writeFileSync(preview, '<html><body>home</body></html>', 'utf8')
    writeArtifact(w2, 'out/build.json', JSON.stringify({
      previewUrl: `file://${preview.replaceAll('\\', '/')}`,
      performance: 95,
      seo: 94,
      sitemap: ['/','/about'],
      rtl: true
    }))
    const w2Result = runWorkflowAcceptance(acceptanceContext('W2', w2, { language: 'en' }))
    expect(w2Result, JSON.stringify(w2Result)).toMatchObject({ passed: true })

    const w3 = fixtureDirectory()
    writeArtifact(w3, 'out/plan.md', [
      'Persona source_count: 120',
      'Competitor domain_count: 45',
      'Budget math: total = 1000; allocation = 600 + 400.',
      'First week content: seven posts and campaign variants.',
      'approval required; dry_run: true; published: false'
    ].join('\n'))
    expect(runWorkflowAcceptance(acceptanceContext('W3', w3)).passed).toBe(true)

    const w4 = fixtureDirectory()
    writeArtifact(w4, 'out/memo.md', [
      '# Decision memo',
      'Option 1: build now.',
      'Option 2: validate first.',
      'Option 3: defer.',
      'Recommendation: validate first because the assumption is that demand is uncertain.',
      'Tasks are created after go.'
    ].join('\n'))
    expect(runWorkflowAcceptance(acceptanceContext('W4', w4, { go: true })).passed).toBe(true)

    const w5 = fixtureDirectory()
    writeArtifact(w5, 'out/invoice-draft.json', '{"reconciled":true,"timeTracking":{"totalSeconds":3600}}')
    writeArtifact(w5, 'out/invoice-pdf.json', '{"brand":{"name":"Fixture brand"}}')
    mkdirSync(join(w5, 'out'), { recursive: true })
    writeFileSync(join(w5, 'out/invoice-2026-001.pdf'), Buffer.from('%PDF-1.7\nfixture\n', 'utf8'))
    writeArtifact(w5, 'out/sent-record.json', '{"approved":true,"sent":true,"status":"sent","sent_at":"2026-09-08T10:00:00.000Z"}')
    writeArtifact(w5, 'out/follow-ups.json', '{"tasks":["+7","+14","+21"],"recurring":true}')
    const w5Result = runWorkflowAcceptance(acceptanceContext('W5', w5))
    expect(w5Result, JSON.stringify(w5Result)).toMatchObject({ passed: true })
  })
})

describe('social queue dry-run handoff', () => {
  it('exports only approved posts using the PHP publisher contract', () => {
    const directory = fixtureDirectory()
    const repository = new SocialQueueRepository(join(directory, 'octa.db'))
    const unapproved = repository.queue({
      id: 'unapproved',
      platform: 'instagram',
      body: 'Do not publish this yet.',
      scheduledAt: '2026-09-09T09:00:00.000Z'
    })
    const approved = repository.queue({
      id: 'approved',
      platform: 'linkedin',
      body: 'Approved launch note.',
      mediaPaths: ['C:/Octa/carousel/slide-01.png'],
      scheduledAt: '2026-09-10T09:00:00.000Z',
      approvedAt: '2026-09-08T10:00:00.000Z'
    })
    const outputPath = join(directory, 'tamim-os-queue.json')
    const handoff = repository.exportDryRun(outputPath)
    expect(handoff).toEqual({
      version: 1,
      dry_run: true,
      posts: [{
        id: approved.id,
        platform: 'linkedin',
        body: 'Approved launch note.',
        media_paths: ['C:/Octa/carousel/slide-01.png'],
        scheduled_at: '2026-09-10T09:00:00.000Z'
      }]
    })
    expect(JSON.parse(readFileSync(outputPath, 'utf8'))).toEqual(handoff)
    expect(repository.get(unapproved.id)?.status).toBe('queued')
    expect(repository.get(approved.id)?.status).toBe('handed_off')
    repository.close()
  })
})

describe('W5 invoice workflow', () => {
  it('creates a branded PDF, keeps send behind approval, then schedules follow-ups', async () => {
    const directory = fixtureDirectory()
    const databasePath = join(directory, 'octa.db')
    const jobs = new JobsRepository(databasePath)
    const tasks = new TaskRepository(databasePath)
    const operations = new OperationsRepository(databasePath)
    const documents = new DocumentRepository(databasePath)
    const now = () => new Date('2026-09-08T10:00:00.000Z')
    const report: TimeReport = {
      day: '2026-09-08',
      available: true,
      totalSeconds: 7_200,
      apps: [{ name: 'Editor', seconds: 7_200 }],
      titles: [{ name: 'Fixture project', seconds: 7_200 }]
    }
    const timeTracker = { report: async (): Promise<TimeReport> => report } as unknown as TimeTracker
    const pdfRenderer = new PdfRenderer()
    const dependencies = {
      homePath: directory,
      tasks,
      operations,
      documents,
      jobs,
      timeTracker,
      pdfRenderer,
      now
    }
    const runner = new WorkflowRunner({
      jobs,
      homePath: directory,
      now,
      stepHandler: createLaunchWorkflowHandler(dependencies),
      afterGateApproval: createLaunchWorkflowGateApprovalHandler(dependencies),
      reviewStep: async () => ({ verdict: 'pass', issues: [] }) as never
    })

    try {
      const handle = runner.start('W5', {
        language: 'en',
        client: { name: 'Fixture Client', email: 'client@example.test' },
        period: { day: '2026-09-08' },
        project: 'Fixture project',
        scope: 'Implementation',
        currency: 'USD',
        hourlyRateMinor: 10_000
      }, { language: 'en' })

      const pendingPdf = await waitForGate(runner, handle.runId)
      const firstOutput = runner.getRun(handle.runId)?.steps.find((step) => step.id === 's1')?.output as { invoiceId?: string } | undefined
      expect(firstOutput?.invoiceId).toBeTruthy()
      expect(operations.getInvoice(firstOutput!.invoiceId!)?.storedStatus).toBe('draft')
      await runner.approveGate({ runId: handle.runId, stepId: 's2', payload: pendingPdf })

      const pendingSend = await waitForGate(runner, handle.runId)
      const invoiceId = firstOutput!.invoiceId!
      expect(operations.getInvoice(invoiceId)?.storedStatus).toBe('draft')
      await runner.approveGate({ runId: handle.runId, stepId: 's3', payload: pendingSend })

      const result = await handle.promise
      expect(result, JSON.stringify(result, null, 2)).toMatchObject({ status: 'ok' })
      expect(result.acceptance?.passed).toBe(true)
      expect(operations.getInvoice(invoiceId)?.storedStatus).toBe('sent')
      expect(operations.listInvoiceSends(invoiceId)).toHaveLength(1)
      expect(operations.listInvoiceSends(invoiceId)[0].message).toContain('Fixture Client')
      const followUps = tasks.list({ project: 'Invoice 2026-001' })
      expect(followUps).toHaveLength(3)
      expect(followUps.map((task) => task.title)).toEqual([
        'Follow up 2026-001 (+7 days)',
        'Follow up 2026-001 (+14 days)',
        'Follow up 2026-001 (+21 days)'
      ])
      expect(jobs.listRecurringJobs().filter((job) => job.workflow === 'invoice-follow-up')).toHaveLength(3)
      const pdfPath = join(handle.folder, 'out', 'invoice-2026-001.pdf')
      expect(existsSync(pdfPath)).toBe(true)
      expect(readFileSync(pdfPath).subarray(0, 4).toString()).toBe('%PDF')
    } finally {
      await runner.close()
      tasks.close()
      operations.close()
      documents.close()
      jobs.close()
    }
  })
})

async function waitForGate(runner: WorkflowRunner, runId: string, timeoutMs = 2_000): Promise<string> {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const gate = runner.getRun(runId)?.currentGate
    if (gate) return gate.payload
    await new Promise<void>((resolve) => setTimeout(resolve, 5))
  }
  throw new Error('Timed out waiting for a workflow gate.')
}
