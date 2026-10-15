import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (value: unknown) => value, hairlineWidth: 1 }
}))
vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 })
}))
vi.mock('expo-router', () => ({ useRouter: () => ({ back: vi.fn(), push: vi.fn() }) }))
vi.mock('lucide-react-native', () => ({ ChevronLeft: 'Icon', ChevronRight: 'Icon' }))
vi.mock('../components/BottomDrawer', () => ({ BottomDrawer: () => null }))
vi.mock('../i18n/use-ui-language', () => ({
  useUiLanguage: () => ({
    language: 'system',
    resolvedLocale: 'en',
    setLanguage: vi.fn().mockResolvedValue(undefined)
  })
}))

import { I18nProvider } from '../i18n/I18nProvider'
import LanguageSettingsScreen from './mobile-language-settings-screen'

describe('mobile-language-settings-screen', () => {
  let renderer: ReactTestRenderer | null = null
  afterEach(() => {
    if (renderer) {
      act(() => renderer!.unmount())
      renderer = null
    }
    vi.restoreAllMocks()
  })

  it('renders the screen title from the i18n catalog', () => {
    act(() => {
      renderer = create(
        <I18nProvider>
          <LanguageSettingsScreen />
        </I18nProvider>
      )
    })
    const text = JSON.stringify(renderer!.toJSON())
    expect(text).toContain('Language')
    expect(text).toContain('Choose the language used by the Orca interface.')
  })

  it('renders the current selection label from the picker row', () => {
    act(() => {
      renderer = create(
        <I18nProvider>
          <LanguageSettingsScreen />
        </I18nProvider>
      )
    })
    // Why: the row shows the current pick. With language=system the label
    // resolves to the en catalog value 'System'.
    const text = JSON.stringify(renderer!.toJSON())
    expect(text).toContain('System')
  })
})
