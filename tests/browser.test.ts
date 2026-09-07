import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  DomainPacingLimiter,
  RESEARCH_BROWSER_MIN_INTERVAL_MS,
  RESEARCH_SOCIAL_PAGE_LIMIT,
  SocialPageBudget,
  assertReadOnlyTarget,
  isComposerControl,
  researchBrowserPaths
} from '../electron/core/octa/browser'

describe('research browser safety primitives', () => {
  it('paces each domain independently at four seconds', async () => {
    let now = 1_000
    const waits: number[] = []
    const limiter = new DomainPacingLimiter({
      now: () => now,
      sleep: async (milliseconds) => {
        waits.push(milliseconds)
        now += milliseconds
      }
    })

    await limiter.wait('www.example.com')
    await limiter.wait('example.com')
    await limiter.wait('other.example.com')

    expect(waits).toEqual([RESEARCH_BROWSER_MIN_INTERVAL_MS])
    expect(limiter.lastRequest('example.com')).toBe(5_000)
    expect(limiter.lastRequest('other.example.com')).toBe(5_000)
  })

  it('caps social pages per job', () => {
    const budget = new SocialPageBudget(2)
    expect(budget.consume('job-1', 'facebook')).toBe(1)
    expect(budget.consume('job-1', 'facebook')).toBe(2)
    expect(() => budget.consume('job-1', 'facebook')).toThrow(/budget/i)
    expect(budget.consume('job-2', 'facebook')).toBe(1)
    expect(RESEARCH_SOCIAL_PAGE_LIMIT).toBe(200)
  })

  it('blocks composer and outward-action controls from a DOM fixture', () => {
    const fixture = readFileSync(join(process.cwd(), 'tests', 'fixtures', 'research', 'composer-dom.html'), 'utf8')
    expect(fixture).toContain('class="composer status-editor"')
    expect(isComposerControl({ tagName: 'BUTTON', text: 'Post', insideComposer: true })).toBe(true)
    expect(isComposerControl({ tagName: 'BUTTON', text: 'Read details' })).toBe(false)
    expect(isComposerControl({ tagName: 'DIV', ariaLabel: 'Write a post', contentEditable: true })).toBe(true)
    expect(() => assertReadOnlyTarget({ role: 'button', ariaLabel: 'Send message' })).toThrow(/read-only/i)
  })

  it('keeps the profile and browser binaries under the Octa home', () => {
    expect(researchBrowserPaths('D:\\Octa')).toEqual({
      profilePath: 'D:\\Octa\\browser\\research',
      playwrightBrowsersPath: 'D:\\Octa\\browser\\playwright',
      screenshotPath: 'D:\\Octa\\browser\\research\\screenshots'
    })
  })
})
