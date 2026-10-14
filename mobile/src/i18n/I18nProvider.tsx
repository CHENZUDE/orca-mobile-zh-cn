import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from './i18n'

// Why: react-i18next reads from a singleton i18n instance by default, but
// routing the instance through I18nextProvider keeps the dependency direction
// one-way (callers import this module, not i18next directly) and lets tests
// mount a fresh instance without monkey-patching the global.
export function I18nProvider({ children }: { children: ReactNode }): ReactNode {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
