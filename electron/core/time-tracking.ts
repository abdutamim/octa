import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { TimeReport, TimeUsageEntry } from '../types'

interface ActivityEvent {
  duration?: number
  data?: {
    app?: string
    title?: string
  }
}

interface FetchLike {
  (input: string | URL, init?: RequestInit): Promise<Response>
}

function dayRange(day: string): { start: Date; end: Date } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error('Day must use YYYY-MM-DD.')
  const start = new Date(`${day}T00:00:00`)
  if (Number.isNaN(start.getTime())) throw new Error('Day is invalid.')
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

function ranked(values: Map<string, number>): TimeUsageEntry[] {
  return [...values.entries()]
    .map(([name, seconds]) => ({ name, seconds }))
    .sort((left, right) => right.seconds - left.seconds)
}

export function aggregateActivityEvents(
  day: string,
  events: ActivityEvent[]
): TimeReport {
  const apps = new Map<string, number>()
  const titles = new Map<string, number>()
  let totalSeconds = 0

  for (const event of events) {
    const seconds = Number(event.duration)
    if (!Number.isFinite(seconds) || seconds <= 0) continue
    const app = event.data?.app?.trim() || 'Unknown'
    const title = event.data?.title?.trim() || 'Untitled'
    apps.set(app, (apps.get(app) ?? 0) + seconds)
    titles.set(title, (titles.get(title) ?? 0) + seconds)
    totalSeconds += seconds
  }

  return {
    day,
    available: true,
    totalSeconds,
    apps: ranked(apps),
    titles: ranked(titles)
  }
}

export class TimeTracker {
  private readonly cache = new Map<string, { expires: number; report: TimeReport }>()

  constructor(
    private readonly fetcher: FetchLike = fetch,
    private readonly now: () => number = Date.now
  ) {}

  async report(day: string): Promise<TimeReport> {
    const cached = this.cache.get(day)
    if (cached && cached.expires > this.now()) return cached.report

    try {
      const { start, end } = dayRange(day)
      const bucketResponse = await this.fetcher('http://127.0.0.1:5600/api/0/buckets/', {
        signal: AbortSignal.timeout(3_000)
      })
      if (!bucketResponse.ok) throw new Error(`ActivityWatch returned ${bucketResponse.status}.`)
      const buckets = (await bucketResponse.json()) as Record<string, unknown>
      const bucketId = Object.keys(buckets).find((id) => id.startsWith('aw-watcher-window_'))
      if (!bucketId) throw new Error('ActivityWatch window watcher is not running.')

      const query = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString()
      })
      const eventResponse = await this.fetcher(
        `http://127.0.0.1:5600/api/0/buckets/${encodeURIComponent(bucketId)}/events?${query}`,
        { signal: AbortSignal.timeout(8_000) }
      )
      if (!eventResponse.ok) throw new Error(`ActivityWatch returned ${eventResponse.status}.`)
      const events = (await eventResponse.json()) as ActivityEvent[]
      const report = aggregateActivityEvents(day, Array.isArray(events) ? events : [])
      this.cache.set(day, { expires: this.now() + 60_000, report })
      return report
    } catch (error) {
      return {
        day,
        available: false,
        reason:
          error instanceof Error && error.message.includes('window watcher')
            ? error.message
            : 'ActivityWatch is not running.',
        totalSeconds: 0,
        apps: [],
        titles: []
      }
    }
  }

  launch(): boolean {
    const local = process.env.LOCALAPPDATA
    if (!local) return false
    const executable = join(local, 'Programs', 'ActivityWatch', 'aw-qt.exe')
    if (!existsSync(executable)) return false
    const child = spawn(executable, ['--no-gui'], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true
    })
    child.unref()
    this.cache.clear()
    return true
  }
}
