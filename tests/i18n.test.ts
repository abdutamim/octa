import { describe, expect, it, vi } from 'vitest'
import { applyLocale, t, type TranslationKey } from '../src/i18n'
import { ar } from '../src/i18n/ar'
import { en } from '../src/i18n/en'

describe('bilingual shell', () => {
  it('has a translation for every shell key', () => {
    for (const key of Object.keys(en) as TranslationKey[]) {
      expect(t(key, 'en')).toBeTruthy()
      expect(t(key, 'ar')).toBeTruthy()
      expect(ar[key]).toBe(t(key, 'ar'))
    }
  })

  it('sets document language and direction for Arabic and English', () => {
    const documentElement = { lang: '', dir: '' }
    vi.stubGlobal('document', { documentElement })

    applyLocale('ar')
    expect(documentElement).toEqual({ lang: 'ar', dir: 'rtl' })
    applyLocale('en')
    expect(documentElement).toEqual({ lang: 'en', dir: 'ltr' })

    vi.unstubAllGlobals()
  })
})
