import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import enCatalog from './locales/en.json'

// Why: the production bootstrap in ./i18n.ts uses a side-effectful module-scope
// init that latches onto a singleton. Tests want a fresh instance per describe
// so lazy loader behavior and fallback rules stay observable.
async function makeTestInstance() {
  const inst = i18next.createInstance()
  await inst.use(initReactI18next).init({
    fallbackLng: 'en',
    lng: 'en',
    resources: { en: { translation: enCatalog } },
    interpolation: { escapeValue: false },
    react: { useSuspense: false }
  })
  return inst
}

describe('mobile i18n instance', () => {
  let inst: ReturnType<typeof i18next.createInstance> | undefined
  beforeEach(() => {})
  afterEach(async () => {
    if (inst) {
      await inst.changeLanguage('en')
      // @ts-expect-error -- dispose the singleton for the next test
      inst = undefined
    }
  })

  it('loads English eagerly and returns it for t()', async () => {
    inst = await makeTestInstance()
    expect(inst.t('common.back')).toBe('Back')
    expect(inst.t('settings.menu.terminal')).toBe('Terminal')
  })

  it('falls back to English when the key is missing from the active locale', async () => {
    inst = await makeTestInstance()
    // Why: install a partial zh catalog with a missing key, then assert the
    // fallback path returns the en string instead of the key. This locks
    // fallbackLng: 'en' semantics so a zh-only rollout never silently
    // surfaces 'common.back' (the literal, the e-language) to users.
    await inst.addResource(
      'zh',
      'translation',
      'common.back',
      '返回'
    )
    await inst.changeLanguage('zh')
    expect(inst.t('common.back')).toBe('返回')
    expect(inst.t('settings.menu.terminal')).toBe('Terminal') // fallback to en
  })

  it('changeLanguage swaps the resolved string set', async () => {
    inst = await makeTestInstance()
    expect(inst.t('common.back')).toBe('Back')
    await inst.addResource('zh', 'translation', 'common.back', '返回')
    await inst.changeLanguage('zh')
    expect(inst.t('common.back')).toBe('返回')
    await inst.changeLanguage('en')
    expect(inst.t('common.back')).toBe('Back')
  })

  it('does not escape the en catalog values (RN renders raw text)', async () => {
    inst = await makeTestInstance()
    // Why: interpolation.escapeValue is set to false on purpose because
    // react-native Text renders literal Unicode; if a future change flips
    // it back on, the right single quote / em dash would render as
    // &#x27; / &#x2014; — fail the test loudly.
    expect(inst.t('settings.about.tagline')).not.toContain('&#x')
  })
})
