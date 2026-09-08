import { describe, expect, it } from 'vitest'
import { detectConversationLanguage, scriptRatio } from '../electron/core/voice/language'

describe('voice language mirror detection', () => {
  it('classifies Arabic final transcripts as Egyptian Arabic', () => {
    expect(detectConversationLanguage('عايز نعمل خطة تسويق للمشروع', 'ar-EG')).toBe('ar-EG')
  })

  it('classifies English final transcripts as English', () => {
    expect(detectConversationLanguage('Build the landing page tomorrow', 'en-US')).toBe('en')
  })

  it('preserves Arabic/English code-switching as mixed', () => {
    expect(detectConversationLanguage('اعمل landing page للمشروع', 'ar-EG')).toBe('mixed')
  })

  it('exposes script evidence for planner and diagnostics', () => {
    const ratio = scriptRatio('اعمل a plan')
    expect(ratio.arabic).toBeGreaterThan(0)
    expect(ratio.latin).toBeGreaterThan(0)
  })
})
