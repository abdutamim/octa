import Database from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import { mkdirSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { DATABASE_BUSY_TIMEOUT_MS } from './busy-timeout'

export type SocialPlatform = 'facebook' | 'instagram' | 'tiktok' | 'linkedin' | 'x'
export type SocialQueueStatus = 'queued' | 'handed_off' | 'published' | 'failed'

export interface SocialQueueItem {
  id: string
  platform: SocialPlatform
  body: string
  mediaPaths: string[]
  scheduledAt: string
  status: SocialQueueStatus
  approvedAt: string | null
  handedOffAt: string | null
  error: string | null
  createdAt: string
}

export interface SocialQueueInput {
  id?: string
  platform: SocialPlatform
  body: string
  mediaPaths?: string[]
  scheduledAt: string
  approvedAt?: string | null
}

export interface SocialQueueHandoffPost {
  id: string
  platform: SocialPlatform
  body: string
  media_paths: string[]
  scheduled_at: string
}

export interface SocialQueueHandoff {
  version: 1
  dry_run: true
  posts: SocialQueueHandoffPost[]
}

interface SocialQueueRow {
  id: string
  platform: SocialPlatform
  body: string
  media_paths: string
  scheduled_at: string
  status: SocialQueueStatus
  approved_at: string | null
  handed_off_at: string | null
  error: string | null
  created_at: string
}

function parsePaths(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function now(): string {
  return new Date().toISOString()
}

function rowToItem(row: SocialQueueRow): SocialQueueItem {
  return {
    id: row.id,
    platform: row.platform,
    body: row.body,
    mediaPaths: parsePaths(row.media_paths),
    scheduledAt: row.scheduled_at,
    status: row.status,
    approvedAt: row.approved_at,
    handedOffAt: row.handed_off_at,
    error: row.error,
    createdAt: row.created_at
  }
}

/** SQLite-backed, approval-first queue for the existing PHP publisher. */
export class SocialQueueRepository {
  private readonly database: Database.Database

  constructor(readonly databasePath: string) {
    if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true })
    this.database = new Database(databasePath, { timeout: DATABASE_BUSY_TIMEOUT_MS })
    this.database.pragma('journal_mode = WAL')
    this.database.pragma('synchronous = FULL')
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS social_queue (
        id TEXT PRIMARY KEY,
        platform TEXT NOT NULL CHECK(platform IN ('facebook', 'instagram', 'tiktok', 'linkedin', 'x')),
        body TEXT NOT NULL,
        media_paths TEXT NOT NULL DEFAULT '[]',
        scheduled_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued', 'handed_off', 'published', 'failed')),
        approved_at TEXT,
        handed_off_at TEXT,
        error TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS social_queue_schedule_idx ON social_queue(scheduled_at, status);
    `)
  }

  queue(input: SocialQueueInput): SocialQueueItem {
    const body = input.body.trim()
    if (!body) throw new Error('A social post needs copy.')
    if (!input.scheduledAt.trim() || Number.isNaN(Date.parse(input.scheduledAt))) throw new Error('A social post needs a valid schedule.')
    const id = input.id?.trim() || randomUUID()
    const createdAt = now()
    this.database.prepare(`
      INSERT INTO social_queue (id, platform, body, media_paths, scheduled_at, status, approved_at, created_at)
      VALUES (?, ?, ?, ?, ?, 'queued', ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        platform = excluded.platform, body = excluded.body, media_paths = excluded.media_paths,
        scheduled_at = excluded.scheduled_at, approved_at = excluded.approved_at
    `).run(
      id,
      input.platform,
      body,
      JSON.stringify(input.mediaPaths ?? []),
      new Date(input.scheduledAt).toISOString(),
      input.approvedAt ?? null,
      createdAt
    )
    return this.get(id)!
  }

  get(id: string): SocialQueueItem | undefined {
    const row = this.database.prepare('SELECT * FROM social_queue WHERE id = ?').get(id) as SocialQueueRow | undefined
    return row ? rowToItem(row) : undefined
  }

  list(options: { status?: SocialQueueStatus; from?: string; to?: string } = {}): SocialQueueItem[] {
    const clauses: string[] = []
    const params: Record<string, unknown> = {}
    if (options.status) {
      clauses.push('status = @status')
      params.status = options.status
    }
    if (options.from) {
      clauses.push('scheduled_at >= @from')
      params.from = options.from
    }
    if (options.to) {
      clauses.push('scheduled_at <= @to')
      params.to = options.to
    }
    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : ''
    const rows = this.database.prepare(`SELECT * FROM social_queue ${where} ORDER BY scheduled_at ASC, created_at ASC`).all(params) as SocialQueueRow[]
    return rows.map(rowToItem)
  }

  approve(ids: string[], approvedAt = now()): SocialQueueItem[] {
    const clean = [...new Set(ids.map((id) => id.trim()).filter(Boolean))]
    if (clean.length === 0) return []
    const transaction = this.database.transaction(() => {
      const update = this.database.prepare("UPDATE social_queue SET approved_at = ?, status = 'queued', error = NULL WHERE id = ?")
      for (const id of clean) update.run(approvedAt, id)
    })
    transaction()
    return clean.flatMap((id) => {
      const item = this.get(id)
      return item ? [item] : []
    })
  }

  /**
   * Atomically creates the PHP handoff from approved rows. The payload is
   * deliberately always dry-run; live publishing remains the owner's switch
   * in the existing scheduler.php process.
   */
  exportDryRun(outputPath: string, ids?: string[]): SocialQueueHandoff {
    const requested = ids?.length
      ? new Set(ids.map((id) => id.trim()).filter(Boolean))
      : undefined
    const rows = this.list().filter((item) => item.approvedAt !== null && (!requested || requested.has(item.id)))
    const handoff: SocialQueueHandoff = {
      version: 1,
      dry_run: true,
      posts: rows.map((item) => ({
        id: item.id,
        platform: item.platform,
        body: item.body,
        media_paths: item.mediaPaths,
        scheduled_at: item.scheduledAt
      }))
    }
    mkdirSync(dirname(outputPath), { recursive: true })
    const temporary = `${outputPath}.tmp-${process.pid}`
    writeFileSync(temporary, `${JSON.stringify(handoff, null, 2)}\n`, 'utf8')
    renameSync(temporary, outputPath)
    const handedOffAt = now()
    const update = this.database.prepare("UPDATE social_queue SET status = 'handed_off', handed_off_at = ? WHERE id = ?")
    for (const item of rows) update.run(handedOffAt, item.id)
    return handoff
  }

  close(): void {
    this.database.close()
  }
}
