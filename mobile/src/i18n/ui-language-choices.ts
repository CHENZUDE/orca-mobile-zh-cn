import {
  UI_LANGUAGE_CHINESE,
  UI_LANGUAGE_ENGLISH,
  UI_LANGUAGE_FRENCH,
  UI_LANGUAGE_JAPANESE,
  UI_LANGUAGE_KOREAN,
  UI_LANGUAGE_SPANISH,
  UI_LANGUAGE_SYSTEM,
  type BuiltInUiLanguage
} from '../../../src/shared/ui-language'

// Why: a stable, ordered list of the seven built-in UI languages the mobile
// picker surfaces. Mirrors the renderer's UI_LANGUAGE_CHOICES shape so the
// two surfaces share the same ordering, but the labels stay i18n keys
// resolved at render time (English-source + zh translation, not a hard-coded
// "Chinese" string) so the picker self-localizes.
export type UiLanguageChoice = {
  value: BuiltInUiLanguage
  labelKey: string
}

export const UI_LANGUAGE_CHOICES: UiLanguageChoice[] = [
  { value: UI_LANGUAGE_SYSTEM, labelKey: 'settings.appearance.language.system' },
  { value: UI_LANGUAGE_ENGLISH, labelKey: 'settings.appearance.language.english' },
  { value: UI_LANGUAGE_CHINESE, labelKey: 'settings.appearance.language.chinese' },
  { value: UI_LANGUAGE_KOREAN, labelKey: 'settings.appearance.language.korean' },
  { value: UI_LANGUAGE_JAPANESE, labelKey: 'settings.appearance.language.japanese' },
  { value: UI_LANGUAGE_SPANISH, labelKey: 'settings.appearance.language.spanish' },
  { value: UI_LANGUAGE_FRENCH, labelKey: 'settings.appearance.language.french' }
]
