import type { ReactNode } from 'react'
import { useUiLanguage } from './use-ui-language'

// Why: useUiLanguage reads AsyncStorage and calls i18n.changeLanguage(), both
// of which need a mounted React tree. The hook must run inside <I18nProvider>,
// but the Provider cannot depend on a hook. A tiny component bridges the two:
// it sits inside the provider, calls the hook, and renders its children.
export function LanguageBootstrap({ children }: { children: ReactNode }): ReactNode {
  useUiLanguage()
  return <>{children}</>
}
