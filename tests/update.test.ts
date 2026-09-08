import { describe, expect, it, vi } from 'vitest'
import {
  checkForUpdate,
  compareVersions,
  normalizeRepository,
  type UpdateFetcher
} from '../electron/core/octa/update'

describe('in-app GitHub update check', () => {
  it('normalizes repository URLs and compares release versions', () => {
    expect(normalizeRepository('https://github.com/abdutamim/octa.git')).toBe('abdutamim/octa')
    expect(normalizeRepository('not-a-repository')).toBeNull()
    expect(compareVersions('v0.1.0', '0.2.0')).toBe(-1)
    expect(compareVersions('0.2.0', 'v0.2.0')).toBe(0)
    expect(compareVersions('0.3.0', '0.2.0')).toBe(1)
    expect(compareVersions('1.0.0-beta.1', '1.0.0')).toBe(-1)
  })

  it('offers the latest NSIS asset without installing anything', async () => {
    const fetcher = vi.fn<UpdateFetcher>(async (url, options) => {
      expect(url).toBe('https://api.github.com/repos/abdutamim/octa/releases/latest')
      expect(options?.headers.Accept).toBe('application/vnd.github+json')
      return {
        ok: true,
        status: 200,
        json: async () => ({
          tag_name: 'v0.2.0',
          html_url: 'https://github.com/abdutamim/octa/releases/tag/v0.2.0',
          assets: [{
            name: 'Octa-Assistant-Setup-0.2.0.exe',
            browser_download_url: 'https://github.com/abdutamim/octa/releases/download/v0.2.0/Octa-Assistant-Setup-0.2.0.exe'
          }]
        })
      }
    })
    const result = await checkForUpdate({
      currentVersion: '0.1.0',
      repository: 'abdutamim/octa',
      fetcher,
      now: () => new Date(0)
    })

    expect(result).toMatchObject({
      status: 'available',
      currentVersion: '0.1.0',
      latestVersion: 'v0.2.0',
      downloadUrl: 'https://github.com/abdutamim/octa/releases/download/v0.2.0/Octa-Assistant-Setup-0.2.0.exe',
      releaseUrl: 'https://github.com/abdutamim/octa/releases/tag/v0.2.0',
      checkedAt: new Date(0).toISOString()
    })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('reports current and network-error states without blocking startup', async () => {
    const current = await checkForUpdate({
      currentVersion: '0.2.0',
      repository: 'abdutamim/octa',
      fetcher: async () => ({ ok: true, status: 200, json: async () => ({ tag_name: 'v0.2.0' }) })
    })
    expect(current.status).toBe('current')
    expect(current.downloadUrl).toContain('https://github.com/abdutamim/octa/releases/tag/v0.2.0')

    const failed = await checkForUpdate({
      currentVersion: '0.1.0',
      repository: 'abdutamim/octa',
      fetcher: async () => { throw new Error('offline') }
    })
    expect(failed).toMatchObject({ status: 'error', repository: 'abdutamim/octa' })
  })
})
