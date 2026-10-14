import * as Localization from 'expo-localization'
import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { i18n } from './i18n'
import { DEFAULT_UI_LOCALE, resolveUiLocale } from './supported-languages'
import {
  UI_LANGUAGE_SYSTEM,
  normalizeUiLanguage,
  type UiLanguage
} from '../../../src/shared/ui-language'

const STORAGE_KEY = '@orca/mobile/ui-language'

// Why: the persisted preference wins over the system locale, and the system
// locale only feeds the picker when the preference is `system`. That keeps the
// first launch deterministic ("follow OS") without burning the choice into
// disk on day one.
export function useUiLanguage(): {
  language: UiLanguage
  resolvedLocale: string
  setLanguage: (next: UiLanguage) => Promise<void>
} {
  const [language, setLanguageState] = useState<UiLanguage>(UI_LANGUAGE_SYSTEM)

  useEffect(() => {
    let cancelled = false
    void AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (cancelled) {
        return
      }
      setLanguageState(normalizeUiLanguage(stored ?? UI_LANGUAGE_SYSTEM))
    })
    return () => {
      cancelled = true
    }
  }, [])

  const systemTag = Localization.getLocales()[0]?.languageTag
  const resolvedLocale: string =
    language === UI_LANGUAGE_SYSTEM
      ? resolveUiLocale(UI_LANGUAGE_SYSTEM, systemTag ?? DEFAULT_UI_LOCALE)
      : resolveUiLocale(language, systemTag ?? DEFAULT_UI_LOCALE)

  useEffect(() => {
    if (i18n.language !== resolvedLocale) {
      void i18n.changeLanguage(resolvedLocale)
    }
  }, [resolvedLocale])

  const setLanguage = async (next: UiLanguage): Promise<void> => {
    const normalized = normalizeUiLanguage(next)
    setLanguageState(normalized)
    await AsyncStorage.setItem(STORAGE_KEY, normalized)
  }

  return { language, resolvedLocale, setLanguage }
}
