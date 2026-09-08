import { describe, expect, it, vi } from 'vitest'
import { aggregateActivityEvents, TimeTracker } from '../electron/core/time-tracking'

describe('ActivityWatch reports', () => {
  it('merges applications and drops zero-duration events', () => {
    const report = aggregateActivityEvents('2026-07-29', [
      { duration: 12, data: { app: 'Code', title: 'a.ts' } },
      { duration: 8, data: { app: 'Code', title: 'b.ts' } },
      { duration: 0, data: { app: 'Chrome', title: 'Ignored' } }
    ])

    expect(report.totalSeconds).toBe(20)
    expect(report.apps).toEqual([{ name: 'Code', seconds: 20 }])
    expect(report.titles).toHaveLength(2)
  })

  it('returns a visible empty state when the service is missing', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))
    const tracker = new TimeTracker(fetcher)

    await expect(tracker.report('2026-07-29')).resolves.toMatchObject({
      available: false,
      totalSeconds: 0,
      reason: 'ActivityWatch is not running.'
    })
  })
})
