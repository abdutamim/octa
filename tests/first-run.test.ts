import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from '../electron/types'
import {
  FIRST_RUN_STEPS,
  INITIAL_FIRST_RUN_STATE,
  FirstRun,
  firstRunReducer,
  nextFirstRunStep,
  previousFirstRunStep
} from '../src/components/FirstRun'

describe('first-run wizard state machine', () => {
  it('keeps the final setup order and does not overshoot the done page', () => {
    expect(FIRST_RUN_STEPS).toEqual(['language', 'credentials', 'paths', 'health', 'research', 'photoshop', 'done'])
    expect(nextFirstRunStep('language')).toBe('credentials')
    expect(nextFirstRunStep('health')).toBe('research')
    expect(nextFirstRunStep('photoshop')).toBe('done')
    expect(nextFirstRunStep('done')).toBe('done')
    expect(previousFirstRunStep('language')).toBe('language')
    expect(previousFirstRunStep('health')).toBe('paths')
    expect(previousFirstRunStep('done')).toBe('photoshop')

    const credentials = firstRunReducer(INITIAL_FIRST_RUN_STATE, { type: 'next' })
    const paths = firstRunReducer(credentials, { type: 'next' })
    const health = firstRunReducer(paths, { type: 'next' })
    const research = firstRunReducer(health, { type: 'next' })
    const photoshop = firstRunReducer(research, { type: 'next' })
    const done = firstRunReducer(photoshop, { type: 'next' })
    expect(done).toEqual({ step: 'done', completed: false })
    expect(firstRunReducer(done, { type: 'complete' })).toEqual({ step: 'done', completed: true })
    expect(firstRunReducer(health, { type: 'reset' })).toEqual(INITIAL_FIRST_RUN_STATE)
  })

  it('supports explicit navigation back to completed steps and forward to a selected step', () => {
    const state = firstRunReducer(firstRunReducer(INITIAL_FIRST_RUN_STATE, { type: 'next' }), { type: 'next' })
    expect(firstRunReducer(state, { type: 'go-to', step: 'language' }).step).toBe('language')
    expect(firstRunReducer(state, { type: 'go-to', step: 'health' }).step).toBe('health')
  })

  it('renders the first step with bilingual setup fields and progress controls', () => {
    const html = renderToStaticMarkup(createElement(FirstRun, {
      locale: 'en',
      onComplete: vi.fn(async () => undefined),
      onInstall: vi.fn(async () => ({ kind: 'python' as const, ok: true, command: '', exitCode: 0, output: '', error: '' })),
      onRunHealth: vi.fn(async () => ({ ok: true, checkedAt: new Date(0).toISOString(), checks: [] })),
      onUpdate: vi.fn(async () => DEFAULT_SETTINGS),
      required: true,
      settings: { ...DEFAULT_SETTINGS, locale: 'en' }
    }))
    expect(html).toContain('Welcome to Octa')
    expect(html).toContain('Language')
    expect(html).toContain('Step 1 of 7')
    expect(html).toContain('Save and continue')
    expect(html).toContain('Skip for now')
  })
})
