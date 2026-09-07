import { ar } from './ar'
import { en } from './en'

export type Locale = 'ar' | 'en'
export type TranslationKey = keyof typeof en

const dictionaries = { ar, en } satisfies Record<Locale, Record<TranslationKey, string>>

export function t(key: TranslationKey, locale: Locale): string {
  return dictionaries[locale][key]
}

export function applyLocale(locale: Locale): void {
  if (typeof document === 'undefined') return
  document.documentElement.lang = locale
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
}
