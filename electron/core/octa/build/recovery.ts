import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { BuildPlan, BuildSubtask, BuildWorkspace, CommandRunner } from './types'
import { readySubtasks } from './spec'
import { defaultCommandRunner, workspaceGit } from './workspace'

export interface AttemptRecord {
  id: string
  subtaskId: string
  attempt: number
  success: boolean
  error?: string
  approach?: string
  sessionId?: string
  timestamp: string
}

export interface GoodCommit {
  hash: string
  subtaskId?: string
  message?: string
  timestamp: string
}

export interface RecoverySnapshot {
  attempts: AttemptRecord[]
  goodCommits: GoodCommit[]
  stuckSubtasks: string[]
  updatedAt: string
}

export interface RecoveryOptions {
  workspace: BuildWorkspace
  plan?: BuildPlan
  commandRunner?: CommandRunner
  maxRetries?: number
}

function recoveryPath(workspace: BuildWorkspace): string {
  mkdirSync(workspace.metadataPath, { recursive: true })
  return join(workspace.metadataPath, 'recovery.json')
}

function readSnapshot(workspace: BuildWorkspace): RecoverySnapshot {
  const path = recoveryPath(workspace)
  if (!existsSync(path)) return { attempts: [], goodCommits: [], stuckSubtasks: [], updatedAt: new Date().toISOString() }
  try {
    const value: unknown = JSON.parse(readFileSync(path, 'utf8'))
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const record = value as Record<string, unknown>
      return {
        attempts: Array.isArray(record.attempts) ? record.attempts as AttemptRecord[] : [],
        goodCommits: Array.isArray(record.goodCommits) ? record.goodCommits as GoodCommit[] : [],
        stuckSubtasks: Array.isArray(record.stuckSubtasks) ? record.stuckSubtasks.filter((item): item is string => typeof item === 'string') : [],
        updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : new Date().toISOString()
      }
    }
  } catch {
    // A corrupt recovery record should not prevent a human from resuming a build.
  }
  return { attempts: [], goodCommits: [], stuckSubtasks: [], updatedAt: new Date().toISOString() }
}

function writeSnapshot(workspace: BuildWorkspace, snapshot: RecoverySnapshot): void {
  writeFileSync(recoveryPath(workspace), `${JSON.stringify({ ...snapshot, updatedAt: new Date().toISOString() }, null, 2)}\n`, 'utf8')
}

function tasks(plan: BuildPlan): BuildSubtask[] {
  return plan.phases.flatMap((phase) => phase.subtasks)
}

export class RecoveryManager {
  private readonly runner: CommandRunner
  private readonly maxRetries: number
  private snapshot: RecoverySnapshot

  constructor(private readonly options: RecoveryOptions) {
    this.runner = options.commandRunner ?? defaultCommandRunner
    this.maxRetries = Math.max(1, options.maxRetries ?? 3)
    this.snapshot = readSnapshot(options.workspace)
  }

  get state(): RecoverySnapshot {
    return this.snapshot
  }

  attemptCount(subtaskId: string): number {
    return this.snapshot.attempts.filter((attempt) => attempt.subtaskId === subtaskId).length
  }

  recordAttempt(input: Omit<AttemptRecord, 'id' | 'attempt' | 'timestamp'>): AttemptRecord {
    const record: AttemptRecord = {
      ...input,
      id: `${input.subtaskId}-${this.attemptCount(input.subtaskId) + 1}`,
      attempt: this.attemptCount(input.subtaskId) + 1,
      timestamp: new Date().toISOString()
    }
    this.snapshot.attempts.push(record)
    const task = this.options.plan && tasks(this.options.plan).find((item) => item.id === input.subtaskId)
    if (task) {
      task.attempts = record.attempt
      if (input.success) {
        task.status = 'completed'
        task.error = undefined
      } else {
        task.status = record.attempt >= this.maxRetries ? 'stuck' : 'failed'
        task.error = input.error
        if (task.status === 'stuck' && !this.snapshot.stuckSubtasks.includes(task.id)) this.snapshot.stuckSubtasks.push(task.id)
      }
    }
    writeSnapshot(this.options.workspace, this.snapshot)
    return record
  }

  recordGoodCommit(hash: string, subtaskId?: string, message?: string): GoodCommit {
    const record: GoodCommit = { hash, subtaskId, message, timestamp: new Date().toISOString() }
    this.snapshot.goodCommits.push(record)
    writeSnapshot(this.options.workspace, this.snapshot)
    return record
  }

  lastGoodCommit(): GoodCommit | undefined {
    return this.snapshot.goodCommits.at(-1)
  }

  markStuck(subtaskId: string, reason = 'The subtask needs human intervention.'): BuildSubtask | undefined {
    const task = this.options.plan && tasks(this.options.plan).find((item) => item.id === subtaskId)
    if (!task) return undefined
    task.status = 'stuck'
    task.error = reason
    if (!this.snapshot.stuckSubtasks.includes(subtaskId)) this.snapshot.stuckSubtasks.push(subtaskId)
    writeSnapshot(this.options.workspace, this.snapshot)
    return task
  }

  /** Reset an interrupted in-progress subtask without touching committed work. */
  resumeFromLastCommit(plan = this.options.plan): { plan?: BuildPlan; nextSubtask?: BuildSubtask; completedCommit?: string } {
    if (!plan) return { completedCommit: this.lastGoodCommit()?.hash }
    const stuck = new Set(this.snapshot.stuckSubtasks)
    for (const task of tasks(plan)) {
      if (task.status === 'in_progress') task.status = 'pending'
      if (task.status === 'failed' && (task.attempts ?? this.attemptCount(task.id)) < this.maxRetries && !stuck.has(task.id)) task.status = 'pending'
      if (stuck.has(task.id)) task.status = 'stuck'
    }
    writeSnapshot(this.options.workspace, this.snapshot)
    return { plan, nextSubtask: readySubtasks(plan)[0], completedCommit: this.lastGoodCommit()?.hash }
  }

  async rollbackToLastGoodCommit(plan = this.options.plan): Promise<string> {
    const good = this.lastGoodCommit()
    if (!good) throw new Error('No good build commit is recorded.')
    await workspaceGit(this.options.workspace, ['reset', '--hard', good.hash], this.runner)
    if (plan) {
      for (const task of tasks(plan)) {
        if (task.commitHash && task.commitHash !== good.hash) {
          task.status = 'pending'
          task.commitHash = undefined
          task.completedAt = undefined
        }
      }
      writeSnapshot(this.options.workspace, this.snapshot)
    }
    return good.hash
  }
}

export function resumeBuild(options: RecoveryOptions): ReturnType<RecoveryManager['resumeFromLastCommit']> {
  return new RecoveryManager(options).resumeFromLastCommit()
}

export async function rollbackBuild(options: RecoveryOptions): Promise<string> {
  return new RecoveryManager(options).rollbackToLastGoodCommit()
}
