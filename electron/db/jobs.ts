import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { randomUUID } from 'node:crypto'
import { DATABASE_BUSY_TIMEOUT_MS } from './busy-timeout'
import type {
  JobAutonomy,
  JobGate,
  JobRecord,
  JobRunnerName,
  JobStatus
} from '../types'

interface JobRow {
  id: string
  plan_id: string | null
  workflow: string | null
  step_id: string | null
  skill: string | null
  runner: string
  department: string | null
  status: string
  autonomy: string | null
  gate: string | null
  input_json: string | null
  result_json: string | null
  review_json: string | null
  source_count: number
  cost_json: string | null
  started_at: string | null
  finished_at: string | null
  approved_by: string | null
  approved_at: string | null
  error: string | null
}

interface PlanRow {
  id: string
  conversation_id: string | null
  brief_md: string
  plan_json: string
  round: number
  question_round: number
  status: string
  created_at: string
}

export interface CreateJobInput {
  id?: string
  planId?: string | null
  workflow?: string | null
  stepId?: string | null
  skill?: string | null
  runner: JobRunnerName | string
  department?: string | null
  status?: JobStatus
  autonomy?: JobAutonomy | null
  gate?: JobGate | null
  input?: unknown
  result?: unknown
  review?: unknown
  sourceCount?: number
  cost?: unknown
  startedAt?: string | null
  finishedAt?: string | null
  approvedBy?: string | null
  approvedAt?: string | null
  error?: string | null
}

export interface UpdateJobInput {
  planId?: string | null
  workflow?: string | null
  stepId?: string | null
  skill?: string | null
  runner?: JobRunnerName | string
  department?: string | null
  status?: JobStatus
  autonomy?: JobAutonomy | null
  gate?: JobGate | null
  input?: unknown
  result?: unknown
  review?: unknown
  sourceCount?: number
  cost?: unknown
  startedAt?: string | null
  finishedAt?: string | null
  approvedBy?: string | null
  approvedAt?: string | null
  error?: string | null
}

export interface ListJobsOptions {
  status?: JobStatus | string
  limit?: number
}

export type PlanStatus = 'draft' | 'needs_input' | 'needs_approval' | 'approved'

export interface PlanRecord {
  id: string
  conversationId: string | null
  briefMd: string
  plan: unknown
  round: number
  questionRound: number
  status: PlanStatus
  createdAt: string
}

export interface CreatePlanInput {
  id: string
  conversationId?: string | null
  briefMd: string
  plan: unknown
  round?: number
  questionRound?: number
  status?: PlanStatus
  createdAt?: string
}

export interface UpdatePlanInput {
  conversationId?: string | null
  briefMd?: string
  plan?: unknown
  round?: number
  questionRound?: number
  status?: PlanStatus
}

function jsonValue(value: unknown): string | null {
  if (value === undefined) return null
  const encoded = JSON.stringify(value)
  return encoded === undefined ? null : encoded
}

function parseJson(value: string | null): unknown {
  if (value === null) return null
  try {
    return JSON.parse(value) as unknown
  } catch {
    return value
  }
}

function isoNow(): string {
  return new Date().toISOString()
}

function validStatus(value: string): JobStatus {
  const statuses: JobStatus[] = [
    'running',
    'ok',
    'failed',
    'needs_approval',
    'needs_input',
    'cancelled'
  ]
  return statuses.includes(value as JobStatus) ? (value as JobStatus) : 'failed'
}

function validAutonomy(value: string | null): JobAutonomy | null {
  return value === 'led' || value === 'assisted' || value === 'auto' ? value : null
}

function validGate(value: string | null): JobGate | null {
  return value === 'none' || value === 'review' || value === 'approve' ? value : null
}

function mapJob(row: JobRow): JobRecord {
  return {
    id: row.id,
    planId: row.plan_id,
    workflow: row.workflow,
    stepId: row.step_id,
    skill: row.skill,
    runner: row.runner,
    department: row.department,
    status: validStatus(row.status),
    autonomy: validAutonomy(row.autonomy),
    gate: validGate(row.gate),
    input: parseJson(row.input_json),
    result: parseJson(row.result_json),
    review: parseJson(row.review_json),
    sourceCount: row.source_count,
    cost: parseJson(row.cost_json),
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    error: row.error
  }
}

function validPlanStatus(value: string): PlanStatus {
  const statuses: PlanStatus[] = ['draft', 'needs_input', 'needs_approval', 'approved']
  return statuses.includes(value as PlanStatus) ? (value as PlanStatus) : 'draft'
}

function mapPlan(row: PlanRow): PlanRecord {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    briefMd: row.brief_md,
    plan: parseJson(row.plan_json),
    round: row.round,
    questionRound: row.question_round,
    status: validPlanStatus(row.status),
    createdAt: row.created_at
  }
}

/** SQLite persistence for the job spine. One row is written for every run. */
export class JobsRepository {
  private readonly database: Database.Database

  constructor(readonly databasePath: string) {
    if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true })
    this.database = new Database(databasePath, { timeout: DATABASE_BUSY_TIMEOUT_MS })
    try {
      this.initialize()
    } catch (error) {
      this.database.close()
      throw error
    }
  }

  private initialize(): void {
    this.database.pragma('journal_mode = WAL')
    this.database.pragma(`busy_timeout = ${DATABASE_BUSY_TIMEOUT_MS}`)
    this.database.pragma('synchronous = FULL')
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS job_runs (
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
        review_json TEXT,
        source_count INTEGER NOT NULL DEFAULT 0,
        cost_json TEXT,
        started_at TEXT,
        finished_at TEXT,
        approved_by TEXT,
        approved_at TEXT,
        error TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_job_runs_started_at ON job_runs(started_at DESC);
      CREATE INDEX IF NOT EXISTS idx_job_runs_status ON job_runs(status);

      CREATE TABLE IF NOT EXISTS workflows (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        version INTEGER NOT NULL,
        definition_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS plans (
        id TEXT PRIMARY KEY,
        conversation_id TEXT,
        brief_md TEXT NOT NULL,
        plan_json TEXT NOT NULL,
        round INTEGER NOT NULL DEFAULT 0,
        question_round INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'draft',
        created_at TEXT NOT NULL
      );
    `)
    this.applyMigrations()
  }

  /** Apply additive schema changes to databases created by older specs. */
  private applyMigrations(): void {
    const columns = this.database.prepare('PRAGMA table_info(job_runs)').all() as Array<{ name?: unknown }>
    if (!columns.some((column) => column.name === 'review_json')) {
      this.database.exec('ALTER TABLE job_runs ADD COLUMN review_json TEXT')
    }
    const planColumns = this.database
      .prepare('PRAGMA table_info(plans)')
      .all() as Array<{ name: string }>
    const names = new Set(planColumns.map((column) => column.name))
    if (!names.has('question_round')) this.database.exec('ALTER TABLE plans ADD COLUMN question_round INTEGER NOT NULL DEFAULT 0')
    if (!names.has('status')) this.database.exec("ALTER TABLE plans ADD COLUMN status TEXT NOT NULL DEFAULT 'draft'")
  }

  createJob(input: CreateJobInput): JobRecord {
    const id = input.id?.trim() || randomUUID()
    const startedAt = input.startedAt === undefined ? isoNow() : input.startedAt
    this.database
      .prepare(
        `INSERT INTO job_runs
          (id, plan_id, workflow, step_id, skill, runner, department, status, autonomy, gate,
           input_json, result_json, review_json, source_count, cost_json, started_at, finished_at,
           approved_by, approved_at, error)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        input.planId ?? null,
        input.workflow ?? null,
        input.stepId ?? null,
        input.skill ?? null,
        input.runner,
        input.department ?? null,
        input.status ?? 'running',
        input.autonomy ?? 'assisted',
        input.gate ?? 'none',
        jsonValue(input.input),
        jsonValue(input.result),
        jsonValue(input.review),
        Number.isFinite(input.sourceCount) ? Math.max(0, Math.trunc(input.sourceCount!)) : 0,
        jsonValue(input.cost),
        startedAt,
        input.finishedAt ?? null,
        input.approvedBy ?? null,
        input.approvedAt ?? null,
        input.error ?? null
      )
    const job = this.getJob(id)
    if (!job) throw new Error(`Job ${id} was not created.`)
    return job
  }

  updateJob(id: string, update: UpdateJobInput): JobRecord | undefined {
    const columns: Array<[string, unknown]> = []
    const values: Array<keyof UpdateJobInput> = [
      'planId',
      'workflow',
      'stepId',
      'skill',
      'runner',
      'department',
      'status',
      'autonomy',
      'gate',
      'input',
      'result',
      'review',
      'sourceCount',
      'cost',
      'startedAt',
      'finishedAt',
      'approvedBy',
      'approvedAt',
      'error'
    ]
    const columnNames: Record<keyof UpdateJobInput, string> = {
      planId: 'plan_id',
      workflow: 'workflow',
      stepId: 'step_id',
      skill: 'skill',
      runner: 'runner',
      department: 'department',
      status: 'status',
      autonomy: 'autonomy',
      gate: 'gate',
      input: 'input_json',
      result: 'result_json',
      review: 'review_json',
      sourceCount: 'source_count',
      cost: 'cost_json',
      startedAt: 'started_at',
      finishedAt: 'finished_at',
      approvedBy: 'approved_by',
      approvedAt: 'approved_at',
      error: 'error'
    }
    for (const key of values) {
      if (update[key] === undefined) continue
      let value: unknown = update[key]
      if (key === 'input' || key === 'result' || key === 'review' || key === 'cost') value = jsonValue(value)
      if (key === 'sourceCount') value = Math.max(0, Math.trunc(Number(value) || 0))
      columns.push([columnNames[key], value])
    }
    if (columns.length === 0) return this.getJob(id)
    const setClause = columns.map(([column]) => `${column} = ?`).join(', ')
    const result = this.database
      .prepare(`UPDATE job_runs SET ${setClause} WHERE id = ?`)
      .run(...columns.map(([, value]) => value), id)
    return result.changes === 0 ? undefined : this.getJob(id)
  }

  listJobs(options: ListJobsOptions = {}): JobRecord[] {
    const clauses: string[] = []
    const parameters: unknown[] = []
    if (options.status) {
      clauses.push('status = ?')
      parameters.push(options.status)
    }
    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : ''
    const limit = Math.max(1, Math.min(500, Math.trunc(options.limit ?? 100)))
    const rows = this.database
      .prepare(`SELECT * FROM job_runs ${where} ORDER BY COALESCE(started_at, '') DESC LIMIT ?`)
      .all(...parameters, limit) as JobRow[]
    return rows.map(mapJob)
  }

  getJob(id: string): JobRecord | undefined {
    const row = this.database.prepare('SELECT * FROM job_runs WHERE id = ?').get(id) as
      | JobRow
      | undefined
    return row ? mapJob(row) : undefined
  }

  createPlan(input: CreatePlanInput): PlanRecord {
    const id = input.id.trim()
    if (!id) throw new Error('Plan id is required.')
    const briefMd = input.briefMd
    if (!briefMd.trim()) throw new Error('Plan brief is required.')
    this.database
      .prepare(
        `INSERT INTO plans
          (id, conversation_id, brief_md, plan_json, round, question_round, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        input.conversationId ?? null,
        briefMd,
        JSON.stringify(input.plan),
        Math.max(0, Math.trunc(input.round ?? 0)),
        Math.max(0, Math.trunc(input.questionRound ?? 0)),
        input.status ?? 'draft',
        input.createdAt ?? isoNow()
      )
    const plan = this.getPlan(id)
    if (!plan) throw new Error(`Plan ${id} was not created.`)
    return plan
  }

  updatePlan(id: string, update: UpdatePlanInput): PlanRecord | undefined {
    const columns: Array<[string, unknown]> = []
    const values: Array<keyof UpdatePlanInput> = [
      'conversationId',
      'briefMd',
      'plan',
      'round',
      'questionRound',
      'status'
    ]
    const columnNames: Record<keyof UpdatePlanInput, string> = {
      conversationId: 'conversation_id',
      briefMd: 'brief_md',
      plan: 'plan_json',
      round: 'round',
      questionRound: 'question_round',
      status: 'status'
    }
    for (const key of values) {
      if (update[key] === undefined) continue
      let value: unknown = update[key]
      if (key === 'plan') value = JSON.stringify(value)
      if (key === 'round' || key === 'questionRound') value = Math.max(0, Math.trunc(Number(value) || 0))
      columns.push([columnNames[key], value])
    }
    if (columns.length === 0) return this.getPlan(id)
    const setClause = columns.map(([column]) => `${column} = ?`).join(', ')
    const result = this.database
      .prepare(`UPDATE plans SET ${setClause} WHERE id = ?`)
      .run(...columns.map(([, value]) => value), id)
    return result.changes === 0 ? undefined : this.getPlan(id)
  }

  getPlan(id: string): PlanRecord | undefined {
    const row = this.database
      .prepare('SELECT id, conversation_id, brief_md, plan_json, round, question_round, status, created_at FROM plans WHERE id = ?')
      .get(id) as PlanRow | undefined
    return row ? mapPlan(row) : undefined
  }

  listPlans(limit = 100): PlanRecord[] {
    const safeLimit = Math.max(1, Math.min(500, Math.trunc(limit)))
    const rows = this.database
      .prepare('SELECT id, conversation_id, brief_md, plan_json, round, question_round, status, created_at FROM plans ORDER BY created_at DESC LIMIT ?')
      .all(safeLimit) as PlanRow[]
    return rows.map(mapPlan)
  }

  approveJob(id: string, approvedBy = 'owner'): JobRecord | undefined {
    const job = this.getJob(id)
    if (!job) return undefined
    const approvedAt = isoNow()
    this.database
      .prepare(
        `UPDATE job_runs
         SET approved_by = ?, approved_at = ?,
             status = CASE WHEN status = 'needs_approval' THEN 'ok' ELSE status END
         WHERE id = ?`
      )
      .run(approvedBy.trim() || 'owner', approvedAt, id)
    return this.getJob(id)
  }

  checkpoint(): void {
    this.database.pragma('wal_checkpoint(TRUNCATE)')
  }

  close(): void {
    this.database.close()
  }
}

export { mapJob }
