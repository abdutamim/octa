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
  it('advances through credentials, paths, research, and health without overshooting', () => {
    expect(FIRST_RUN_STEPS).toEqual(['credentials', 'paths', 'research', 'health'])
    expect(nextFirstRunStep('credentials')).toBe('paths')
    expect(nextFirstRunStep('health')).toBe('health')
    expect(previousFirstRunStep('credentials')).toBe('credentials')
    expect(previousFirstRunStep('health')).toBe('research')

    const paths = firstRunReducer(INITIAL_FIRST_RUN_STATE, { type: 'next' })
    const research = firstRunReducer(paths, { type: 'next' })
    const health = firstRunReducer(research, { type: 'next' })
    expect(health).toEqual({ step: 'health', completed: false })
    expect(firstRunReducer(health, { type: 'complete' })).toEqual({ step: 'health', completed: true })
    expect(firstRunReducer(health, { type: 'reset' })).toEqual(INITIAL_FIRST_RUN_STATE)
  })

  it('allows returning to completed steps but never jumps over an unfinished step from the reducer', () => {
    const state = firstRunReducer(firstRunReducer(INITIAL_FIRST_RUN_STATE, { type: 'next' }), { type: 'next' })
    expect(firstRunReducer(state, { type: 'go-to', step: 'credentials' }).step).toBe('credentials')
    expect(firstRunReducer(state, { type: 'go-to', step: 'health' }).step).toBe('health')
  })

  it('renders the first step with bilingual setup fields and progress controls', () => {
    const html = renderToStaticMarkup(createElement(FirstRun, {
      locale: 'en',
      onComplete: vi.fn(async () => undefined),
      onInstall: vi.fn(async () => ({ kind: 'python', ok: true, command: '', exitCode: 0, output: '', error: '' })),
      onRunHealth: vi.fn(async () => ({ ok: true, checkedAt: new Date(0).toISOString(), checks: [] })),
      onUpdate: vi.fn(async () => DEFAULT_SETTINGS),
      required: true,
      settings: DEFAULT_SETTINGS
    }))
    expect(html).toContain('Welcome to Octa')
    expect(html).toContain('Gemini API key')
    expect(html).toContain('Step 1 of 4')
    expect(html).toContain('Save and continue')
    expect(html).toContain('Skip for now')
  })
})
