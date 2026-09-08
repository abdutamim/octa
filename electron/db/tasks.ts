import Database from 'better-sqlite3'
import { DATABASE_BUSY_TIMEOUT_MS } from './busy-timeout'
import { randomUUID } from 'node:crypto'
import type { NewTask, TaskRecord, TaskSession, TaskStatus } from '../types'
import { TASK_STATUSES } from '../types'

interface TaskRow {
  id: string
  title: string
  notes: string
  project: string
  status: TaskStatus
  priority: number
  due_at: number | null
  estimate_minutes: number | null
  created_at: number
  updated_at: number
  completed_at: number | null
  source: string
  vault_note: string | null
  tracked_seconds: number | null
  running_since: number | null
}

function clampPriority(value: unknown): number {
  const parsed = Math.round(Number(value))
  if (!Number.isFinite(parsed)) return 0
  return Math.min(2, Math.max(0, parsed))
}

function nullableInteger(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Math.round(Number(value))
  return Number.isFinite(parsed) ? parsed : null
}

export class TaskRepository {
  private readonly database: Database.Database

  constructor(path: string) {
    this.database = new Database(path, { timeout: DATABASE_BUSY_TIMEOUT_MS })
    this.database.pragma('journal_mode = WAL')
    this.database.pragma('synchronous = FULL')
    this.database.pragma('foreign_keys = ON')
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        project TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'inbox',
        priority INTEGER NOT NULL DEFAULT 0,
        due_at INTEGER,
        estimate_minutes INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        completed_at INTEGER,
        source TEXT NOT NULL DEFAULT 'manual',
        vault_note TEXT
      );
      CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status, due_at);
      CREATE TABLE IF NOT EXISTS task_sessions (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        started_at INTEGER NOT NULL,
        ended_at INTEGER
      );
      CREATE INDEX IF NOT EXISTS task_sessions_task_idx ON task_sessions(task_id);
    `)
  }

  private hydrate(row: TaskRow): TaskRecord {
    return {
      id: row.id,
      title: row.title,
      notes: row.notes,
      project: row.project,
      status: TASK_STATUSES.includes(row.status) ? row.status : 'inbox',
      priority: row.priority,
      dueAt: row.due_at,
      estimateMinutes: row.estimate_minutes,
      trackedSeconds: row.tracked_seconds ?? 0,
      runningSince: row.running_since ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at,
      source: (row.source as TaskRecord['source']) ?? 'manual',
      vaultNote: row.vault_note
    }
  }

  // Tracked time is derived from the sessions table rather than stored on the
  // task, so a crash mid-session can never leave a wrong total behind.
  private readonly selectColumns = `
    tasks.*,
    (SELECT CAST(COALESCE(SUM(ended_at - started_at), 0) / 1000 AS INTEGER)
       FROM task_sessions
      WHERE task_sessions.task_id = tasks.id AND ended_at IS NOT NULL) AS tracked_seconds,
    (SELECT started_at FROM task_sessions
      WHERE task_sessions.task_id = tasks.id AND ended_at IS NULL
      ORDER BY started_at DESC LIMIT 1) AS running_since
  `

  create(input: NewTask): TaskRecord {
    const title = input.title.trim()
    if (!title) throw new Error('A task needs a title.')
    const now = Date.now()
    const id = randomUUID()
    this.database
      .prepare(
        `INSERT INTO tasks (
           id, title, notes, project, status, priority, due_at, estimate_minutes,
           created_at, updated_at, completed_at, source, vault_note
         ) VALUES (
           @id, @title, @notes, @project, @status, @priority, @due_at, @estimate_minutes,
           @created_at, @updated_at, NULL, @source, @vault_note
         )`
      )
      .run({
        id,
        title: title.slice(0, 500),
        notes: (input.notes ?? '').slice(0, 20_000),
        project: (input.project ?? '').slice(0, 200),
        status: input.status && TASK_STATUSES.includes(input.status) ? input.status : 'inbox',
        priority: clampPriority(input.priority),
        due_at: nullableInteger(input.dueAt),
        estimate_minutes: nullableInteger(input.estimateMinutes),
        created_at: now,
        updated_at: now,
        source: input.source ?? 'manual',
        vault_note: input.vaultNote ?? null
      })
    return this.get(id)!
  }

  get(id: string): TaskRecord | undefined {
    const row = this.database
      .prepare(`SELECT ${this.selectColumns} FROM tasks WHERE id = ?`)
      .get(id) as TaskRow | undefined
    return row ? this.hydrate(row) : undefined
  }

  list(filter: { status?: TaskStatus; project?: string; query?: string } = {}): TaskRecord[] {
    const clauses: string[] = []
    const params: Record<string, unknown> = {}
    if (filter.status) {
      clauses.push('tasks.status = @status')
      params.status = filter.status
    }
    if (filter.project) {
      clauses.push('tasks.project = @project')
      params.project = filter.project
    }
    if (filter.query?.trim()) {
      clauses.push('(tasks.title LIKE @query OR tasks.notes LIKE @query)')
      params.query = `%${filter.query.trim()}%`
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    // Undated tasks sort after dated ones rather than jumping to the top, which
    // is what NULL would otherwise do in ascending order.
    const rows = this.database
      .prepare(
        `SELECT ${this.selectColumns} FROM tasks ${where}
         ORDER BY
           CASE tasks.status WHEN 'doing' THEN 0 WHEN 'todo' THEN 1 WHEN 'inbox' THEN 2 ELSE 3 END,
           tasks.priority DESC,
           CASE WHEN tasks.due_at IS NULL THEN 1 ELSE 0 END,
           tasks.due_at,
           tasks.created_at DESC`
      )
      .all(params) as TaskRow[]
    return rows.map((row) => this.hydrate(row))
  }

  update(id: string, patch: Partial<NewTask>): TaskRecord {
    const existing = this.get(id)
    if (!existing) throw new Error('Task not found.')
    const next = {
      title: patch.title !== undefined ? patch.title.trim().slice(0, 500) : existing.title,
      notes: patch.notes !== undefined ? patch.notes.slice(0, 20_000) : existing.notes,
      project: patch.project !== undefined ? patch.project.slice(0, 200) : existing.project,
      status:
        patch.status && TASK_STATUSES.includes(patch.status) ? patch.status : existing.status,
      priority: patch.priority !== undefined ? clampPriority(patch.priority) : existing.priority,
      due_at: patch.dueAt !== undefined ? nullableInteger(patch.dueAt) : existing.dueAt,
      estimate_minutes:
        patch.estimateMinutes !== undefined
          ? nullableInteger(patch.estimateMinutes)
          : existing.estimateMinutes,
      vault_note: patch.vaultNote !== undefined ? patch.vaultNote : existing.vaultNote
    }
    if (!next.title) throw new Error('A task needs a title.')

    // completed_at tracks the transition, not the last edit: re-opening a task
    // must clear it, and editing a done task must not move it.
    const completedAt =
      next.status === 'done'
        ? existing.completedAt ?? Date.now()
        : null

    this.database
      .prepare(
        `UPDATE tasks SET
           title = @title, notes = @notes, project = @project, status = @status,
           priority = @priority, due_at = @due_at, estimate_minutes = @estimate_minutes,
           vault_note = @vault_note, completed_at = @completed_at, updated_at = @updated_at
         WHERE id = @id`
      )
      .run({ ...next, completed_at: completedAt, updated_at: Date.now(), id })

    // Finishing or abandoning a task closes its clock; leaving it running would
    // silently accumulate hours against something nobody is working on.
    if (next.status === 'done' || next.status === 'dropped') this.stop(id)
    return this.get(id)!
  }

  remove(id: string): boolean {
    return this.database.prepare('DELETE FROM tasks WHERE id = ?').run(id).changes > 0
  }

  /**
   * Starts timing a task. Only one task can be running at a time — starting a
   * second one closes the first, because two clocks running at once would each
   * claim the same wall-clock minutes.
   */
  start(id: string, now = Date.now()): TaskRecord {
    const task = this.get(id)
    if (!task) throw new Error('Task not found.')
    const begin = this.database.transaction(() => {
      this.database
        .prepare('UPDATE task_sessions SET ended_at = ? WHERE ended_at IS NULL')
        .run(now)
      this.database
        .prepare(
          'INSERT INTO task_sessions (id, task_id, started_at, ended_at) VALUES (?, ?, ?, NULL)'
        )
        .run(randomUUID(), id, now)
      if (task.status !== 'doing') {
        this.database
          .prepare("UPDATE tasks SET status = 'doing', updated_at = ? WHERE id = ?")
          .run(now, id)
      }
    })
    begin()
    return this.get(id)!
  }

  stop(id: string, now = Date.now()): TaskRecord | undefined {
    this.database
      .prepare('UPDATE task_sessions SET ended_at = ? WHERE task_id = ? AND ended_at IS NULL')
      .run(now, id)
    return this.get(id)
  }

  running(): TaskRecord | undefined {
    const row = this.database
      .prepare(
        `SELECT ${this.selectColumns} FROM tasks
         WHERE EXISTS (
           SELECT 1 FROM task_sessions
            WHERE task_sessions.task_id = tasks.id AND ended_at IS NULL
         ) LIMIT 1`
      )
      .get() as TaskRow | undefined
    return row ? this.hydrate(row) : undefined
  }

  sessions(taskId: string): TaskSession[] {
    return (
      this.database
        .prepare(
          'SELECT id, task_id AS taskId, started_at AS startedAt, ended_at AS endedAt FROM task_sessions WHERE task_id = ? ORDER BY started_at'
        )
        .all(taskId) as TaskSession[]
    )
  }

  projects(): string[] {
    return (
      this.database
        .prepare("SELECT DISTINCT project FROM tasks WHERE project <> '' ORDER BY project")
        .all() as Array<{ project: string }>
    ).map((row) => row.project)
  }

  close(): void {
    this.database.close()
  }
}
