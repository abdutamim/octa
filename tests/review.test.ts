import { afterEach, describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { reviewStep, type ReviewRunner } from '../electron/core/octa/review'
import { JobRunner } from '../electron/core/jobs/runner'
import { JobsRepository } from '../electron/db/jobs'

let temporaryDirectory: string | undefined
let repository: JobsRepository | undefined

afterEach(() => {
  repository?.close()
  repository = undefined
  if (temporaryDirectory) rmSync(temporaryDirectory, { recursive: true, force: true })
  temporaryDirectory = undefined
})

describe('Sol reviewer step', () => {
  it('returns revise and quotes the failed acceptance criterion', async () => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'octa-review-'))
    const outputPath = join(temporaryDirectory, 'out', 'report.md')
    mkdirSync(join(temporaryDirectory, 'out'), { recursive: true })
    writeFileSync(outputPath, '# Report\nMissing the required conclusion.\n', 'utf8')
    const criterion = 'The report contains a conclusion.'

    const fakeReview: ReviewRunner = async (request) => {
      expect(request.runner).toBe('codex-review')
      expect(request.argv).toEqual(expect.arrayContaining(['gpt-5.6-sol', 'read-only', '--output-schema', 'review.schema.json']))
      expect(request.prompt).toContain(JSON.stringify(criterion))
      expect(request.prompt).toContain('Missing the required conclusion.')
      return {
        verdict: 'revise',
        issues: [{ criterion, detail: 'The conclusion is missing.', severity: 'high' }]
      }
    }
    const review = await reviewStep(
      {
        id: 'job-review-1',
        folder: temporaryDirectory,
        result: { outputs: [{ path: 'out/report.md', type: 'markdown', title: 'Report' }] }
      },
      { id: 's1', acceptance: [criterion] },
      fakeReview
    )

    expect(review).toEqual({
      verdict: 'revise',
      issues: [{ criterion, detail: 'The conclusion is missing.', severity: 'high' }]
    })
    expect(JSON.parse(readFileSync(join(temporaryDirectory, 'review.json'), 'utf8'))).toEqual(review)
  })

  it('passes a clean output unchanged', async () => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'octa-review-pass-'))
    const criterion = 'The report contains a conclusion.'
    const fakeReview: ReviewRunner = async () => ({ verdict: 'pass', issues: [] })
    const review = await reviewStep(
      { id: 'job-review-2', folder: temporaryDirectory, result: { outputs: [] } },
      { acceptance: [criterion] },
      fakeReview
    )

    expect(review).toEqual({ verdict: 'pass', issues: [] })
    const schemaPath = join(temporaryDirectory, 'review.schema.json')
    expect(existsSync(schemaPath)).toBe(true)
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8')) as { required: string[]; properties: { fixed_output_path: { type: string[] } } }
    expect(schema.required).toContain('fixed_output_path')
    expect(schema.properties.fixed_output_path.type).toEqual(['string', 'null'])
  })
})

describe('executor review wiring', () => {
  it('re-runs a revised executor exactly once and records review cost', async () => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'octa-review-loop-'))
    repository = new JobsRepository(':memory:')
    const executor = `
      const fs = require('node:fs');
      let prompt = '';
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', chunk => prompt += chunk);
      process.stdin.on('end', () => {
        const attemptsPath = 'executor-attempts.txt';
        const attempts = Number(fs.existsSync(attemptsPath) ? fs.readFileSync(attemptsPath, 'utf8') : '0') + 1;
        fs.writeFileSync(attemptsPath, String(attempts));
        const revised = prompt.includes('## Sol review feedback');
        fs.mkdirSync('out', { recursive: true });
        fs.writeFileSync('out/report.md', revised ? 'clean output' : 'violating output');
        fs.writeFileSync('result.json', JSON.stringify({
          status: 'ok',
          outputs: [{ path: 'out/report.md', type: 'markdown', title: 'Report' }],
          metrics: { source_count: 0, tokens_in: 1, tokens_out: 1, seconds: 0, cost_usd: 0.01 },
          questions: [],
          notes: ''
        }));
        process.stdout.write(JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: revised ? 'clean output' : 'violating output' } }) + '\\n');
      });
    `
    const criterion = 'The report contains clean output.'
    let reviewCalls = 0
    const runner = new JobRunner({
      homePath: temporaryDirectory,
      jobs: repository,
      reviewStep: async (_job, step) => {
        reviewCalls += 1
        if (reviewCalls === 1) {
          return {
            verdict: 'revise',
            issues: [{ criterion: step.acceptance?.[0] ?? '', detail: 'The output is violating.', severity: 'high' }],
            cost: { inputTokens: 10, outputTokens: 4, costUsd: 0.10 }
          }
        }
        return {
          verdict: 'pass',
          issues: [],
          cost: { inputTokens: 8, outputTokens: 3, costUsd: 0.20 }
        }
      }
    })

    const handle = runner.startJob({
      runner: 'codex-exec',
      input: { text: 'create the report' },
      acceptance: [criterion],
      executable: process.execPath,
      argsOverride: ['-e', executor],
      maxRetries: 0
    })
    const result = await handle.promise
    const persisted = repository.getJob(handle.id)

    expect(result.status).toBe('ok')
    expect(result.metrics.cost_usd).toBe(0.31)
    expect(readFileSync(join(handle.folder, 'executor-attempts.txt'), 'utf8')).toBe('2')
    expect(reviewCalls).toBe(2)
    expect(readFileSync(join(handle.folder, 'out', 'report.md'), 'utf8')).toBe('clean output')
    expect(persisted?.review).toMatchObject({ verdict: 'pass', issues: [] })
    expect(persisted?.cost).toMatchObject({
      review: { attempts: 2, inputTokens: 18, outputTokens: 7, costUsd: 0.30 },
      costUsd: 0.31
    })
    expect(readFileSync(join(handle.folder, 'review.json'), 'utf8')).toContain('"verdict": "pass"')
  })
})
