// Why: the mobile and renderer share the same UI-language list and locale
// normalization rules (e.g. zh-TW -> DEFAULT_UI_LOCALE). Re-exporting from
// src/shared keeps a single source of truth across surfaces.
export {
  DEFAULT_UI_LOCALE,
  SUPPORTED_UI_LOCALES,
  normalizeSupportedUiLocale,
  resolveUiLocale,
  type SupportedUiLocale
} from '../../../src/shared/ui-locale'

export {
  UI_LANGUAGE_SYSTEM,
  UI_LANGUAGE_ENGLISH,
  UI_LANGUAGE_CHINESE,
  UI_LANGUAGE_KOREAN,
  UI_LANGUAGE_JAPANESE,
  UI_LANGUAGE_SPANISH,
  UI_LANGUAGE_FRENCH,
  type BuiltInUiLanguage,
  type UiLanguage,
  normalizeUiLanguage
} from '../../../src/shared/ui-language'
