import i18next, { type BackendModule, type i18n as I18nInstance, type ReadCallback } from 'i18next'
import { initReactI18next } from 'react-i18next'

import enCatalog from './locales/en.json'
import { DEFAULT_UI_LOCALE } from './supported-languages'
import type { SupportedUiLocale } from '../../../src/shared/ui-locale'

// Why: only English is bundled eagerly. The other five locales stay as JSON
// stubs and are imported via Metro's lazy import(), so first-launch cold start
// stays under 200KB even with a fully populated en.json later in M3.
const NON_DEFAULT_UI_LOCALE_LOADERS: Record<
  Exclude<SupportedUiLocale, 'en'>,
  () => Promise<{ default: Record<string, unknown> }>
> = {
  es: () => import('./locales/es.json'),
  fr: () => import('./locales/fr.json'),
  ja: () => import('./locales/ja.json'),
  ko: () => import('./locales/ko.json'),
  zh: () => import('./locales/zh.json')
}

const lazyLocaleBackend: BackendModule = {
  type: 'backend',
  init: () => {},
  read: (language: string, _namespace: string, callback: ReadCallback) => {
    const loader = NON_DEFAULT_UI_LOCALE_LOADERS[language as Exclude<SupportedUiLocale, 'en'>]
    if (!loader) {
      callback(null, false)
      return
    }
    loader().then(
      (mod) => callback(null, mod.default),
      (error) => callback(error instanceof Error ? error : new Error(String(error)), false)
    )
  }
}

export const i18n: I18nInstance = i18next.createInstance()

void i18n
  .use(lazyLocaleBackend)
  .use(initReactI18next)
  .init({
    fallbackLng: DEFAULT_UI_LOCALE,
    lng: DEFAULT_UI_LOCALE,
    partialBundledLanguages: true,
    resources: {
      en: { translation: enCatalog }
    },
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  })
