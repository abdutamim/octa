import { describe, expect, it } from 'vitest'
import { AutoUpdateController, feedForRepository, type UpdaterLike } from '../electron/core/octa/auto-update'
import type { UpdateProgress } from '../electron/types'

type Listener = (...args: unknown[]) => void

function fakeUpdater(): UpdaterLike & { emit: (event: string, ...args: unknown[]) => void; feeds: unknown[]; downloads: number; installs: unknown[] } {
  const listeners = new Map<string, Listener[]>()
  const updater = {
    autoDownload: true,
    autoInstallOnAppQuit: false,
    allowDowngrade: true,
    disableDifferentialDownload: true,
    feeds: [] as unknown[],
    downloads: 0,
    installs: [] as unknown[],
    setFeedURL(feed: unknown) { updater.feeds.push(feed) },
    async checkForUpdates() { updater.emit('checking-for-update'); updater.emit('update-available', { version: '0.2.0' }) },
    async downloadUpdate() {
      updater.downloads += 1
      updater.emit('download-progress', { percent: 41.6, transferred: 4_000_000, total: 9_600_000, bytesPerSecond: 800_000 })
      updater.emit('update-downloaded', { version: '0.2.0' })
    },
    quitAndInstall(...args: unknown[]) { updater.installs.push(args) },
    on(event: string, listener: Listener) { listeners.set(event, [...(listeners.get(event) ?? []), listener]); return updater },
    emit(event: string, ...args: unknown[]) { for (const listener of listeners.get(event) ?? []) listener(...args) }
  }
  return updater
}

describe('differential auto-update controller', () => {
  it('maps the configured repository to a GitHub feed', () => {
    expect(feedForRepository('https://github.com/abdutamim/octa.git')).toEqual({ provider: 'github', owner: 'abdutamim', repo: 'octa' })
    expect(feedForRepository('garbage')).toEqual({ provider: 'github', owner: 'abdutamim', repo: 'octa' })
  })

  it('downloads only when packaged, reports progress and installs once downloaded', async () => {
    const updater = fakeUpdater()
    const seen: UpdateProgress[] = []
    const controller = new AutoUpdateController({
      updater, packaged: true, currentVersion: '0.1.0', getRepository: () => 'abdutamim/octa', onProgress: (p) => seen.push(p), now: () => 1
    })
    expect(updater.autoDownload).toBe(false)
    expect(updater.disableDifferentialDownload).toBe(false)
    expect(controller.install()).toBe(false)

    const result = await controller.download()
    expect(updater.feeds).toEqual([{ provider: 'github', owner: 'abdutamim', repo: 'octa' }])
    expect(updater.downloads).toBe(1)
    expect(seen.map((p) => p.phase)).toEqual(['checking', 'checking', 'available', 'downloading', 'downloading', 'downloaded'])
    const downloading = seen.find((p) => p.phase === 'downloading' && p.total > 0)
    expect(downloading).toMatchObject({ percent: 42, transferred: 4_000_000, total: 9_600_000 })
    expect(result.phase).toBe('downloaded')
    expect(result.version).toBe('0.2.0')

    expect((await controller.download()).phase).toBe('downloaded')
    expect(controller.install()).toBe(true)
    expect(updater.installs).toEqual([[true, true]])
  })

  it('refuses in dev builds and surfaces updater errors', async () => {
    const dev = new AutoUpdateController({ updater: fakeUpdater(), packaged: false, currentVersion: '0.1.0', getRepository: () => undefined, onProgress: () => {} })
    expect((await dev.download({ status: 'available', currentVersion: '0.1.0', repository: 'abdutamim/octa', checkedAt: '', latestVersion: 'v0.2.0' })).phase).toBe('unsupported')

    const failing = fakeUpdater()
    failing.checkForUpdates = async () => { throw new Error('offline') }
    const controller = new AutoUpdateController({ updater: failing, packaged: true, currentVersion: '0.1.0', getRepository: () => undefined, onProgress: () => {} })
    const result = await controller.download()
    expect(result.phase).toBe('error')
    expect(result.error).toBe('offline')
  })
})
