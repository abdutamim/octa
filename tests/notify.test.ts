import { describe, expect, it, vi } from 'vitest'
import { Notifier } from '../electron/core/notify'
import { DEFAULT_SETTINGS } from '../electron/types'

describe('notifications', () => {
  it('returns false instead of throwing when ntfy is unreachable', async () => {
    const showLocalNotification = vi.fn(() => true)
    const notifier = new Notifier(
      () => ({
        ...DEFAULT_SETTINGS,
        ntfyTopic: 'private-topic'
      }),
      {
        showLocalNotification,
        fetch: vi.fn(async () => {
          throw new Error('offline')
        })
      }
    )

    await expect(
      notifier.send({ title: 'Limit reached', body: 'chrome crossed its limit' })
    ).resolves.toBe(false)
    expect(showLocalNotification).toHaveBeenCalledOnce()
  })

  it('works locally without making a request when no topic is configured', async () => {
    const fetch = vi.fn()
    const notifier = new Notifier(
      () => DEFAULT_SETTINGS,
      {
        fetch,
        showLocalNotification: () => true
      }
    )

    await expect(notifier.send({ title: 'Test', body: 'Local only' })).resolves.toBe(true)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('posts the message and ntfy headers to the configured topic', async () => {
    const fetch = vi.fn(async () => new Response('', { status: 200 }))
    const notifier = new Notifier(
      () => ({
        ...DEFAULT_SETTINGS,
        ntfyTopic: 'long secret/topic',
        ntfyServer: 'https://notify.example.test/'
      }),
      {
        fetch,
        showLocalNotification: () => true
      }
    )

    await expect(
      notifier.send({
        title: 'Limit reached',
        body: 'chrome used 1 GB',
        priority: 'high',
        tags: ['warning'],
        clickUrl: 'https://example.test/usage'
      })
    ).resolves.toBe(true)
    expect(fetch).toHaveBeenCalledWith(
      'https://notify.example.test/long%20secret%2Ftopic',
      expect.objectContaining({
        method: 'POST',
        body: 'chrome used 1 GB',
        headers: {
          Title: 'Limit reached',
          Priority: 'high',
          Tags: 'warning',
          Click: 'https://example.test/usage'
        }
      })
    )
  })
})
