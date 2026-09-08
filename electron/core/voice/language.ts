import type { VoiceLanguage } from '../../types'

export interface ScriptRatio {
  arabic: number
  latin: number
  other: number
}

const ARABIC_LETTER = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/u
const LATIN_LETTER = /[A-Za-z]/u

export function scriptRatio(text: string): ScriptRatio {
  let arabic = 0
  let latin = 0
  let other = 0
  for (const character of text) {
    if (ARABIC_LETTER.test(character)) arabic += 1
    else if (LATIN_LETTER.test(character)) latin += 1
    else if (/\p{L}/u.test(character)) other += 1
  }
  const total = arabic + latin + other
  if (total === 0) return { arabic: 0, latin: 0, other: 0 }
  return { arabic: arabic / total, latin: latin / total, other: other / total }
}

function letterCount(text: string, pattern: RegExp): number {
  let count = 0
  for (const character of text) if (pattern.test(character)) count += 1
  return count
}

export function normalizeLanguageHint(hint: string | undefined): VoiceLanguage | null {
  const value = hint?.trim().toLowerCase()
  if (!value) return null
  if (/mixed|code[- ]?switch|multilingual/.test(value)) return 'mixed'
  if (value === 'ar' || value.startsWith('ar-') || /arabic|egyptian/.test(value)) return 'ar-EG'
  if (value === 'en' || value.startsWith('en-') || /english/.test(value)) return 'en'
  return null
}

/**
 * Language mirror detection for a final user turn. Script evidence is the
 * primary signal; Gemini's languageCode is used to break ties and to preserve
 * an Arabic/English mix when a recognizer labels the whole utterance as one
 * language.
 */
export function detectConversationLanguage(
  text: string,
  geminiLanguageHint?: string
): VoiceLanguage {
  const arabicLetters = letterCount(text, ARABIC_LETTER)
  const latinLetters = letterCount(text, LATIN_LETTER)
  const hint = normalizeLanguageHint(geminiLanguageHint)
  if (arabicLetters === 0 && latinLetters === 0) return hint ?? 'mixed'
  if (arabicLetters === 0) return hint === 'mixed' ? 'mixed' : 'en'
  if (latinLetters === 0) return hint === 'mixed' ? 'mixed' : 'ar-EG'

  // A short Latin brand/acronym inside Arabic should not erase the Arabic
  // mirror. Two or more letters on each side is a useful deterministic floor.
  if (arabicLetters >= 2 && latinLetters >= 2) return 'mixed'
  if (hint === 'mixed') return 'mixed'
  if (hint === 'ar-EG' && latinLetters <= arabicLetters * 0.2) return 'ar-EG'
  if (hint === 'en' && arabicLetters <= latinLetters * 0.2) return 'en'

  const ratio = scriptRatio(text)
  return ratio.arabic >= ratio.latin ? 'ar-EG' : 'en'
}

export const detectTranscriptLanguage = detectConversationLanguage
export const detectLanguage = detectConversationLanguage
