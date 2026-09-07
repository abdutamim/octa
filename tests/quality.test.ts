import { describe, expect, it } from 'vitest'
import { qualityChain, type StepRunner } from '../electron/core/octa/quality'

describe('quality chain', () => {
  it('runs outward steps in order and carries each edited result forward', async () => {
    const calls: Array<{ skill: string; text: string; language: string; outward: boolean }> = []
    const runStep: StepRunner = async (skill, input) => {
      calls.push({ skill, text: input.text, language: input.language, outward: input.outward })
      return {
        text: `${input.text} -> ${skill}`,
        changes: [`${skill} made one change`]
      }
    }

    const result = await qualityChain('draft', {
      language: 'ar-EG',
      outward: true,
      sourcesPath: 'C:\\Octa\\jobs\\job-1\\evidence\\sources.jsonl',
      runStep
    })

    expect(calls.map((call) => call.skill)).toEqual(['copy-editing', 'stop-slop', 'fact-checker'])
    expect(calls.map((call) => call.text)).toEqual([
      'draft',
      'draft -> copy-editing',
      'draft -> copy-editing -> stop-slop'
    ])
    expect(calls.every((call) => call.language === 'ar-EG' && call.outward)).toBe(true)
    expect(result.text).toBe('draft -> copy-editing -> stop-slop -> fact-checker')
    expect(result.changes).toEqual([
      'copy-editing made one change',
      'stop-slop made one change',
      'fact-checker made one change'
    ])
    expect(result.passes.map((pass) => pass.skill)).toEqual(['copy-editing', 'stop-slop', 'fact-checker'])
    expect(result.changeLog).toEqual([
      { skill: 'copy-editing', change: 'copy-editing made one change' },
      { skill: 'stop-slop', change: 'stop-slop made one change' },
      { skill: 'fact-checker', change: 'fact-checker made one change' }
    ])
  })

  it('leaves an internal draft alone without invoking outward quality steps', async () => {
    let calls = 0
    const result = await qualityChain('internal note', {
      language: 'en',
      outward: false,
      runStep: async () => {
        calls += 1
        return { text: 'should not run', changes: [] }
      }
    })

    expect(calls).toBe(0)
    expect(result).toMatchObject({ text: 'internal note', skipped: true, ok: true, blocked: false })
  })
})
