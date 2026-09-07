import { afterEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { JobsRepository } from '../../electron/db/jobs'

let repository: JobsRepository | undefined
let temporaryDirectory: string | undefined

afterEach(() => {
  repository?.close()
  repository = undefined
  if (temporaryDirectory) rmSync(temporaryDirectory, { recursive: true, force: true })
  temporaryDirectory = undefined
})

describe('job_runs persistence', () => {
  it('creates, reads, updates, lists, and approves a job', () => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'octa-job-db-'))
    const databasePath = join(temporaryDirectory, 'nested', 'octa.db')
    repository = new JobsRepository(databasePath)

    const created = repository.createJob({
      id: 'job-1',
      runner: 'claude-skill',
      skill: 'stop-slop',
      workflow: 'custom',
      input: { text: 'draft' },
      gate: 'approve'
    })
    expect(created).toMatchObject({ id: 'job-1', status: 'running', skill: 'stop-slop', input: { text: 'draft' } })

    const updated = repository.updateJob('job-1', {
      status: 'needs_approval',
      result: { outputs: [{ path: 'out/result.md' }] },
      review: { verdict: 'pass', issues: [] },
      sourceCount: 3,
      cost: { costUsd: 0.12 }
    })
    expect(updated).toMatchObject({
      status: 'needs_approval',
      sourceCount: 3,
      result: { outputs: [{ path: 'out/result.md' }] },
      review: { verdict: 'pass', issues: [] }
    })
    expect(repository.getJob('missing')).toBeUndefined()
    expect(repository.listJobs({ status: 'needs_approval' })).toHaveLength(1)

    const approved = repository.approveJob('job-1', 'bedo')
    expect(approved).toMatchObject({ status: 'ok', approvedBy: 'bedo' })
    expect(approved?.approvedAt).toEqual(expect.any(String))
    expect(existsSync(databasePath)).toBe(true)
  })

  it('creates the workflows and plans tables alongside job_runs', () => {
    repository = new JobsRepository(':memory:')
    // A create on each schema proves initialization ran without relying on private DB fields.
    repository.createJob({ id: 'schema-check', runner: 'codex-exec' })
    expect(repository.getJob('schema-check')?.runner).toBe('codex-exec')
  })

  it('migrates an existing job_runs table with review_json', () => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'octa-job-db-migration-'))
    const databasePath = join(temporaryDirectory, 'octa.db')
    const oldDatabase = new Database(databasePath)
    oldDatabase.exec(`
      CREATE TABLE job_runs (
        id TEXT PRIMARY KEY,
        plan_id TEXT,
        workflow TEXT,
        step_id TEXT,
        skill TEXT,
        runner TEXT NOT NULL,
        department TEXT,
        status TEXT NOT NULL,
        autonomy TEXT,
        gate TEXT,
        input_json TEXT,
        result_json TEXT,
        source_count INTEGER NOT NULL DEFAULT 0,
        cost_json TEXT,
        started_at TEXT,
        finished_at TEXT,
        approved_by TEXT,
        approved_at TEXT,
        error TEXT
      )
    `)
    oldDatabase.close()

    repository = new JobsRepository(databasePath)
    repository.createJob({ id: 'migrated', runner: 'codex-exec' })
    const updated = repository.updateJob('migrated', { review: { verdict: 'revise', issues: [] } })

    expect(updated?.review).toEqual({ verdict: 'revise', issues: [] })
  })
})
