import { create, act, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'

vi.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'zh-CN' }]
}))

const asyncStore = new Map<string, string>()
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => asyncStore.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      asyncStore.set(key, value)
    })
  }
}))

const changeLanguage = vi.fn().mockResolvedValue(undefined)
const i18nState = { language: 'en' }
vi.mock('./i18n', () => ({
  i18n: {
    get language() {
      return i18nState.language
    },
    changeLanguage: (...args: unknown[]) => changeLanguage(...args)
  }
}))

import { useUiLanguage } from './use-ui-language'
import { UI_LANGUAGE_CHINESE, UI_LANGUAGE_SYSTEM } from '../../../src/shared/ui-language'

type HookResult = ReturnType<typeof useUiLanguage>
type Probe = { current: HookResult | null }

function captureHook(): { probe: Probe; rerender: () => void; unmount: () => void } {
  const probe: Probe = { current: null }
  function Probe() {
    probe.current = useUiLanguage()
    return null
  }
  let renderer: ReactTestRenderer | null = create(createElement(Probe))
  return {
    probe,
    rerender: () => {
      act(() => {
        renderer!.update(createElement(Probe))
      })
    },
    unmount: () => {
      if (renderer) {
        act(() => renderer!.unmount())
        renderer = null
      }
    }
  }
}

async function flushMicrotasks() {
  // Why: useUiLanguage schedules AsyncStorage reads in a microtask. Two
  // ticks is enough to resolve the Promise chains without relying on
  // vitest's fake timers, which would need to be enabled per-test.
  for (let i = 0; i < 3; i++) {
    await act(async () => {
      await Promise.resolve()
    })
  }
}

describe('useUiLanguage', () => {
  beforeEach(() => {
    asyncStore.clear()
    changeLanguage.mockClear()
    i18nState.language = 'en'
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('defaults to system when AsyncStorage is empty and resolves to zh on a Chinese device', async () => {
    const h = captureHook()
    await flushMicrotasks()
    expect(h.probe.current?.language).toBe(UI_LANGUAGE_SYSTEM)
    // system + zh-CN -> resolveUiLocale picks 'zh' so changeLanguage lands on
    // the populated catalog.
    expect(changeLanguage).toHaveBeenCalledWith('zh')
    h.unmount()
  })

  it('honors a previously persisted language', async () => {
    asyncStore.set('@orca/mobile/ui-language', UI_LANGUAGE_CHINESE)
    const h = captureHook()
    await flushMicrotasks()
    expect(h.probe.current?.language).toBe(UI_LANGUAGE_CHINESE)
    expect(changeLanguage).toHaveBeenCalledWith('zh')
    h.unmount()
  })

  it('persists the new language when setLanguage runs', async () => {
    const h = captureHook()
    await flushMicrotasks()
    expect(h.probe.current?.language).toBe(UI_LANGUAGE_SYSTEM)
    await act(async () => {
      await h.probe.current!.setLanguage(UI_LANGUAGE_CHINESE)
    })
    expect(asyncStore.get('@orca/mobile/ui-language')).toBe(UI_LANGUAGE_CHINESE)
    h.unmount()
  })
})
