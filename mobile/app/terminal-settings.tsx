import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, Text, Pressable, Switch } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, {
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue
} from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { ChevronLeft, ChevronRight, Smartphone, Type } from 'lucide-react-native'
import { colors, spacing } from '../src/theme/mobile-theme'
import { loadHosts } from '../src/transport/host-store'
import type { HostProfile } from '../src/transport/types'
import { useFocusedSettingsHostClients } from '../src/transport/settings-host-client-connections'
import type { RpcClient } from '../src/transport/rpc-client'
import { PickerModal, type PickerOption } from '../src/components/PickerModal'
import { TerminalShortcutSettings } from '../src/components/TerminalShortcutSettings'
import { setTerminalAutoRestoreFitMsForHost } from '../src/terminal/terminal-auto-restore-fit-state'
import { terminalSettingsScreenStyles as styles } from '../src/terminal/terminal-settings-screen-styles'
import { setTerminalSettingsScrollEnabled } from '../src/terminal/terminal-settings-scroll-lock'
import {
  loadTerminalAutocompleteEnabled,
  loadTerminalTextScale,
  saveTerminalAutocompleteEnabled,
  saveTerminalTextScale
} from '../src/storage/preferences'

type RestoreValue = 'indefinite' | '60s' | '5m' | '30m'

type TextSizeValue = 'smallest' | 'smaller' | 'default' | 'large' | 'larger' | 'largest'

// Why: scale + ms are machine-readable; option labels render through t() so zh-CN can replace
// the percent strings without code changes.
const TEXT_SIZE_DEFS: { value: TextSizeValue; scale: number }[] = [
  { value: 'smallest', scale: 0.5 },
  { value: 'smaller', scale: 0.75 },
  { value: 'default', scale: 1 },
  { value: 'large', scale: 1.25 },
  { value: 'larger', scale: 1.5 },
  { value: 'largest', scale: 2 }
]

const RESTORE_DEFS: { value: RestoreValue; ms: number | null }[] = [
  { value: 'indefinite', ms: null },
  { value: '60s', ms: 60_000 },
  { value: '5m', ms: 5 * 60_000 },
  { value: '30m', ms: 30 * 60_000 }
]

function textSizeValueFromScale(scale: number): TextSizeValue {
  return TEXT_SIZE_DEFS.find((o) => o.scale === scale)?.value ?? 'default'
}

function textSizeSummary(
  options: (PickerOption<TextSizeValue> & { scale: number })[],
  scale: number
): string {
  return (options.find((o) => o.scale === scale) ?? options[0]!).label
}

function buildTextSizeOptions(
  t: (k: string) => string
): (PickerOption<TextSizeValue> & { scale: number })[] {
  return TEXT_SIZE_DEFS.map((d) => ({
    value: d.value,
    scale: d.scale,
    label: t(`settings.terminal.textSize.${d.value}`)
  }))
}

function buildRestoreOptions(
  t: (k: string) => string
): (PickerOption<RestoreValue> & { ms: number | null })[] {
  return RESTORE_DEFS.map((d) => ({
    value: d.value,
    ms: d.ms,
    label: t(`settings.terminal.autoRestore.${d.value}`)
  }))
}

function valueFromMs(
  options: (PickerOption<RestoreValue> & { ms: number | null })[],
  ms: number | null | undefined
): RestoreValue {
  if (ms == null) {
    return 'indefinite'
  }
  const exact = options.find((o) => o.ms === ms)
  if (exact) {
    return exact.value
  }
  // Why: server may return a non-preset ms (custom value, future preset,
  // or server-side clamp). Snap to the closest finite preset so the
  // picker's selected radio agrees with the row sublabel rendered by
  // autoRestoreSummary ("After Xs").
  let closest: (typeof options)[number] | null = null
  let bestDelta = Infinity
  for (const opt of options) {
    if (opt.ms == null) {
      continue
    }
    const delta = Math.abs(opt.ms - ms)
    if (delta < bestDelta) {
      bestDelta = delta
      closest = opt
    }
  }
  return closest ? closest.value : 'indefinite'
}

function autoRestoreSummary(
  options: (PickerOption<RestoreValue> & { ms: number | null })[],
  t: (k: string, opts?: Record<string, unknown>) => string,
  ms: number | null | undefined
): string {
  if (ms === undefined) {
    return t('common.loading')
  }
  if (ms === null) {
    return options[0]!.label
  }
  const exact = options.find((o) => o.ms === ms)
  return exact
    ? exact.label
    : t('settings.terminal.autoRestore.afterSeconds', { seconds: Math.round(ms / 1000) })
}

function HostFitRow({
  client,
  hostName,
  ms,
  restoreOptions,
  t,
  onPress
}: {
  client: RpcClient | null
  hostName: string
  ms: number | null | undefined
  restoreOptions: (PickerOption<RestoreValue> & { ms: number | null })[]
  t: (k: string, opts?: Record<string, unknown>) => string
  onPress: () => void
}): React.JSX.Element {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
      disabled={!client}
    >
      <Smartphone size={16} color={colors.textSecondary} />
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{hostName}</Text>
        <Text style={styles.rowSublabel}>{autoRestoreSummary(restoreOptions, t, ms)}</Text>
      </View>
      <ChevronRight size={16} color={colors.textMuted} />
    </Pressable>
  )
}

export default function TerminalSettingsScreen() {
  const { t } = useTranslation()
  // Why: build options once per render so each PickerModal keeps the same
  // PickerOption instances and avoids remounting on every locale change.
  const textSizeOptions = useMemo(() => buildTextSizeOptions(t), [t])
  const restoreOptions = useMemo(() => buildRestoreOptions(t), [t])
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [hosts, setHosts] = useState<HostProfile[]>([])
  useEffect(() => {
    void loadHosts().then(setHosts)
  }, [])
  const hostIds = useMemo(() => hosts.map((h) => h.id), [hosts])
  const { clients: hostClients } = useFocusedSettingsHostClients(hostIds)
  const hostClientsById = useMemo(
    () => new Map(hostClients.map((entry) => [entry.hostId, entry.client])),
    [hostClients]
  )

  // Why: per-host current value, lazily fetched. We keep state at the
  // screen level rather than per-row so the picker can render at root
  // level — embedding PickerModal inside a row clipped its BottomDrawer
  // absoluteFill backdrop to the ScrollView content frame and made the
  // drawer appear cut-off.
  const [hostMs, setHostMs] = useState<Record<string, number | null | undefined>>({})
  const [pickerHostId, setPickerHostId] = useState<string | null>(null)

  const [textScale, setTextScale] = useState(1)
  const [textSizePickerOpen, setTextSizePickerOpen] = useState(false)
  useEffect(() => {
    void loadTerminalTextScale().then(setTextScale)
  }, [])
  const selectTextSize = useCallback((value: TextSizeValue) => {
    const opt = textSizeOptions.find((o) => o.value === value)
    if (!opt) {
      return
    }
    setTextScale(opt.scale)
    void saveTerminalTextScale(opt.scale)
  }, [textSizeOptions])

  const [autocompleteEnabled, setAutocompleteEnabled] = useState(false)
  // Why: a fast toggle before the initial load resolves must win — otherwise the
  // delayed read would clobber the user's choice with the stored (stale) value.
  const userToggledAutocompleteRef = useRef(false)
  useEffect(() => {
    let stale = false
    void loadTerminalAutocompleteEnabled().then((enabled) => {
      if (!stale && !userToggledAutocompleteRef.current) {
        setAutocompleteEnabled(enabled)
      }
    })
    return () => {
      stale = true
    }
  }, [])
  const toggleAutocomplete = useCallback((next: boolean) => {
    userToggledAutocompleteRef.current = true
    setAutocompleteEnabled(next)
    void saveTerminalAutocompleteEnabled(next)
  }, [])

  useEffect(() => {
    let cancelled = false
    for (const host of hosts) {
      const client = hostClientsById.get(host.id) ?? null
      if (!client) {
        continue
      }
      void client
        .sendRequest('terminal.getAutoRestoreFit')
        .then((resp) => {
          if (cancelled) {
            return
          }
          const value = (resp as { ms?: number | null } | null)?.ms
          // Why: reconnect/status ticks can replay the same value; preserving
          // object identity avoids rerendering every settings row again.
          setHostMs((prev) => setTerminalAutoRestoreFitMsForHost(prev, host.id, value))
        })
        .catch(() => {
          if (!cancelled) {
            setHostMs((prev) => setTerminalAutoRestoreFitMsForHost(prev, host.id, null))
          }
        })
    }
    return () => {
      cancelled = true
    }
  }, [hosts, hostClientsById])

  async function selectValue(hostId: string, value: RestoreValue) {
    const client = hostClientsById.get(hostId) ?? null
    if (!client) {
      return
    }
    const opt = restoreOptions.find((o) => o.value === value)
    if (!opt) {
      return
    }
    setHostMs((prev) => setTerminalAutoRestoreFitMsForHost(prev, hostId, opt.ms))
    try {
      const resp = (await client.sendRequest('terminal.setAutoRestoreFit', {
        ms: opt.ms
      })) as { ms?: number | null } | null
      setHostMs((prev) => setTerminalAutoRestoreFitMsForHost(prev, hostId, resp?.ms))
    } catch {
      try {
        const resp = (await client.sendRequest('terminal.getAutoRestoreFit')) as {
          ms?: number | null
        } | null
        setHostMs((prev) => setTerminalAutoRestoreFitMsForHost(prev, hostId, resp?.ms))
      } catch {
        // give up silently — the next mount retries
      }
    }
  }

  const pickerHost = pickerHostId ? hosts.find((h) => h.id === pickerHostId) : null

  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const scrollOffsetY = useSharedValue(0)
  const scrollContentHeight = useSharedValue(0)
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollOffsetY.value = event.contentOffset.y
  })
  // Why: imperative toggle instead of state — a re-render while a drag gesture
  // is active would rebuild the row gestures and could cancel the drag.
  const setScrollEnabled = useCallback(
    (enabled: boolean) => {
      setTerminalSettingsScrollEnabled(scrollRef, enabled)
    },
    [scrollRef]
  )
  const handleDragActiveChange = useCallback(
    (active: boolean) => setScrollEnabled(!active),
    [setScrollEnabled]
  )

  return (
    <GestureHandlerRootView style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.topRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={22} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.heading}>{t('settings.menu.terminal')}</Text>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onContentSizeChange={(_width, height) => {
          scrollContentHeight.value = height
        }}
      >
        <Text style={styles.groupHeading}>{t('settings.terminal.group.leaveApp.heading')}</Text>
        <Text style={styles.groupDescription}>{t('settings.terminal.group.leaveApp.body')}
          While you&apos;re using a terminal on your phone, Orca shrinks it to fit your screen. When
          you close the app or switch away, this controls whether it stays at phone size (so
          interactive CLI tools don&apos;t reflow) or resizes back to your desktop. You can always
          use Restore on the desktop banner to resize manually.
        </Text>

        {hosts.length === 0 ? (
          <View style={[styles.section, styles.sectionTopGap]}>
            <Text style={styles.emptyText}>{t('settings.terminal.noPairedDesktops')}
              No paired desktops yet. Pair one to control terminal behavior.
            </Text>
          </View>
        ) : (
          <View style={[styles.section, styles.sectionTopGap]}>
            {hosts.map((host, idx) => {
              const client = hostClientsById.get(host.id) ?? null
              return (
                <View key={host.id}>
                  {idx > 0 && <View style={styles.separator} />}
                  <HostFitRow
                    client={client}
                    hostName={host.name}
                    ms={hostMs[host.id]}
                    restoreOptions={restoreOptions}
                    t={t}
                    onPress={() => setPickerHostId(host.id)}
                  />
                </View>
              )
            })}
          </View>
        )}

        <Text style={[styles.groupHeading, styles.inputGroupGap]}>{t('settings.terminal.group.textSize.heading')}</Text>
        <Text style={styles.groupDescription}>{t('settings.terminal.group.textSize.body')}
          Scale the terminal text. Smaller sizes fit more columns with side margins; larger sizes
          show fewer columns — drag sideways to pan. You can also pinch to zoom in the terminal
          itself, which updates this setting. Per-device display only; doesn&apos;t change the
          desktop terminal.
        </Text>
        <View style={[styles.section, styles.sectionTopGap]}>
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => setTextSizePickerOpen(true)}
          >
            <Type size={16} color={colors.textSecondary} />
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>{t('settings.terminal.textSizeRow.label')}</Text>
              <Text style={styles.rowSublabel}>{textSizeSummary(textSizeOptions, textScale)}</Text>
            </View>
            <ChevronRight size={16} color={colors.textMuted} />
          </Pressable>
        </View>

        <Text style={[styles.groupHeading, styles.inputGroupGap]}>{t('settings.terminal.group.keyboard.heading')}</Text>
        <Text style={styles.groupDescription}>{t('settings.terminal.group.keyboard.body')}
          Enable phone-style autocomplete, autocorrect, and spelling suggestions in the terminal
          command bar. Off by default so the keyboard never rewrites commands, flags, or paths.
          Direct keyboard input (when keys go straight to the terminal) always sends raw keystrokes,
          so suggestions don&apos;t apply there.
        </Text>
        <View style={[styles.section, styles.sectionTopGap]}>
          <View style={styles.row}>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>{t('settings.terminal.autocomplete.label')}</Text>
              <Text style={styles.rowSublabel}>{autocompleteEnabled ? t('common.on') : t('common.off')}</Text>
            </View>
            <Switch
              value={autocompleteEnabled}
              onValueChange={toggleAutocomplete}
              trackColor={{ false: colors.bgRaised, true: colors.textSecondary }}
              thumbColor={colors.textPrimary}
            />
          </View>
        </View>

        <TerminalShortcutSettings
          scrollRef={scrollRef}
          scrollOffsetY={scrollOffsetY}
          scrollContentHeight={scrollContentHeight}
          onDragActiveChange={handleDragActiveChange}
        />
      </Animated.ScrollView>

      <PickerModal<RestoreValue>
        visible={pickerHost != null}
        title={pickerHost ? t('settings.terminal.autoRestore.title', { name: pickerHost.name }) : ''}
        options={restoreOptions}
        selected={valueFromMs(restoreOptions, pickerHost ? hostMs[pickerHost.id] : null)}
        onSelect={(v) => {
          if (pickerHost) {
            void selectValue(pickerHost.id, v)
          }
        }}
        onClose={() => setPickerHostId(null)}
      />

      <PickerModal<TextSizeValue>
        visible={textSizePickerOpen}
        title={t('settings.terminal.textSizePickerTitle')}
        options={textSizeOptions}
        selected={textSizeValueFromScale(textScale)}
        onSelect={selectTextSize}
        onClose={() => setTextSizePickerOpen(false)}
      />
    </GestureHandlerRootView>
  )
}
