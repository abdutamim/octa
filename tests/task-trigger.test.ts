import { describe, expect, it } from 'vitest'
import {
  DEFAULT_TASK_TRIGGERS,
  matchTaskTrigger,
  normalizeForMatch,
  splitTitleAndNotes
} from '../electron/core/task-trigger'

describe('task trigger detection', () => {
  it('catches the trigger at the end of a dictation and strips it', () => {
    const match = matchTaskTrigger('أكلم أحمد بخصوص العقد خلي دي تاسك في السيستم')
    expect(match?.text).toBe('أكلم أحمد بخصوص العقد')
  })

  it('survives the spelling variations Arabic ASR produces', () => {
    // Same sentence, different hamza and taa marbuta — one recognition to the
    // next. Comparing raw strings would miss this and drop the task silently.
    const match = matchTaskTrigger('أراجع الفاتورة خلى دى تاسك فى السيستم')
    expect(match).toBeDefined()
    expect(match?.text).toBe('أراجع الفاتورة')
  })

  it('does not fire on an ordinary message that merely mentions a task', () => {
    // This is the failure that matters: Bedo dictates voice notes to friends
    // through the same pipeline, and a false positive sends nothing at all.
    expect(matchTaskTrigger('يا صاحبي التاسك اللي كلمتك عليها خلصت')).toBeUndefined()
    expect(matchTaskTrigger('عندي تاسك كتير النهاردة')).toBeUndefined()
    expect(matchTaskTrigger('add this task to the report please')).toBeUndefined()
  })

  it('ignores a single-word trigger even if configured', () => {
    // A one-word trigger cannot be precise enough to be safe.
    expect(matchTaskTrigger('راجع الحسابات تاسك', ['تاسك'])).toBeUndefined()
  })

  it('matches the English trigger', () => {
    const match = matchTaskTrigger('call the landlord tomorrow add this to my system')
    expect(match?.text).toBe('call the landlord tomorrow')
  })

  it('handles the trigger at the start', () => {
    const match = matchTaskTrigger('خلي دي تاسك في السيستم أراجع الديزاين')
    expect(match?.text).toBe('أراجع الديزاين')
  })

  it('leaves trailing punctuation off the task title', () => {
    const match = matchTaskTrigger('أبعت البروبوزال، خلي دي تاسك في السيستم.')
    expect(match?.text).toBe('أبعت البروبوزال')
  })

  it('returns nothing for empty or whitespace input', () => {
    expect(matchTaskTrigger('')).toBeUndefined()
    expect(matchTaskTrigger('   ')).toBeUndefined()
  })

  it('ships defaults that are all multi-word', () => {
    for (const trigger of DEFAULT_TASK_TRIGGERS) {
      expect(trigger.trim().split(/\s+/).length).toBeGreaterThan(1)
    }
  })
})

describe('normalisation', () => {
  it('folds hamza forms, taa marbuta and alef maqsura together', () => {
    expect(normalizeForMatch('أحمد')).toBe(normalizeForMatch('احمد'))
    expect(normalizeForMatch('مدرسة')).toBe(normalizeForMatch('مدرسه'))
    expect(normalizeForMatch('على')).toBe(normalizeForMatch('علي'))
  })

  it('strips diacritics and tatweel', () => {
    expect(normalizeForMatch('مُحَمَّـــد')).toBe(normalizeForMatch('محمد'))
  })
})

describe('splitting a dictation into title and notes', () => {
  it('uses the first sentence as the title', () => {
    const result = splitTitleAndNotes('أراجع العقد. فيه بند التسليم محتاج تعديل')
    expect(result.title).toBe('أراجع العقد')
    expect(result.notes).toBe('فيه بند التسليم محتاج تعديل')
  })

  it('keeps a short one-liner whole with no notes', () => {
    expect(splitTitleAndNotes('أبعت الفاتورة')).toEqual({
      title: 'أبعت الفاتورة',
      notes: ''
    })
  })

  it('breaks a long run-on at a word boundary rather than mid-word', () => {
    const long = 'كلمة '.repeat(60).trim()
    const result = splitTitleAndNotes(long)
    expect(result.title.length).toBeLessThanOrEqual(120)
    expect(result.title.endsWith('كلمة')).toBe(true)
    expect(result.notes.length).toBeGreaterThan(0)
  })
})
